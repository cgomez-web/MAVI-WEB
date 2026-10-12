import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra el build de producción (`pnpm build` antes). El servidor se levanta en el puerto 3200.
 * PUERTO_E2E permite reutilizar un servidor ya iniciado.
 */
const puerto = Number(process.env.PUERTO_E2E ?? 3200);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 45_000,
  use: {
    baseURL: `http://localhost:${puerto}`,
    trace: "retain-on-failure",
    locale: "es-CO",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "movil", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${puerto}`,
    url: `http://localhost:${puerto}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
