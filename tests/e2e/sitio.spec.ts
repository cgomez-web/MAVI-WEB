import { expect, test, type Page } from "@playwright/test";

/**
 * IP propia por petición: el límite de 5 cada 10 min por IP (lib/limite.ts) no se agota entre los
 * dos proyectos (escritorio y móvil) ni entre ejecuciones locales seguidas (`next start` conserva el
 * X-Forwarded-For que manda el cliente).
 */
const ipDePrueba = () =>
  `10.${Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 250)).join(".")}`;

const solicitudValida = {
  nombre: "Laura Gómez",
  telefono: "3225599325",
  ciudad: "Envigado",
  servicio: "Andamiaje",
  mensaje: "Cuarenta cuerpos de andamio para fachada de cuatro pisos.",
  consentimiento: true,
};

/**
 * El formulario real se descarga aparte (FormularioCotizacionDiferido, #51). Mientras llega hay un
 * esqueleto inerte con las mismas etiquetas que no es un <form>: este selector solo resuelve con el
 * formulario real, y el botón nace deshabilitado hasta que React lo controla.
 */
async function formularioListo(page: Page) {
  await page.locator("#cotizacion form").waitFor({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Enviar solicitud" })).toBeEnabled();
}

/** React ya controla la página: Movimiento marca html[data-js=on] al hidratar (antes, un clic se pierde). */
async function hidratada(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-js", "on");
}

const meta = (page: Page, selector: string) =>
  page.locator(selector).first().getAttribute("content");

test.describe("humo", () => {
  test("el home carga con su titular, sin errores de consola y sin scroll horizontal", async ({
    page,
  }) => {
    const errores: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errores.push(m.text());
    });
    page.on("pageerror", (e) => errores.push(e.message));
    const respuesta = await page.goto("/");
    expect(respuesta?.status()).toBe(200);
    // Título corto con la palabra clave y "Envigado" al principio (#68).
    await expect(page).toHaveTitle(/Envigado \| MAVI$/);
    // El H1 lleva el antetítulo con las palabras clave del negocio (#67) y el titular de marca.
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("Alquiler de maquinaria y equipos para construcción");
    await expect(h1).toContainText("Su obra avanza.");
    await expect(page.locator("html")).toHaveAttribute("lang", "es-CO");
    // Se compara con el ancho del dispositivo: en móvil, si algo desborda, innerWidth también crece.
    await page.waitForLoadState("networkidle");
    const ancho = page.viewportSize()!.width;
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scroll).toBeLessThanOrEqual(ancho);
    expect(errores, errores.join("\n")).toEqual([]);
  });

  test("datos de contacto reales visibles y con nombre accesible legible", async ({ page }) => {
    await page.goto("/contacto");
    await expect(page.getByText("322 559 9325").first()).toBeVisible();
    await expect(page.getByText("Cr 25 # 41B Sur 37").first()).toBeVisible();
    const correo = page.locator('a[href^="mailto:maviproyectoseinversiones"]').first();
    await expect(correo).toBeAttached();
    // Sin palabras pegadas ni espacios de más (#37): el href se arma en el cliente.
    await expect(
      page.getByRole("link", { name: "322 559 9325", exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "maviproyectoseinversiones@gmail.com", exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Cr 25 # 41B Sur 37, Envigado, Antioquia en Google Maps (se abre en una pestaña nueva)",
      }),
    ).toHaveCount(2); // tarjeta de Cotización y pie
  });

  test("el pie agrupa los dos correos bajo un solo rótulo", async ({ page }) => {
    await page.goto("/");
    await hidratada(page);
    const pie = page.locator("footer");
    await expect(pie.locator("dt").filter({ hasText: /correo/i })).toHaveCount(1);
    await expect(pie.locator('a[href^="mailto:"]')).toHaveCount(2);
  });
});

