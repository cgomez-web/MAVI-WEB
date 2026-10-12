# PLAN — Sitio MAVI Proyectos e Inversiones

> Estado vivo del proyecto. Cada iteración del loop actualiza la tabla de avance.

## Avance

| Fase | Estado |
|---|---|
| 1. Descubrimiento (`INVENTARIO-ACTIVOS.md`) | ✅ 2026-10-12 |
| 2. Plan (`PLAN.md`, `DISEÑO.md`, `MOTION.md`, `PENDIENTES.md`) | ✅ 2026-10-12 |
| 3. Scaffold + tokens + pipeline de imágenes + `content/` | ⏳ |
| 4. Secciones HTML/CSS (sitio completo sin 3D) | ⏳ |
| 5. Capa 3D por fases | ⏳ |
| 6. Formulario + seguridad | ⏳ |
| 7. Pruebas, accesibilidad, Lighthouse | ⏳ |
| 8. Entrega (README, SECURITY, ASSETS-LICENSES, REPORTE-FINAL) | ⏳ |

## 1. Arquitectura

```
mavi-web/
├─ app/                      App Router (RSC por defecto; cliente solo donde hay interacción)
│  ├─ (site)/                layout común: header, footer, WhatsApp flotante, cursor
│  │  ├─ page.tsx            home narrativa
│  │  ├─ servicios/[slug]/   6 páginas SEO generadas desde content/servicios.ts
│  │  ├─ nosotros/  contacto/  politica-de-privacidad/
│  ├─ api/cotizacion/route.ts  Route Handler del formulario (POST, JSON)
│  ├─ opengraph-image.tsx  sitemap.ts  robots.ts  not-found.tsx  error.tsx  global-error.tsx
│  └─ fonts/                 woff2 self-hosted (next/font/local)
├─ components/
│  ├─ ui/                    primitivas propias (Button, Stamp, Odometer, SpecTable, Tape…)
│  ├─ sections/              Hero, TrustBar, Services, About, Inventory, Process, Quote, Footer
│  ├─ icons/                 set propio de 10 iconos SVG
│  └─ three/                 escena R3F (carga diferida) + detección de capacidades
├─ content/                  TODO el texto, fichas técnicas, contacto, galería (editable por el dueño)
├─ lib/                      validación Zod, email, rate-limit, turnstile, seguridad, utilidades
├─ scripts/process-images.ts pipeline reproducible (sharp)
├─ public/                   img/bodega (generado), brochure optimizado, .well-known/security.txt
├─ middleware.ts             CSP con nonce por petición
└─ tests/ (unit + e2e)
```

**Render**: la CSP con *nonce* obliga a render dinámico por petición (el nonce cambia en cada respuesta). Se acepta: las páginas son ligeras, Vercel las sirve desde funciones en `iad1`/`gru1`, y el HTML no depende de datos externos. Alternativa documentada en `SECURITY.md`: CSP por *hash* con `experimental.sri` si se quisiera volver a estático.

## 2. Mapa del sitio

| Ruta | Contenido | H1 |
|---|---|---|
| `/` | Narrativa: Hero → Barra de confianza → Servicios (6) → Quiénes somos → Inventario real → Cómo trabajamos → Cotización → Footer | "Facilitamos su avance" (titular propio, ver DISEÑO) |
| `/servicios/maquinaria-pesada` | Ficha: excavadoras, retro, mini retro, mini cargadores | Alquiler de maquinaria pesada en Envigado y Medellín |
| `/servicios/transporte-y-elevacion` | Volquetas, grúas, planchones, camabajas | Alquiler de volquetas, grúas y transporte de maquinaria en Antioquia |
| `/servicios/equipos-para-losas` | Correas, portacorreas, sopandas, puntales, tableros + fotos reales | Equipos para losas: puntales, correas y tableros |
| `/servicios/encofrados-y-formaleteria` | Encofrados, formaletería, tableros, accesorios + fotos | Encofrados y formaletería para columnas, vigas y muros |
| `/servicios/andamiaje` | Andamios certificados, fachada/torre, accesorios, montaje + fotos | Alquiler de andamios certificados |
| `/servicios/otros-equipos` | Plumas, generadores, compresores, vibradores, herramientas, menores + fotos | Otros equipos y accesorios para obra |
| `/nosotros` | Quiénes somos, valores, misión, visión | |
| `/contacto` | Formulario + contacto directo + mapa (enlace) | |
| `/politica-de-privacidad` | Ley 1581/2012, Decreto 1377/2013 | |

