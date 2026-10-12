/**
 * Lighthouse (configuración móvil por defecto) sobre un Chromium lanzado por Playwright.
 * Alternativa a `lhci collect` cuando chrome-launcher no puede lanzar el navegador.
 *
 *   node scripts/lighthouse.mjs [urlBase] [salida.json]
 */
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const requerir = createRequire(import.meta.url);
// lighthouse llega como dependencia de @lhci/cli (pnpm no la eleva a la raíz).
const rutaLhci = requerir.resolve("@lhci/cli/package.json");
const rutaLighthouse = createRequire(rutaLhci).resolve("lighthouse");
const { default: lighthouse } = await import(pathToFileURL(rutaLighthouse).href);

const base = process.argv[2] ?? "http://localhost:3200";
const salida = process.argv[3];
const rutas = (process.env.RUTAS ?? "/,/servicios/andamiaje,/contacto").split(",");
const puerto = 9333;

const navegador = await chromium.launch({ args: [`--remote-debugging-port=${puerto}`] });
const resultados = {};
for (const ruta of rutas) {
  const r = await lighthouse(`${base}${ruta}`, { port: puerto, output: "json", logLevel: "error" });
  const lhr = r.lhr;
  const cat = Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]));
  const a = lhr.audits;
  resultados[ruta] = {
    ...cat,
    LCP_ms: Math.round(a["largest-contentful-paint"].numericValue),
    CLS: Number(a["cumulative-layout-shift"].numericValue.toFixed(3)),
    TBT_ms: Math.round(a["total-blocking-time"].numericValue),
    FCP_ms: Math.round(a["first-contentful-paint"].numericValue),
    SI_ms: Math.round(a["speed-index"].numericValue),
    pesoTotal_kB: Math.round(a["total-byte-weight"].numericValue / 1024),
    fallidas: Object.values(a)
      .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== "informative" && x.scoreDisplayMode !== "notApplicable" && x.scoreDisplayMode !== "manual")
      .map((x) => `${x.id} (${x.score})`)
      .slice(0, 12),
  };
  process.stdout.write(`${ruta} ${JSON.stringify(resultados[ruta])}\n`);
}
await navegador.close();
if (salida) await writeFile(salida, `${JSON.stringify(resultados, null, 2)}\n`, "utf8");
