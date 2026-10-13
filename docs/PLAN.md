# PLAN — Sitio MAVI Proyectos e Inversiones

> Estado vivo del proyecto. Cada iteración del loop actualiza la tabla de avance.

## Avance

| Fase                                                           | Estado                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| 1. Descubrimiento (`INVENTARIO-ACTIVOS.md`)                    | ✅ 2026-10-12                                                 |
| 2. Plan (`PLAN.md`, `DISEÑO.md`, `MOTION.md`, `PENDIENTES.md`) | ✅ 2026-10-12                                                 |
| 3. Scaffold + tokens + pipeline de imágenes + `content/`       | ✅ 2026-10-12                                                 |
| 4. Secciones HTML/CSS (sitio completo sin 3D)                  | ✅ 2026-10-12                                                 |
| 5. Capa 3D por fases                                           | ✅ 2026-10-12 (pulido visual pendiente, ver REPORTE-FINAL §7) |
| 6. Formulario + seguridad                                      | ✅ 2026-10-12 (claves reales: dueño)                          |
| 7. Pruebas, accesibilidad, Lighthouse                          | ✅ 2026-10-12 (cifras vigentes en `REPORTE-FINAL.md`)         |
| 8. Entrega (README, SECURITY, ASSETS-LICENSES, REPORTE-FINAL)  | ✅ 2026-10-12                                                 |

**Iteraciones siguientes del loop**: pulido de la escena 3D, medición de fps en dispositivo real, `TODO(owner)` de `PENDIENTES.md`.

**Auditoría del 2026-10-12** (`docs/auditoria/resultado-2026-10-12.json`, 85 hallazgos): corregida por equipos e integrada. Este documento describe lo que existe después de esa ronda.

## 1. Arquitectura

```
mavi-web/
├─ app/                      App Router (RSC por defecto; cliente solo donde hay interacción)
│  ├─ layout.tsx             cabecera, pie, WhatsApp fijo, cursor, movimiento, transición de página
│  ├─ page.tsx               home narrativa (secciones bajo el pliegue con content-visibility: auto)
│  ├─ servicios/page.tsx     índice de las 6 líneas (destino de la miga "Servicios")
│  ├─ servicios/[slug]/      6 fichas generadas desde content/servicios.ts y servicios-detalle.ts,
│  │                         cada una con su opengraph-image.tsx
│  ├─ nosotros/  contacto/  politica-de-privacidad/
│  ├─ api/cotizacion/route.ts  Route Handler del formulario (POST, JSON; fuera del middleware)
│  ├─ opengraph-image.tsx  sitemap.ts  robots.ts  not-found.tsx  error.tsx  global-error.tsx
│  ├─ fonts.ts + fonts/      woff2 self-hosted (next/font/local) y respaldo de la precarga
│  └─ og/                    fuentes TTF para las imágenes OG
├─ components/
│  ├─ ui/                    Movimiento (+ movimiento-diferido), TransicionPagina, Odometro,
│  │                         FilaInclinable, FotoBodega, ContactoProtegido, Cursor, BarraProgreso,
│  │                         WhatsAppFlotante
│  ├─ sections/              Cabecera, Hero, BarraConfianza, IndiceServicios, LineaServicio, Marquee,
│  │                         Nosotros, Inventario, Proceso, PreguntasFrecuentes, Cierre, Cotizacion
│  │                         (+ CamposCotizacion, FormularioCotizacion, FormularioCotizacionDiferido), Pie
│  ├─ brand/  icons/  seo/   logo en SVG, set propio de iconos, JSON-LD
│  └─ three/                 escena R3F (carga diferida), póster SVG por capas, velos de contraste,
│                            detección de capacidades y fases del storyboard
├─ content/                  TODO el texto, fichas técnicas, contacto, galería, rótulos de interfaz
│                            (interfaz.ts) y textos del formulario (editable por el dueño)
├─ lib/                      validación Zod, email, rate-limit, Turnstile, CSP, metadatos, JSON-LD,
│                            preferencias de movimiento, utilidades
├─ scripts/                  process-images.ts (sharp) y presupuesto-js.mjs (JS inicial por ruta)
├─ public/                   img/bodega (generado, con hash en el nombre), brochure, .well-known/
├─ middleware.ts             CSP con nonce por petición (solo documentos HTML) y 404 de fichas inexistentes
└─ tests/ (unit + e2e)
```

