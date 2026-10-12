# Seguridad — sitio MAVI

Contacto para reportar vulnerabilidades: ver [`/.well-known/security.txt`](public/.well-known/security.txt).

## 1. Superficie y amenazas consideradas

El sitio es de contenido; la **única entrada de datos** es el formulario de cotización (`POST /api/cotizacion`). No hay cuentas, sesiones, cookies propias, base de datos ni subida de archivos.

| Amenaza                                  | Vector                                     | Control                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XSS reflejado/almacenado                 | Datos del formulario en el correo; JSON-LD | Zod con listas cerradas y sin caracteres de control; HTML del correo 100 % escapado (`lib/escape.ts`); JSON-LD serializado escapando `<`, `>`, `&`; React escapa por defecto |
| XSS por inyección de scripts de terceros | Recursos externos                          | CSP estricta con **nonce por petición** + `'strict-dynamic'`; ningún script de CDN; fuentes self-hosted                                                                      |
| Inyección de cabeceras de correo         | `asunto`, `reply_to`                       | El asunto solo usa valores de listas cerradas; `reply_to` solo con correo validado sin CR/LF; `limpiarCabecera()`                                                            |
| CSRF                                     | POST desde otro sitio                      | Verificación estricta de `Origin`; solo `application/json` (fuerza preflight CORS, que no se responde); sin cookies                                                          |
| Spam / abuso                             | Bots                                       | Honeypot, tiempo mínimo de llenado (3 s), rate limit por IP (5/10 min y 20/día), Cloudflare Turnstile opcional                                                               |
| DoS de la función                        | Cuerpos grandes                            | Límite de 16 KB (cabecera y lectura real), timeouts de 2,5–8 s a servicios externos                                                                                          |
| Clickjacking                             | iframes                                    | `frame-ancestors 'none'` + `X-Frame-Options: DENY`                                                                                                                           |
| Fuga de información                      | Errores, logs                              | Respuestas genéricas con códigos; páginas 404/500 propias sin trazas; `poweredByHeader: false`; logs JSON sin datos personales; IP solo como hash con sal                    |
| Recolección de contactos                 | Scrapers                                   | Correos y `tel:` armados en el cliente y partidos en el HTML (disuasión básica; el teléfono sigue siendo público por diseño)                                                 |
| Secretos filtrados                       | Repositorio                                | `.env*` ignorados; solo `NEXT_PUBLIC_` para valores públicos; secretlint en pre-commit y en CI                                                                               |
| Dependencias vulnerables                 | Cadena de suministro                       | Versiones exactas, lockfile congelado en CI, `pnpm audit --prod` en CI, Dependabot semanal, _overrides_ para transitivas                                                     |
| Privacidad de terceros en fotos          | Imágenes                                   | Pipeline que **destruye** (no difumina) rótulos de otra empresa, placa de vehículo y folletos; EXIF eliminado                                                                |

## 2. Cabeceras HTTP

Definidas en `next.config.ts` (estáticas, todas las rutas) y `middleware.ts` (CSP por petición). Verificadas por la prueba E2E `cabeceras de seguridad`.

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic';
  style-src 'self' 'nonce-…'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob:;
  font-src 'self'; connect-src 'self'; frame-src 'none'; worker-src 'self' blob:;
  manifest-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self';
  form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(),
  bluetooth=(), hid=(), accelerometer=(), gyroscope=(), magnetometer=(), display-capture=(),
  browsing-topics=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
X-Permitted-Cross-Domain-Policies: none
```

**Excepciones mínimas documentadas**

1. `style-src-attr 'unsafe-inline'`: el HTML renderizado en servidor lleva atributos `style` (proporción de imágenes, variables CSS por elemento). Un atributo `style` no ejecuta código; los `<style>` y `<script>` siguen exigiendo nonce.
2. `worker-src blob:`: three.js puede crear workers desde blobs.
3. Con Turnstile configurado se añade `https://challenges.cloudflare.com` a `script-src` (como respaldo CSP2; con `strict-dynamic` lo carga nuestro código con nonce), `connect-src` y `frame-src`. El script de Turnstile no admite SRI (es dinámico); es el único recurso externo y solo existe si se configura.
4. En desarrollo (`pnpm dev`) se permiten `'unsafe-eval'` y estilos inline (requisito de React/Next en dev). **Nunca en producción.**
5. **Render dinámico**: un nonce por petición obliga a renderizar cada página en el servidor (no hay HTML pre-renderizado). Si en el futuro se prefiere estático, la alternativa es CSP por _hash_ con `experimental.sri`.

`upgrade-insecure-requests` se omite solo cuando el host es `localhost` (pruebas locales por HTTP).

## 3. Formulario de cotización

