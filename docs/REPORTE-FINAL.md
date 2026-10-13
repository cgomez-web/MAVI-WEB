# Reporte final — iteración 2 (2026-10-13)

Estado: **sitio completo y funcional** (HTML + 3D + formulario + seguridad + pruebas + documentación), con la **auditoría de 85 hallazgos aplicada** (ver §0). Lo que depende de cuentas o del dominio del dueño queda en `docs/PENDIENTES.md`.

## 0. Auditoría y correcciones (iteración 2)

Una auditoría en 8 dimensiones (accesibilidad, seguridad, rendimiento, errores de código, contenido, SEO, diseño responsive y cumplimiento del prompt), con un verificador escéptico por hallazgo, confirmó **85 hallazgos** (2 altos, 33 medios, 50 bajos) y descartó 4. Detalle en `auditoria/resultado-2026-10-12.json`.

| Estado                                                            | Hallazgos                                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Corregidos y verificados (revisor independiente por equipo + E2E) | 84                                                                     |
| Pendiente del dueño                                               | #74 — coordenadas exactas del negocio para el JSON-LD (no se inventan) |

Correcciones destacadas: el filtro anti-spam ya no descarta cotizaciones reales por diferencias de reloj; sin JavaScript el formulario nunca envía datos personales por la URL; formulario diferido (fuera del JS inicial); imagen para compartir corregida y propia de cada servicio; página `/servicios`; contraste del texto sobre la escena 3D; fases del 3D sincronizadas con su sección y narrativa también en el póster 2D; Lenis ya no secuestra la rueda; transición de página; precarga de fuentes (en Windows Next no la emitía); nombres de archivo de fotos con hash para la caché de 1 año; cifras que no venían del brochure retiradas.

Al integrar aparecieron y se corrigieron dos problemas más: los saltos a anclas (`#inventario`, `#proceso`) aterrizaban hasta 408 px fuera de lugar por el `content-visibility` de las secciones diferidas (`components/ui/AnclasPrecisas.tsx` maqueta antes del salto y reajusta si llegan fuentes tarde), y el nombre accesible de los filtros de la galería no contenía su texto visible (2.5.3).

## 1. Capturas

|                       | Escritorio (1440)                                                 | Móvil (375)                                                  |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Inicio                | `img/capturas/escritorio-inicio-1.jpg` … `-3.jpg`                 | `img/capturas/movil-inicio-1.jpg` … `-4.jpg`                 |
| Servicio (encofrados) | `img/capturas/escritorio-servicios-encofrados-y-formaleteria.jpg` | `img/capturas/movil-servicios-encofrados-y-formaleteria.jpg` |
| Contacto              | `img/capturas/escritorio-contacto.jpg`                            | `img/capturas/movil-contacto.jpg`                            |

Escena 3D, 8 fases del storyboard: `img/escena-3d-fases.jpg`. Comparativa tipográfica: `img/comparativa-display.png`. Verificación de fotos procesadas (sin rótulos ajenos): `img/verificacion-galeria.jpg`.

> Las capturas de página completa se toman con movimiento reducido (estado final de las animaciones) y, por eso, con el póster 2D en lugar del 3D.

## 2. Lighthouse móvil (Moto G Power emulado, 4G lento, CPU ×4)

Medido en local contra `next start` (servidor y Lighthouse en la misma máquina). Detalle en `metricas/lighthouse-movil.json`.

| Página                 | Rendimiento | Accesibilidad | Buenas prácticas | SEO     | LCP     | CLS | TBT    |
| ---------------------- | ----------- | ------------- | ---------------- | ------- | ------- | --- | ------ |
| `/`                    | **93**      | **100**       | **100**          | **100** | 3,0 s\* | 0   | 134 ms |
| `/servicios/andamiaje` | **93**      | **100**       | **100**          | **100** | 3,2 s\* | 0   | 45 ms  |
| `/contacto`            | **94**      | **100**       | **100**          | **100** | 3,0 s\* | 0   | 65 ms  |
| `/servicios`           | **94**      | **100**       | **100**          | **100** | 3,0 s\* | 0   | 53 ms  |
| `/nosotros`            | **94**      | **100**       | **100**          | **100** | 3,0 s\* | 0   | 76 ms  |

