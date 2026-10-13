import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { precargasDeFuentes, variablesDeFuente } from "./fonts";
import { analiticaSinCookies, sitio, urlDelSitio } from "@/content/sitio";
import { textosGenerales } from "@/content/interfaz";
import { Cabecera } from "@/components/sections/Cabecera";
import { Pie } from "@/components/sections/Pie";
import { WhatsAppFlotante } from "@/components/ui/WhatsAppFlotante";
import { Movimiento } from "@/components/ui/Movimiento";
import { TransicionPagina } from "@/components/ui/TransicionPagina";
import { BarraProgreso } from "@/components/ui/BarraProgreso";
import { Cursor } from "@/components/ui/Cursor";
import { JsonLd } from "@/components/seo/JsonLd";
import { jsonLdNegocio } from "@/lib/jsonld";
import { baseOpenGraph } from "@/lib/metadatos";

/**
 * Metadatos comunes. Cada página declara los suyos con `metaPagina()` (lib/metadatos.ts); estos
 * valores son los del inicio, que no exporta metadata propia.
 * - canonical y og:url "./": Next los resuelve con la ruta de la página actual, así que una página
 *   nueva sin `alternates` se declara canónica a sí misma (no al inicio). La 404 lo anula.
 * - Sin `robots`: indexar es el comportamiento por defecto y así la 404 solo lleva el `noindex`
 *   que Next le añade, sin una segunda etiqueta "index, follow" contradictoria.
 * - La imagen OG la aporta app/opengraph-image.tsx.
 */
export const metadata: Metadata = {
  metadataBase: new URL(urlDelSitio()),
  title: {
    default: sitio.tituloInicio,
    template: `%s | ${sitio.nombreCorto}`,
  },
  description: sitio.descripcion,
  keywords: [...sitio.palabrasClave],
  applicationName: sitio.nombre,
  authors: [{ name: sitio.nombre }],
  creator: sitio.nombre,
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: "./" },
  openGraph: {
    ...baseOpenGraph,
    title: `${sitio.nombre} — ${sitio.lema}`,
    description: sitio.descripcion,
    url: "./",
  },
  twitter: {
    card: "summary_large_image",
    title: `${sitio.nombre} — ${sitio.lema}`,
    description: sitio.descripcion,
  },
};

// Todas las páginas se renderizan por petición (CSP con nonce). Ver PLAN.md §1.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Permite usar env(safe-area-inset-*) para la barra inferior en iPhone.
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Leer las cabeceras obliga a renderizar cada petición: así Next aplica a sus <script> el nonce de la
  // CSP generada en middleware.ts (una página pre-renderizada no podría llevar un nonce por petición).
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const analitica = analiticaSinCookies();
  return (
    <html lang="es-CO" className={variablesDeFuente} data-cursor="off" suppressHydrationWarning>
      <body>
        {/* Respaldo de la precarga de fuentes para builds hechos en Windows (ver app/fonts.ts); en
            Linux y Vercel devuelve una lista vacía porque Next ya escribe las precargas. */}
        {precargasDeFuentes().map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
        ))}
        <a href="#contenido" className="saltar">
          {textosGenerales.saltarAlContenido}
        </a>
        <BarraProgreso />
        <Cabecera />
        <main id="contenido" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Pie />
        <WhatsAppFlotante />
        <Cursor />
        <Movimiento />
        {/* Transición de página "cinta" (z 45: bajo la cabecera y la barra de progreso). */}
        <TransicionPagina />
        <JsonLd datos={jsonLdNegocio()} />
        {analitica ? (
          // Analítica sin cookies, solo si están NEXT_PUBLIC_PLAUSIBLE_HOST y _DOMAIN. Lleva el nonce
          // de la petición: la CSP usa 'strict-dynamic' y no admite listas de hosts en script-src.
          <Script
            src={analitica.src}
            data-domain={analitica.dominio}
            nonce={nonce}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
