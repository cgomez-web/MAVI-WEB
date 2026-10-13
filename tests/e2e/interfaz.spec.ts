import { expect, test, type Page } from "@playwright/test";

/** Palabras partidas entre dos renglones dentro de los elementos que cumplen `selector`. */
function palabrasPartidas(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const partidas: string[] = [];
    for (const el of document.querySelectorAll(sel)) {
      const recorrido = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let nodo: Node | null;
      while ((nodo = recorrido.nextNode())) {
        const texto = nodo.textContent ?? "";
        for (const m of texto.matchAll(/\S+/g)) {
          const rango = document.createRange();
          rango.setStart(nodo, m.index);
          rango.setEnd(nodo, m.index + m[0].length);
          const renglones = new Set(
            [...rango.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)),
          );
          if (renglones.size > 1) partidas.push(m[0]);
        }
      }
    }
    return partidas;
  }, selector);
}

/** React ya controla la página: Movimiento marca html[data-js=on] al hidratar (antes, un clic se pierde). */
async function hidratada(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-js", "on");
}

const anchoDelDocumento = (page: Page) =>
  page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    cliente: document.documentElement.clientWidth,
    ventana: innerWidth,
  }));

/** Nombre accesible aproximado de un enlace: su aria-label o su texto sin lo que va aria-hidden. */
function nombresDeEnlacesExternos(page: Page) {
  return page.locator('a[target="_blank"]').evaluateAll((enlaces) =>
    enlaces.map((a) => {
      if (a.getAttribute("aria-label")) return a.getAttribute("aria-label")!;
      const copia = a.cloneNode(true) as HTMLElement;
      copia.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      return (copia.textContent ?? "").replace(/\s+/g, " ").trim();
    }),
  );
}

/**
 * Secciones con cinta cuya banda ::after asoma en reposo: visible y con la esquina superior derecha
 * dentro de la sección (x > 0). Con el sesgo de −12°, correrla a la izquierda no basta en secciones
 * con alto > 7,76 × ancho. Se ignoran las que están barriendo en ese momento.
 */
function bandasQueAsoman(page: Page) {
  return page.evaluate(() => {
    const barriendo = new Set(
      document
        .getAnimations()
        .map((a) => a.effect)
        .filter((e): e is KeyframeEffect => e instanceof KeyframeEffect)
        .filter((e) => e.pseudoElement === "::after")
        .map((e) => e.target),
    );
    return [...document.querySelectorAll<HTMLElement>('[data-revelar="cinta"]')].flatMap((s) => {
      if (barriendo.has(s)) return [];
      const cs = getComputedStyle(s, "::after");
      if (cs.visibility === "hidden") return [];
      const m = new DOMMatrixReadOnly(cs.transform);
      const [ox = 0, oy = 0] = cs.transformOrigin.split(" ").map(parseFloat);
      const x = m.transformPoint(new DOMPointReadOnly(parseFloat(cs.width) - ox, -oy)).x + ox;
      return x > 0 ? [`#${s.id}: esquina en x = ${Math.round(x)} px`] : [];
    });
  });
}