- **Validación**: `lib/validacion.ts` (Zod mini, el mismo esquema en cliente y servidor): longitudes máximas, nombre solo letras, teléfono colombiano (`3xx…` o `60x…`, con o sin +57), correo opcional, municipio y línea en listas cerradas, consentimiento obligatorio (Ley 1581 de 2012).
- **Orden de controles** (`lib/cotizacion.ts`): Origin → tipo y tamaño → rate limit → JSON + Zod → honeypot y tiempo → Turnstile → envío.
- A un bot detectado por honeypot/tiempo se le responde `200 ok` sin enviar nada (no recibe señales para adaptarse).
- **Rate limit** (`lib/limite.ts`): Upstash REST si está configurado; si no, memoria del proceso. ⚠️ En serverless la memoria es **por instancia**: configure Upstash en producción. Si Upstash falla, se degrada a memoria (nunca queda sin límite).
- `X-Forwarded-For`: en Vercel lo fija la plataforma. En un servidor propio, el proxy debe sobrescribirlo; si no, un atacante podría rotar IPs falsas.
- **Sin subida de archivos** en v1. Si se requiere: lista blanca MIME + verificación de _magic bytes_, ≤ 5 MB, almacenamiento fuera del webroot con nombres aleatorios y escaneo antivirus.

## 4. Datos personales

- Se recogen solo los datos del formulario; no se guardan en el servidor: viajan por correo al buzón de MAVI.
- Política en `/politica-de-privacidad` (`content/legal.ts`). **TODO(owner)**: NIT y revisión legal.
- Sin cookies de analítica ni publicidad. `localStorage` solo guarda la preferencia de animaciones.

## 5. Secretos y rotación de claves

| Clave                      | Dónde rotarla                                    | Pasos                                                                                                                           |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`           | resend.com → API Keys                            | Crear clave nueva con permiso _Sending access_ → actualizarla en Vercel (Production y Preview) → redeploy → revocar la anterior |
| `TURNSTILE_SECRET_KEY`     | Cloudflare → Turnstile → sitio → _Rotate secret_ | Actualizar en Vercel → redeploy (Cloudflare acepta ambas durante la transición)                                                 |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → base → _Reset token_                   | Actualizar en Vercel → redeploy                                                                                                 |
| `RATE_LIMIT_SALT`          | —                                                | Cambiarla reinicia los contadores (efecto inocuo)                                                                               |

Si una clave se filtra a git: revocarla **primero**, luego limpiar el historial (`git filter-repo`) y forzar el push.

## 6. Dependencias

- Producción: `pnpm audit --prod` → **0 vulnerabilidades** (con _override_ de `postcss` 8.5.29, transitiva de Next).
- Desarrollo: quedan avisos en herramientas que **no se publican** (`@lhci/cli` → `uuid`, `extract-zip`, `sprintf-js`; `eslint-config-next` → `braces`). Sin versión parcheada compatible a la fecha; Dependabot los propondrá cuando exista.

## 7. Fuera de alcance

- WAF/DDoS de red (lo cubre la plataforma: Vercel/Cloudflare).
- Seguridad del buzón de Gmail que recibe las cotizaciones (activar 2FA es responsabilidad del dueño).
- Monitoreo/alertas de errores (se puede añadir un servicio sin datos personales).

## 8. Auto-auditoría (2026-10-12)

| Control                                                            | Estado | Evidencia                                                            |
| ------------------------------------------------------------------ | ------ | -------------------------------------------------------------------- |
| CSP con nonce, sin `unsafe-inline`/`unsafe-eval` en scripts (prod) | ✅     | `tests/unit/seguridad.test.ts`, `tests/e2e/sitio.spec.ts`            |
| Nonce distinto por respuesta                                       | ✅     | E2E "cada respuesta usa un nonce distinto"                           |
| HSTS, nosniff, XFO, Referrer, Permissions, COOP, CORP              | ✅     | E2E "CSP con nonce y cabeceras estrictas"                            |
| `X-Powered-By` ausente                                             | ✅     | E2E                                                                  |
| Validación servidor aunque se salte el cliente                     | ✅     | E2E "el servidor valida…" + unitarias                                |
| Origin ajeno → 403                                                 | ✅     | E2E + unitarias                                                      |
| Correo escapado, asunto sin texto libre                            | ✅     | `tests/unit/cotizacion.test.ts`                                      |
| Rate limit 429 + `Retry-After`                                     | ✅     | unitarias                                                            |
| Errores genéricos sin trazas                                       | ✅     | unitarias + E2E 404                                                  |
| Secretos fuera del repo + secretlint                               | ✅     | `.gitignore`, `.husky/pre-commit`, CI                                |
| `pnpm audit --prod` limpio                                         | ✅     | CI                                                                   |
| securityheaders.com A/A+                                           | ⏳     | Requiere el dominio público desplegado (ver `docs/REPORTE-FINAL.md`) |