**Render**: la CSP con _nonce_ obliga a render dinámico por petición (el nonce cambia en cada respuesta). Se acepta: las páginas son ligeras, Vercel las sirve desde funciones en `iad1`/`gru1`, y el HTML no depende de datos externos. Alternativa documentada en `SECURITY.md`: CSP por _hash_ con `experimental.sri` si se quisiera volver a estático.

## 2. Mapa del sitio

| Ruta                                   | Contenido                                                                                                                                                      | H1                                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                    | Narrativa: Hero → Barra de confianza → Servicios (6) → Quiénes somos → Inventario real → Cómo trabajamos → Preguntas frecuentes → Cierre → Cotización → Footer | Antetítulo "Alquiler de maquinaria y equipos para construcción · Envigado, Antioquia" + "Su obra avanza. Nosotros la movemos." (los dos en el mismo H1) |
| `/servicios`                           | Índice de las seis líneas con sus equipos                                                                                                                      | Alquiler de equipos para construcción                                                                                                                   |
| `/servicios/maquinaria-pesada`         | Ficha: excavadoras, retro, mini retro, mini cargadores                                                                                                         | Alquiler de maquinaria pesada en Envigado y Medellín                                                                                                    |
| `/servicios/transporte-y-elevacion`    | Volquetas, grúas, planchones, camabajas                                                                                                                        | Alquiler de volquetas, grúas y transporte de maquinaria en Antioquia                                                                                    |
| `/servicios/equipos-para-losas`        | Correas, portacorreas, sopandas, puntales, tableros + fotos reales                                                                                             | Equipos para losas: puntales, correas y tableros                                                                                                        |
| `/servicios/encofrados-y-formaleteria` | Encofrados, formaletería, tableros, accesorios + fotos                                                                                                         | Encofrados y formaletería para columnas, vigas y muros                                                                                                  |
| `/servicios/andamiaje`                 | Andamios certificados, fachada/torre, accesorios, montaje + fotos                                                                                              | Alquiler de andamios certificados                                                                                                                       |
| `/servicios/otros-equipos`             | Plumas, generadores, compresores, vibradores, herramientas, menores + fotos                                                                                    | Otros equipos y accesorios para obra                                                                                                                    |
| `/nosotros`                            | Quiénes somos, valores, misión, visión, cómo trabajamos, cotización                                                                                            | Más de 15 años facilitando el avance de cada obra                                                                                                       |
| `/contacto`                            | Formulario + contacto directo + mapa (enlace) + preguntas frecuentes                                                                                           | Cuéntenos qué necesita su obra                                                                                                                          |
| `/politica-de-privacidad`              | Ley 1581/2012, Decreto 1377/2013                                                                                                                               | Política de tratamiento de datos personales                                                                                                             |

Una ruta inexistente responde 404 con `app/not-found.tsx` renderizada en el servidor. `/servicios/<slug>` con un slug que no existe se reescribe en `middleware.ts` a esa misma 404 (con `notFound()` en la página, Next 15.5 serviría un documento vacío que solo se pinta con JavaScript).

## 3. Concepto 3D — storyboard _"La obra que avanza con usted"_

