/**
 * Presupuesto de JS inicial por ruta (PROMPT §6: "JS inicial (sin Three) < 150 kB gz").
 *
 * Se ejecuta DESPUÉS de `pnpm build` y no necesita servidor:
 *
 *   node scripts/presupuesto-js.mjs [--dir .next] [--limite 150000] [--json salida.json]
 *
 * "JS inicial" = los <script src> que el HTML de la ruta trae desde el principio (sin los polyfills
 * `nomodule`): los archivos raíz de la app (build-manifest.json → rootMainFiles) más los chunks de los
 * componentes cliente que usa la ruta, tal como los lista server/app/<ruta>/page_client-reference-manifest.js.
 * Ese manifiesto trae TODOS los componentes cliente de la app; se cuentan los de Next (node_modules), las
 * fronteras de app/ (error, not-found…) y los del proyecto que el código de servidor de la ruta importa
 * (server/app/<ruta>/page.js y sus chunks), que son los que su HTML puede pedir. Es una cota superior
 * (un componente importado pero no pintado también suma). Lo que se importa en diferido (three, gsap,
 * lenis, la escena 3D) no entra. Cada archivo se mide comprimido con gzip nivel 6, el de `next start`;
 * el servidor, que comprime por partes, envía unos cientos de bytes más por ruta.
 *
 * Con --url <base> mide el HTML real de un servidor en marcha (`next start`, una vista previa): toma
 * los <script src> sin `nomodule` de cada ruta, los descarga y los comprime igual.
 *
 *   node scripts/presupuesto-js.mjs --url http://localhost:3200
 *
 * Sale con código 1 si alguna ruta supera el límite (por defecto 150 000 bytes).
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";
import vm from "node:vm";

const LIMITE_POR_DEFECTO = 150_000;
const AVISO = 0.97; // por encima del 97 % del límite se avisa aunque pase
const RUTAS_URL = [
  "/",
  "/servicios/andamiaje",
  "/contacto",
  "/nosotros",
  "/politica-de-privacidad",
];

function leerArgumentos(argv) {
  const opciones = { dir: ".next", limite: LIMITE_POR_DEFECTO, url: undefined, json: undefined };
  const conValor = { "--dir": "dir", "--limite": "limite", "--url": "url", "--json": "json" };
  for (let i = 0; i < argv.length; i++) {
    const clave = argv[i];
    const valor = argv[i + 1];
    if (clave in conValor && valor !== undefined) {
      opciones[conValor[clave]] = valor;
      i++;
    } else if (clave === "--ayuda" || clave === "-h") {
      process.stdout.write(
        "Uso: node scripts/presupuesto-js.mjs [--dir .next] [--limite 150000] [--url http://localhost:3200] [--json salida.json]\n",
      );
      process.exit(0);
    } else {
      process.stderr.write(`Argumento desconocido: ${clave}\n`);
      process.exit(2);
    }
  }
  opciones.limite = Number(opciones.limite);
  if (opciones.url) opciones.url = opciones.url.replace(/\/$/, "");
  if (!Number.isFinite(opciones.limite) || opciones.limite <= 0) {
    process.stderr.write("--limite debe ser un número de bytes positivo\n");
    process.exit(2);
  }
  return opciones;
}

const gzip = (contenido) => gzipSync(contenido, { level: 6 }).length;
const kB = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;

/* ───────────────────────── Desde el build (.next) ───────────────────────── */

function leerJson(ruta) {
  return JSON.parse(readFileSync(ruta, "utf8"));
}

/**
 * Evalúa page_client-reference-manifest.js en un contexto aislado: el archivo solo asigna
 * `globalThis.__RSC_MANIFEST[entrada] = {...}` (algunas versiones usan `self`).
 */
function leerManifiestoCliente(archivo) {
  const contexto = vm.createContext({});
  contexto.self = contexto;
  vm.runInContext(readFileSync(archivo, "utf8"), contexto, { filename: archivo, timeout: 2000 });
  const manifiestos = contexto.__RSC_MANIFEST ?? {};
  const [entrada, manifiesto] = Object.entries(manifiestos)[0] ?? [];
  return entrada ? { entrada, manifiesto } : undefined;
}

