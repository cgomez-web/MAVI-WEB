/**
 * Pipeline reproducible de las fotos de bodega.
 *
 *   pnpm images                       (lee los originales de la carpeta superior)
 *   MAVI_ASSETS_DIR=/ruta pnpm images (otra carpeta de originales)
 *
 * Para cada foto publicable de content/galeria.ts:
 *  1. Aplica los parches (coordenadas del original): el área se reconstruye interpolando los píxeles
 *     del borde (relleno tipo Coons) + grano, de modo que el contenido original queda destruido —no
 *     difuminado— y no puede recuperarse. Así se eliminan rótulos de otra empresa y datos personales.
 *  2. Aplica el recorte.
 *  3. Exporta AVIF y WebP en varios anchos (sin ampliar nunca el original) SIN metadatos.
 *  4. Genera un LQIP WebP diminuto en base64.
 *  5. Escribe content/galeria.generated.json y una hoja de verificación en docs/img/.
 *
 * Los originales nunca se modifican.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fotosGaleria, type FotoGaleria, type Rect } from "../content/galeria";

const RAIZ = path.resolve(import.meta.dirname, "..");
const ORIGENES = path.resolve(process.env.MAVI_ASSETS_DIR ?? path.join(RAIZ, ".."));
const SALIDA = path.join(RAIZ, "public", "img", "bodega");
const MANIFIESTO = path.join(RAIZ, "content", "galeria.generated.json");
const HOJA = path.join(RAIZ, "docs", "img", "verificacion-galeria.jpg");

const ANCHOS = [480, 800, 1280] as const;
const BORDE = 3; // píxeles de muestreo fuera del parche
const FUNDIDO = 3; // píxeles de transición en el contorno del parche

export interface ImagenGenerada {
  id: string;
  ancho: number;
  alto: number;
  anchos: number[];
  lqip: string;
}

/** PRNG determinista (mulberry32) para que el grano sea reproducible. */
function prng(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function semillaDe(texto: string): number {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

type RGB = [number, number, number];

/** Promedio de una ventana de píxeles (recortada a los límites de la imagen). */
function promedio(
  px: Buffer,
  ancho: number,
  alto: number,
  canales: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): RGB {
  const suma: RGB = [0, 0, 0];
  let n = 0;
  for (let y = Math.max(0, y0); y <= Math.min(alto - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(ancho - 1, x1); x++) {
      const i = (y * ancho + x) * canales;
      suma[0] += px[i] ?? 0;
      suma[1] += px[i + 1] ?? 0;
      suma[2] += px[i + 2] ?? 0;
      n++;
    }
  }
  return n === 0 ? [0, 0, 0] : [suma[0] / n, suma[1] / n, suma[2] / n];
}

/**
 * Reconstruye el rectángulo a partir de sus cuatro bordes (interpolación bilineal de los contornos)
 * y añade grano. Modifica `px` en sitio.
 */
function aplicarParche(px: Buffer, ancho: number, alto: number, canales: number, r: Rect, azar: () => number) {
  const { x, y, ancho: w, alto: h } = r;
  const sup: RGB[] = [];
  const inf: RGB[] = [];
  const izq: RGB[] = [];
  const der: RGB[] = [];
  for (let i = 0; i < w; i++) {
    sup.push(promedio(px, ancho, alto, canales, x + i - 2, y - BORDE, x + i + 2, y - 1));
    inf.push(promedio(px, ancho, alto, canales, x + i - 2, y + h, x + i + 2, y + h + BORDE - 1));
  }
  for (let j = 0; j < h; j++) {
    izq.push(promedio(px, ancho, alto, canales, x - BORDE, y + j - 2, x - 1, y + j + 2));
    der.push(promedio(px, ancho, alto, canales, x + w, y + j - 2, x + w + BORDE - 1, y + j + 2));
  }
  for (let j = 0; j < h; j++) {
    const py = y + j;
    if (py < 0 || py >= alto) continue;
    const v = h > 1 ? j / (h - 1) : 0;
    for (let i = 0; i < w; i++) {
      const pxX = x + i;
      if (pxX < 0 || pxX >= ancho) continue;
      const u = w > 1 ? i / (w - 1) : 0;
      const a = izq[j]!;
      const b = der[j]!;
      const c = sup[i]!;
      const d = inf[i]!;
      const grano = (azar() - 0.5) * 14;
      // Distancia al contorno para fundir 3 px con el original (evita un borde recto visible).
      const dist = Math.min(i, j, w - 1 - i, h - 1 - j);
      const alfa = dist >= FUNDIDO ? 1 : (dist + 1) / (FUNDIDO + 1);
      const k = (py * ancho + pxX) * canales;
      for (let ch = 0; ch < 3; ch++) {
        const relleno = ((1 - u) * a[ch]! + u * b[ch]! + (1 - v) * c[ch]! + v * d[ch]!) / 2 + grano;
        const original = px[k + ch] ?? 0;
        px[k + ch] = Math.max(0, Math.min(255, Math.round(alfa * relleno + (1 - alfa) * original)));
      }
    }
  }
}

async function procesar(foto: FotoGaleria): Promise<ImagenGenerada> {
  const origen = path.join(ORIGENES, foto.original);
  if (!existsSync(origen)) throw new Error(`No existe el original ${origen}`);

  // rotate() aplica la orientación EXIF y la descarta; luego se trabaja en crudo.
  const { data, info } = await sharp(origen).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const azar = prng(semillaDe(foto.id));
  for (const parche of foto.parches ?? []) aplicarParche(data, info.width, info.height, info.channels, parche, azar);

  let base = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
  let ancho = info.width;
  let alto = info.height;
  if (foto.recorte) {
    const { x, y, ancho: w, alto: h } = foto.recorte;
    base = base.extract({ left: x, top: y, width: w, height: h });
    ancho = w;
    alto = h;
  }
  // Se materializa una sola vez para reutilizarlo en todas las salidas.
  const maestro = await base.png().toBuffer();

  const mayor = ANCHOS[ANCHOS.length - 1] ?? ancho;
  const anchos: number[] = ANCHOS.filter((a) => a <= ancho);
  // Si el original es más angosto que el mayor objetivo, también se publica a su ancho real.
  if (ancho < mayor && anchos[anchos.length - 1] !== ancho) anchos.push(ancho);
  const unicos = [...new Set(anchos)].sort((p, q) => p - q);

  for (const a of unicos) {
    const redim = sharp(maestro).resize({ width: a, withoutEnlargement: true });
    // sharp no copia metadatos (EXIF/XMP/ICC) salvo que se pida con withMetadata(): se omite a propósito.
    await redim.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(SALIDA, `${foto.id}-${a}.avif`));
    await redim.clone().webp({ quality: 74, effort: 6 }).toFile(path.join(SALIDA, `${foto.id}-${a}.webp`));
  }

  const lqipBuf = await sharp(maestro).resize({ width: 16 }).blur(0.6).webp({ quality: 32 }).toBuffer();
  return {
    id: foto.id,
    ancho,
    alto,
    anchos: unicos,
    lqip: `data:image/webp;base64,${lqipBuf.toString("base64")}`,
  };
}

/** Hoja de contacto para revisión visual (parches y recortes). */
async function hojaDeVerificacion(generadas: ImagenGenerada[]) {
  const celda = 360;
  const columnas = 5;
  const filas = Math.ceil(generadas.length / columnas);
  const piezas = await Promise.all(
    generadas.map(async (g, n) => {
      const archivo = path.join(SALIDA, `${g.id}-${g.anchos[g.anchos.length - 1]}.webp`);
      const input = await sharp(archivo)
        .resize({ width: celda - 8, height: celda - 8, fit: "inside" })
        .toBuffer();
      return { input, left: (n % columnas) * celda + 4, top: Math.floor(n / columnas) * celda + 4 };
    }),
  );
  await mkdir(path.dirname(HOJA), { recursive: true });
  await sharp({
    create: { width: columnas * celda, height: filas * celda, channels: 3, background: "#0B0B0C" },
  })
    .composite(piezas)
    .jpeg({ quality: 80 })
    .toFile(HOJA);
}

async function main() {
  await mkdir(SALIDA, { recursive: true });
  for (const f of await readdir(SALIDA)) await rm(path.join(SALIDA, f));

  const publicables = fotosGaleria.filter((f) => f.publicar);
  const generadas: ImagenGenerada[] = [];
  for (const foto of publicables) {
    generadas.push(await procesar(foto));
    process.stdout.write(`✓ ${foto.id}\n`);
  }
  await writeFile(MANIFIESTO, `${JSON.stringify(generadas, null, 2)}\n`, "utf8");
  await hojaDeVerificacion(generadas);
  process.stdout.write(`\n${generadas.length} fotos → ${path.relative(RAIZ, SALIDA)}\n`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
