/**
 * "M" del isotipo MAVI (la misma de components/brand/Logo.tsx, LETRAS.M): polígono sobre una
 * retícula de 80 × 100 u con el eje y hacia abajo. Se replica aquí para extruirla en la escena 3D
 * y dibujarla en el póster 2D.
 */
export const PUNTOS_M: ReadonlyArray<readonly [number, number]> = [
  [0, 100],
  [0, 0],
  [22, 0],
  [40, 38],
  [58, 0],
  [80, 0],
  [80, 100],
  [60, 100],
  [60, 42],
  [46, 70],
  [34, 70],
  [20, 42],
  [20, 100],
];

/** Trazado SVG de la "M" centrada en (cx, cy) con la altura dada. */
export function rutaM(cx: number, cy: number, alto: number): string {
  const s = alto / 100;
  return (
    "M" +
    PUNTOS_M.map(
      ([x, y]) => `${(cx + (x - 40) * s).toFixed(1)} ${(cy + (y - 50) * s).toFixed(1)}`,
    ).join("L") +
    "Z"
  );
}
