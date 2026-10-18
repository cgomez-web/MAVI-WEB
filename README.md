# MAVI Proyectos e Inversiones — sitio web

Sitio de **MAVI Proyectos e Inversiones** (Envigado, Antioquia): alquiler y suministro de maquinaria pesada, transporte y elevación, equipos para losas, encofrados y formaletería, andamiaje y equipos menores. Narrativa _"La obra que avanza con usted"_: una escena 3D (React Three Fiber) que se construye con el scroll, con respaldo 2D completo.

- **Stack**: Next.js 15 (App Router) · React 19 · TypeScript estricto · Tailwind CSS v4 · three.js + R3F · GSAP (solo la tipografía viva, diferido) · Lenis (opcional) · Zod (mini) + React Hook Form (formulario diferido).
- **Documentos**: [`docs/PLAN.md`](docs/PLAN.md) · [`docs/DISEÑO.md`](docs/DISEÑO.md) · [`docs/MOTION.md`](docs/MOTION.md) · [`docs/INVENTARIO-ACTIVOS.md`](docs/INVENTARIO-ACTIVOS.md) · [`docs/PENDIENTES.md`](docs/PENDIENTES.md) · [`docs/REPORTE-FINAL.md`](docs/REPORTE-FINAL.md) · [`SECURITY.md`](SECURITY.md) · [`ASSETS-LICENSES.md`](ASSETS-LICENSES.md)

## Requisitos

- Node.js 24 LTS (ver `.nvmrc`).
- pnpm 10 vía corepack: `corepack enable` (el proyecto fija `pnpm@10.34.7` en `package.json`).

## Cómo correrlo

```bash
corepack enable
pnpm install
cp .env.example .env.local   # complete las variables (ver abajo)
pnpm dev                     # http://localhost:3000
```

Producción local:

```bash
pnpm build
pnpm start
```

> No ejecute `pnpm dev` y `pnpm build`/`pnpm start` a la vez: comparten la carpeta `.next`.

## Variables de entorno

Todas documentadas en [`.env.example`](.env.example). Ninguna clave secreta lleva prefijo `NEXT_PUBLIC_`.

