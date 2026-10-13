/**
 * Capas del póster 2D (fallback sin WebGL, movimiento reducido o mientras carga el 3D).
 *
 * El póster es un SVG vectorial (sin imágenes: nunca compite por el LCP) que cuenta la misma
 * historia que la escena 3D: cada capa tiene un "avance" k ∈ [0, 1] que depende del progreso p
 * de las fases (fases.ts). El cliente escribe k en la variable CSS `--k` de cada capa y el estilo
 * en línea de la capa la traduce en opacidad y desplazamiento. Sin JS, cada capa queda en su
 * estado del hero (k en p = 0), escrito ya en el HTML de servidor.
 */
import { enFase, tramo, type IdFase } from "./fases";

type Tramo = readonly [IdFase, number, number];

interface DefCapa {
  /** Entra en este tramo (k 0 → 1). Sin `entra`, está desde el principio. */
  entra?: Tramo;
  /** Sale en este tramo (k 1 → 0). */
  sale?: Tramo;
  /** Cálculo propio de k (cielos, poses alternativas). */
  k?: (p: number) => number;
}

const cava = (p: number) =>
  enFase(p, "maquinaria-pesada", 0.05, 0.3) * (1 - enFase(p, "maquinaria-pesada", 0.85, 1));

export const CAPAS_POSTER = {
  // Luz del día: amanecer (base) → mediodía → atardecer.
  dia: { k: (p) => tramo(p, 0.06, 0.35) * (1 - tramo(p, 0.78, 0.98)) },
  tarde: { k: (p) => tramo(p, 0.78, 0.98) },
  // Hero: engranaje MAVI al fondo; terreno con estacas; la excavadora ya en el lote.
  "engranaje-inicio": { sale: ["inicio", 0.55, 1] },
  "brazo-reposo": { k: (p) => 1 - cava(p) },
  "brazo-cava": { k: cava },
  // Maquinaria pesada: el montículo crece, entra el minicargador y queda la placa nivelada.
  monticulo: { entra: ["maquinaria-pesada", 0.1, 0.9] },
  "monticulo-descarga": { entra: ["transporte-y-elevacion", 0.5, 0.8] },
  minicargador: {
    entra: ["maquinaria-pesada", 0.15, 0.4],
    sale: ["transporte-y-elevacion", 0, 0.3],
  },
  placa: { entra: ["maquinaria-pesada", 0.55, 1] },
  // Transporte y elevación: entran la volqueta y la grúa; la volqueta descarga y la grúa iza.
  volqueta: { entra: ["transporte-y-elevacion", 0.02, 0.42] },
  platon: {
    k: (p) =>
      enFase(p, "transporte-y-elevacion", 0.5, 0.8) *
      (1 - enFase(p, "equipos-para-losas", 0.2, 0.5)),
  },
  grua: { entra: ["transporte-y-elevacion", 0.1, 0.42] },
  "grua-pluma": { entra: ["transporte-y-elevacion", 0.4, 0.66] },
  "grua-cable": {
    entra: ["transporte-y-elevacion", 0.62, 0.7],
    sale: ["equipos-para-losas", 0.4, 0.5],
  },
  "grua-iza": { entra: ["transporte-y-elevacion", 0.66, 1] },
  // Equipos para losas: puntales por grupos, correas y primera losa.
  "puntales-a": { entra: ["equipos-para-losas", 0, 0.22] },
  "puntales-b": { entra: ["equipos-para-losas", 0.12, 0.34] },
  "puntales-c": { entra: ["equipos-para-losas", 0.24, 0.46] },
  correas: { entra: ["equipos-para-losas", 0.5, 0.8] },
  losa1: { entra: ["equipos-para-losas", 0.75, 1] },
  // Encofrados: hierros, formaletas que se cierran, vaciado de concreto y segunda losa.
  varillas: { entra: ["encofrados-y-formaleteria", 0, 0.2] },
  formaletas: {
    entra: ["encofrados-y-formaleteria", 0.15, 0.4],
    sale: ["encofrados-y-formaleteria", 0.82, 1],
  },
  vaciado: { entra: ["encofrados-y-formaleteria", 0.4, 0.8] },
  "losa1-concreto": { entra: ["encofrados-y-formaleteria", 0.4, 0.8] },
  losa2: { entra: ["encofrados-y-formaleteria", 0.85, 1] },
  // Andamiaje: la fachada crece piso a piso.
  "andamio-1": { entra: ["andamiaje", 0, 0.33] },
  "andamio-2": { entra: ["andamiaje", 0.3, 0.63] },
  "andamio-3": { entra: ["andamiaje", 0.6, 0.95] },
  // Otros equipos: generador, compresor y pluma de cargue bajan a la terraza.
  generador: { entra: ["otros-equipos", 0, 0.35] },
  compresor: { entra: ["otros-equipos", 0.2, 0.55] },
  pluma: { entra: ["otros-equipos", 0.4, 0.8] },
  // Cierre: atardecer y el engranaje vuelve sobre la obra terminada.
  "engranaje-cierre": { entra: ["cierre", 0, 0.7] },
} satisfies Record<string, DefCapa>;