test.describe("navegación", () => {
  test("del índice de servicios a una página de línea", async ({ page, isMobile }) => {
    await page.goto("/");
    if (!isMobile) {
      await page
        .getByRole("navigation", { name: "Principal" })
        .getByRole("link", { name: "Equipos" })
        .click();
      await expect(page).toHaveURL(/#servicios$/);
    }
    await page.goto("/servicios/andamiaje");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Alquiler de andamios certificados",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/servicios\/andamiaje$/,
    );
  });

  test("/servicios existe y la miga 'Servicios' lleva a él (#72)", async ({ page }) => {
    const r = await page.goto("/servicios");
    expect(r?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Alquiler de equipos para construcción",
    );
    await expect(page.locator('main h2[id^="indice-"] a[href^="/servicios/"]')).toHaveCount(6);
    await page.goto("/servicios/andamiaje");
    await expect(
      page
        .getByRole("navigation", { name: "Migas de pan" })
        .getByRole("link", { name: "Servicios" }),
    ).toHaveAttribute("href", "/servicios");
  });

  test("menú móvil accesible", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await page.goto("/");
    await hidratada(page);
    const boton = page.getByRole("button", { name: "Abrir menú" });
    await boton.click();
    await expect(page.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
  });

  test("con el menú móvil abierto el fondo queda inerte (#38)", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await page.goto("/");
    const inertes = () =>
      page.evaluate(() => ({
        contenido: document.getElementById("contenido")!.inert,
        pie: document.querySelector<HTMLElement>("body > footer")!.inert,
        whatsapp: document.querySelector<HTMLElement>(".cta-whatsapp")!.inert,
        cabecera: document.querySelector<HTMLElement>("header")!.inert,
      }));
    await hidratada(page);
    await page.getByRole("button", { name: "Abrir menú" }).click();
    expect(await inertes()).toEqual({
      contenido: true,
      pie: true,
      whatsapp: true,
      cabecera: false,
    });
    await page.keyboard.press("Escape");
    expect(await inertes()).toEqual({
      contenido: false,
      pie: false,
      whatsapp: false,
      cabecera: false,
    });
  });

  test("si la tableta gira a horizontal con el menú abierto, el menú se cierra (#54)", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "cambia el viewport: se prueba una vez");
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/");
    await hidratada(page);
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.setViewportSize({ width: 1180, height: 820 });
    await expect(page.locator("header button[aria-expanded]")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("404 propio sin trazas, con título propio y sin canonical (#41, #70)", async ({ page }) => {
    const r = await page.goto("/esta-ruta-no-existe");
    expect(r?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("no está en la obra");
    await expect(page.locator("body")).not.toContainText(/at .*\.js:\d+/);
    await expect(page).toHaveTitle("Página no encontrada | MAVI");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test("una ficha de servicio inexistente sirve la 404 completa desde el servidor (#71)", async ({
    request,
  }) => {
    const r = await request.get("/servicios/no-existe");
    expect(r.status()).toBe(404);
    const html = await r.text();
    expect(html).toContain('<html lang="es-CO"');
    expect(html).toMatch(/<h1[^>]*>[^<]*no está en la obra/);
    expect(html).not.toContain('id="__next_error__"');
    // Un %XX mal formado no tumba el middleware.
    expect((await request.get("/servicios/%E0%A4%A")).status()).toBeLessThan(500);
  });

  test("sitemap, robots y security.txt", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("/servicios</loc>");
    expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
    expect(await (await request.get("/.well-known/security.txt")).text()).toContain("Contact:");
  });
});

test.describe("metadatos para buscadores y redes", () => {
  test("las fichas de servicio tienen imagen OG propia y título de Twitter propio (#15, #21, #34)", async ({
    page,
    request,
  }) => {
    await page.goto("/servicios/andamiaje");
    const imagen = await meta(page, 'meta[property="og:image"]');
    expect(imagen).toMatch(/\/servicios\/andamiaje\/opengraph-image/);
    expect(await meta(page, 'meta[property="og:site_name"]')).toBe("MAVI Proyectos e Inversiones");
    expect(await meta(page, 'meta[property="og:locale"]')).toBe("es_CO");
    const ogTitulo = await meta(page, 'meta[property="og:title"]');
    expect(await meta(page, 'meta[name="twitter:title"]')).toBe(ogTitulo);
    expect(await meta(page, 'meta[name="twitter:image"]')).toBeTruthy();
    const url = new URL(imagen!);
    const r = await request.get(url.pathname + url.search);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
  });

  for (const ruta of ["/contacto", "/nosotros", "/politica-de-privacidad", "/servicios"]) {
    test(`${ruta} tiene og:title, og:url e imagen OG propios (#66)`, async ({ page, request }) => {
      await page.goto("/");
      const tituloInicio = await meta(page, 'meta[property="og:title"]');
      await page.goto(ruta);
      const titulo = await meta(page, 'meta[property="og:title"]');
      expect(titulo).toBeTruthy();
      expect(titulo).not.toBe(tituloInicio);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(await meta(page, 'meta[property="og:url"]')).toBe(canonical);
      const imagen = await meta(page, 'meta[property="og:image"]');
      // Con versión: WhatsApp y Facebook guardan la tarjeta por URL.
      expect(imagen).toContain("/opengraph-image?v=");
      const url = new URL(imagen!);
      const r = await request.get(url.pathname + url.search);
      expect(r.status()).toBe(200);
      expect(r.headers()["content-type"]).toContain("image/png");
    });
  }

  test("la política de datos está completa y sin textos provisionales (#18)", async ({ page }) => {
    await page.goto("/politica-de-privacidad");
    const main = page.locator("main");
    await expect(main).not.toContainText("TODO");
    await expect(main).toContainText("Vigente desde");
    await expect(
      page.getByRole("heading", { name: /Procedimiento para ejercer sus derechos/ }),
    ).toBeVisible();
    await expect(main).toContainText("dos (2) meses desde ese requerimiento");
    // Sin las variables de Plausible no hay analítica que declarar.
    if (!process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || !process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN)
      await expect(main).not.toContainText("herramienta de estadísticas");
  });

  test("la ficha de maquinaria no promete condiciones que el brochure no dice", async ({
    page,
  }) => {
    await page.goto("/servicios/maquinaria-pesada");
    await expect(
      page.locator("summary", { hasText: "¿Ofrecen soporte técnico con la maquinaria?" }),
    ).toHaveCount(1);
    await expect(page.locator("main")).not.toContainText("incluye soporte");
  });
});

test.describe("formulario de cotización", () => {
  test("rechaza entradas inválidas con mensajes accesibles", async ({ page }) => {
    await page.goto("/contacto");
    await formularioListo(page);
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    const resumen = page.getByText(/Revise \d+ campos antes de enviar/);
    await expect(resumen).toBeVisible();
    await expect(page.getByLabel("Nombre completo")).toHaveAttribute("aria-invalid", "true");
    await page.getByLabel("Celular / WhatsApp").fill("123");
    await page.getByLabel("Celular / WhatsApp").blur();
    await expect(page.locator('[id$="-telefono-error"]')).toContainText(
      "celular colombiano de 10 dígitos",
    );
  });

  test("el resumen de errores solo aparece al enviar y recibe el foco (#36)", async ({ page }) => {
    await page.goto("/contacto");
    await formularioListo(page);
    // Antes de tocar nada, ningún control se anuncia como no válido.
    for (const control of await page
      .locator("#cotizacion form select, #cotizacion form input[type=checkbox]")
      .all())
      await expect(control).toHaveAttribute("aria-invalid", "false");
    // Recorrer los campos con el tabulador no muestra el resumen.
    await page.getByLabel("Nombre completo").focus();
    for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
    await expect(page.getByText(/Revise \d+ campos? antes de enviar/)).toHaveCount(0);
    // Al enviar (un solo clic, aunque el último campo tuviera el foco) el foco va al resumen.
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    await expect(
      page.getByRole("group", { name: /Revise \d+ campos antes de enviar/ }),
    ).toBeFocused();
  });

  test("acepta una solicitud válida (respuesta del servidor simulada)", async ({ page }) => {
    let cuerpo: Record<string, unknown> = {};
    await page.route("**/api/cotizacion", async (ruta) => {
      cuerpo = ruta.request().postDataJSON() as Record<string, unknown>;
      await ruta.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, codigo: "ok" }),
      });
    });
    await page.goto("/contacto");
    await formularioListo(page);
    await page.getByLabel("Nombre completo").fill("Laura Gómez");
    await page.getByLabel("Celular / WhatsApp").fill("322 559 9325");
    await page.getByLabel("Municipio de la obra").selectOption("Envigado");
    await page.getByLabel("Línea de servicio").selectOption("Andamiaje");
    await page
      .getByLabel(/Qué necesita/)
      .fill("Cuarenta cuerpos de andamio para fachada de cuatro pisos.");
    await page.getByLabel(/Autorizo a MAVI/).check();
    await page.waitForTimeout(3100); // tiempo mínimo humano de llenado
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    await expect(page.getByText("Recibimos su solicitud")).toBeVisible();
    expect(cuerpo.telefono).toBe("3225599325");
    expect(cuerpo.consentimiento).toBe(true);
    // El tiempo de llenado lo mide el navegador (#13): ya no viaja la hora de inicio.
    expect(typeof cuerpo.transcurridoMs).toBe("number");
    expect(cuerpo.iniciado).toBeUndefined();
  });

  test("el servidor valida aunque se salte el cliente", async ({ request, baseURL }) => {
    const r = await request.post("/api/cotizacion", {
      headers: {
        origin: baseURL!,
        "content-type": "application/json",
        "x-forwarded-for": ipDePrueba(),
      },
      data: {
        nombre: "x",
        telefono: "1",
        ciudad: "Narnia",
        servicio: "Otra",
        mensaje: "",
        consentimiento: false,
        transcurridoMs: 0,
      },
    });
    // Zod devuelve los errores por campo antes de revisar el tiempo de llenado.
    expect(r.status()).toBe(400);
    const cuerpo = (await r.json()) as { codigo: string };
    expect(cuerpo.codigo).toBe("validacion");
  });

  test("rechaza peticiones de otro origen", async ({ request }) => {
    const r = await request.post("/api/cotizacion", {
      headers: { origin: "https://atacante.example", "content-type": "application/json" },
      data: {},
    });
    expect(r.status()).toBe(403);
  });

  test("honeypot lleno: responde ok sin enviar nada (#46)", async ({ request, baseURL }) => {
    const r = await request.post("/api/cotizacion", {
      headers: {
        origin: baseURL!,
        "content-type": "application/json",
        "x-forwarded-for": ipDePrueba(),
      },
      data: { ...solicitudValida, sitioWeb: "https://spam.example", transcurridoMs: 5000 },
    });
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true, codigo: "ok" });
  });

  test("envío en 300 ms: 400 'verificacion', sin fingir éxito (#7, #13)", async ({
    request,
    baseURL,
  }) => {
    const r = await request.post("/api/cotizacion", {
      headers: {
        origin: baseURL!,
        "content-type": "application/json",
        "x-forwarded-for": ipDePrueba(),
      },
      data: { ...solicitudValida, transcurridoMs: 300 },
    });
    expect(r.status()).toBe(400);
    expect(((await r.json()) as { codigo: string }).codigo).toBe("verificacion");
  });

  test("sin JavaScript no hay formulario que filtre datos a la URL (#8, #52)", async ({
    browser,
    baseURL,
  }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false });
    const pagina = await contexto.newPage();
    await pagina.goto(`${baseURL}/contacto`);
    await expect(pagina.locator("#cotizacion form")).toHaveCount(0);
    await expect(pagina.locator("#cotizacion [name]")).toHaveCount(0);
    // El aviso de <noscript> ofrece WhatsApp.
    await expect(pagina.locator('#cotizacion noscript a[href^="https://wa.me/"]')).toBeVisible();
    await contexto.close();
  });

  test("el formulario se descarga solo al acercarse a la sección (#51)", async ({ page }) => {
    await page.goto("/nosotros");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#cotizacion form")).toHaveCount(0);
    // El esqueleto está fuera del árbol de accesibilidad: no hay botón que pulsar todavía.
    await expect(page.getByRole("button", { name: "Enviar solicitud" })).toHaveCount(0);
    await page.locator("#cotizacion").scrollIntoViewIfNeeded();
    await formularioListo(page);
  });

  test("si el formulario tarda en llegar, lo avisa sin mover la página", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "una vez basta");
    await page.goto("/?escena=2d");
    await page.waitForLoadState("networkidle");
    // A partir de aquí, todo trozo de JS nuevo (el del formulario) llega con 3 s de retraso.
    await page.route("**/_next/static/chunks/**", async (ruta) => {
      await new Promise((r) => setTimeout(r, 3000));
      await ruta.continue();
    });
    await page.locator("#cotizacion").scrollIntoViewIfNeeded();
    const aviso = page.locator("#cotizacion p.mono-etiqueta", {
      hasText: "Cargando el formulario…",
    });
    await expect(aviso).toBeVisible({ timeout: 2000 });
    const opacidad = await page
      .locator("#cotizacion [inert] input")
      .first()
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacidad)).toBeCloseTo(0.5, 1);
    // Desplazamientos de diseño desde ahora hasta que llega el formulario real.
    await page.evaluate(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) w.__cls += (e as unknown as { value: number }).value;
      }).observe({ type: "layout-shift" });
    });
    await page.locator("#cotizacion form").waitFor({ timeout: 15_000 });
    await expect(aviso).toHaveCount(0);
    await page.waitForTimeout(300);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.01);
  });
});