| Variable                                                  | Obligatoria                    | Para qué                                                                                                                                                            |
| --------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                    | Sí                             | URL canónica (metadatos, sitemap, JSON-LD)                                                                                                                          |
| `RESEND_API_KEY`                                          | Sí (para recibir cotizaciones) | Envío del correo del formulario                                                                                                                                     |
| `QUOTE_FROM_EMAIL`                                        | Sí                             | Remitente de un dominio verificado en Resend                                                                                                                        |
| `QUOTE_TO_EMAIL`                                          | Sí                             | Destinatarios (separados por coma)                                                                                                                                  |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Recomendado                    | Anti-spam Cloudflare Turnstile                                                                                                                                      |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`     | Recomendado en producción      | Rate limit global entre instancias                                                                                                                                  |
| `RATE_LIMIT_SALT`                                         | Recomendado                    | Sal para hashear IPs                                                                                                                                                |
| `NEXT_PUBLIC_PLAUSIBLE_HOST` / `_DOMAIN`                  | Opcional (las dos)             | Analítica sin cookies (Plausible). Solo se activa con las dos variables y un host `https`, que también entra en el `connect-src` de la CSP. Umami no está soportado |

Sin `RESEND_API_KEY` el formulario responde con un error genérico y ofrece WhatsApp: **nunca se pierde el contacto**.

## Cómo editar textos, datos y fotos (sin tocar componentes)

| Qué                                                                                                                                                                                                | Dónde                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Teléfono, correos, dirección, Instagram, horario                                                                                                                                                   | `content/contacto.ts`          |
| Nombre, lema, frases, años de experiencia, títulos y descripciones SEO de cada página, textos de las páginas de error                                                                              | `content/sitio.ts`             |
| Las 6 líneas de servicio, fichas técnicas, cifras, sellos y SEO por página. Cada `cifra` lleva `tipo: "cifra"` (valor y unidad del brochure) o `tipo: "texto"` (dato textual literal del brochure) | `content/servicios.ts`         |
| Texto propio de cada ficha (guía rápida, datos para cotizar, preguntas por línea) y del índice `/servicios`                                                                                        | `content/servicios-detalle.ts` |
| Quiénes somos, misión, visión, valores, frase de compromiso y encabezado del índice de servicios (`solucionesIntegrales`)                                                                          | `content/empresa.ts`           |
| Textos del home (hero, barra de confianza, secciones, marquee, cierre, mensaje de WhatsApp de la galería)                                                                                          | `content/home.ts`              |
| Menú, cabecera y conmutador "Animaciones"                                                                                                                                                          | `content/navegacion.ts`        |
| Rótulos de la interfaz (contacto, pie, ficha técnica, visor de fotos)                                                                                                                              | `content/interfaz.ts`          |
| Pasos de "Cómo trabajamos"                                                                                                                                                                         | `content/proceso.ts`           |
| Preguntas frecuentes (también alimentan el JSON-LD)                                                                                                                                                | `content/faq.ts`               |
| Listas del formulario (municipios, duraciones), textos, autorización de datos y mensajes de validación                                                                                             | `content/formulario.ts`        |
| Política de datos personales                                                                                                                                                                       | `content/legal.ts`             |
| Galería de bodega (títulos, textos alternativos, recortes, parches, ocultar)                                                                                                                       | `content/galeria.ts`           |

**Agregar o cambiar una foto de bodega**

1. Copie el original en la carpeta superior (`E:\PAGINA WEB`) o indique otra con `MAVI_ASSETS_DIR`.
2. Agregue una entrada en `content/galeria.ts` (`id`, `original`, `categoria`, `titulo`, `alt` descriptivo, `publicar: true`). Si la foto muestra rótulos de otra empresa, placas o datos personales, defina `parches` o `recorte`.
3. Ejecute `pnpm images` y revise `docs/img/verificacion-galeria.jpg`.

Cada archivo generado lleva en el nombre un hash de su contenido (`<id>-<ancho>.<hash>.avif|webp`), así que una foto corregida estrena URL y la caché `immutable` de `/img` nunca sirve la versión vieja. No renombre los archivos a mano.

**Brochure PDF**: `corepack pnpm brochure` lo genera desde cero (texto vectorial, logo SVG y fotos procesadas, datos de `content/`) en `public/brochure-mavi-proyectos-e-inversiones.pdf`. Ejecútelo de nuevo cuando cambie un dato.

## Calidad

```bash
pnpm lint          # ESLint (sin advertencias)
pnpm typecheck     # TypeScript estricto
pnpm test          # Vitest (unitarias)
pnpm build
pnpm test:e2e      # Playwright + axe (requiere build; levanta next start en :3200)
pnpm secrets       # secretlint
pnpm lhci          # Lighthouse CI con presupuestos (Linux/CI)
node scripts/lighthouse.mjs http://localhost:3200   # Lighthouse local alternativo
pnpm analyze       # @next/bundle-analyzer
pnpm presupuesto:js # JS inicial gzip por ruta desde .next (falla si una ruta supera 150 kB)
```

`pnpm exec playwright install chromium` la primera vez. El hook de pre-commit (husky) bloquea commits con secretos.

Parámetro de diagnóstico: `/?escena=3d` fuerza la escena 3D (omite heurísticas de hardware y muestra métricas en `window.__maviInfo()`); `/?escena=2d` fuerza el póster.

## Despliegue en Vercel (paso a paso)

1. Suba el repositorio a GitHub (rama `main`).
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importe el repositorio. Vercel detecta Next.js; `vercel.json` ya define instalación con pnpm y región `iad1`.
3. En **Settings → Environment Variables** cargue las variables de la tabla (Production y Preview).
4. **Deploy**. Verifique `https://<su-dominio>/` y `/.well-known/security.txt`.
5. **Dominio**: Settings → Domains → agregue el dominio y configure los DNS indicados. Actualice `NEXT_PUBLIC_SITE_URL` y `public/.well-known/security.txt`.
6. **Correo**: en Resend verifique el dominio (registros SPF/DKIM) y use un remitente de ese dominio en `QUOTE_FROM_EMAIL`.
7. **Turnstile**: en Cloudflare → Turnstile cree un sitio con el dominio y copie las dos claves.
8. **Upstash**: cree una base Redis (región cercana a `iad1`) y copie URL y token REST.
9. Revise cabeceras en [securityheaders.com](https://securityheaders.com) y rendimiento en PageSpeed Insights.

### Alternativas

- **Node propio**: `pnpm build && pnpm start` detrás de un proxy con HTTPS (Nginx/Caddy). Configure las mismas variables. Si el proxy reescribe `X-Forwarded-For`, asegúrese de que sea confiable (el rate limit lo usa).
- **Build en Windows**: Next 15.5 no emite la precarga de fuentes de `next/font` en un build hecho en Windows (compara rutas con barras normales). `app/fonts.ts` la añade como respaldo desde el layout, pero se recomienda construir en Linux o en Vercel.
- **Cloudflare Pages / Workers**: use el adaptador `@opennextjs/cloudflare`; el middleware (CSP con nonce) y el Route Handler funcionan en el runtime de Workers. Las fotos ya están optimizadas (AVIF/WebP) y no dependen del optimizador de imágenes de Next.

## Estructura

```
app/            rutas, layout, metadatos, API de cotización, fuentes
components/     brand · icons · sections · ui · three · seo
content/        TODO el contenido editable
lib/            validación, CSP, correo, rate limit, Turnstile, JSON-LD
scripts/        imágenes, brochure, capturas, Lighthouse, presupuesto de JS
public/         fotos procesadas, brochure, security.txt
tests/          unit (Vitest) · e2e (Playwright + axe)
docs/           plan, diseño, movimiento, inventario, pendientes, reporte
```
