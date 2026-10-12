import localFont from "next/font/local";

/**
 * Fuentes self-hosted (OFL 1.1), subconjunto latino para español. Ver app/fonts/licencias.
 * Archivo y Martian Mono declaran su rango de anchura para poder animar `font-stretch` (eje wdth).
 */
export const archivo = localFont({
  src: "./fonts/archivo-var.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  preload: true,
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  fallback: ["Arial Narrow", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const hanken = localFont({
  src: "./fonts/hanken-grotesk-var.woff2",
  variable: "--font-hanken",
  weight: "100 900",
  display: "swap",
  preload: true,
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const martian = localFont({
  src: "./fonts/martian-mono-var.woff2",
  variable: "--font-martian",
  weight: "100 800",
  display: "swap",
  preload: false,
  declarations: [{ prop: "font-stretch", value: "75% 112.5%" }],
  fallback: ["Courier New", "monospace"],
  adjustFontFallback: false,
});

export const saira = localFont({
  src: "./fonts/saira-stencil-one.woff2",
  variable: "--font-saira-stencil",
  weight: "400",
  display: "swap",
  preload: false,
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: false,
});

export const variablesDeFuente = [
  archivo.variable,
  hanken.variable,
  martian.variable,
  saira.variable,
].join(" ");
