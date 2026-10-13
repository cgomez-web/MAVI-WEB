/** Utilidades de URLs de imágenes de bodega. Sin datos: seguro de importar desde componentes cliente. */
import type { FotoGaleria } from "@/content/galeria";

export type FormatoFoto = "avif" | "webp";

export interface FotoPublica extends FotoGaleria {
  ancho: number;
  alto: number;
  anchos: number[];
  /**
   * Hash del contenido de los archivos generados (lo calcula `pnpm images`). Va en el nombre de cada
   * archivo, así que una foto corregida (otro parche, otro recorte) estrena URL y la caché
   * `immutable` de un año de /img nunca sirve la versión vieja.
   */
  version: string;
  lqip: string;
}

/** Lo mínimo que necesita un componente cliente (sin nombres de archivo originales ni parches). */
export type FotoCliente = Pick<
  FotoPublica,
  "id" | "categoria" | "titulo" | "alt" | "ancho" | "alto" | "anchos" | "version"
> & { lqip?: string };

export function aFotoCliente(f: FotoPublica, conLqip = false): FotoCliente {
  const { id, categoria, titulo, alt, ancho, alto, anchos, version, lqip } = f;
  return conLqip
    ? { id, categoria, titulo, alt, ancho, alto, anchos, version, lqip }
    : { id, categoria, titulo, alt, ancho, alto, anchos, version };
}

/**
 * Nombre del archivo publicado en public/img/bodega/. Única fuente de verdad: lo usan el pipeline
 * (scripts/process-images.ts) al escribir y los componentes al pedir la foto.
 */
export function archivoFoto(
  foto: Pick<FotoPublica, "id" | "version">,
  ancho: number,
  formato: FormatoFoto,
): string {
  return `${foto.id}-${ancho}.${foto.version}.${formato}`;
}

function urlFoto(foto: Pick<FotoPublica, "id" | "version">, ancho: number, formato: FormatoFoto) {
  return `/img/bodega/${archivoFoto(foto, ancho, formato)}`;
}

export function srcSet(
  foto: Pick<FotoPublica, "id" | "anchos" | "version">,
  formato: FormatoFoto,
): string {
  return foto.anchos.map((a) => `${urlFoto(foto, a, formato)} ${a}w`).join(", ");
}

export function srcPorDefecto(foto: Pick<FotoPublica, "id" | "anchos" | "version">): string {
  const medio = foto.anchos.find((a) => a >= 800) ?? foto.anchos[foto.anchos.length - 1] ?? 480;
  return urlFoto(foto, medio, "webp");
}
