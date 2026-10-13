import { describe, expect, it } from "vitest";
import { construirCsp, generarNonce } from "@/lib/csp";
import { escaparHtml, limpiarCabecera } from "@/lib/escape";
import { serializarJsonLd } from "@/lib/jsonld";
import { config as configMiddleware, esFichaDesconocida } from "@/middleware";
// Misma función con la que Next compila el matcher del middleware (no está en sus tipos públicos).
import * as infoEstatica from "next/dist/build/analysis/get-page-static-info";

const { getMiddlewareMatchers } = infoEstatica as unknown as {
  getMiddlewareMatchers: (matcher: unknown, nextConfig: object) => Array<{ regexp: string }>;
};

const directiva = (csp: string, nombre: string) =>
  csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${nombre} `)) ?? "";

describe("Content-Security-Policy", () => {
  const prod = construirCsp({ nonce: "abc123", desarrollo: false, local: false, turnstile: false });

  it("usa nonce + strict-dynamic y nunca unsafe-inline/unsafe-eval en scripts de producción", () => {
    const script = directiva(prod, "script-src");
    expect(script).toContain("'nonce-abc123'");
    expect(script).toContain("'strict-dynamic'");
    expect(script).not.toContain("unsafe-inline");
    expect(script).not.toContain("unsafe-eval");
  });

  it("bloquea objetos, marcos ajenos y cambia la base", () => {
    expect(directiva(prod, "object-src")).toBe("object-src 'none'");
    expect(directiva(prod, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directiva(prod, "base-uri")).toBe("base-uri 'self'");
    expect(directiva(prod, "form-action")).toBe("form-action 'self'");
    expect(prod).toContain("upgrade-insecure-requests");
  });

  it("solo abre Cloudflare cuando Turnstile está configurado", () => {
    expect(prod).not.toContain("challenges.cloudflare.com");
    const conTurnstile = construirCsp({
      nonce: "n",
      desarrollo: false,
      local: false,
      turnstile: true,
    });
    expect(directiva(conTurnstile, "frame-src")).toContain("https://challenges.cloudflare.com");
    expect(directiva(conTurnstile, "connect-src")).toContain("https://challenges.cloudflare.com");
  });

  it("permite workers blob: (three.js) y omite upgrade-insecure-requests en localhost", () => {
    expect(directiva(prod, "worker-src")).toContain("blob:");
    const local = construirCsp({ nonce: "n", desarrollo: false, local: true, turnstile: false });
    expect(local).not.toContain("upgrade-insecure-requests");
  });

  it("genera nonces distintos de 128 bits", () => {
    const a = generarNonce();
    const b = generarNonce();
    expect(a).not.toBe(b);
    expect(atob(a)).toHaveLength(16);
  });
});

describe("escape", () => {
  it("escapa HTML", () => {
    expect(escaparHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;",
    );
  });

  it("limpia saltos de línea de valores de cabecera", () => {
    expect(limpiarCabecera("Asunto\r\nBcc: x@y.co")).toBe("Asunto Bcc: x@y.co");
  });

  it("el JSON-LD no puede cerrar la etiqueta <script>", () => {
    const s = serializarJsonLd({ nombre: "</script><script>alert(1)</script>" });
    expect(s).not.toContain("</script>");
    expect(JSON.parse(s)).toEqual({ nombre: "</script><script>alert(1)</script>" });
  });
});

describe("matcher del middleware (qué rutas reciben CSP)", () => {
  const [compilado] = getMiddlewareMatchers(configMiddleware.matcher, {});
  const recibeCsp = (ruta: string) => new RegExp(compilado!.regexp).test(ruta);

  it("las páginas y cualquier ruta nueva o inexistente llevan CSP", () => {
    for (const ruta of [
      "/",
      "/contacto",
      "/servicios/andamiaje",
      "/no-existe",
      "/iconos",
      "/iconos-falsos",
      "/favicon.ico",
      "/apple-icon",
      "/brochure-2027",
      "/fonts/x",
      "/img/no-existe.html",
      "/opengraph-image-x",
      "/_next/image",
      "/api/no-existe",
      "/api/cotizacion-x",
      "/api/cotizacion/x",
    ]) {
      expect(recibeCsp(ruta), ruta).toBe(true);
    }
  });

  it("los assets reales y la API JSON quedan fuera", () => {
    for (const ruta of [
      // Sin middleware Next no copia el cuerpo: la lectura acotada a 16 KB corta a tiempo (#44).
      "/api/cotizacion",
      "/_next/static/chunks/main.js",
      "/img/bodega/puntal-01-1280.avif",
      "/img/bodega/puntal-01-1280.3f9a1c2b.webp",
      "/icon.svg",
      "/opengraph-image",
      "/robots.txt",
      "/sitemap.xml",
      "/.well-known/security.txt",
      "/brochure-mavi-proyectos-e-inversiones.pdf",
    ]) {
      expect(recibeCsp(ruta), ruta).toBe(false);
    }
  });
});

describe("fichas de servicio inexistentes (#71)", () => {
  it("se reescriben a la 404 renderizada en el servidor", () => {
    for (const ruta of ["/servicios/xyz", "/servicios/no-existe/", "/servicios/%E0%A4%A"])
      expect(esFichaDesconocida(ruta), ruta).toBe(true);
  });

  it("las fichas reales, el índice y sus imágenes no se tocan", () => {
    for (const ruta of [
      "/servicios",
      "/servicios/",
      "/servicios/andamiaje",
      "/servicios/maquinaria-pesada/",
      "/servicios/andamiaje/opengraph-image/ficha",
      "/contacto",
    ])
      expect(esFichaDesconocida(ruta), ruta).toBe(false);
  });
});