Escena única, persistente: capa fija a pantalla completa detrás del contenido (`position: fixed`, también en móvil), con velos de contraste bajo el texto (`components/three/VelosTexto.tsx`). Cámara y objetos se interpolan con el progreso de scroll (0→1) que calcula `medirDocumento()` (`components/three/fases.ts`) a partir de la "ventana" de cada fase (`[data-ventana-3d]`): cada fase ocurre mientras su ventana está en pantalla. Todo modelado **en código** con primitivas (`BoxGeometry`, `CylinderGeometry`, `ExtrudeGeometry`) agrupadas e instanciadas → **0 KB de GLB**, licencia propia.

| t         | Fase / sección            | Cámara                                                                 | Escena                                                                                                                                                                                                                                   |
| --------- | ------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.00–0.12 | Hero                      | baja, frontal, amanecer (sol bajo a la izquierda, cielo ámbar→grafito) | terreno vacío con estacas y cinta; engranaje MAVI 3D gira lento; polvo (Points, 600 partículas); la excavadora entra sola desde la derecha al aparecer la escena (y con el scroll); su cabina **sigue el cursor** (en táctil, el scroll) |
| 0.12–0.28 | Maquinaria pesada         | órbita 35° a la derecha                                                | excavadora baja el brazo y excava (bones = grupos anidados); minicargador nivela; montículo de tierra crece (escala Y)                                                                                                                   |
| 0.28–0.42 | Transporte y elevación    | plano general alto                                                     | volqueta y grúa entran; la volqueta bascula y la grúa despliega la pluma e iza un paquete de formaletas (la grúa no está antes de esta fase)                                                                                             |
| 0.42–0.56 | Equipos para losas        | picado 3/4                                                             | se levantan puntales rojos (instanced, 48) uno por uno, luego correas amarillas, luego tableros → primera losa                                                                                                                           |
| 0.56–0.70 | Encofrados y formaletería | lateral, cerca                                                         | formaletas de columnas y muros se cierran (traslación); "vaciado" de concreto: shader que sube un umbral de llenado (gris concreto)                                                                                                      |
| 0.70–0.82 | Andamiaje                 | frontal, más abierta                                                   | marcos de andamio crecen piso a piso alrededor de la estructura (instanced, ~60 marcos)                                                                                                                                                  |
| 0.82–0.92 | Otros equipos             | detalle en la terraza                                                  | generador, compresor y pluma de cargue aparecen en la losa superior                                                                                                                                                                      |
| 0.92–1.00 | Cierre / contacto         | se aleja y sube, atardecer (sol bajo a la derecha, luz naranja)        | obra terminada; engranaje MAVI vuelve al centro: "Facilitamos su avance"                                                                                                                                                                 |

**Presupuesto**: ≤ 40k triángulos (objetivo; límite 150k), 1 luz direccional con sombras solo en desktop (mapa 1024), luz hemisférica, niebla lineal. DPR `min(devicePixelRatio, 1.5)` (móvil 1.25). `frameloop` "always" mientras alguna ventana de la escena está en pantalla y la pestaña visible, "never" en otro caso (IntersectionObserver + `visibilitychange`).

**Carga**: se descarga con la primera señal de lectura (movimiento del ratón, rueda o scroll; no con toques ni teclas) o tras 6,5 s; three, R3F y la escena se evalúan en tareas separadas y la escena se monta por etapas compilando los shaders con `compileAsync`. El póster 2D está siempre debajo.

**Degradación**: se monta el 3D solo si `WebGL2` existe **y** no hay `prefers-reduced-motion` **y** `hardwareConcurrency ≥ 4` **y** `deviceMemory ≥ 4` (si está disponible) **y** no `saveData`. Si no: póster SVG por capas que cuenta las 8 fases según el scroll (`components/three/posterCapas.ts`) — mismo contenido HTML. El conmutador "Animaciones" del header desmonta el 3D y deja el póster (preferencia en `localStorage`, envuelta en try/catch).

## 4. Stack final y justificación de cada dependencia

Versiones **exactas** (sin `^`). Node 24 LTS (`.nvmrc`), pnpm vía corepack (`packageManager`).