\* LCP **simulado** por Lighthouse (modelo Lantern: suma la descarga de todo el JS pedido antes del LCP). Medido de verdad en Chromium con CPU ×4 y red de 1,6 Mbps / 150 ms: **LCP = FCP = 1,25 s** en el inicio, sobre el mismo nodo (el párrafo del hero) y sin repintados. Incluye un TTFB local de ~450 ms (render dinámico por la CSP con nonce); en Vercel/CDN se espera menor. Se volverá a medir con PageSpeed Insights sobre el dominio público.

### Qué se corrigió para llegar ahí

| Problema medido                           | Causa                                                                                                                                                               | Solución                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| TBT 6,1 s, rendimiento 51                 | La escena 3D se inicializaba dentro de la ventana de medición                                                                                                       | Carga del 3D en la **primera interacción** o tras 6,5 s ocioso (TBT → 190 ms)                          |
| CLS 0,19                                  | (a) "FACILITAMOS" a ancho 112 % desbordaba 412 px y ensanchaba la página al cargar la fuente; (b) el titular del hero cambiaba de número de renglones con la fuente | (a) ancho 88 % en móvil; (b) cortes de línea fijos (4 renglones en móvil, 2 en escritorio) → **CLS 0** |
| SEO 92 (sin meta description en `<head>`) | _Streaming metadata_ de Next 15.5                                                                                                                                   | `htmlLimitedBots: /.*/` → SEO 100                                                                      |
| HTML 57 kB gz                             | Props de la galería con datos innecesarios y LQIP repetidos                                                                                                         | Props mínimas, sin LQIP en miniaturas duotono, LQIP 16 px → 44 kB gz                                   |
| Cabecera ilegible en páginas claras (axe) | Cabecera transparente sobre fondo hueso                                                                                                                             | Transparente solo sobre el hero del inicio                                                             |
| JS inicial 163 kB                         | Zod clásico + datos de contenido en el bundle cliente                                                                                                               | `zod/mini` + separar datos de servidor → **140 kB**                                                    |

## 3. Presupuestos

| Presupuesto            | Objetivo                           | Medido                                                                                                 |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| JS inicial (sin Three) | < 150 kB gz                        | **138 kB** (`/`), 124–125 kB (servicios, contacto, nosotros) — `pnpm presupuesto:js`, también en la CI |
| CSS                    | —                                  | 11 kB gz (1 archivo)                                                                                   |
| HTML inicio            | —                                  | 44 kB gz                                                                                               |
| Activos 3D             | ≤ 1,5 MB                           | **0 kB** de modelos/texturas (todo procedural); JS 3D diferido ≈ 250 kB gz                             |
| Triángulos en escena   | ≤ 150 k                            | **14 264** (fase final) · 123 llamadas de dibujo · 3 texturas (sombras)                                |
| Fuentes                | —                                  | 170 kB woff2 en total (2 precargadas: Archivo 83 kB + Hanken 32 kB)                                    |
| Fotos                  | AVIF/WebP, varios anchos, sin EXIF | 22 fotos × 2–3 anchos × 2 formatos                                                                     |

60 fps en portátil medio / ≥ 30 fps en Android medio: **pendiente de medir en dispositivo real** (las pruebas automáticas corren con WebGL por software). Hay calidad adaptativa (`PerformanceMonitor`: primero sin sombras y DPR 1; si sigue lento, vuelve al póster 2D). Para medir: abrir `/?escena=3d`, DevTools → Rendering → _Frame Rendering Stats_, y `window.__maviInfo()` para el presupuesto.

## 4. Pruebas

