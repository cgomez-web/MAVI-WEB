import AxeBuilder from "@axe-core/playwright";
import { chromium, expect, test, type Page } from "@playwright/test";

/** Avance (`--k`) de una capa del póster 2D (components/three/posterCapas.ts). */
const avanceCapa = (page: Page, id: string) =>
  page
    .locator(`[data-capa="${id}"]`)
    .first()
    .evaluate((el) => Number(getComputedStyle(el).getPropertyValue("--k")));

test.describe("escena 3D y degradación", () => {
  test("sin WebGL el sitio es 100 % usable con el póster 2D", async ({ baseURL }) => {
    const navegador = await chromium.launch({
      args: ["--disable-webgl", "--disable-webgl2", "--use-gl=disabled"],
    });
    const pagina = await navegador.newPage();
    await pagina.goto(`${baseURL}/`);
    await pagina.waitForTimeout(2500);
    await expect(pagina.locator(".escena-lienzo canvas")).toHaveCount(0);
    await expect(pagina.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      pagina.getByRole("heading", { name: "Inventario real, listo para su obra" }),
    ).toBeAttached();
    // El formulario real se descarga al acercarse a #cotizacion (#51); el esqueleto es aria-hidden + inert.
    await pagina.locator("#cotizacion").scrollIntoViewIfNeeded();
    await expect(pagina.getByRole("button", { name: "Enviar solicitud" })).toBeEnabled({
      timeout: 15000,
    });
    await navegador.close();
  });

  test("con movimiento reducido no se monta la escena", async ({ browser, baseURL }) => {
    const contexto = await browser.newContext({ reducedMotion: "reduce" });
    const pagina = await contexto.newPage();
    await pagina.goto(`${baseURL}/`);
    await pagina.waitForTimeout(2500);
    await expect(pagina.locator(".escena-lienzo")).toHaveCount(0);
    await contexto.close();
  });

  test("el lienzo 3D, si se monta, queda oculto a lectores de pantalla", async ({ page }) => {
    await page.goto("/?escena=3d");
    const capa = page.locator(".escena-lienzo").first();
    if ((await capa.count()) > 0) {
      await expect(page.locator(".escena-lienzo canvas").first()).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
    // La descripción textual equivalente existe siempre.
    await expect(page.locator("#inicio .solo-lectores").first()).toContainText(
      "Ilustración animada",
    );
  });

  test("el póster 2D cuenta las fases con el scroll (#80)", async ({ page }) => {
    await page.goto("/?escena=2d");
    await page.waitForLoadState("networkidle");
    // En el hero la grúa todavía no está (#33).
    expect(await avanceCapa(page, "grua")).toBe(0);
    await page.evaluate(() => {
      const ventana = document.querySelector("#transporte-y-elevacion [data-ventana-3d]")!;
      window.scrollTo(0, scrollY + ventana.getBoundingClientRect().top - innerHeight * 0.12);
    });
    await expect.poll(() => avanceCapa(page, "grua"), { timeout: 3000 }).toBeGreaterThan(0.9);
    // Los puntales son de la fase siguiente.
    expect(await avanceCapa(page, "puntales-a")).toBe(0);
  });

  test("un toque no dispara la carga de la escena 3D (#10)", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo táctil");
    await page.goto("/");
    // Abrir y cerrar el menú con toques: ni toques ni teclas descargan la escena (solo el scroll, la
    // rueda, el movimiento del ratón o, a falta de señales, 6,5 s después de cargar).
    await page.getByRole("button", { name: "Abrir menú" }).tap();
    await page.getByRole("button", { name: "Cerrar menú" }).tap();
    await page.waitForTimeout(3000);
    await expect(page.locator(".escena-lienzo")).toHaveCount(0);
  });

  test("preloader 'nivelando': se centra antes de revelar la escena (#82)", async ({
    baseURL,
    isMobile,
  }) => {
    test.skip(isMobile, "lanza su propio navegador: una vez basta");
    const navegador = await chromium.launch({
      args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
    });
    const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
    await pagina.goto(`${baseURL}/?escena=3d`);
    const conWebGl2 = await pagina.evaluate(
      () => document.createElement("canvas").getContext("webgl2") !== null,
    );
    if (!conWebGl2) {
      await navegador.close();
      test.skip(true, "este entorno no tiene WebGL2 ni con SwiftShader");
    }
    await pagina.evaluate(() => {
      const w = window as unknown as { __orden: string[] };
      w.__orden = [];
      new MutationObserver(() => {
        const o = w.__orden;
        const nivel = document.querySelector<HTMLElement>(".nivelando");
        const lienzo = document.querySelector<HTMLElement>(".escena-lienzo");
        if (nivel && o.length === 0) o.push(`nivelando:${getComputedStyle(nivel).display}`);
        if (nivel?.dataset.centrada === "true" && !o.includes("centrada")) o.push("centrada");
        if (lienzo?.dataset.lista === "true" && !o.includes("lista")) o.push("lista");
        if (o.includes("lista") && !nivel && !o.includes("sin-nivelando")) o.push("sin-nivelando");
      }).observe(document.body, { subtree: true, childList: true, attributes: true });
    });
    // Primera señal de lectura: un scroll mínimo.
    await pagina.evaluate(() => window.scrollBy(0, 1));
    await expect
      .poll(() => pagina.evaluate(() => (window as unknown as { __orden: string[] }).__orden), {
        timeout: 30_000,
      })
      .toEqual(["nivelando:flex", "centrada", "lista", "sin-nivelando"]);
    await navegador.close();
  });

  test("los velos de contraste se dibujan bajo el texto de las ventanas (#3)", async ({ page }) => {
    await page.goto("/?escena=2d");
    await expect
      .poll(
        async () =>
          Number((await page.locator("[data-velos-texto]").getAttribute("data-velos")) ?? 0),
        { timeout: 8000 },
      )
      .toBeGreaterThan(0);
  });
});

test.describe("accesibilidad (axe, WCAG 2.2 AA)", () => {
  for (const ruta of [
    "/",
    "/servicios",
    "/servicios/andamiaje",
    "/servicios/encofrados-y-formaleteria",
    "/contacto",
    "/nosotros",
    "/politica-de-privacidad",
  ]) {
    test(`sin violaciones graves en ${ruta}`, async ({ browser, baseURL }) => {
      // Movimiento reducido: el contenido queda en su estado final y axe evalúa lo que se lee.
      const contexto = await browser.newContext({ reducedMotion: "reduce" });
      const pagina = await contexto.newPage();
      await pagina.goto(`${baseURL}${ruta}`);
      await pagina.waitForTimeout(800);
      const resultado = await new AxeBuilder({ page: pagina })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const graves = resultado.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(
        graves.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join(" | ")}`,
        ),
      ).toEqual([]);
      await contexto.close();
    });
  }

  test("navegación completa por teclado: skip-link y foco visible", async ({ page, isMobile }) => {
    test.skip(isMobile, "teclado: escritorio");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const salto = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(salto).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#contenido")).toBeFocused();
  });
});