test.describe("galería de la bodega", () => {
  test("el visor anuncia cada foto y no repite la descripción (#39)", async ({ page }) => {
    await page.goto("/?escena=2d");
    await hidratada(page);
    const primero = page.locator('#inventario button[aria-label^="Ampliar:"]').first();
    await primero.click();
    const dialogo = page.locator("#inventario dialog");
    await expect(dialogo).toHaveAttribute("open", "");
    const vivo = dialogo.locator('[aria-live="polite"]');
    await expect(vivo).toContainText("01 / ");
    await page.keyboard.press("ArrowRight");
    await expect(vivo).toContainText("02 / ");
    await page.getByRole("button", { name: "Foto siguiente" }).click();
    await expect(vivo).toContainText("03 / ");
    await expect(dialogo).toHaveAttribute("open", "");
    // La descripción visible del pie repite el alt: va oculta a lectores de pantalla.
    await expect(dialogo.locator("figcaption span").nth(1)).toHaveAttribute("aria-hidden", "true");
    const cotizar = page.getByRole("link", {
      name: /Cotizar este equipo por WhatsApp \(se abre en una pestaña nueva\)/,
    });
    await expect(cotizar).toHaveAttribute("target", "_blank");
    await expect(cotizar).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("el visor se cierra al pulsar fuera de la foto y no al pulsarla (#57)", async ({ page }) => {
    await page.goto("/?escena=2d");
    await hidratada(page);
    const primero = page.locator('#inventario button[aria-label^="Ampliar:"]').first();
    const dialogo = page.locator("#inventario dialog");
    const abrir = async () => {
      await primero.click();
      await expect(dialogo).toHaveAttribute("open", "");
      // Mientras carga, la caja de la imagen mide 4 × 4 px (solo el borde).
      await page.waitForFunction(() => {
        const i = document.querySelector<HTMLImageElement>("#inventario dialog img");
        return !!i && i.complete && i.naturalWidth > 0;
      });
    };
    await abrir();
    await dialogo.locator("img").click();
    await expect(dialogo).toHaveAttribute("open", "");
    await dialogo.locator("figcaption").click();
    await expect(dialogo).toHaveAttribute("open", "");
    // Seleccionar el pie y soltar fuera no lo cierra (el gesto empezó dentro).
    const pie = (await dialogo.locator("figcaption span").nth(1).boundingBox())!;
    await page.mouse.move(pie.x + 5, pie.y + pie.height / 2);
    await page.mouse.down();
    await page.mouse.move(pie.x + pie.width + 120, pie.y + pie.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(dialogo).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(dialogo).not.toHaveAttribute("open", "");
    await expect(primero).toBeFocused();

    // Ningún punto a menos de 20 px del borde derecho: en Chromium para Windows la barra de
    // desplazamiento clásica queda encima del diálogo y ahí el clic no llega.
    const vp = page.viewportSize()!;
    const puntos = [
      () => ({ x: vp.width - 40, y: vp.height - 4 }),
      () => ({ x: vp.width / 2, y: vp.height - 2 }),
    ];
    for (const punto of puntos) {
      await abrir();
      const { x, y } = punto();
      await page.mouse.click(x, y);
      await expect(dialogo).not.toHaveAttribute("open", "");
      await expect(primero).toBeFocused();
    }
    await abrir();
    const foto = (await dialogo.locator("img").boundingBox())!;
    if (foto.x > 8) {
      await page.mouse.click(Math.max(4, foto.x / 2), foto.y + foto.height / 2);
      await expect(dialogo).not.toHaveAttribute("open", "");
    }
  });

  test("los filtros se anuncian con su conteo y su nombre contiene el texto visible (#37, 2.5.3)", async ({
    page,
  }) => {
    await page.goto("/?escena=2d");
    await hidratada(page);
    const grupo = page.getByRole("group", { name: "Filtrar por línea" });
    const todo = grupo.getByRole("button", { name: /^Todo \d+ fotos$/ });
    await expect(todo).toHaveAttribute("aria-pressed", "true");
    // Sin aria-label: el nombre sale del texto visible más el complemento solo para lectores.
    await expect(todo).not.toHaveAttribute("aria-label", /.*/);
    await grupo.getByRole("button", { name: /^Andamiaje \d+ fotos?$/ }).click();
    await expect(page.locator('#inventario button[aria-label^="Ampliar:"]')).toHaveCount(3);
  });

  test("con ratón la galería se arrastra con inercia; en táctil usa scroll-snap (#16)", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/?escena=2d");
    await hidratada(page);
    const pista = page.getByRole("list", { name: "Fotografías del inventario" });
    const snap = await pista.evaluate((el) => getComputedStyle(el).scrollSnapType);
    if (isMobile) {
      expect(snap.startsWith("x")).toBe(true);
      return;
    }
    expect(snap).toBe("none");
    // Al centrarla se pintan las secciones aplazadas de alrededor: se mide cuando ya no se mueve.
    await pista.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(500);
    await pista.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(300);
    const caja = (await pista.boundingBox())!;
    const y = caja.y + caja.height / 2;
    await page.mouse.move(caja.x + 700, y);
    await page.mouse.down();
    for (let i = 1; i <= 30; i++) await page.mouse.move(caja.x + 700 - i * 10, y);
    await page.mouse.up();
    const alSoltar = await pista.evaluate((el) => el.scrollLeft);
    expect(alSoltar).toBeGreaterThan(280);
    expect(alSoltar).toBeLessThan(320);
    await page.waitForTimeout(1500);
    expect(await pista.evaluate((el) => el.scrollLeft)).toBeGreaterThan(alSoltar);
    // Terminar un arrastre no abre el visor.
    await expect(page.locator("#inventario dialog")).not.toHaveAttribute("open", "");
  });

  test("cada línea muestra fotos de lo que alquila (#19, #58)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#encofrados-y-formaleteria figure img").first()).toHaveAttribute(
      "alt",
      /^Pilas de formaletas metálicas/,
    );
    await page.goto("/servicios/encofrados-y-formaleteria");
    await expect(page.locator("main figure img").first()).toHaveAttribute(
      "alt",
      /^Pilas de formaletas metálicas/,
    );
    await page.goto("/servicios/andamiaje");
    await expect(page.locator("main figure", { hasText: "Andamios en bodega" })).toHaveCount(0);
    await expect(page.locator('main figure img[alt*="arrete"]')).toHaveCount(0);
  });
});

