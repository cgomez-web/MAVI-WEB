# Guía para el dueño: comprar el dominio, publicar el sitio y hacerle cambios

Escrita para alguien sin experiencia técnica. Tiempo total estimado: **una tarde** (más 1–24 h de espera mientras se propagan los DNS). Precios consultados en octubre de 2026: verifíquelos al pagar.

---

## Resumen en un minuto

1. **Cuentas** (todas con un correo de la empresa y verificación en dos pasos): GitHub, Vercel, Resend, Cloudflare y Upstash.
2. **Código a GitHub** en un repositorio privado (lo puedo hacer yo por usted).
3. **Publicar en Vercel** conectando ese repositorio. Cada cambio que se guarde en GitHub se publica solo en 1–2 minutos.
4. **Comprar el dominio .com** (dentro de Vercel es lo más sencillo) y conectarlo.
5. **Activar el correo de cotizaciones** (Resend) y el anti-spam (Turnstile + Upstash).
6. **Para cambiar textos**, edite los archivos de `content/` desde la web de GitHub. Para cambios más grandes, pídamelos (Claude Code) y yo los hago, los pruebo y los publico.

## Costos

| Concepto | Proveedor recomendado | Costo aproximado |
|---|---|---|
| Dominio `.com` | Vercel Domains o Cloudflare Registrar | US$10–20 por año |
| Hosting del sitio | **Vercel Pro** | **US$20 al mes** |
| Correo de cotizaciones | Resend | Gratis en el volumen de un sitio de cotizaciones |
| Anti-spam | Cloudflare Turnstile | Gratis |
| Límite de envíos | Upstash Redis | Gratis en este volumen |
| Código | GitHub (repositorio privado) | Gratis |

> **Importante:** el plan gratuito de Vercel (*Hobby*) es **solo para uso personal no comercial**, y un sitio que ofrece servicios de una empresa es uso comercial. Por eso se recomienda **Vercel Pro**.
>
> **Alternativa más económica (~US$5 al mes):** Cloudflare Workers (plan de pago) + dominio en Cloudflare a precio de costo. Exige adaptar el proyecto con el adaptador `@opennextjs/cloudflare` y volver a probarlo. Si prefiere esta opción, pídamela y la preparo.

---

## Paso 1 — Crear las cuentas

Use **un correo de la empresa que usted controle** (por ejemplo `maviproyectoseinversiones@gmail.com`), no el de un tercero. Active la **verificación en dos pasos** en cada cuenta y en ese Gmail: quien controla ese correo controla el sitio.

1. **GitHub** — <https://github.com/signup> (guarda el código).
2. **Vercel** — <https://vercel.com/signup> → "Continue with GitHub" (publica el sitio).
3. **Resend** — <https://resend.com/signup> (envía los correos del formulario).
4. **Cloudflare** — <https://dash.cloudflare.com/sign-up> (Turnstile; opcionalmente el dominio).
5. **Upstash** — <https://console.upstash.com> (límite de envíos del formulario).

## Paso 2 — Subir el código a GitHub (privado)

**Opción fácil (lo hago yo):** cree en GitHub un repositorio **vacío y privado** llamado `mavi-web` (botón **New**, sin README) y dígame. Le pediré que autorice este computador una sola vez con `gh auth login` (se abre el navegador para confirmar) y yo subo el código.

**Opción manual:** en una terminal, dentro de `E:\PAGINA WEB\mavi-web`:

```bash
git remote add origin https://github.com/SU-USUARIO/mavi-web.git
```

```bash
git push -u origin main
```

## Paso 3 — Publicar en Vercel

1. En Vercel: **Add New… → Project → Import** el repositorio `mavi-web`.
2. Vercel detecta Next.js. No cambie nada: el archivo `vercel.json` ya define pnpm y la región.
3. Antes de **Deploy**, abra **Environment Variables** y agregue, por ahora:
   - `NEXT_PUBLIC_SITE_URL` = `https://www.SU-DOMINIO.com` (puede corregirla después).
   - `RATE_LIMIT_SALT` = una frase larga cualquiera (no la comparta).