## 3. Concepto 3D — storyboard *"La obra que avanza con usted"*

Escena única, persistente (`position: fixed`, detrás del contenido en desktop; banda superior en móvil), cámara y objetos interpolados con el progreso de scroll (0→1) medido por GSAP ScrollTrigger sobre las secciones del home. Todo modelado **en código** con primitivas (`BoxGeometry`, `CylinderGeometry`, `ExtrudeGeometry`) agrupadas e instanciadas → **0 KB de GLB**, licencia propia.

| t | Fase / sección | Cámara | Escena |
|---|---|---|---|
| 0.00–0.12 | Hero | baja, frontal, amanecer (sol bajo a la izquierda, cielo ámbar→grafito) | terreno vacío con estacas y cinta; engranaje MAVI 3D gira lento; polvo (Points, 600 partículas); excavadora entra desde la derecha y su cabina **sigue el cursor** (lerp suave) |
| 0.12–0.28 | Maquinaria pesada | órbita 35° a la derecha | excavadora baja el brazo y excava (bones = grupos anidados); minicargador nivela; montículo de tierra crece (escala Y) |
| 0.28–0.42 | Transporte y elevación | plano general alto | volqueta entra y bascula; grúa telescópica despliega pluma e iza un paquete de formaletas |
| 0.42–0.56 | Equipos para losas | picado 3/4 | se levantan puntales rojos (instanced, 48) uno por uno, luego correas amarillas, luego tableros → primera losa |
| 0.56–0.70 | Encofrados y formaletería | lateral, cerca | formaletas de columnas y muros se cierran (traslación); "vaciado" de concreto: shader que sube un umbral de llenado (gris concreto) |
| 0.70–0.82 | Andamiaje | frontal, más abierta | marcos de andamio crecen piso a piso alrededor de la estructura (instanced, ~60 marcos) |
| 0.82–0.92 | Otros equipos | detalle en la terraza | generador, compresor y pluma de cargue aparecen en la losa superior |
| 0.92–1.00 | Cierre / contacto | se aleja y sube, atardecer (sol bajo a la derecha, luz naranja) | obra terminada; engranaje MAVI vuelve al centro: "Facilitamos su avance" |

**Presupuesto**: ≤ 40k triángulos (objetivo; límite 150k), 1 luz direccional con sombras solo en desktop (mapa 1024), luz hemisférica, niebla lineal. DPR `min(devicePixelRatio, 1.5)` (móvil 1.25). `frameloop="demand"` + invalidación en scroll/puntero/animación; pausa con `visibilitychange` e IntersectionObserver.

**Degradación**: se monta el 3D solo si `WebGL2` existe **y** no hay `prefers-reduced-motion` **y** `hardwareConcurrency ≥ 4` **y** `deviceMemory ≥ 4` (si está disponible) **y** no `saveData`. Si no: póster estático (SVG/CSS compuesto con los iconos propios y la cinta) — mismo contenido HTML. El usuario puede apagar el 3D desde el header (preferencia en `localStorage`, envuelta en try/catch).

## 4. Stack final y justificación de cada dependencia

Versiones **exactas** (sin `^`). Node 24 LTS (`.nvmrc`), pnpm vía corepack (`packageManager`).

