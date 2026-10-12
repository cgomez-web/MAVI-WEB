import { expect, test } from "@playwright/test";

test.describe("humo", () => {
  test("el home carga con su titular, sin errores de consola y sin scroll horizontal", async ({ page }) => {
    const errores: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errores.push(m.text());
    });
    page.on("pageerror", (e) => errores.push(e.message));
    const respuesta = await page.goto("/");
    expect(respuesta?.status()).toBe(200);
    await expect(page).toHaveTitle(/MAVI Proyectos e Inversiones/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Su obra avanza.");
    await expect(page.locator("html")).toHaveAttribute("lang", "es-CO");
    // Se compara con el ancho del dispositivo: en móvil, si algo desborda, innerWidth también crece.
    await page.waitForLoadState("networkidle");
    const ancho = page.viewportSize()!.width;
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scroll).toBeLessThanOrEqual(ancho);
    expect(errores, errores.join("\n")).toEqual([]);
  });

  test("datos de contacto reales visibles", async ({ page }) => {
    await page.goto("/contacto");
    await expect(page.getByText("322 559 9325").first()).toBeVisible();
    await expect(page.getByText("Cr 25 # 41B Sur 37").first()).toBeVisible();
    const correo = page.locator('a[href^="mailto:maviproyectoseinversiones"]').first();
    await expect(correo).toBeAttached();
  });
});

test.describe("navegación", () => {
  test("del índice de servicios a una página de línea", async ({ page, isMobile }) => {
    await page.goto("/");
    if (!isMobile) {
      await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Equipos" }).click();
      await expect(page).toHaveURL(/#servicios$/);
    }
    await page.goto("/servicios/andamiaje");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alquiler de andamios certificados");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/servicios\/andamiaje$/);
  });

  test("menú móvil accesible", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await page.goto("/");
    const boton = page.getByRole("button", { name: "Abrir menú" });
    await boton.click();
    await expect(page.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
  });

  test("404 propio sin trazas", async ({ page }) => {
    const r = await page.goto("/esta-ruta-no-existe");
    expect(r?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("no está en la obra");
    await expect(page.locator("body")).not.toContainText(/at .*\.js:\d+/);
  });

  test("sitemap, robots y security.txt", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
    expect(await (await request.get("/.well-known/security.txt")).text()).toContain("Contact:");
  });
});

test.describe("formulario de cotización", () => {
  test("rechaza entradas inválidas con mensajes accesibles", async ({ page }) => {
    await page.goto("/contacto");
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    const resumen = page.getByText(/Revise \d+ campos antes de enviar/);
    await expect(resumen).toBeVisible();
    await expect(page.getByLabel("Nombre completo")).toHaveAttribute("aria-invalid", "true");
    await page.getByLabel("Celular / WhatsApp").fill("123");
    await page.getByLabel("Celular / WhatsApp").blur();
    await expect(page.locator('[id$="-telefono-error"]')).toContainText("celular colombiano de 10 dígitos");
  });

  test("acepta una solicitud válida (respuesta del servidor simulada)", async ({ page }) => {
    let cuerpo: Record<string, unknown> = {};
    await page.route("**/api/cotizacion", async (ruta) => {
      cuerpo = ruta.request().postDataJSON() as Record<string, unknown>;
      await ruta.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, codigo: "ok" }) });
    });
    await page.goto("/contacto");
    await page.getByLabel("Nombre completo").fill("Laura Gómez");
    await page.getByLabel("Celular / WhatsApp").fill("322 559 9325");
    await page.getByLabel("Municipio de la obra").selectOption("Envigado");
    await page.getByLabel("Línea de servicio").selectOption("Andamiaje");
    await page.getByLabel(/Qué necesita/).fill("Cuarenta cuerpos de andamio para fachada de cuatro pisos.");
    await page.getByLabel(/Autorizo a MAVI/).check();
    await page.waitForTimeout(3100); // tiempo mínimo humano de llenado
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    await expect(page.getByText("Recibimos su solicitud")).toBeVisible();
    expect(cuerpo.telefono).toBe("3225599325");
    expect(cuerpo.consentimiento).toBe(true);
  });

  test("el servidor valida aunque se salte el cliente", async ({ request, baseURL }) => {
    const r = await request.post("/api/cotizacion", {
      headers: { origin: baseURL!, "content-type": "application/json" },
      data: { nombre: "x", telefono: "1", ciudad: "Narnia", servicio: "Otra", mensaje: "", consentimiento: false, iniciado: 1 },
    });
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
});

test.describe("cabeceras de seguridad", () => {
  test("CSP con nonce y cabeceras estrictas", async ({ request }) => {
    const r = await request.get("/");
    const h = r.headers();
    expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
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
});
