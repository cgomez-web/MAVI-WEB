/** Utilidades de URLs de imágenes de bodega. Sin datos: seguro de importar desde componentes cliente. */
import type { FotoGaleria } from "@/content/galeria";

export interface FotoPublica extends FotoGaleria {
  ancho: number;
  alto: number;
  anchos: number[];
  lqip: string;
}

export function srcSet(foto: Pick<FotoPublica, "id" | "anchos">, formato: "avif" | "webp"): string {
  return foto.anchos.map((a) => `/img/bodega/${foto.id}-${a}.${formato} ${a}w`).join(", ");
}

export function srcPorDefecto(foto: Pick<FotoPublica, "id" | "anchos">): string {
  const medio = foto.anchos.find((a) => a >= 800) ?? foto.anchos[foto.anchos.length - 1] ?? 480;
  return `/img/bodega/${foto.id}-${medio}.webp`;
}
