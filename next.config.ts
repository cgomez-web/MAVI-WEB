import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

/**
 * Cabeceras de seguridad estáticas para TODAS las rutas (incluidos assets).
 * La Content-Security-Policy no va aquí: necesita un nonce por petición y la genera middleware.ts.
 */
const cabecerasDeSeguridad = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // Solo funciones reconocidas por los navegadores actuales (las desconocidas ensucian la consola).
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), accelerometer=(), gyroscope=(), magnetometer=(), display-capture=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig: NextConfig = {
  // Permite un servidor de desarrollo en otra carpeta (NEXT_DIST_DIR=.next-dev) sin pisar el build.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  // Metadatos siempre en el <head> (sin "streaming metadata"): los rastreadores y Lighthouse
  // leen title/description/canonical/OG del HTML inicial.
  htmlLimitedBots: /.*/,
  // El sitio no usa next/image: las fotos se sirven con <picture> (AVIF/WebP pregenerados). Con el
  // optimizador apagado, /_next/image responde 404 y nadie puede pedir miles de transformaciones que
  // cuestan CPU o cuota. Si algún día se usa next/image, reactivarlo con límites:
  // { formats: ["image/avif", "image/webp"], qualities: [75], localPatterns: [{ pathname: "/img/**", search: "" }] }
  images: {
    unoptimized: true,
  },
  experimental: {
    // Importa solo lo usado de estas librerías grandes.
    optimizePackageImports: ["@react-three/drei", "gsap"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: cabecerasDeSeguridad },
      {
        source: "/img/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/brochure-mavi-proyectos-e-inversiones.pdf",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },
};

const conAnalizador = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

export default conAnalizador(nextConfig);