function buscarManifiestosCliente(dirApp) {
  const encontrados = [];
  const recorrer = (dir) => {
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (nombre === "page_client-reference-manifest.js") encontrados.push(ruta);
    }
  };
  recorrer(dirApp);
  return encontrados;
}

/**
 * Código de servidor de la ruta (page.js y los chunks que carga con `.X(0, [ids], …)`): allí aparecen
 * las rutas de los componentes cliente que importa. Devuelve undefined si no se puede leer.
 */
function codigoServidor(dir, archivoManifiesto) {
  const pagina = archivoManifiesto.replace(/_client-reference-manifest\.js$/, ".js");
  if (!existsSync(pagina)) return undefined;
  const fuente = readFileSync(pagina, "utf8");
  const ids = /\.X\(0,\[([\d,\s]*)\]/.exec(fuente)?.[1];
  if (ids === undefined) return undefined;
  let codigo = fuente;
  const chunks = ids.split(",").map((x) => x.trim());
  for (const id of chunks.filter(Boolean)) {
    const chunk = join(dir, "server", "chunks", `${id}.js`);
    if (!existsSync(chunk)) return undefined;
    codigo += readFileSync(chunk, "utf8");
  }
  return codigo;
}

/** ¿El código de servidor menciona este archivo (con / o con \ escapadas, según el sistema)? */
function seImporta(codigo, relativa) {
  const partes = relativa.split(/[\\/]/);
  return [partes.join("/"), partes.join("\\\\"), partes.join("\\")].some((r) => codigo.includes(r));
}

/** "/servicios/[slug]/page" → "/servicios/[slug]"; "/page" → "/" */
function rutaDeEntrada(entrada) {
  const ruta = entrada.replace(/\/page$/, "");
  return ruta === "" ? "/" : ruta;
}

function medirDesdeBuild(dir) {
  const manifiestoBuild = join(dir, "build-manifest.json");
  const dirApp = join(dir, "server", "app");
  if (!existsSync(manifiestoBuild) || !existsSync(dirApp)) {
    process.stderr.write(
      `No hay un build en "${dir}" (falta build-manifest.json o server/app). Ejecute antes "pnpm build".\n`,
    );
    process.exit(2);
  }
  const raiz = resolve(dir, "..");
  const { rootMainFiles = [], polyfillFiles = [] } = leerJson(manifiestoBuild);
  const polyfills = new Set(polyfillFiles);
  const cacheTamano = new Map();
  const tamano = (archivo) => {
    if (!cacheTamano.has(archivo)) {
      const ruta = join(dir, decodeURIComponent(archivo));
      cacheTamano.set(archivo, existsSync(ruta) ? gzip(readFileSync(ruta)) : undefined);
    }
    return cacheTamano.get(archivo);
  };

  const resultados = [];
  for (const archivoManifiesto of buscarManifiestosCliente(dirApp)) {
    const leido = leerManifiestoCliente(archivoManifiesto);
    if (!leido) continue;
    const ruta = rutaDeEntrada(leido.entrada);
    if (ruta.startsWith("/_")) continue; // /_not-found y similares internos
    const codigo = codigoServidor(dir, archivoManifiesto);
    const archivos = new Set(rootMainFiles);
    for (const [clave, modulo] of Object.entries(leido.manifiesto.clientModules ?? {})) {
      // Clave: ruta absoluta del módulo (+ "#export"). Sin el código de servidor se cuentan todos.
      const relativa = relative(raiz, clave.replace(/#.*$/, ""));
      const delProyecto = !relativa.startsWith("..") && !relativa.includes("node_modules");
      const frontera = /^app[\\/]/.test(relativa);
      if (codigo && delProyecto && !frontera && !seImporta(codigo, relativa)) continue;
      for (const chunk of modulo.chunks ?? []) {
        if (typeof chunk === "string" && chunk.endsWith(".js")) archivos.add(chunk);
      }
    }
    let total = 0;
    const faltan = [];
    const detalle = [];
    for (const archivo of archivos) {
      if (polyfills.has(archivo)) continue;
      const bytes = tamano(archivo);
      if (bytes === undefined) faltan.push(archivo);
      else {
        total += bytes;
        detalle.push({ archivo, bytes });
      }
    }
    if (faltan.length > 0) {
      process.stderr.write(
        `${ruta}: faltan en ${relative(process.cwd(), dir) || dir}${sep}: ${faltan.join(", ")}\n`,
      );
      process.exit(2);
    }
    detalle.sort((a, b) => b.bytes - a.bytes);
    resultados.push({ ruta, total, archivos: detalle });
  }
  if (resultados.length === 0) {
    process.stderr.write(`No se encontraron páginas en ${dirApp}.\n`);
    process.exit(2);
  }
  return resultados.sort((a, b) => a.ruta.localeCompare(b.ruta));
}

/* ───────────────────────── Desde un servidor (--url) ───────────────────────── */

async function medirDesdeServidor(base) {
  const cacheTamano = new Map();
  const resultados = [];
  for (const ruta of RUTAS_URL) {
    const respuesta = await fetch(`${base}${ruta}`, { redirect: "follow" });
    if (!respuesta.ok) throw new Error(`${ruta}: HTTP ${respuesta.status}`);
    const html = await respuesta.text();
    const fuentes = new Set();
    for (const [etiqueta] of html.matchAll(/<script\b[^>]*>/gi)) {
      if (/\bnomodule\b/i.test(etiqueta)) continue;
      const src = /\bsrc="([^"]+)"/i.exec(etiqueta)?.[1];
      if (src) fuentes.add(new URL(src.replaceAll("&amp;", "&"), `${base}${ruta}`).href);
    }
    let total = 0;
    const detalle = [];
    for (const src of fuentes) {
      if (!cacheTamano.has(src)) {
        const r = await fetch(src, { headers: { "accept-encoding": "identity" } });
        if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`);
        cacheTamano.set(src, gzip(Buffer.from(await r.arrayBuffer())));
      }
      const bytes = cacheTamano.get(src);
      total += bytes;
      detalle.push({ archivo: new URL(src).pathname, bytes });
    }
    detalle.sort((a, b) => b.bytes - a.bytes);
    resultados.push({ ruta, total, archivos: detalle });
  }
  return resultados;
}

/* ───────────────────────── Informe ───────────────────────── */

const opciones = leerArgumentos(process.argv.slice(2));
let resultados;
if (opciones.url) {
  try {
    resultados = await medirDesdeServidor(opciones.url);
  } catch (error) {
    const causa = error instanceof Error ? (error.cause?.code ?? error.message) : String(error);
    process.stderr.write(
      `No se pudo medir ${opciones.url} (${causa}). ¿Está el servidor en marcha?\n`,
    );
    process.exit(2);
  }
} else {
  resultados = medirDesdeBuild(opciones.dir);
}

const origen = opciones.url ?? opciones.dir;
let lineas = `JS inicial por ruta (gzip nivel 6) · origen: ${origen} · límite ${kB(opciones.limite)}\n\n`;
let fallan = 0;
for (const r of resultados) {
  const proporcion = r.total / opciones.limite;
  const estado = proporcion > 1 ? "FALLA" : proporcion > AVISO ? "AL LÍMITE" : "ok";
  if (proporcion > 1) fallan++;
  const margen = opciones.limite - r.total;
  lineas += `${estado.padEnd(9)} ${r.ruta.padEnd(28)} ${kB(r.total).padStart(9)}  (${r.archivos.length} archivos, margen ${kB(margen)})\n`;
  if (proporcion > AVISO) {
    for (const a of r.archivos.slice(0, 5))
      lineas += `            ${kB(a.bytes).padStart(9)}  ${a.archivo}\n`;
  }
}
process.stdout.write(lineas);

if (opciones.json) {
  writeFileSync(
    opciones.json,
    `${JSON.stringify({ limite: opciones.limite, origen, rutas: resultados }, null, 2)}\n`,
  );
}

if (fallan > 0) {
  process.stderr.write(
    `\n${fallan} ruta(s) superan el presupuesto de ${kB(opciones.limite)} gz de JS inicial. ` +
      "Revise qué entró al bundle inicial (pnpm analyze) y pase a import() diferido lo que no se usa al cargar.\n",
  );
  process.exit(1);
}
process.stdout.write(`\nPresupuesto cumplido en ${resultados.length} rutas.\n`);
