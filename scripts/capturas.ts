/**
 * Capturas de página completa para revisión de diseño y para docs/REPORTE-FINAL.md.
 *
 *   pnpm exec tsx scripts/capturas.ts [urlBase] [carpetaSalida]
 *
 * Por defecto: http://localhost:3100 → docs/img/capturas. Desactiva el movimiento para que las
 * capturas sean deterministas (estado final de las animaciones).
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3100";
const salida = path.resolve(process.argv[3] ?? "docs/img/capturas");
const rutas = (process.env.RUTAS ?? "/,/servicios/andamiaje,/contacto").split(",");
const vistas = [
  { nombre: "escritorio", width: 1440, height: 900 },
  { nombre: "movil", width: 375, height: 812 },
];

async function main() {
  await mkdir(salida, { recursive: true });
  const navegador = await chromium.launch();
  for (const vista of vistas) {
    const contexto = await navegador.newContext({
      viewport: { width: vista.width, height: vista.height },
      deviceScaleFactor: 1,
      reducedMotion: process.env.CON_MOVIMIENTO ? "no-preference" : "reduce",
      // Solo para capturar: permite fijar la altura de la galería (en página completa, svh = alto total).
      bypassCSP: true,
    });
    const pagina = await contexto.newPage();
    for (const ruta of rutas) {
      await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
      await pagina.addStyleTag({ content: `:root { --alto-galeria: ${Math.round(vista.height * 0.46)}px !important; }` });
      await pagina.waitForTimeout(600);
      // Recorre la página para disparar la carga diferida y espera a que cada imagen se decodifique.
      // Se pasa como cadena: el transpilador de tsx inyecta helpers (__name) que no existen en la página.
      await pagina.evaluate(`(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
        for (const img of Array.from(document.images)) img.loading = "eager";
        const todas = Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => undefined)));
        await Promise.race([todas, new Promise((r) => setTimeout(r, 8000))]);
      })()`);
      await pagina.waitForLoadState("networkidle");
      const archivo = path.join(salida, `${vista.nombre}${ruta === "/" ? "-inicio" : ruta.replace(/\//g, "-")}.png`);
      await pagina.screenshot({ path: archivo, fullPage: true });
      process.stdout.write(`✓ ${path.relative(process.cwd(), archivo)}\n`);
    }
    await contexto.close();
  }
  await navegador.close();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
