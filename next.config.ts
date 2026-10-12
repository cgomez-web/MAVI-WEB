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
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
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