| Suite                                                                                                                                                                                                      | Resultado                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ESLint (0 advertencias)                                                                                                                                                                                    | ✅                                                                              |
| TypeScript estricto (`noUncheckedIndexedAccess`)                                                                                                                                                           | ✅                                                                              |
| Vitest — 85 unitarias (esquema, CSP, escape, endpoint con correo simulado, rate limit, contenido, metadatos)                                                                                               | ✅ 85/85                                                                        |
| Playwright — 164 casos E2E en escritorio + móvil (humo, navegación, anclas, formulario diferido, sin WebGL, movimiento, cabeceras, axe WCAG 2.2 AA, desbordes 320–1440 px, galería, OG, barra de WhatsApp) | ✅ 142 en verde · 22 omitidos por ser exclusivos de un dispositivo              |
| Presupuesto de JS inicial (`pnpm presupuesto:js`)                                                                                                                                                          | ✅ 6 rutas bajo 150 kB                                                          |
| `pnpm build`                                                                                                                                                                                               | ✅                                                                              |
| `pnpm audit --prod`                                                                                                                                                                                        | ✅ 0 vulnerabilidades                                                           |
| CI de GitHub Actions                                                                                                                                                                                       | ⏳ configurada (`.github/workflows/ci.yml`); se ejecuta al subir el repositorio |

## 5. Checklist de seguridad (resumen; detalle en `SECURITY.md`)

- [x] CSP estricta con nonce por petición + `strict-dynamic`, sin `unsafe-inline`/`unsafe-eval` en scripts
- [x] HSTS (2 años, preload), nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy restrictiva, COOP, CORP
- [x] `poweredByHeader: false`, 404/500 propios sin trazas, `robots.txt`, `security.txt`
- [x] Zod en cliente y servidor, listas cerradas, longitudes máximas, sin caracteres de control
- [x] Rate limit (Upstash o memoria) + honeypot + tiempo mínimo + Turnstile opcional
- [x] Correo escapado; asunto sin texto libre; sin inyección de cabeceras
- [x] CSRF: verificación de `Origin` + solo JSON
- [x] Consentimiento Ley 1581 obligatorio + política de datos
- [x] Sin subida de archivos en v1
- [x] Secretos fuera del repo, `.env.example`, secretlint (pre-commit + CI)
- [x] Dependencias exactas, lockfile, Dependabot, audit en CI
- [x] Enlaces externos con `rel="noopener noreferrer"`
- [x] Correos/teléfono armados en cliente (anti-scraping básico)
- [ ] securityheaders.com A/A+ — requiere dominio público desplegado
- [ ] Envío real de correo — requiere `RESEND_API_KEY` y dominio verificado (probado con proveedor simulado)

## 6. Definición de "hecho"

| Criterio                                                   | Estado                                                                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm build` sin warnings relevantes                       | ✅                                                                                                                                                                     |
| CI verde                                                   | ⏳ al subir a GitHub                                                                                                                                                   |
| Lighthouse móvil ≥ 90/90/90/90                             | ✅ (local) — confirmar en dominio                                                                                                                                      |
| securityheaders A/A+                                       | ⏳ dominio                                                                                                                                                             |
| Escena 3D en presupuesto + sitio 100 % funcional sin WebGL | ✅ (E2E con WebGL desactivado)                                                                                                                                         |
| Formulario envía correo real y rechaza spam básico         | ✅ rechazo de spam probado · ⏳ correo real con claves del dueño                                                                                                       |
| Contenido del brochure completo y sin erratas              | ✅ (prueba automática de erratas y datos prohibidos) · las líneas 03, 04 y 05 muestran un dato textual del brochure en lugar de una cifra, porque el brochure no la da |
| Documentos de entrega                                      | ✅ README, SECURITY, ASSETS-LICENSES, PLAN, DISEÑO, MOTION, INVENTARIO, PENDIENTES, este reporte                                                                       |

## 7. Próximas iteraciones (técnicas)

- Reducir llamadas de dibujo de la escena 3D fusionando geometrías estáticas y sustituir `PerformanceMonitor` de drei por un monitor propio (−50 kB del chunk 3D).
- Medir fps en dispositivos reales y ajustar umbrales de calidad.
- Revisar con el dueño los `TODO(owner)` y publicar.