test.describe("cabeceras de seguridad", () => {
  test("CSP con nonce y cabeceras estrictas", async ({ request }) => {
    const r = await request.get("/");
    const h = r.headers();
    expect(h["content-security-policy"]).toMatch(
      /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/,
    );
    expect(h["content-security-policy"]).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(h["strict-transport-security"]).toContain("max-age=63072000");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toContain("camera=()");
    expect(h["cross-origin-opener-policy"]).toBe("same-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("cada respuesta usa un nonce distinto", async ({ request }) => {
    const a = (await request.get("/")).headers()["content-security-policy"];
    const b = (await request.get("/")).headers()["content-security-policy"];
    expect(a).not.toBe(b);
  });

  test("los 404 llevan CSP y el optimizador de imágenes está apagado (#43, #47)", async ({
    request,
  }) => {
    const falsa = await request.get("/iconos-falsos");
    expect(falsa.status()).toBe(404);
    expect(falsa.headers()["content-security-policy"]).toBeTruthy();
    const api = await request.get("/api/no-existe");
    expect(api.status()).toBe(404);
    expect(api.headers()["content-security-policy"]).toBeTruthy();
    const optimizador = await request.get(
      "/_next/image?url=%2Fimg%2Fbodega%2Fplumas-de-cargue-01-800.avif&w=640&q=75",
    );
    expect(optimizador.status()).toBe(404);
    expect((await request.get("/icon.svg")).status()).toBe(200);
    expect((await request.get("/opengraph-image")).status()).toBe(200);
  });

  test("la API JSON no lleva CSP pero sí nosniff (#44)", async ({ request }) => {
    // Origen ajeno: 403 antes del rate limit, así que no gasta cupo.
    const r = await request.post("/api/cotizacion", {
      headers: { origin: "https://atacante.example", "content-type": "application/json" },
      data: {},
    });
    expect(r.status()).toBe(403);
    const h = r.headers();
    expect(h["content-security-policy"]).toBeUndefined();
    expect(h["x-content-type-options"]).toBe("nosniff");
  });

  test("las fotos llevan un hash en el nombre y caché inmutable (#12)", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const urls = await page.evaluate(() => {
      const todas = new Set<string>();
      for (const el of document.querySelectorAll<HTMLImageElement | HTMLSourceElement>(
        "img[src*='/img/bodega/'], source[srcset*='/img/bodega/'], img[srcset*='/img/bodega/']",
      )) {
        const lista = [el.getAttribute("src") ?? "", el.getAttribute("srcset") ?? ""].join(",");
        for (const parte of lista.split(",")) {
          const url = parte.trim().split(/\s+/)[0];
          if (url && url.includes("/img/bodega/")) todas.add(url);
        }
      }
      return [...todas];
    });
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url, url).toMatch(/-\d+\.[0-9a-f]{8}\.(avif|webp)$/);
    for (const url of urls.slice(0, 3)) {
      const r = await request.get(url);
      expect(r.status(), url).toBe(200);
      expect(r.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
    }
  });
});

