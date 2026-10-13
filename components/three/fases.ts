/**
 * Storyboard de la escena (PLAN.md §3). El progreso global p ∈ [0, 1] se reparte en fases;
 * cada sección del home marcada con `data-fase` es una fase, y su "ventana" a la escena
 * (`[data-ventana-3d]`, la propia sección en el hero y el cierre) marca cuándo ocurre.
 */
export const FASES = [
  { id: "inicio", desde: 0, hasta: 0.12 },
  { id: "maquinaria-pesada", desde: 0.12, hasta: 0.28 },
  { id: "transporte-y-elevacion", desde: 0.28, hasta: 0.42 },
  { id: "equipos-para-losas", desde: 0.42, hasta: 0.56 },
  { id: "encofrados-y-formaleteria", desde: 0.56, hasta: 0.7 },
  { id: "andamiaje", desde: 0.7, hasta: 0.82 },
  { id: "otros-equipos", desde: 0.82, hasta: 0.92 },
  { id: "cierre", desde: 0.92, hasta: 1 },
] as const;

export type IdFase = (typeof FASES)[number]["id"];

export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Interpolación suave (smoothstep) de un tramo [a, b] del progreso. */
export function tramo(p: number, a: number, b: number): number {
  const t = limitar((p - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Progreso local (0→1, suavizado) de una fase, opcionalmente de una sub-parte [desde, hasta] de ella. */
export function enFase(p: number, id: IdFase, desde = 0, hasta = 1): number {
  const f = FASES.find((x) => x.id === id);
  if (!f) return 0;
  const largo = f.hasta - f.desde;
  return tramo(p, f.desde + largo * desde, f.desde + largo * hasta);
}

/**
 * Cuándo ocurre cada fase, en alturas de pantalla. Una fase empieza cuando el borde superior de su
 * ventana sube a INICIO (la ventana ya asoma por abajo) y termina RECORRIDO pantallas después, con la
 * ventana todavía a la vista (su borde superior queda en INICIO − RECORRIDO = 12 % de la altura).
 * Así cada etapa (la volqueta que entra, el izado, el vaciado…) se ve mientras su ventana está en
 * pantalla, no cuando ya la tapan la ficha y las fotos opacas de la sección. Las fases que empiezan
 * por encima de INICIO (el hero, a scroll 0) arrancan desde su posición inicial.
 */
export const INICIO = 0.72;
export const RECORRIDO = 0.6;

/**
 * Encuadre vertical: en qué fracción de la altura de su ventana se dibuja el centro de la toma (el
 * punto al que mira la cámara). En pantallas verticales el texto ocupa la mitad inferior de cada
 * ventana, así que la acción se sube al tercio superior; en escritorio va a la derecha del texto.
 */
const ENCUADRE: Record<IdFase, { ancho: number; vertical: number }> = {
  inicio: { ancho: 0.78, vertical: 0.2 },
  "maquinaria-pesada": { ancho: 0.26, vertical: 0.2 },
  "transporte-y-elevacion": { ancho: 0.26, vertical: 0.2 },
  "equipos-para-losas": { ancho: 0.26, vertical: 0.2 },
  "encofrados-y-formaleteria": { ancho: 0.26, vertical: 0.2 },
  andamiaje: { ancho: 0.26, vertical: 0.2 },
  "otros-equipos": { ancho: 0.42, vertical: 0.3 },
  cierre: { ancho: 0.3, vertical: 0.24 },
};

/** Límites del encuadre (fracción de la altura de la pantalla) para no vaciar el cuadro. */
const FOCO_MIN = 0.18;
const FOCO_MAX = 0.8;

export interface MedidaDocumento {
  /** Progreso global p ∈ [0, 1]. */
  p: number;
  /** Dónde (0 arriba → 1 abajo) debe quedar el centro de la toma, o null si no hay ventana a la vista. */
  foco: number | null;
}

/** Ventana a la escena de una sección: la propia sección o su bloque `[data-ventana-3d]`. */
export function ventanaDe(seccion: HTMLElement): HTMLElement {
  if (seccion.hasAttribute("data-ventana-3d")) return seccion;
  return seccion.querySelector<HTMLElement>("[data-ventana-3d]") ?? seccion;
}

let cache: Array<HTMLElement | null> = [];

function ventanas(): Array<HTMLElement | null> {
  if (cache.length !== FASES.length || cache.some((v) => v !== null && !v.isConnected)) {
    cache = FASES.map((f) => {
      const s = document.querySelector<HTMLElement>(`[data-fase="${f.id}"]`);
      return s ? ventanaDe(s) : null;
    });
  }
  return cache;
}

/**
 * Lee la posición de las ventanas en pantalla y devuelve el progreso p y el encuadre vertical.
 * `vertical`: pantalla más alta que ancha (el encuadre sube la acción sobre el texto).
 */
export function medirDocumento(vertical = false): MedidaDocumento {
  const alto = window.innerHeight;
  const lista = ventanas();
  let p = 0;
  let foco: number | null = null;
  let mejor = 0;
  for (let i = 0; i < FASES.length; i++) {
    const v = lista[i];
    const fase = FASES[i];
    if (!v || !fase) continue;
    const r = v.getBoundingClientRect();
    // Una fase que ya empieza por encima de INICIO (el hero a scroll 0) arranca desde ahí.
    const inicio = Math.min(alto * INICIO, r.top + window.scrollY);
    if (r.top <= inicio) {
      const t = limitar((inicio - r.top) / (alto * RECORRIDO));
      p = fase.desde + t * (fase.hasta - fase.desde);
    }
    const visible = Math.min(r.bottom, alto) - Math.max(r.top, 0);
    if (visible > mejor) {
      mejor = visible;
      const f = ENCUADRE[fase.id][vertical ? "vertical" : "ancho"];
      foco = limitar((r.top + r.height * f) / alto, FOCO_MIN, FOCO_MAX);
    }
  }
  return { p: limitar(p), foco };
}