4. **Deploy**. En 2–3 minutos tendrá una dirección temporal `https://mavi-web-xxxx.vercel.app`: el sitio ya funciona ahí.
5. Pase la cuenta a **Pro** en Settings → Billing antes de anunciar el sitio (ver nota de costos).

## Paso 4 — Comprar y conectar el dominio .com

### 4.1 Elegir el nombre

Busque disponibilidad (en Vercel → **Domains → Buy**, o en <https://www.cloudflare.com/products/registrar/>). Ideas, en orden de preferencia: `maviproyectos.com` (coincide con el Instagram @maviproyectos), `maviproyectoseinversiones.com` y `mavi-proyectos.com`. Corto, sin tildes ni eñes, y fácil de dictar por teléfono.

### 4.2 Comprarlo

**Opción A (recomendada, la más simple) — dentro de Vercel:** Proyecto → **Settings → Domains → Buy a domain**. Al comprarlo ahí, Vercel configura los DNS y el certificado HTTPS automáticamente. Fin.

**Opción B — en Cloudflare Registrar** (a precio de costo, sin margen): compre el dominio en el panel de Cloudflare. Luego, en Vercel → Settings → **Domains → Add**, escriba el dominio y copie en Cloudflare → **DNS** los registros que Vercel le indique (normalmente un registro `A` para `su-dominio.com` y un `CNAME` para `www`). Use los valores **exactos** que muestre Vercel y déjelos en modo **"DNS only"** (nube gris).

En cualquier caso:
- Ponga el dominio **a nombre de la empresa o del dueño**, con el correo de la empresa.
- Active la **renovación automática** y la privacidad de datos (suele ser gratis).
- **No compre extras** como "SSL", "protección premium" o "constructor web": el HTTPS es gratis en Vercel.
- En Vercel deje `www.su-dominio.com` como principal y `su-dominio.com` redirigiendo a él (Vercel lo ofrece con un clic).

### 4.3 Ajustes después de tener el dominio

1. En Vercel → Environment Variables, ponga `NEXT_PUBLIC_SITE_URL=https://www.su-dominio.com` y haga **Redeploy**.
2. Pídame actualizar `public/.well-known/security.txt` con el dominio (o edítelo en GitHub).

## Paso 5 — Correo de cotizaciones (Resend)

1. En Resend → **Domains → Add Domain** → `su-dominio.com`. Resend le muestra 3 o 4 registros DNS (SPF/DKIM). Agréguelos donde esté el DNS (Vercel → Domains, o Cloudflare → DNS). La verificación tarda de minutos a pocas horas.
2. Resend → **API Keys → Create** con permiso **Sending access**. Cópiela (solo se muestra una vez).
3. En Vercel → Environment Variables:
   - `RESEND_API_KEY` = la clave.
   - `QUOTE_FROM_EMAIL` = `MAVI Web <cotizaciones@su-dominio.com>`.
   - `QUOTE_TO_EMAIL` = `maviproyectoseinversiones@gmail.com` (varios destinatarios separados por coma).
4. **Redeploy** y envíe una cotización de prueba desde `/contacto`.

## Paso 6 — Anti-spam

1. **Turnstile** (Cloudflare → Turnstile → Add site → dominio, modo *Managed*): copie la *Site Key* en `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y la *Secret Key* en `TURNSTILE_SECRET_KEY`.
2. **Upstash** → Create Database (Redis, región cercana a Washington/`us-east-1`) → pestaña **REST API**: copie `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
3. Agréguelas en Vercel y haga **Redeploy**.

## Paso 7 — Lista final de lanzamiento

- [ ] El sitio abre en `https://www.su-dominio.com` con candado.
- [ ] La cotización de prueba llegó al correo.
- [ ] <https://securityheaders.com> con su dominio: calificación A o A+.
- [ ] <https://pagespeed.web.dev> con su dominio, en móvil.
- [ ] **Google Search Console** (<https://search.google.com/search-console>): agregar el dominio y enviar `https://www.su-dominio.com/sitemap.xml`.
- [ ] **Perfil de Empresa de Google** (Google Maps): agregar el enlace al sitio.
- [ ] Bio de Instagram @maviproyectos con el enlace.
- [ ] Revisar los `TODO(owner)` de `docs/PENDIENTES.md` (horario, NIT, autorización de fotos).

---

## Cómo hacerle cambios al sitio

Todo el contenido está separado del diseño, en la carpeta **`content/`**. No hace falta tocar nada más para cambiar textos, teléfonos o servicios.

| Quiere cambiar… | Archivo |
|---|---|
| Teléfono, correos, dirección, Instagram, horario | `content/contacto.ts` |
| Servicios, equipos, rangos (HP, t, m³), textos de cada línea | `content/servicios.ts` |
| Textos del inicio (titular, secciones, cinta de equipos) | `content/home.ts` |
| Quiénes somos, misión, visión | `content/empresa.ts` |
| Pasos de "Cómo trabajamos" | `content/proceso.ts` |
| Preguntas frecuentes | `content/faq.ts` |
| Municipios del formulario | `content/formulario.ts` |
| Política de datos | `content/legal.ts` |
| Títulos y textos alternativos de las fotos, ocultar una foto | `content/galeria.ts` |

### Forma 1 — Desde el navegador, sin instalar nada (textos pequeños)

1. Entre a su repositorio en GitHub → carpeta `content` → abra el archivo (por ejemplo `contacto.ts`).
2. Clic en el **lápiz** (Edit this file).
3. Cambie **solo el texto entre comillas**. No borre comillas, comas ni llaves:
   `visible: "322 559 9325",` → `visible: "300 000 0000",`
4. Clic en **Commit changes…** y escriba qué cambió (por ejemplo "Actualiza teléfono").
5. En 1–2 minutos Vercel publica el cambio. Si el archivo quedó con un error, Vercel **no publica** y el sitio anterior sigue en línea: usted no rompe nada.

**Para revisar antes de publicar:** en el paso 4 elija **"Create a new branch"**. Vercel crea una dirección de vista previa privada; si le gusta, en GitHub haga **Merge** para publicar.

### Forma 2 — Pidiéndoselo a Claude (recomendada para todo lo demás)

Abra Claude Code en la carpeta `E:\PAGINA WEB\mavi-web` y escriba lo que quiere en lenguaje normal, por ejemplo:

- "Agrega el servicio de alquiler de torres de iluminación a Otros equipos."
- "Cambia el teléfono por 300 000 0000 en todo el sitio."
- "Agrega estas 5 fotos nuevas de la bodega a la galería."

Yo hago el cambio, corro las pruebas, reviso cómo se ve en celular y computador, y lo subo a GitHub; Vercel lo publica solo. Las **fotos nuevas** se hacen mejor así, porque hay que procesarlas (tamaños, formatos, borrar datos y rótulos ajenos).

### Forma 3 — En su computador (para quien sepa algo de programación)

```bash
corepack enable
```

```bash
pnpm install
```

```bash
pnpm dev
```

Abra <http://localhost:3000>, edite, y antes de subir ejecute `pnpm lint`, `pnpm typecheck` y `pnpm test`. Detalles en `README.md`.

### Si algo sale mal

En Vercel → **Deployments**, busque la versión anterior que funcionaba → menú **⋯** → **Promote to Production** (o *Instant Rollback*). En segundos vuelve a estar en línea, sin perder nada.

---

## Seguridad básica para el dueño

- Verificación en dos pasos en Gmail, GitHub, Vercel, Cloudflare y Resend.
- Nunca pegue claves (`RESEND_API_KEY`, etc.) en el código ni en chats: solo en Vercel → Environment Variables.
- Si cree que una clave se filtró: créela de nuevo en el servicio, reemplácela en Vercel, haga Redeploy y borre la anterior (ver `SECURITY.md` §5).
- Renovación automática del dominio activada; si el dominio vence, el sitio y el correo dejan de funcionar.
