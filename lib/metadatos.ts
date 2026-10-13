/**
 * Metadatos por página (title, description, canonical, Open Graph y Twitter) y piezas comunes de las
 * imágenes para compartir (app/opengraph-image.tsx y app/servicios/[slug]/opengraph-image.tsx).
 *
 * Por qué un ayudante: cuando una página declara `openGraph` o `twitter`, Next REEMPLAZA el objeto
 * heredado del layout en vez de mezclarlo. Si la página no repite type, locale, siteName e images,
 * la vista previa de WhatsApp/Facebook sale sin imagen. `metaPagina` siempre los incluye.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { home } from "@/content/home";
import { sitio } from "@/content/sitio";

/** La función vive en content/sitio.ts (sin dependencias de Node); se reexporta por compatibilidad. */
export { analiticaSinCookies } from "@/content/sitio";

/* ───────────────────────── Open Graph / Twitter ───────────────────────── */

export const TAMANO_OG = { width: 1200, height: 630 } as const;

export const ALT_OG_GENERAL = `${sitio.nombre} — ${sitio.lema}. Alquiler de maquinaria y equipos para construcción en Envigado, Antioquia.`;

/**
 * Versión del DISEÑO de app/opengraph-image.tsx. Súbala (2, 3…) cada vez que cambie ese archivo.
 * Los cambios de texto (hero, nombre, lema) ya cambian la versión solos: ver VERSION_OG.
 */
const DISENO_OG = 1;

/** Hash corto (FNV-1a de 32 bits) para versionar la URL de la imagen sin depender de Node. */
function hashCorto(texto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Va en la URL de la imagen general (?v=…). WhatsApp y Facebook guardan la tarjeta por URL: si la
 * imagen cambia y la URL no, siguen mostrando la vieja. Combina el diseño y los textos que dibuja.
 */
export const VERSION_OG = `${DISENO_OG}-${hashCorto(
  [
    home.hero.eyebrow,
    ...home.hero.titular,
    ...home.hero.ficha,
    sitio.nombre,
    sitio.nombreCorto,
    sitio.lema,
  ].join("|"),
)}`;

/** Imagen general del sitio (la genera app/opengraph-image.tsx). */
export const imagenOgGeneral = {
  url: `/opengraph-image?v=${VERSION_OG}`,
  ...TAMANO_OG,
  alt: ALT_OG_GENERAL,
  type: "image/png",
} as const;

/** Campos que toda tarjeta social debe llevar (Next no los hereda si la página declara openGraph). */
export const baseOpenGraph = {
  type: "website",
  locale: "es_CO",
  siteName: sitio.nombre,
} as const;

export interface OpcionesPagina {
  /** Va en <title> antes de la plantilla "| MAVI" del layout. */
  titulo: string;
  descripcion: string;
  /**
   * Ruta canónica ("/contacto"). Se usa también como og:url. Sin ruta no se declara canonical
   * (p. ej. en la página 404).
   */
  ruta?: string;
  /** Título para la tarjeta social. Por defecto: "<titulo> | MAVI Proyectos e Inversiones". */
  tituloSocial?: string;
  /**
   * "general": la imagen de app/opengraph-image.tsx.
   * "segmento": la aporta un opengraph-image.tsx de la propia ruta; aquí NO se declara `images`
   * (si la clave existe, aunque sea vacía, Next descarta la imagen del archivo).
   */
  imagen?: "general" | "segmento";
}

export function metaPagina({
  titulo,
  descripcion,
  ruta,
  tituloSocial,
  imagen = "general",
}: OpcionesPagina): Metadata {
  const social = tituloSocial ?? `${titulo} | ${sitio.nombre}`;
  const imagenes = imagen === "general" ? { images: [imagenOgGeneral] } : {};
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: ruta ?? null },
    openGraph: {
      ...baseOpenGraph,
      title: social,
      description: descripcion,
      ...(ruta ? { url: ruta } : {}),
      ...imagenes,
    },
    // Sin `images`: Next copia las de openGraph (incluida la del archivo del segmento).
    twitter: { card: "summary_large_image", title: social, description: descripcion },
  };
}

/* ───────────────────────── Piezas comunes de las imágenes OG ───────────────────────── */

/** Colores de marca (docs/DISEÑO.md §2). Satori no lee variables CSS. */
export const COLOR_OG = {
  ink: "#0B0B0C",
  ink2: "#151517",
  amarillo: "#FCBF06",
  hueso: "#F4F1EA",
  concreto: "#8A8A85",
  concretoClaro: "#A3A39E",
} as const;

/** Fuentes estáticas para Satori (las variables de app/fonts no sirven: Satori no lee woff2). */
export async function fuentesOg() {
  const [display, mono] = await Promise.all([
    readFile(path.join(process.cwd(), "app/og/archivo-900-ancha.ttf")),
    readFile(path.join(process.cwd(), "app/og/martian-mono-500.ttf")),
  ]);
  return [
    { name: "Archivo", data: display, weight: 900 as const, style: "normal" as const },
    { name: "Martian", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

/**
 * Franja de peligro amarillo/negro a −45° como SVG en data URI. Satori no dibuja
 * `repeating-linear-gradient`, así que las rayas se trazan como polígonos.
 */
export function franjaOg(ancho: number = TAMANO_OG.width, alto = 18, paso = 44): string {
  const mitad = paso / 2;
  const rayas: string[] = [];
  for (let x = -alto; x < ancho + paso; x += paso) {
    rayas.push(
      `<polygon points="${x},${alto} ${x + alto},0 ${x + alto + mitad},0 ${x + mitad},${alto}"/>`,
    );
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"><rect width="${ancho}" height="${alto}" fill="${COLOR_OG.ink}"/><g fill="${COLOR_OG.amarillo}">${rayas.join("")}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