export type IdCapaPoster = keyof typeof CAPAS_POSTER;

/** Avance k de una capa para el progreso p. */
export function kCapa(id: IdCapaPoster, p: number): number {
  const def: DefCapa = CAPAS_POSTER[id];
  if (def.k) return def.k(p);
  let k = def.entra ? enFase(p, ...def.entra) : 1;
  if (def.sale) k *= 1 - enFase(p, ...def.sale);
  return k;
}

/** Posición del sol en el póster (unidades del viewBox 1600 × 900): sale a la izquierda y se pone a la derecha. */
export function solEn(p: number): [number, number] {
  const x = 380 + 1080 * p;
  const y = 640 - Math.sin(Math.min(1, Math.max(0, p)) * Math.PI) * 460;
  return [Math.round(x), Math.round(y)];
}

const TRANSICION = "opacity 480ms var(--ease-weight), transform 480ms var(--ease-weight)";
const TRANSICION_REDUCIDA = "opacity 200ms linear";
const capasDe = new WeakMap<SVGSVGElement, SVGElement[]>();

/**
 * Pone el póster al día con el progreso p. Con movimiento reducido las capas aparecen o se van
 * con un fundido corto, sin desplazamientos (k redondeado a 0 o 1).
 */
/**
 * En vertical, dónde queda en reposo (fracción de la altura de la pantalla) el centro de la obra del
 * póster: caja de 60svh que empieza en 8svh (PosterObra) y obra centrada a 513/900 de la caja.
 */
const CENTRO_VERTICAL = 0.08 + 0.6 * (513 / 900);

export function actualizarPoster(
  svg: SVGSVGElement,
  p: number,
  reducido: boolean,
  foco: number | null = null,
): void {
  let capas = capasDe.get(svg);
  if (!capas) {
    capas = Array.from(svg.querySelectorAll<SVGElement>("[data-capa]"));
    capasDe.set(svg, capas);
  }
  const modo = reducido ? "reducido" : "normal";
  const cambiaModo = svg.dataset.modo !== modo;
  if (cambiaModo) svg.dataset.modo = modo;
  for (const el of capas) {
    const id = el.dataset.capa as IdCapaPoster | undefined;
    if (cambiaModo) el.style.transition = reducido ? TRANSICION_REDUCIDA : TRANSICION;
    if (id === undefined) continue;
    if (!(id in CAPAS_POSTER)) continue;
    let k = kCapa(id, p);
    if (reducido) k = k >= 0.5 ? 1 : 0;
    const valor = k.toFixed(3);
    if (el.style.getPropertyValue("--k") !== valor) el.style.setProperty("--k", valor);
  }
  // En vertical (sin espacio a la derecha del texto) la obra sigue a la ventana visible, como el
  // encuadre de la escena 3D. Con movimiento reducido, quieta.
  const vertical = window.innerHeight > window.innerWidth;
  const dy =
    vertical && foco !== null && !reducido ? (foco - CENTRO_VERTICAL) * window.innerHeight : 0;
  const mover = `translateY(${Math.round(dy)}px)`;
  if (svg.style.transform !== mover) svg.style.transform = mover;
  if (cambiaModo) svg.style.transition = reducido ? "none" : "transform 600ms var(--ease-weight)";
  const sol = svg.querySelector<SVGElement>("[data-sol]");
  if (sol) {
    const [x, y] = solEn(p);
    const t = `translate(${x}px, ${y}px)`;
    if (sol.style.transform !== t) sol.style.transform = t;
    if (cambiaModo) sol.style.transition = reducido ? "none" : "transform 480ms var(--ease-weight)";
  }
}