| Dependencia | Versión | Por qué |
|---|---|---|
| next | 15.5.27 | Exigido (App Router). Última 15.x con parches de seguridad backport. |
| react / react-dom | 19.3.0 | Requerido por Next 15 y compatible con R3F 9 (peer `<19.4`). |
| three | 0.186.1 | Motor WebGL. |
| @react-three/fiber | 9.8.1 | Render declarativo de three en React 19. |
| @react-three/drei | 10.7.9 | Solo utilidades puntuales (`AdaptiveDpr`, `PerformanceMonitor`); se importan por ruta para tree-shaking. |
| gsap | 3.15.0 | **Único sistema de animación** (UI + mapeo scroll→3D). ScrollTrigger y SplitText son gratuitos desde 3.13. Se descarta framer-motion para no duplicar runtime (~35 kB) y porque el control de líneas de tiempo con scroll es mejor en GSAP. |
| @gsap/react | 2.1.2 | `useGSAP` con limpieza automática de contextos (evita fugas en navegación). |
| lenis | 1.3.26 | Scroll suave opcional, **desactivable**, apagado con reduced-motion y en touch. |
| zod | 4.6.6 | Esquema único compartido cliente/servidor. |
| react-hook-form + @hookform/resolvers | 7.90.0 / 5.9.1 | Formulario accesible sin re-render por tecla. |
| tailwindcss + @tailwindcss/postcss | 4.3.3 | Exigido; tokens en `@theme`. |
| — email | `fetch` nativo a la API REST de Resend | **Sin SDK**: una llamada HTTP no justifica una dependencia más. |
| — rate limit | `fetch` a la API REST de Upstash (ventana fija con `INCR`+`EXPIRE` en pipeline) + fallback en memoria | **Sin SDK**: misma razón; fallback documentado como por instancia. |
| — Turnstile | script oficial de Cloudflare cargado con nonce solo si hay `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Privacidad > reCAPTCHA. |
| Dev: typescript 5.9.3 | | TS 7 (nativo) aún no es soportado por Next 15. |
| Dev: eslint 9.39.5 + eslint-config-next 15.5.27, prettier 3.9.10 | | Calidad. |
| Dev: vitest 5.0.4, @playwright/test 1.64.0, @axe-core/playwright 4.13.0 | | Unit, E2E, a11y. |
| Dev: sharp 0.35.5, tsx 4.23.15 | | Pipeline de imágenes reproducible. |
| Dev: @next/bundle-analyzer 15.5.27 | | Presupuestos de bundle. |
| Dev: secretlint 13.0.7 + preset, husky 9.1.7 | | Pre-commit de secretos. |
| Dev: @lhci/cli 0.15.1 | | Lighthouse CI con presupuestos. |

**Desviación propuesta (documentada)**: las fotos de bodega se sirven con `<picture>` (AVIF + WebP en 3 anchos generados por `scripts/process-images.ts`) en lugar de `next/image` con optimización en runtime. Motivo: funcionan igual en Vercel, Cloudflare Pages o Node sin optimizador, no consumen cuota de optimización, permiten LQIP inline y dimensiones fijas (CLS 0). `next/image` se mantiene disponible para cualquier imagen futura.

## 5. Paleta y tipografías (detalle en `DISEÑO.md`)

- Grafito `#0B0B0C` · Amarillo máquina `#FCBF06` (muestreado del logo) · Hueso `#F4F1EA` · Concreto `#8A8A85` · Rojo puntal `#C8321E` (≤ 2 %).
- Display: **Archivo** variable (`wdth 62–125`, `wght 100–900`) — elegido sobre Big Shoulders porque la firma "tipografía viva" necesita un eje de **anchura**, que Big Shoulders no tiene (solo `wght`). Ver comparativa en `DISEÑO.md`.
- Texto: **Hanken Grotesk** variable. Datos: **Martian Mono** (`wdth`, `wght`, cifras tabulares). Estarcido: **Saira Stencil One** (3–5 usos).

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| CSP con nonce fuerza render dinámico (TTFB) | Páginas sin I/O; cache del CDN de assets; medir en Lighthouse. |
| Three.js pesa (~160 kB gz con R3F) | Import dinámico tras `requestIdleCallback` y solo si pasa la detección; fuera del JS inicial. |
| Fotos de WhatsApp de baja calidad (≤1280 px) | No se agrandan más allá del original; tratamiento visual (overlay, grano, viñeta) para que se vean intencionales. |
| Marca de otra empresa en fotos | Parches opacos/recortes en el pipeline + revisión visual registrada. |
| Sin fotos de maquinaria pesada ni transporte | Ilustración 3D + iconos propios; nunca stock. |
| Falta dominio, proveedor de email, claves | Variables de entorno + `TODO(owner)` en `PENDIENTES.md`; el formulario degrada a enlace de WhatsApp si el envío falla. |
| Rate limit en memoria no es global en serverless | Usar Upstash en producción (documentado como requisito). |
| Lighthouse ≥ 90 con 3D | 3D fuera del camino crítico; LCP = titular de texto. |

## 7. Preguntas al dueño (no bloqueantes — se asumen valores y se registran en `PENDIENTES.md`)

1. ¿Dominio definitivo? (se asume `https://www.maviproyectos.com` como placeholder).
2. ¿Proveedor de correo? (se asume Resend; destino `maviproyectoseinversiones@gmail.com`).
3. ¿Existe el logo en vector? (se redibuja en SVG a partir del brochure).
4. ¿Horario de atención? (se publica como "a confirmar").
5. ¿Autorizan mostrar a los trabajadores que aparecen en las fotos de obra?