test.describe("movimiento", () => {
  test("el conmutador «Animaciones» dice su estado (#6, #56, #64)", async ({ page, isMobile }) => {
    test.skip(isMobile, "en móvil vive dentro del menú");
    await page.goto("/");
    await hidratada(page);
    expect(await page.evaluate(() => document.documentElement.dataset.movimiento)).toBeUndefined();
    const conmutador = page.getByRole("switch", { name: "Animaciones" });
    await expect(conmutador).toHaveAttribute("aria-checked", "true");
    await conmutador.click();
    await expect(conmutador).toHaveAttribute("aria-checked", "false");
    await expect(page.locator("html")).toHaveAttribute("data-movimiento", "off");
  });

  test("con «reducir movimiento» el conmutador queda apagado y deshabilitado", async ({
    browser,
    baseURL,
    isMobile,
  }) => {
    test.skip(isMobile, "en móvil vive dentro del menú");
    const contexto = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    await contexto.addInitScript(() => {
      try {
        localStorage.setItem("mavi:movimiento", "on");
      } catch {}
    });
    const pagina = await contexto.newPage();
    await pagina.goto(`${baseURL}/`);
    const conmutador = pagina.getByRole("switch", { name: "Animaciones" });
    await expect(conmutador).toHaveAttribute("aria-checked", "false");
    await expect(conmutador).toHaveAttribute("aria-disabled", "true");
    await expect(conmutador).toHaveAccessibleDescription(/reducir el movimiento/);
    await contexto.close();
  });

  test("la transición de página barre la ventana en cada navegación (#81)", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "una vez basta");
    await page.goto("/?escena=2d");
    await page.waitForLoadState("networkidle");
    // El módulo de la cinta llega en tiempo ocioso.
    await page.waitForTimeout(2500);
    const capa = page.locator("[data-transicion-pagina]");
    await expect(capa).toBeHidden();
    await capa.evaluate((el) => {
      const w = window as unknown as { __cintaVista: boolean };
      w.__cintaVista = false;
      new MutationObserver(() => {
        if (!(el as HTMLElement).hidden) w.__cintaVista = true;
      }).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    });
    await page.locator('a[href="/servicios/andamiaje"]').first().click();
    await expect(page).toHaveURL(/\/servicios\/andamiaje$/);
    expect(
      await page.evaluate(() => (window as unknown as { __cintaVista: boolean }).__cintaVista),
    ).toBe(true);
    // Dura 300 ms en total: después no tapa nada.
    await page.waitForTimeout(400);
    await expect(capa).toBeHidden();
  });

  test("con «reducir movimiento» no hay transición de página", async ({ browser, baseURL }) => {
    const contexto = await browser.newContext({ reducedMotion: "reduce" });
    const pagina = await contexto.newPage();
    await pagina.goto(`${baseURL}/?escena=2d`);
    await pagina.waitForTimeout(2500);
    const capa = pagina.locator("[data-transicion-pagina]");
    await capa.evaluate((el) => {
      const w = window as unknown as { __cintaVista: boolean };
      w.__cintaVista = false;
      new MutationObserver(() => {
        if (!(el as HTMLElement).hidden) w.__cintaVista = true;
      }).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    });
    await pagina.locator("footer").getByRole("link", { name: "Andamiaje", exact: true }).click();
    await expect(pagina).toHaveURL(/\/servicios\/andamiaje$/);
    await pagina.waitForTimeout(400);
    expect(
      await pagina.evaluate(() => (window as unknown as { __cintaVista: boolean }).__cintaVista),
    ).toBe(false);
    await contexto.close();
  });

  test("la cinta barre seis secciones y en reposo no asoma (#23, #81)", async ({ page }) => {
    // 320 px: Nosotros y Cotización miden más de 7,76 veces el ancho, donde la banda sesgada asomaba.
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/?escena=2d");
    await hidratada(page);
    for (const id of ["servicios", "nosotros", "inventario", "proceso", "preguntas", "cotizacion"])
      await expect(page.locator(`#${id}`)).toHaveAttribute("data-revelar", "cinta");
    // Antes del barrido.
    expect(await bandasQueAsoman(page)).toEqual([]);
    for (const id of ["servicios", "nosotros", "cotizacion"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expect(page.locator(`#${id}`)).toHaveAttribute("data-visible", "true");
    }
    await page.waitForTimeout(900);
    // Al terminar, la banda vuelve a su reposo oculta y a la izquierda: no se queda tapando las
    // últimas filas ni asoma por la esquina superior.
    const reposo = await page.locator("#servicios").evaluate((el) => {
      const cs = getComputedStyle(el, "::after");
      return { m41: new DOMMatrixReadOnly(cs.transform).m41, visibilidad: cs.visibility };
    });
    expect(reposo.m41).toBeLessThan(0);
    expect(reposo.visibilidad).toBe("hidden");
    expect(await bandasQueAsoman(page)).toEqual([]);
    // En /contacto la Cotización es la primera sección: la cubre la transición de página.
    await page.goto("/contacto");
    await expect(page.locator("#cotizacion")).not.toHaveAttribute("data-revelar", "cinta");
  });

  test("el contador de líneas de servicio es un odómetro (#81)", async ({ page }) => {
    await page.goto("/");
    const barra = page.getByRole("region", { name: "Por qué confiar en MAVI" });
    await expect(barra).toContainText("LÍNEAS");
    await expect(barra.locator(".odometro")).toHaveCount(3); // "15" (dos rodillos) y "6"
    await expect(barra.locator(".solo-lectores", { hasText: /^6$/ })).toHaveCount(1);
  });

  test("ningún revelado oculta el contenido mientras espera (#25)", async ({ page, isMobile }) => {
    test.skip(isMobile, "una vez basta");
    await page.goto("/?escena=2d");
    // Se detiene el scroll con el titular de servicios al 72 % del alto: el bloque está a medio entrar.
    await page.evaluate(() => {
      const t = document.getElementById("titulo-servicios")!;
      window.scrollTo(0, scrollY + t.getBoundingClientRect().top - innerHeight * 0.72);
    });
    await page.waitForTimeout(300);
    const estado = await page.evaluate(() => ({
      recortes: [...document.querySelectorAll(".revelar-contenido")].map(
        (el) => getComputedStyle(el).clipPath,
      ),
      opacidades: [...document.querySelectorAll(".ficha td, .ficha th")].map(
        (el) => getComputedStyle(el).opacity,
      ),
    }));
    for (const r of estado.recortes) expect(r).toBe("none");
    for (const o of estado.opacidades) expect(o).toBe("1");
  });

  test("al imprimir nada sale en blanco ni a medio revelar (#55)", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });
    const problemas = await page.evaluate(() => {
      const malos: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        "[data-sello], [data-revelar], .ficha td, .ficha th",
      )) {
        const cs = getComputedStyle(el);
        if (Number(cs.opacity) < 1) malos.push(`${el.tagName} opacity ${cs.opacity}`);
        if (cs.clipPath !== "none") malos.push(`${el.tagName} clip-path ${cs.clipPath}`);
        if (el.dataset.revelar === "sube" && cs.transform !== "none")
          malos.push(`${el.tagName} transform ${cs.transform}`);
      }
      return malos;
    });
    expect(problemas).toEqual([]);
  });
});

