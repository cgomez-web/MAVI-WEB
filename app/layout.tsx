import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { variablesDeFuente } from "./fonts";
import { sitio, urlDelSitio } from "@/content/sitio";
import { Cabecera } from "@/components/sections/Cabecera";
import { Pie } from "@/components/sections/Pie";
import { WhatsAppFlotante } from "@/components/ui/WhatsAppFlotante";
import { Movimiento } from "@/components/ui/Movimiento";
import { BarraProgreso } from "@/components/ui/BarraProgreso";
import { Cursor } from "@/components/ui/Cursor";
import { JsonLd } from "@/components/seo/JsonLd";
import { jsonLdNegocio } from "@/lib/jsonld";

export const metadata: Metadata = {
  metadataBase: new URL(urlDelSitio()),
  title: {
    default: `${sitio.nombre} — Alquiler de maquinaria y equipos en Envigado`,
    template: `%s | ${sitio.nombreCorto} Proyectos e Inversiones`,
  },
  description: sitio.descripcion,
  keywords: [...sitio.palabrasClave],
  applicationName: sitio.nombre,
  authors: [{ name: sitio.nombre }],
  creator: sitio.nombre,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: sitio.nombre,
    title: `${sitio.nombre} — ${sitio.lema}`,
    description: sitio.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: `${sitio.nombre} — ${sitio.lema}`,
    description: sitio.descripcion,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

// Todas las páginas se renderizan por petición (CSP con nonce). Ver PLAN.md §1.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Leer las cabeceras obliga a renderizar cada petición: así Next aplica a sus <script> el nonce de la
  // CSP generada en middleware.ts (una página pre-renderizada no podría llevar un nonce por petición).
  await headers();
  return (
    <html lang="es-CO" className={variablesDeFuente} data-cursor="off" suppressHydrationWarning>
      <body>
        <a href="#contenido" className="saltar">
          Saltar al contenido
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
        <JsonLd datos={jsonLdNegocio()} />
      </body>
    </html>
  );
}
