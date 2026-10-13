import { NextResponse, type NextRequest } from "next/server";
import { construirCsp, generarNonce } from "@/lib/csp";
import { lineaPorSlug } from "@/content/servicios";

/** /servicios/<slug> (un solo segmento, con o sin barra final). */
const FICHA_DE_SERVICIO = /^\/servicios\/([^/]+)\/?$/;

/**
 * Ruta que no existe a propósito: al reescribir a ella, Next responde 404 con app/not-found.tsx
 * renderizada en el servidor dentro del layout (lang="es-CO", cabecera, H1 y pie en el HTML inicial).
 */
const RUTA_NO_ENCONTRADA = "/__no-encontrada";

/** ¿La ruta es la ficha de una línea de servicio que no existe? */
export function esFichaDesconocida(ruta: string): boolean {
  const ficha = FICHA_DE_SERVICIO.exec(ruta);
  if (!ficha) return false;
  let slug: string;
  try {
    slug = decodeURIComponent(ficha[1] ?? "");
  } catch {
    return true; // %XX mal formado (p. ej. /servicios/%E0%A4%A): no puede ser una línea real
  }
  return !lineaPorSlug(slug);
}

/**
 * Genera un nonce por petición y la CSP correspondiente.
 * Next.js lee la CSP de la petición y aplica el nonce a sus propios <script>; los componentes que
 * necesiten el nonce (p. ej. Turnstile) lo leen de la cabecera `x-nonce`.
 */
export function middleware(request: NextRequest) {
  const nonce = generarNonce();
  const host = request.nextUrl.hostname;
  const csp = construirCsp({
    nonce,
    desarrollo: process.env.NODE_ENV === "development",
    local: host === "localhost" || host === "127.0.0.1" || host === "[::1]",
    turnstile: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    analitica: process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || undefined,
  });

  const cabeceras = new Headers(request.headers);
  cabeceras.set("x-nonce", nonce);
  cabeceras.set("Content-Security-Policy", csp);

  // /servicios/<slug> desconocido: con notFound() en la página, Next 15.5 sirve un shell vacío
  // (<html id="__next_error__">, sin lang ni contenido) que solo se pinta con JavaScript. Reescribir a
  // una ruta inexistente hace que sirva la 404 completa desde el servidor. El notFound() de
  // app/servicios/[slug]/page.tsx queda como red de seguridad.
  const respuesta = esFichaDesconocida(request.nextUrl.pathname)
    ? NextResponse.rewrite(new URL(RUTA_NO_ENCONTRADA, request.url), {
        request: { headers: cabeceras },
      })
    : NextResponse.next({ request: { headers: cabeceras } });
  respuesta.headers.set("Content-Security-Policy", csp);
  return respuesta;
}

export const config = {
  matcher: [
    {
      // Solo documentos HTML: se excluyen los assets que existen de verdad y el prefetch de Next.
      // Cada exclusión está anclada a un archivo concreto (con `$` o extensión de imagen): una ruta
      // nueva como /iconos o /brochure-2027, o un 404 bajo /img/, sí recibe CSP.
      // /_next/image no se excluye: el optimizador está apagado (next.config.ts) y su 404 lleva CSP.
      // /api/cotizacion se excluye porque responde JSON (no necesita CSP) y porque, si el middleware
      // la procesa, Next copia el cuerpo entero (hasta 10 MB) y espera al final de la subida antes de
      // llamar a la ruta: la lectura acotada a 16 KB de lib/cotizacion.ts no podría cortar a tiempo.
      // Las cabeceras de next.config.ts se siguen aplicando. Un /api/* inexistente sí recibe CSP.
      source:
        "/((?!_next/static/|api/cotizacion$|img/.+\\.(?:avif|webp|jpe?g|png|gif|svg)$|icon\\.svg$|opengraph-image$|robots\\.txt$|sitemap\\.xml$|manifest\\.webmanifest$|\\.well-known/|brochure-mavi-proyectos-e-inversiones\\.pdf$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