test.describe("diseño adaptable (sin desbordes desde 320 px)", () => {
  test("el índice de servicios no se sale de su columna, en reposo ni activo (#4, #23)", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "cambia el viewport: se prueba una vez");
    test.setTimeout(90_000);
    for (const ancho of [320, 768, 1024]) {
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto("/?escena=2d");
      await page.locator("#servicios").scrollIntoViewIfNeeded();
      const medir = () =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>(".fila-enlace")].flatMap((a) => {
            const rango = document.createRange();
            rango.selectNodeContents(a);
            const derecha = Math.max(...[...rango.getClientRects()].map((r) => r.right));
            const limite = a.parentElement!.getBoundingClientRect().right;
            return derecha > limite + 0.5 ? [`${a.textContent}: ${derecha} > ${limite}`] : [];
          }),
        );
      expect(await medir(), `reposo a ${ancho}`).toEqual([]);
      await page.evaluate(() =>
        document
          .querySelectorAll(".fila-inclinable")
          .forEach((f) => f.setAttribute("data-activa", "true")),
      );
      await page.waitForTimeout(400);
      expect(await medir(), `activo a ${ancho}`).toEqual([]);
      const { scroll, cliente } = await anchoDelDocumento(page);
      expect(scroll, `scroll a ${ancho}`).toBeLessThanOrEqual(cliente);
    }
  });

  test("ninguna página clave desborda entre 320 y 1440 px (#22, #75)", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "cambia el viewport: se prueba una vez");
    test.setTimeout(240_000);
    const rutas = [
      "/",
      "/servicios",
      "/servicios/maquinaria-pesada",
      "/servicios/encofrados-y-formaleteria",
      "/servicios/andamiaje",
      "/politica-de-privacidad",
    ];
    for (const ancho of [320, 344, 768, 800, 820, 834, 1024, 1080, 1440]) {
      await page.setViewportSize({ width: ancho, height: 900 });
      for (const ruta of rutas) {
        await page.goto(`${ruta}${ruta === "/" ? "?escena=2d" : ""}`);
        const { scroll, ventana } = await anchoDelDocumento(page);
        expect(scroll, `${ruta} a ${ancho} px`).toBeLessThanOrEqual(ventana);
      }
    }
  });

  test("en un móvil de 320 y 768 px no hay desbordes (isMobile)", async ({
    browser,
    baseURL,
    isMobile,
  }) => {
    test.skip(!isMobile, "solo móvil");
    test.setTimeout(120_000);
    for (const width of [320, 768]) {
      const contexto = await browser.newContext({
        viewport: { width, height: 900 },
        isMobile: true,
        hasTouch: true,
      });
      const pagina = await contexto.newPage();
      for (const ruta of [
        "/",
        "/servicios",
        "/servicios/encofrados-y-formaleteria",
        "/servicios/andamiaje",
        "/servicios/maquinaria-pesada",
        "/politica-de-privacidad",
      ]) {
        await pagina.goto(`${baseURL}${ruta}`);
        const { scroll } = await anchoDelDocumento(pagina);
        // Con isMobile, si algo desborda innerWidth también crece: se compara con el ancho fijado.
        expect(scroll, `${ruta} a ${width} px`).toBeLessThanOrEqual(width);
      }
      await contexto.close();
    }
  });

  test("los titulares no parten palabras a mitad (#4, #27, #30, #75)", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "cambia el viewport: se prueba una vez");
    test.setTimeout(120_000);
    const casos: Array<[string, string, number[]]> = [
      ["/servicios", 'h1, h2[id^="indice-"]', [320, 344, 768]],
      ["/servicios/encofrados-y-formaleteria", "h1, h2", [320, 360, 768, 1024, 1280]],
      [
        "/",
        "#preguntas h2, #proceso h3, #titulo-encofrados-y-formaleteria",
        [320, 768, 1024, 1280],
      ],
    ];
    for (const [ruta, selector, anchos] of casos)
      for (const ancho of anchos) {
        await page.setViewportSize({ width: ancho, height: 900 });
        await page.goto(`${ruta}${ruta === "/" ? "?escena=2d" : ""}`);
        await page.evaluate(() => document.fonts.ready);
        expect(await palabrasPartidas(page, selector), `${ruta} a ${ancho} px`).toEqual([]);
      }
  });

  test("la ficha técnica en 320 px baja el rango bajo el nombre sin silabear", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "cambia el viewport: se prueba una vez");
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/servicios/maquinaria-pesada");
    await page.evaluate(() => document.fonts.ready);
    const [nombre, rango] = await page.evaluate(() => {
      const fila = document.querySelector(".ficha tbody tr")!;
      return [
        fila.querySelector("th")!.getBoundingClientRect().bottom,
        fila.querySelector(".ficha-rango")!.getBoundingClientRect().top,
      ];
    });
    expect(rango!).toBeGreaterThanOrEqual(nombre! - 0.5);
    expect(await palabrasPartidas(page, ".ficha tbody th")).toEqual([]);
  });

  test("con ratón por debajo de lg la ficha del índice está siempre a la vista", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "puntero fino");
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto("/?escena=2d");
    await page.locator("#servicios").scrollIntoViewIfNeeded();
    const estrecho = await page.evaluate(() => ({
      fichas: [...document.querySelectorAll("#servicios .ficha-fila")].map(
        (el) => getComputedStyle(el).opacity,
      ),
      pistas: [...document.querySelectorAll("#servicios .cifra-fila")].map(
        (el) => getComputedStyle(el).display,
      ),
    }));
    expect(new Set(estrecho.fichas)).toEqual(new Set(["1"]));
    expect(new Set(estrecho.pistas)).toEqual(new Set(["none"]));
    // Desde lg se revela al pasar el ratón.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.mouse.move(5, 5);
    await page.waitForTimeout(600);
    const ancho = await page
      .locator("#servicios .ficha-fila")
      .first()
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(ancho).toBe("0");
  });

  test("«Cómo trabajamos» cabe en un renglón a 1024 px (#78)", async ({ page, isMobile }) => {
    test.skip(isMobile, "navegación de escritorio");
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/");
    const enlace = page
      .getByRole("navigation", { name: "Principal" })
      .getByRole("link", { name: "Cómo trabajamos" });
    expect(await enlace.evaluate((a) => a.getClientRects().length)).toBe(1);
  });
});

