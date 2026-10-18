/**
 * Genera public/brochure-mavi-proyectos-e-inversiones.pdf desde cero (reemplaza al brochure
 * escaneado, que era solo imágenes de baja resolución).
 *
 * - Texto vectorial con las fuentes del sitio (app/fonts): nítido a cualquier zoom y seleccionable.
 * - Logo e iconos en SVG (components/brand, components/icons).
 * - Contenido tomado de content/: los datos del PDF y del sitio no pueden diferir.
 * - Fotos: solo las publicadas de la bodega, ya procesadas (con parches y recortes aplicados).
 *
 * Uso:  node node_modules/tsx/dist/cli.mjs scripts/generar-brochure.mts
 * Requiere el Chromium de Playwright (pnpm exec playwright install chromium).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { chromium } from "@playwright/test";

import { contacto } from "@/content/contacto";
import { empresa } from "@/content/empresa";
import { fotosGaleria } from "@/content/galeria";
import type { IconoId } from "@/content/iconos";
import { lineasDeServicio, type LineaDeServicio } from "@/content/servicios";
import { sitio } from "@/content/sitio";

// tsconfig usa "jsx": "preserve" (lo compila Next); aquí tsx emite React.createElement clásico.
(globalThis as { React?: typeof React }).React = React;
const { IsotipoMavi, LogoCompleto, WordmarkMavi } = await import("@/components/brand/Logo");
const { Icono } = await import("@/components/icons/Icono");

const RAIZ = join(import.meta.dirname, "..");
const DESTINO = join(RAIZ, "public", "brochure-mavi-proyectos-e-inversiones.pdf");
const TEMPORAL = join(RAIZ, ".brochure-tmp");

interface FotoProcesada {
  id: string;
  ancho: number;
  alto: number;
  anchos: number[];
  version: string;
}
const procesadas: FotoProcesada[] = JSON.parse(
  readFileSync(join(RAIZ, "content", "galeria.generated.json"), "utf8"),
);

const esc = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const svg = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);
const icono = (id: IconoId) => svg(createElement(Icono, { id, className: "ico" }));
const fuente = (archivo: string) => pathToFileURL(join(RAIZ, "app", "fonts", archivo)).href;

/** Convierte la foto más grande a JPEG: Chromium incrusta el JPEG tal cual (sin recomprimir a PNG). */
async function fotoJpeg(id: string, fondo = false): Promise<string> {
  const p = procesadas.find((f) => f.id === id);
  if (!p) throw new Error(`Foto sin procesar: ${id}`);
  const ancho = Math.max(...p.anchos);
  return aJpeg(
    join(RAIZ, "public", "img", "bodega", `${id}-${ancho}.${p.version}.webp`),
    id,
    fondo,
  );
}

async function aJpeg(origen: string, id: string, fondo = false): Promise<string> {
  const salida = join(TEMPORAL, `${id}${fondo ? "-fondo" : ""}.jpg`);
  // El fondo de portada se oscurece aquí: un filtro CSS haría que Chromium rasterizara la página entera.
  const base = sharp(origen).resize({ width: 1400, withoutEnlargement: true });
  const imagen = fondo ? base.modulate({ brightness: 0.8, saturation: 0.9 }) : base;
  await imagen.jpeg({ quality: 72, progressive: true, mozjpeg: true }).toFile(salida);
  return pathToFileURL(salida).href;
}

/**
 * Las líneas sin fotos propias (maquinaria y transporte) llevan imágenes de referencia de Unsplash
 * (licencia libre, uso comercial), ya limpias de nombres de otras empresas: assets/referencia/CREDITOS.md.
 * Se rotulan como referencia en el PDF: no son la flota de MAVI.
 */
