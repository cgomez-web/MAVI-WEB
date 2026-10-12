/**
 * Storyboard de la escena (PLAN.md §3). El progreso global p ∈ [0, 1] se reparte en fases;
 * cada sección del home marcada con `data-fase` ancla el inicio de su fase.
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
 * Calcula p a partir de la posición de las secciones ancla en pantalla.
 * La línea de lectura es el 55 % de la altura de la ventana.
 */
export function progresoDesdeDocumento(): number {
  const linea = window.innerHeight * 0.55;
  const anclas = FASES.map((f) => document.querySelector<HTMLElement>(`[data-fase="${f.id}"]`));
  let p = 0;
  for (let i = 0; i < FASES.length; i++) {
    const el = anclas[i];
    const fase = FASES[i];
    if (!el || !fase) continue;
    const arriba = el.getBoundingClientRect().top;
    if (arriba > linea) break;
    const siguiente = anclas.slice(i + 1).find(Boolean);
    const fin = siguiente ? siguiente.getBoundingClientRect().top : arriba + el.offsetHeight;
    const t = limitar((linea - arriba) / Math.max(1, fin - arriba));
    p = fase.desde + t * (fase.hasta - fase.desde);
  }
  return limitar(p);
}