| Dependencia                                                             | Versión                                                                                               | Por qué                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| next                                                                    | 15.5.27                                                                                               | Exigido (App Router). Última 15.x con parches de seguridad backport.                                                                                                                                                                                                            |
| react / react-dom                                                       | 19.3.0                                                                                                | Requerido por Next 15 y compatible con R3F 9 (peer `<19.4`).                                                                                                                                                                                                                    |
| three                                                                   | 0.186.1                                                                                               | Motor WebGL.                                                                                                                                                                                                                                                                    |
| @react-three/fiber                                                      | 9.8.1                                                                                                 | Render declarativo de three en React 19.                                                                                                                                                                                                                                        |
| @react-three/drei                                                       | 10.7.9                                                                                                | Ya no se importa en ningún archivo (el monitor de rendimiento es propio). Pendiente de quitar de `package.json` con `pnpm remove @react-three/drei`.                                                                                                                            |
| gsap                                                                    | 3.15.0                                                                                                | Solo la tipografía viva (`gsap.quickTo`), con carga diferida y únicamente en páginas que la usan. Sin ScrollTrigger ni SplitText: los revelados son CSS + IntersectionObserver y el 3D calcula su propio progreso. Se descarta framer-motion para no duplicar runtime (~35 kB). |
| @gsap/react                                                             | 2.1.2                                                                                                 | Ya no se importa (los contextos se limpian con `gsap.context().revert()`). Pendiente de quitar con `pnpm remove @gsap/react`.                                                                                                                                                   |
| lenis                                                                   | 1.3.26                                                                                                | Scroll suave opcional, **desactivable**, apagado con reduced-motion y en touch; carga diferida.                                                                                                                                                                                 |
| zod                                                                     | 4.6.6                                                                                                 | Esquema único compartido cliente/servidor (`zod/mini`).                                                                                                                                                                                                                         |
| react-hook-form + @hookform/resolvers                                   | 7.90.0 / 5.9.1                                                                                        | Formulario accesible sin re-render por tecla. Fuera del JS inicial: se descarga al acercarse a la sección (`FormularioCotizacionDiferido`).                                                                                                                                     |
| tailwindcss + @tailwindcss/postcss                                      | 4.3.3                                                                                                 | Exigido; tokens en `@theme`.                                                                                                                                                                                                                                                    |
| — email                                                                 | `fetch` nativo a la API REST de Resend                                                                | **Sin SDK**: una llamada HTTP no justifica una dependencia más.                                                                                                                                                                                                                 |
| — rate limit                                                            | `fetch` a la API REST de Upstash (ventana fija con `INCR`+`EXPIRE` en pipeline) + fallback en memoria | **Sin SDK**: misma razón; fallback documentado como por instancia.                                                                                                                                                                                                              |
| — Turnstile                                                             | script oficial de Cloudflare cargado con nonce solo si hay `NEXT_PUBLIC_TURNSTILE_SITE_KEY`           | Privacidad > reCAPTCHA.                                                                                                                                                                                                                                                         |
| Dev: typescript 5.9.3                                                   |                                                                                                       | TS 7 (nativo) aún no es soportado por Next 15.                                                                                                                                                                                                                                  |
| Dev: eslint 9.39.5 + eslint-config-next 15.5.27, prettier 3.9.10        |                                                                                                       | Calidad.                                                                                                                                                                                                                                                                        |
| Dev: vitest 5.0.4, @playwright/test 1.64.0, @axe-core/playwright 4.13.0 |                                                                                                       | Unit, E2E, a11y.                                                                                                                                                                                                                                                                |
| Dev: sharp 0.35.5, tsx 4.23.15                                          |                                                                                                       | Pipeline de imágenes reproducible.                                                                                                                                                                                                                                              |
| Dev: @next/bundle-analyzer 15.5.27                                      |                                                                                                       | Presupuestos de bundle.                                                                                                                                                                                                                                                         |
| Dev: secretlint 13.0.7 + preset, husky 9.1.7                            |                                                                                                       | Pre-commit de secretos.                                                                                                                                                                                                                                                         |
| Dev: @lhci/cli 0.15.1                                                   |                                                                                                       | Lighthouse CI con presupuestos.                                                                                                                                                                                                                                                 |

