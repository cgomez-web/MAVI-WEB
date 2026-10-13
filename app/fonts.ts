import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import localFont from "next/font/local";

/**
 * Fuentes self-hosted (OFL 1.1), subconjunto latino para español. Ver app/fonts/licencias.
 * Archivo y Martian Mono declaran su rango de anchura para poder animar `font-stretch` (eje wdth).
 *
 * Precarga: `preload: true` (Archivo y Hanken, las del primer pintado) hace que next/font emita el
 * archivo como `*.p.woff2` y lo anote en `<distDir>/server/next-font-manifest.json`; con ese manifiesto
 * Next escribe el `<link rel="preload" as="font">` en el <head> de cada ruta. Martian Mono y Saira
 * Stencil no se precargan a propósito: competirían con el LCP para ahorrar un cambio de fuente mínimo.
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

/**
 * Saira Stencil solo se usa en los sellos decorativos de algunas líneas: `optional` evita el intercambio
 * de fuente (y su relayout) y que compita por ancho de banda; si no llega a tiempo en la primera visita,
 * el sello se ve con la fuente de respaldo y en la siguiente ya sale de la caché.
 */
export const saira = localFont({
  src: "./fonts/saira-stencil-one.woff2",
  variable: "--font-saira-stencil",
  weight: "400",
  display: "optional",
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

let precargasDeRespaldo: string[] | undefined;

/**
 * Respaldo de la precarga para builds hechos en Windows: devuelve las URL que hay que precargar a mano
 * (lista vacía si Next ya lo hace). Uso en un componente de servidor (layout o página):
 *
 *   {precargasDeFuentes().map((href) => (
 *     <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
 *   ))}
 *
 * React 19 sube esos <link> al <head> del HTML inicial.
 *
 * Por qué: Next 15.5 (NextFontManifestPlugin) reconoce los módulos de next/font buscando el texto
 * "/next-font-loader/index.js?" con barras normales; en Windows la ruta del loader lleva barras
 * invertidas, el manifiesto sale vacío (`{"app":{}}`) y Next no emite ninguna precarga, ni en
 * `next dev` ni en `next build`. En Linux (Vercel, CI) el manifiesto se llena, Next escribe las
 * precargas y aquí se devuelve una lista vacía. Con el manifiesto vacío se devuelven los `*.p.woff2`
 * que next/font dejó en `<distDir>/static/media`: son exactamente las fuentes con `preload: true` y las
 * mismas URL de su @font-face. Solo en el servidor; el resultado se guarda para todo el proceso en
 * cuanto es definitivo (manifiesto lleno o fuentes encontradas), así que el disco se lee una vez.
 *
 * (Se usa un <link> y no `ReactDOM.preload()`: llamado desde un componente de servidor, en `next dev`
 * solo viajó como pista dentro de la carga RSC y no llegó al <head> del HTML inicial.)
 */
export function precargasDeFuentes(): string[] {
  if (precargasDeRespaldo) return precargasDeRespaldo;
  const { lista, definitiva } = calcularPrecargasDeRespaldo();
  if (definitiva) precargasDeRespaldo = lista;
  return lista;
}

function calcularPrecargasDeRespaldo(): { lista: string[]; definitiva: boolean } {
  try {
    const dist = join(process.cwd(), process.env.NEXT_DIST_DIR || ".next");
    const manifiesto = JSON.parse(
      readFileSync(join(dist, "server", "next-font-manifest.json"), "utf8"),
    ) as { app?: Record<string, string[]> };
    if (Object.values(manifiesto.app ?? {}).some((archivos) => archivos.length > 0)) {
      return { lista: [], definitiva: true }; // Next ya escribe las precargas
    }
    const lista = readdirSync(join(dist, "static", "media"))
      .filter((archivo) => archivo.endsWith(".p.woff2"))
      .sort()
      .map((archivo) => `/_next/static/media/${archivo}`);
    // Vacía solo si next/font aún no emitió sus archivos (primera compilación de `next dev`).
    return { lista, definitiva: lista.length > 0 };
  } catch {
    // Sin manifiesto o sin carpeta de estáticos (build a medias, o un despliegue que los sirve desde un
    // CDN): no se precarga a mano y se vuelve a mirar en la próxima petición (dos lecturas fallidas).
    return { lista: [], definitiva: false };
  }
}