test.describe("contenido y estructura", () => {
  test("/nosotros baja de H1 a H2 sin saltos; en el inicio los mismos títulos son H3 (#42, #73)", async ({
    page,
  }) => {
    await page.goto("/nosotros");
    await expect(page.getByRole("heading", { level: 2, name: "Experiencia" })).toBeAttached();
    await expect(page.getByRole("heading", { level: 2, name: "Nuestra misión" })).toBeAttached();
    const niveles = await page
      .locator("main :is(h1, h2, h3)")
      .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    expect(niveles.indexOf(3)).toBeGreaterThan(niveles.indexOf(2));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 3, name: "Experiencia" })).toBeAttached();
    await expect(page.getByRole("heading", { level: 3, name: "Nuestra misión" })).toBeAttached();
  });

  test("la frase de compromiso del brochure está en el inicio y en /nosotros (#59)", async ({
    page,
  }) => {
    const frase =
      "Nuestro compromiso es facilitar su trabajo, optimizar sus recursos y contribuir al cumplimiento de sus proyectos.";
    for (const ruta of ["/", "/nosotros"]) {
      await page.goto(ruta);
      const texto = page.getByText(frase);
      await texto.scrollIntoViewIfNeeded();
      await expect(texto).toBeVisible();
    }
  });

  test("el índice muestra todos los equipos de cada línea (#61)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#servicios ol > li:nth-child(3) .ficha-fila")).toContainText(
      "Tableros",
    );
    const sexta = page.locator("#servicios ol > li:nth-child(6) .ficha-fila");
    await expect(sexta).toContainText("Herramientas");
    await expect(sexta).toContainText("Equipos menores");
  });

  test("las cifras protagonistas son del brochure, no cantidades inventadas (#61)", async ({
    page,
  }) => {
    await page.goto("/");
    // La ventana de cada línea (cifra protagonista) no muestra "5 PIEZAS", "3 ELEMENTOS" ni "2 SISTEMAS".
    await expect(
      page
        .locator("section[data-fase] [data-ventana-3d]")
        .filter({ hasText: /(piezas|elementos|sistemas)/i }),
    ).toHaveCount(0);
    await expect(page.locator("#andamiaje")).toContainText("Fachada y en torre");
  });

  test("cotizar una línea por WhatsApp se anuncia completo (#40)", async ({ page }) => {
    await page.goto("/");
    const enlace = page.getByRole("link", {
      name: /Cotizar esta línea por WhatsApp: Andamiaje \(se abre en una pestaña nueva\)/,
    });
    await expect(enlace).toHaveAttribute("target", "_blank");
  });

  for (const ruta of ["/", "/contacto", "/servicios/maquinaria-pesada"]) {
    test(`en ${ruta} todo enlace que abre otra pestaña lo avisa (#40)`, async ({ page }) => {
      await page.goto(ruta);
      const nombres = await nombresDeEnlacesExternos(page);
      expect(nombres.length).toBeGreaterThan(0);
      for (const n of nombres) expect(n).toContain("(se abre en una pestaña nueva)");
    });
  }
});