**Desviación propuesta (documentada)**: las fotos de bodega se sirven con `<picture>` (AVIF + WebP en 3 anchos generados por `scripts/process-images.ts`) en lugar de `next/image` con optimización en runtime. Motivo: funcionan igual en Vercel, Cloudflare Pages o Node sin optimizador, no consumen cuota de optimización, permiten LQIP inline y dimensiones fijas (CLS 0). Cada archivo lleva un hash de su contenido en el nombre, así que la caché `immutable` de `/img` nunca sirve una foto vieja. El optimizador de `next/image` está apagado (`images.unoptimized: true` en next.config.ts); si se adopta, reactivarlo con `qualities` y `localPatterns`.

## 5. Paleta y tipografías (detalle en `DISEÑO.md`)

- Grafito `#0B0B0C` · Amarillo máquina `#FCBF06` (muestreado del logo) · Hueso `#F4F1EA` · Concreto `#8A8A85` · Rojo puntal `#C8321E` (≤ 2 %).
- Display: **Archivo** variable (`wdth 62–125`, `wght 100–900`) — elegido sobre Big Shoulders porque la firma "tipografía viva" necesita un eje de **anchura**, que Big Shoulders no tiene (solo `wght`). Ver comparativa en `DISEÑO.md`.
- Texto: **Hanken Grotesk** variable. Datos: **Martian Mono** (`wdth`, `wght`, cifras tabulares). Estarcido: **Saira Stencil One** (solo los sellos, con `display: optional`).

## 6. Riesgos

| Riesgo                                           | Mitigación                                                                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| CSP con nonce fuerza render dinámico (TTFB)      | Páginas sin I/O; cache del CDN de assets; medir en Lighthouse.                                                                |
| Three.js pesa (~160 kB gz con R3F)               | Import dinámico tras `requestIdleCallback` y solo si pasa la detección; fuera del JS inicial.                                 |
| JS inicial al límite de 150 kB gz                | `pnpm presupuesto:js` en la CI (falla por encima de 150 kB); formulario, GSAP, Lenis y la transición de página van diferidos. |
| Fotos de WhatsApp de baja calidad (≤1280 px)     | No se agrandan más allá del original; tratamiento visual (overlay, grano, viñeta) para que se vean intencionales.             |
| Marca de otra empresa en fotos                   | Parches opacos/recortes en el pipeline + revisión visual registrada.                                                          |
| Sin fotos de maquinaria pesada ni transporte     | Ilustración 3D + iconos propios; nunca stock.                                                                                 |
| Falta dominio, proveedor de email, claves        | Variables de entorno + `TODO(owner)` en `PENDIENTES.md`; el formulario degrada a enlace de WhatsApp si el envío falla.        |
| Rate limit en memoria no es global en serverless | Usar Upstash en producción (documentado como requisito).                                                                      |
| Lighthouse ≥ 90 con 3D                           | 3D fuera del camino crítico; LCP = titular de texto.                                                                          |

## 7. Preguntas al dueño (no bloqueantes — se asumen valores y se registran en `PENDIENTES.md`)

1. ¿Dominio definitivo? (se asume `https://www.maviproyectos.com` como placeholder).
2. ¿Proveedor de correo? (se asume Resend; destino `maviproyectoseinversiones@gmail.com`).
3. ¿Existe el logo en vector? (se redibuja en SVG a partir del brochure).
4. ¿Horario de atención? (se publica como "a confirmar").
5. ¿Autorizan mostrar a los trabajadores que aparecen en las fotos de obra?