const REFERENCIAS: Record<string, Array<{ archivo: string; titulo: string }>> = {
  "maquinaria-pesada": [
    { archivo: "excavadora-01", titulo: "Excavadora" },
    { archivo: "retroexcavadora-01", titulo: "Retroexcavadora cargadora" },
    { archivo: "mini-excavadora-01", titulo: "Mini retroexcavadora" },
    { archivo: "minicargador-01", titulo: "Mini cargador" },
  ],
  "transporte-y-elevacion": [
    { archivo: "volqueta-01", titulo: "Volqueta" },
    { archivo: "grua-01", titulo: "Grúa" },
    { archivo: "camabaja-01", titulo: "Camabaja" },
    { archivo: "volqueta-02", titulo: "Volqueta en obra" },
  ],
};
const referencia = (archivo: string, fondo = false) =>
  aJpeg(join(RAIZ, "assets", "referencia", `${archivo}.jpg`), `ref-${archivo}`, fondo);

const publicadas = fotosGaleria.filter((f) => f.publicar);
const fotosDe = (l: LineaDeServicio) =>
  l.categoriaGaleria ? publicadas.filter((f) => f.categoria === l.categoriaGaleria) : [];

const telefono = contacto.telefono.visible;
const correos = contacto.correos.map((c) => `${c.usuario}@${c.dominio}`);
const web = sitio.urlPorDefecto.replace(/^https:\/\//, "");
const TOTAL = 3 + lineasDeServicio.length;

function pie(n: number, oscuro = false) {
  return `<footer class="pie ${oscuro ? "pie-oscuro" : ""}">
    <span class="pie-marca">${svg(createElement(IsotipoMavi, { className: "pie-iso" }))}${esc(sitio.nombre)}</span>
    <span>${esc(telefono)} · ${esc(web)}</span>
    <span class="folio">${String(n).padStart(2, "0")} / ${String(TOTAL).padStart(2, "0")}</span>
  </footer>`;
}

function portada(fondo: string) {
  const lineas = lineasDeServicio
    .map((l) => `<li>${icono(l.icono)}<span>${esc(l.nombre)}</span></li>`)
    .join("");
  return `<section class="hoja oscura portada">
    <div class="portada-foto" style="background-image:url('${fondo}')"></div>
    <div class="portada-velo"></div>
    <div class="franja-diagonal"></div>
    <div class="portada-cuerpo">
      <div class="portada-logo">${svg(createElement(LogoCompleto, { nombre: sitio.nombre, lema: sitio.lema, idTitulo: "logo-portada" }))}</div>
      <p class="antetitulo">Alquiler de maquinaria y equipos para construcción</p>
      <h1>Su obra avanza.<br><em>Nosotros la movemos.</em></h1>
      <div class="sello-anios"><b>+${sitio.experiencia.anios}</b><span>años de experiencia en construcción, infraestructura y desarrollo de proyectos</span></div>
    </div>
    <ul class="portada-lineas">${lineas}</ul>
    <div class="portada-base">
      <span>${esc(contacto.direccion.ciudad)}, ${esc(contacto.direccion.departamento)}</span>
      <span>WhatsApp ${esc(telefono)}</span>
      <span>${esc(web)}</span>
    </div>
  </section>`;
}

function nosotros() {
  const valores = empresa.valores
    .map(
      (v, i) =>
        `<div class="valor"><span class="num">0${i + 1}</span><h3>${esc(v.nombre)}</h3><p>${esc(v.texto)}</p></div>`,
    )
    .join("");
  const indice = lineasDeServicio
    .map(
      (l, i) =>
        `<li><span class="num">${esc(l.codigo)}</span>${icono(l.icono)}<div><b>${esc(l.nombre)}</b><small>${esc(l.subtitulo)}</small></div><span class="pag">pág. ${String(i + 3).padStart(2, "0")}</span></li>`,
    )
    .join("");
  return `<section class="hoja clara">
    <header class="cabeza"><span class="etiqueta">Quiénes somos</span></header>
    <h2 class="titulo-grande">${esc(empresa.solucionesIntegrales.titulo)}</h2>
    <p class="entrada">${esc(empresa.presentacion)}</p>
    <p>${esc(empresa.solucionesIntegrales.texto)}</p>
    <div class="valores">${valores}</div>
    <div class="mv">
      <div><h3>Misión</h3><p>${esc(empresa.mision)}</p></div>
      <div><h3>Visión</h3><p>${esc(empresa.vision)}</p></div>
    </div>
    <h3 class="sub">Seis líneas de servicio</h3>
    <ol class="indice">${indice}</ol>
    <blockquote class="compromiso">${esc(empresa.compromiso)}</blockquote>
    ${pie(2)}
  </section>`;
}

function cifra(l: LineaDeServicio) {
  if (l.cifra.tipo === "cifra")
    return `<div class="cifra"><b>${l.cifra.prefijo ?? ""}${l.cifra.valor}<small>${esc(l.cifra.unidad)}</small></b><span>${esc(l.cifra.etiqueta)}</span></div>`;
  return `<div class="cifra cifra-texto"><b>${esc(l.cifra.texto)}</b><span>${esc(l.cifra.etiqueta)}</span></div>`;
}

function linea(
  l: LineaDeServicio,
  n: number,
  fotos: Array<{ url: string; titulo: string }>,
  deReferencia: boolean,
) {
  const oscura = n % 2 === 1;
  const equipos = l.equipos
    .map(
      (e) =>
        `<article class="equipo">${icono(e.icono)}<div><h3>${esc(e.nombre)}</h3>${e.rango ? `<p class="rango">${esc(e.rango)}</p>` : ""}<p>${esc(e.descripcion)}</p></div></article>`,
    )
    .join("");
  const galeria = fotos.length
    ? `<div class="fotos fotos-${Math.min(fotos.length, 4)}">${fotos
        .slice(0, 4)
        .map(
          (f) =>
            `<figure><img src="${f.url}" alt=""><figcaption>${esc(f.titulo)}</figcaption></figure>`,
        )
        .join(
          "",
        )}</div><p class="nota-fotos">${deReferencia ? "Imágenes de referencia." : "Fotos reales de nuestro inventario."}</p>`
    : `<div class="icono-gigante">${icono(l.icono)}</div>`;
  const atributos = l.atributos?.length
    ? `<ul class="atributos">${l.atributos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`
    : "";
  return `<section class="hoja ${oscura ? "oscura" : "clara"} linea">
    <header class="cabeza"><span class="etiqueta">Línea ${esc(l.codigo)}</span><span class="codigo-fondo">${esc(l.codigo)}</span></header>
    <h2 class="titulo-grande">${esc(l.nombre)}</h2>
    <p class="entrada">${esc(l.subtitulo)}</p>
    <div class="fila-cifra">${cifra(l)}${atributos}</div>
    <div class="equipos equipos-${l.equipos.length > 4 ? 3 : 2}">${equipos}</div>
    ${galeria}
    ${l.frase ? `<p class="frase">${esc(l.frase)}</p>` : ""}
    ${pie(n, oscura)}
  </section>`;
}

function contactoFinal() {
  const datos = [
    ["WhatsApp y celular", telefono],
    ...correos.map((c) => ["Correo", c] as const),
    [
      "Dirección",
      `${contacto.direccion.linea}, ${contacto.direccion.ciudad}, ${contacto.direccion.departamento}`,
    ],
    ["Instagram", `@${contacto.instagram.usuario}`],
    ["Sitio web", web],
  ]
    .map(([k, v]) => `<div class="dato"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("");
  return `<section class="hoja amarilla contacto">
    <div class="contacto-logo">${svg(createElement(WordmarkMavi, { className: "wordmark", tono: "tinta" }))}</div>
    <p class="antetitulo">${esc(sitio.frases.atencion)}</p>
    <h2 class="titulo-grande">¡Contáctenos!</h2>
    <p class="entrada">Cuéntenos qué necesita su obra y le enviamos la cotización. La forma más rápida es por WhatsApp.</p>
    <dl class="datos">${datos}</dl>
    <div class="zona"><h3>Zona de servicio</h3><p>${contacto.zonaDeServicio.map(esc).join(" · ")}</p></div>
    <p class="cierre">${esc(empresa.cierre)}</p>
    <p class="nota-fotos">Portada y fotos de maquinaria y transporte: imágenes de referencia.</p>
    <div class="contacto-iso">${svg(createElement(IsotipoMavi, {}))}</div>
    ${pie(TOTAL)}
  </section>`;
}

const CSS = `
@font-face{font-family:Archivo;src:url('${fuente("archivo-var.woff2")}') format('woff2');font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:Hanken;src:url('${fuente("hanken-grotesk-var.woff2")}') format('woff2');font-weight:100 900}
@font-face{font-family:Martian;src:url('${fuente("martian-mono-var.woff2")}') format('woff2');font-weight:100 800;font-stretch:75% 112.5%}
:root{--color-ink:#0b0b0c;--color-ink-2:#151517;--color-ink-3:#1f1f22;--color-line:#2c2c30;--color-brand-yellow:#fcbf06;--color-bone:#f4f1ea;--color-bone-2:#e9e4d8;--color-concrete:#8a8a85;--font-display:Archivo,sans-serif;--font-hanken:Hanken,sans-serif}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Hanken,sans-serif;font-size:10.5pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hoja{width:210mm;height:297mm;position:relative;overflow:hidden;padding:18mm 16mm 22mm;page-break-after:always;display:flex;flex-direction:column}
.hoja:last-child{page-break-after:auto}
.oscura{background:var(--color-ink);color:var(--color-bone)}
.clara{background:var(--color-bone);color:var(--color-ink)}
.amarilla{background:var(--color-brand-yellow);color:var(--color-ink)}
.ico{width:100%;height:100%}
h1,h2,h3,.titulo-grande{font-family:Archivo,sans-serif;font-weight:900;font-stretch:80%;text-transform:uppercase;line-height:.95;letter-spacing:-.01em}
.antetitulo,.etiqueta,.num,.folio,.pag,.rango,dt,figcaption,.pie{font-family:Martian,monospace;text-transform:uppercase;letter-spacing:.08em;font-size:7.5pt}
.etiqueta{display:inline-block;background:var(--color-brand-yellow);color:var(--color-ink);padding:1.5mm 3mm;font-weight:700}
.cabeza{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm}
.codigo-fondo{font-family:Archivo;font-weight:900;font-stretch:70%;font-size:120pt;line-height:.75;position:absolute;right:12mm;top:10mm;opacity:.08}
.titulo-grande{font-size:40pt;margin-bottom:4mm}
.entrada{font-size:13.5pt;line-height:1.35;font-weight:500;margin-bottom:5mm;max-width:160mm}
.sub{font-size:15pt;margin:7mm 0 3mm}
/* Portada */
.portada{padding:0}
.portada-foto{position:absolute;inset:0;background-size:cover;background-position:70% 0;height:62%}
.portada-velo{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,12,.25) 0%,rgba(11,11,12,.55) 30%,rgba(11,11,12,.9) 62%,#0b0b0c 80%)}
.franja-diagonal{position:absolute;left:-20mm;right:-20mm;bottom:58mm;height:14mm;background:repeating-linear-gradient(-45deg,var(--color-brand-yellow) 0 9mm,var(--color-ink) 9mm 18mm);transform:rotate(-4deg);opacity:.95}
.portada-cuerpo{position:relative;padding:16mm 16mm 0;flex:1}
.portada-logo{width:78mm;height:78mm;margin-bottom:8mm}
.portada-logo svg{width:100%;height:100%}
.portada .antetitulo{color:var(--color-brand-yellow);font-size:8.5pt;margin-bottom:4mm}
.portada h1{font-size:50pt;margin-bottom:8mm}
.portada h1 em{font-style:normal;color:var(--color-brand-yellow)}
.sello-anios{display:flex;align-items:center;gap:5mm;border-left:2mm solid var(--color-brand-yellow);padding-left:5mm;max-width:130mm}
.sello-anios b{font-family:Archivo;font-weight:900;font-stretch:75%;font-size:46pt;line-height:1;color:var(--color-brand-yellow)}
.sello-anios span{font-size:11pt;line-height:1.3}
.portada-lineas{position:relative;list-style:none;display:grid;grid-template-columns:repeat(6,1fr);gap:2mm;padding:0 16mm;margin-bottom:26mm}
.portada-lineas li{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2mm;font-size:7.5pt;font-weight:700;line-height:1.15}
.portada-lineas .ico{width:13mm;height:13mm;color:var(--color-brand-yellow)}
.portada-base{position:relative;background:var(--color-brand-yellow);color:var(--color-ink);display:flex;justify-content:space-between;padding:5mm 16mm;font-family:Martian;font-weight:700;font-size:8.5pt;text-transform:uppercase;letter-spacing:.05em}
/* Nosotros */
.valores{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:5mm 0}
.valor{background:var(--color-ink);color:var(--color-bone);padding:4mm;border-top:1.5mm solid var(--color-brand-yellow)}
.valor .num{color:var(--color-brand-yellow)}
.valor h3{font-size:14pt;margin:1.5mm 0}
.valor p{font-size:9pt;line-height:1.3}
.mv{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.mv h3{font-size:13pt;margin-bottom:1.5mm;border-bottom:.5mm solid var(--color-ink);padding-bottom:1mm}
.mv p{font-size:9.5pt}
.indice{list-style:none;border-top:.4mm solid var(--color-ink)}
.indice li{display:grid;grid-template-columns:9mm 9mm 1fr auto;align-items:center;gap:3mm;padding:1.4mm 0;border-bottom:.3mm solid #c9c4b8}
.indice .ico{width:8mm;height:8mm}
.indice b{display:block;font-family:Archivo;font-weight:800;font-stretch:85%;text-transform:uppercase;font-size:11pt}
.indice small{font-size:8.5pt;color:#55534d}
.compromiso{margin-top:auto;margin-bottom:2mm;background:var(--color-brand-yellow);padding:5mm 6mm;font-family:Archivo;font-weight:800;font-stretch:90%;font-size:13pt;line-height:1.2}
/* Líneas */
.fila-cifra{display:flex;align-items:flex-end;justify-content:space-between;gap:6mm;margin-bottom:6mm}
.cifra{border-left:2mm solid var(--color-brand-yellow);padding-left:4mm}
.cifra b{display:block;font-family:Archivo;font-weight:900;font-stretch:72%;font-size:60pt;line-height:.9;color:var(--color-brand-yellow)}
.clara .cifra b{color:var(--color-ink)}
.cifra b small{font-size:26pt;margin-left:2mm}
.cifra-texto b{font-size:22pt;line-height:1.05;max-width:120mm}
.cifra span{font-family:Martian;font-size:7.5pt;text-transform:uppercase;letter-spacing:.08em;opacity:.75}
.atributos{list-style:none;display:flex;gap:2mm}
.atributos li{border:.4mm solid currentColor;padding:1.2mm 3mm;font-family:Martian;font-size:7pt;text-transform:uppercase;letter-spacing:.06em}
.equipos{display:grid;gap:3mm}
.equipos-2{grid-template-columns:1fr 1fr}
.equipos-3{grid-template-columns:1fr 1fr 1fr}
.equipo{display:flex;gap:3mm;padding:4mm;border:.4mm solid var(--color-line)}
.clara .equipo{border-color:#c9c4b8;background:#fbf9f4}
.oscura .equipo{background:var(--color-ink-2)}
.equipo .ico{flex:none;width:11mm;height:11mm;color:var(--color-brand-yellow)}
.clara .equipo .ico{color:var(--color-ink)}
.equipo h3{font-size:12pt;margin-bottom:1mm}
.equipo .rango{font-weight:700;color:var(--color-brand-yellow);font-size:8.5pt;margin-bottom:1mm}
.clara .equipo .rango{color:#8a6500}
.equipo p{font-size:9pt;line-height:1.3}
.fotos{display:grid;gap:3mm;margin-top:6mm;flex:1;min-height:0}
.fotos-1{grid-template-columns:1fr}
.fotos-2{grid-template-columns:1fr 1fr}
.fotos-3{grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr}
.fotos-3 figure:first-child{grid-row:span 2}
.fotos-4{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}
figure{position:relative;overflow:hidden;min-height:0;background:var(--color-ink-3)}
figure img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
figcaption{position:absolute;left:0;bottom:0;background:var(--color-ink);color:var(--color-bone);padding:1.2mm 2.5mm;font-size:6.5pt}
.nota-fotos{font-size:7.5pt;opacity:.65;margin-top:1.5mm}
.icono-gigante{flex:1;display:flex;align-items:center;justify-content:center;opacity:.9;margin-top:4mm}
.icono-gigante .ico{width:95mm;height:95mm;color:var(--color-brand-yellow);stroke-width:2}
.clara .icono-gigante .ico{color:var(--color-ink)}
.frase{font-family:Archivo;font-weight:900;font-stretch:85%;text-transform:uppercase;font-size:18pt;line-height:1.05;margin-top:5mm;color:var(--color-brand-yellow)}
.clara .frase{color:var(--color-ink);border-left:2mm solid var(--color-brand-yellow);padding-left:4mm}
/* Contacto */
.contacto-logo .wordmark{width:70mm;height:auto;margin-bottom:10mm}
.contacto .titulo-grande{font-size:58pt}
.datos{margin:4mm 0 8mm;border-top:.6mm solid var(--color-ink)}
.dato{display:grid;grid-template-columns:45mm 1fr;padding:3.5mm 0;border-bottom:.3mm solid rgba(11,11,12,.35);align-items:baseline}
.dato dd{font-family:Archivo;font-weight:800;font-stretch:90%;font-size:16pt;line-height:1.1;word-break:break-word}
.dato:first-child dd{font-size:30pt;font-stretch:80%}
.zona h3{font-size:12pt;margin-bottom:1mm}
.cierre{margin-top:auto;font-family:Archivo;font-weight:900;font-stretch:80%;text-transform:uppercase;font-size:24pt}
.contacto-iso{position:absolute;right:-30mm;bottom:-10mm;width:120mm;height:120mm;opacity:.12}
.contacto-iso svg{width:100%;height:100%}
/* Pie */
.pie{position:absolute;left:16mm;right:16mm;bottom:8mm;display:flex;justify-content:space-between;align-items:center;font-size:6.5pt;border-top:.3mm solid currentColor;padding-top:2.5mm;opacity:.8}
.pie-marca{display:flex;align-items:center;gap:2mm}
.pie-iso{width:5mm;height:5mm}
.portada .pie{display:none}
`;

async function main() {
  mkdirSync(TEMPORAL, { recursive: true });
  const fondo = await referencia("excavadora-02", true);
  const paginas = [portada(fondo), nosotros()];
  for (const [i, l] of lineasDeServicio.entries()) {
    const refs = REFERENCIAS[l.slug];
    const fotos = refs
      ? await Promise.all(
          refs.map(async (r) => ({ url: await referencia(r.archivo), titulo: r.titulo })),
        )
      : await Promise.all(
          fotosDe(l)
            .slice(0, 4)
            .map(async (f) => ({ url: await fotoJpeg(f.id), titulo: f.titulo })),
        );
    paginas.push(linea(l, i + 3, fotos, Boolean(refs)));
  }
  paginas.push(contactoFinal());

  const html = `<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><title>Brochure ${esc(sitio.nombre)}</title><style>${CSS}</style></head><body>${paginas.join("")}</body></html>`;
  const archivoHtml = join(TEMPORAL, "brochure.html");
  writeFileSync(archivoHtml, html);

  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  await pagina.goto(pathToFileURL(archivoHtml).href, { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({ path: DESTINO, format: "A4", printBackground: true, preferCSSPageSize: true });
  await navegador.close();
  console.log(`Brochure generado: ${DESTINO}`);
}

void main();
