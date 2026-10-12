import { NextResponse, type NextRequest } from "next/server";
import { construirCsp, generarNonce } from "@/lib/csp";

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

  const respuesta = NextResponse.next({ request: { headers: cabeceras } });
  respuesta.headers.set("Content-Security-Policy", csp);
  return respuesta;
}

export const config = {
  matcher: [
    {
      // Solo documentos HTML: se excluyen assets, imágenes, fuentes y prefetch de Next.
      source:
        "/((?!_next/static|_next/image|img/|fonts/|favicon|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|manifest.webmanifest|\\.well-known/|brochure-).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
