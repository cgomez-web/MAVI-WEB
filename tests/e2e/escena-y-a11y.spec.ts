import AxeBuilder from "@axe-core/playwright";
import { chromium, expect, test } from "@playwright/test";

test.describe("escena 3D y degradación", () => {
  test("sin WebGL el sitio es 100 % usable con el póster 2D", async ({ baseURL }) => {
    const navegador = await chromium.launch({ args: ["--disable-webgl", "--disable-webgl2", "--use-gl=disabled"] });
    const pagina = await navegador.newPage();
    await pagina.goto(`${baseURL}/`);
    await pagina.waitForTimeout(2500);
    await expect(pagina.locator(".escena-lienzo canvas")).toHaveCount(0);
    await expect(pagina.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(pagina.getByRole("heading", { name: "Inventario real, listo para su obra" })).toBeAttached();
    await expect(pagina.getByRole("button", { name: "Enviar solicitud" })).toBeAttached();
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
      await expect(page.locator(".escena-lienzo canvas").first()).toHaveAttribute("aria-hidden", "true");
    }
    // La descripción textual equivalente existe siempre.
    await expect(page.locator("#inicio .solo-lectores").first()).toContainText("Ilustración animada");
  });
});

test.describe("accesibilidad (axe, WCAG 2.2 AA)", () => {
  for (const ruta of ["/", "/servicios/encofrados-y-formaleteria", "/contacto", "/nosotros", "/politica-de-privacidad"]) {
    test(`sin violaciones graves en ${ruta}`, async ({ browser, baseURL }) => {
      // Movimiento reducido: el contenido queda en su estado final y axe evalúa lo que se lee.
      const contexto = await browser.newContext({ reducedMotion: "reduce" });
      const pagina = await contexto.newPage();
      await pagina.goto(`${baseURL}${ruta}`);
      await pagina.waitForTimeout(800);
      const resultado = await new AxeBuilder({ page: pagina })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const graves = resultado.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
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