test.describe("acceso fijo a WhatsApp", () => {
  test("en móvil es una barra inferior que no tapa el texto de la galería", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "solo móvil");
    await page.goto("/");
    const barra = page.locator(".cta-whatsapp");
    const caja = (await barra.boundingBox())!;
    const ancho = page.viewportSize()!.width;
    expect(Math.round(caja.width)).toBe(ancho);
    // El texto de ayuda llevado al borde inferior visible queda por encima de la barra.
    const ayuda = page.getByText(/Arrastre o use las flechas/);
    await ayuda.evaluate((el) => el.scrollIntoView({ block: "end" }));
    // Lejos del hero la barra está a la vista (en el hero se retira, #26).
    await expect(barra).toHaveAttribute("data-oculto", "false");
    const a = (await ayuda.boundingBox())!;
    const b = (await barra.boundingBox())!;
    expect(a.y + a.height).toBeLessThanOrEqual(b.y + 1);
  });

  test("en móvil no tapa los botones del hero (#26)", async ({ browser, baseURL, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    for (const [width, height] of [
      [375, 667],
      [390, 844],
      [412, 915],
    ] as const) {
      const contexto = await browser.newContext({
        viewport: { width, height },
        isMobile: true,
        hasTouch: true,
      });
      const pagina = await contexto.newPage();
      await pagina.goto(`${baseURL}/`);
      const barra = pagina.locator(".cta-whatsapp");
      await expect(barra).toHaveAttribute("data-oculto", "true");
      const ver = (await pagina.getByRole("link", { name: "Ver equipos" }).boundingBox())!;
      const encima = await pagina.evaluate(
        ([x, y]) => document.elementFromPoint(x!, y!)?.closest("a")?.textContent ?? "",
        [ver.x + ver.width / 2, ver.y + ver.height - 4],
      );
      expect(encima, `${width}×${height}`).toContain("Ver equipos");
      await pagina.evaluate(() => {
        const hero = document.querySelector("[data-cta-hero]")!.getBoundingClientRect();
        window.scrollTo(0, scrollY + hero.bottom + 200);
      });
      await expect(barra).toHaveAttribute("data-oculto", "false");
      await contexto.close();
    }
  });

  test("en móvil se oculta mientras se escribe en el formulario", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await page.goto("/contacto");
    // Con el esqueleto (inerte y deshabilitado) el foco no tendría efecto.
    await formularioListo(page);
    await page.getByLabel("Nombre completo").focus();
    await expect(page.locator(".cta-whatsapp")).toHaveAttribute("data-oculto", "true");
  });

  test("en escritorio vive en el margen, fuera de la columna de contenido", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "solo escritorio");
    await page.goto("/");
    const borde = await page.evaluate(() => {
      const r = document.querySelector("#servicios .reticula")!;
      const estilo = getComputedStyle(r);
      return r.getBoundingClientRect().right - parseFloat(estilo.paddingRight);
    });
    const boton = (await page.locator(".cta-whatsapp").boundingBox())!;
    expect(boton.x).toBeGreaterThanOrEqual(borde);
  });
});
