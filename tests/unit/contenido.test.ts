import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lineasDeServicio } from "@/content/servicios";
import { serviciosFormulario } from "@/content/formulario";
import { contacto, correosPorEtiqueta, zonaDeServicioTexto } from "@/content/contacto";
import { fotosGaleria } from "@/content/galeria";
import { preguntasFrecuentes } from "@/content/faq";
import { politicaPrivacidad } from "@/content/legal";
import { detallesDeServicio, indiceServicios } from "@/content/servicios-detalle";
import { NUMERO_DE_LINEAS, home } from "@/content/home";
import { avisoPestanaNueva } from "@/content/navegacion";
import { paginas, sitio } from "@/content/sitio";
import generadas from "@/content/galeria.generated.json";
import { jsonLdNegocio } from "@/lib/jsonld";
import { VERSION_OG, analiticaSinCookies, franjaOg, metaPagina } from "@/lib/metadatos";

const RAIZ = path.resolve(__dirname, "../..");

function archivos(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) return archivos(p, ext);
    return ext.test(n) ? [p] : [];
  });
}

const fuentesDelSitio = [
  ...archivos(path.join(RAIZ, "content"), /\.(ts|json|md)$/),
  ...archivos(path.join(RAIZ, "components"), /\.tsx?$/),
  ...archivos(path.join(RAIZ, "app"), /\.(tsx?|css)$/),
].map((p) => ({ p, texto: readFileSync(p, "utf8") }));

/** Lo anterior más el código de servidor (lib/ y middleware.ts), que también pinta textos. */
const fuentesConLogica = [
  ...fuentesDelSitio,
  ...[...archivos(path.join(RAIZ, "lib"), /\.tsx?$/), path.join(RAIZ, "middleware.ts")].map(
    (p) => ({ p, texto: readFileSync(p, "utf8") }),
  ),
];

const relativa = (p: string) => path.relative(RAIZ, p).split(path.sep).join("/");

describe("contenido", () => {
  it("las líneas del formulario coinciden con las del brochure", () => {
    expect([...serviciosFormulario]).toEqual(lineasDeServicio.map((l) => l.nombre));
  });

  it("el contador de líneas del inicio coincide con las líneas reales", () => {
    expect(NUMERO_DE_LINEAS).toBe(lineasDeServicio.length);
    expect(home.confianza.some((c) => "valor" in c && c.valor === lineasDeServicio.length)).toBe(
      true,
    );
  });

  it("conserva los datos de contacto reales del brochure", () => {
    expect(contacto.telefono.visible).toBe("322 559 9325");
    expect(contacto.correos.map((c) => `${c.usuario}@${c.dominio}`)).toEqual([
      "maviproyectoseinversiones@gmail.com",
      "jorgemariovillamejia@gmail.com",
    ]);
    expect(contacto.direccion.linea).toBe("Cr 25 # 41B Sur 37");
    expect(contacto.instagram.usuario).toBe("maviproyectos");
  });

  it("los correos llevan rótulo y no llevan cargos inventados", () => {
    // Si el dueño confirma el área de cada correo (TODO(owner) en content/contacto.ts), ajuste aquí
    // la segunda expectativa: el área pasa a ser un dato real.
    for (const c of contacto.correos) {
      expect(c.etiqueta.trim()).not.toBe("");
      expect(c.etiqueta).not.toMatch(/comercial|gerencia/i);
    }
  });

  it("agrupa los correos por rótulo: cada correo queda bajo el suyo (#62)", () => {
    const a = { usuario: "a", dominio: "x.co", etiqueta: "Comercial" };
    const b = { usuario: "b", dominio: "x.co", etiqueta: "Gerencia" };
    const c = { usuario: "c", dominio: "x.co", etiqueta: "Comercial " };
    expect(correosPorEtiqueta([a, b, c])).toEqual([
      { etiqueta: "Comercial", correos: [a, c] },
      { etiqueta: "Gerencia", correos: [b] },
    ]);
    // Hoy los dos comparten rótulo: un solo <dt> con los dos correos debajo.
    expect(correosPorEtiqueta()).toEqual([
      { etiqueta: contacto.correos[0].etiqueta, correos: [...contacto.correos] },
    ]);
  });

  it("el pie y la tarjeta de Cotización ponen los correos bajo su propio rótulo (#62)", () => {
    for (const archivo of ["components/sections/Pie.tsx", "components/sections/Cotizacion.tsx"]) {
      const fuente = readFileSync(path.join(process.cwd(), archivo), "utf8");
      expect(fuente, archivo).toContain("correosPorEtiqueta()");
      expect(fuente, archivo).not.toMatch(/correos\[\d+\]\.etiqueta/);
    }
  });

  it("la zona de servicio se lee como frase con artículo", () => {
    expect(zonaDeServicioTexto()).toBe("Envigado, Medellín, el Valle de Aburrá y Antioquia");
    expect(indiceServicios.introduccion().match(/Envigado/g)).toHaveLength(1);
  });

  it("no contiene datos de relleno del mockup ni la errata del brochure", () => {
    const prohibidos = [
      /300 123 4567/,
      /info@mavi\.com\.co/i,
      /topogr[aá]fic/i,
      /formaltr[ií]a/i,
      /lorem ipsum/i,
    ];
    for (const { p, texto } of fuentesDelSitio) {
      for (const re of prohibidos)
        expect(re.test(texto), `${path.relative(RAIZ, p)} contiene ${re}`).toBe(false);
    }
  });

  it("no menciona en ninguna parte el nombre de la otra empresa que aparece en algunas fotos", () => {
    // Codificado para no escribir ese nombre en el repositorio (decisión del dueño, 2026-10-12).
    const palabras = ["QW5kYW1pb3M=", "QW3DqXJpY2E=", "QW1lcmljYQ=="].map((b) =>
      Buffer.from(b, "base64").toString("utf8"),
    );
    const patron = new RegExp(`${palabras[0]}\\s+(${palabras[1]}|${palabras[2]})`, "i");
    for (const { p, texto } of fuentesConLogica)
      expect(patron.test(texto), relativa(p)).toBe(false);
  });

  it("toda foto publicable tiene texto alternativo descriptivo y fue procesada", () => {
    for (const f of fotosGaleria.filter((x) => x.publicar)) {
      expect(f.alt.length, f.id).toBeGreaterThan(30);
      expect(
        generadas.some((g) => g.id === f.id),
        `${f.id} sin procesar: ejecute pnpm images`,
      ).toBe(true);
    }
  });

  it("la Formaletería está bien escrita en la línea 04", () => {
    expect(lineasDeServicio.find((l) => l.codigo === "04")?.nombre).toBe(
      "Encofrados y formaletería",
    );
  });

  it("el teléfono y la dirección solo se escriben en content/contacto.ts", () => {
    // El README promete que basta con editar content/contacto.ts: ninguna otra fuente puede llevar
    // una copia escrita a mano (meta description, FAQ, páginas de error, mensajes del formulario…).
    // Se ignoran los comentarios del código: ahí sí se puede citar el dato como ejemplo.
    const sinComentarios = (t: string) =>
      t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
    const copias = [/322\s?559\s?9325/, /3225599325/, /41\s?B\s+Sur/i];
    for (const { p, texto } of fuentesConLogica) {
      const r = relativa(p);
      if (r === "content/contacto.ts") continue;
      const limpio = sinComentarios(texto);
      for (const re of copias) expect(re.test(limpio), `${r} repite ${re}`).toBe(false);
    }
    // …pero el dato sí llega a donde se necesita.
    expect(preguntasFrecuentes.some((q) => q.respuesta.includes(contacto.telefono.visible))).toBe(
      true,
    );
    expect(paginas.contacto.descripcion).toContain(contacto.telefono.visible);
    expect(paginas.contacto.descripcion).toContain(contacto.direccion.linea);
  });

  it("el lema y los mensajes de WhatsApp no se escriben a mano en componentes ni rutas", () => {
    const vistas = fuentesDelSitio.filter(({ p }) => /^(app|components)\//.test(relativa(p)));
    for (const { p, texto } of vistas) {
      for (const dato of [
        sitio.lema,
        home.inventario.mensajeWhatsApp,
        contacto.whatsapp.mensajeGeneral,
      ])
        expect(texto.includes(dato), `${relativa(p)} repite «${dato}»`).toBe(false);
    }
  });

  it("todo enlace que abre otra pestaña lo avisa a los lectores de pantalla", () => {
    for (const { p, texto } of fuentesDelSitio.filter(({ p }) => p.endsWith(".tsx"))) {
      const pestanas = texto.match(/target="_blank"/g)?.length ?? 0;
      const avisos = texto.match(/\{avisoPestanaNueva\}/g)?.length ?? 0;
      expect(
        avisos,
        `${relativa(p)}: ${pestanas} target=_blank y ${avisos} avisos`,
      ).toBeGreaterThanOrEqual(pestanas);
    }
    expect(avisoPestanaNueva).toBe(" (se abre en una pestaña nueva)");
  });
});

describe("política de datos personales (Ley 1581 de 2012 y Decreto 1377 de 2013)", () => {
  const texto = JSON.stringify(politicaPrivacidad);

  it("no muestra textos provisionales", () => {
    expect(texto).not.toMatch(/TODO|owner|lorem/i);
  });

  it("identifica al responsable con domicilio, dirección, correo y teléfono", () => {
    const r = politicaPrivacidad.responsable;
    expect(r.nombre).toBe(sitio.nombre);
    expect(r.domicilio).toContain(contacto.direccion.ciudad);
    expect(r.direccion).toContain(contacto.direccion.linea);
    expect(r.correo).toBe(`${contacto.correos[0].usuario}@${contacto.correos[0].dominio}`);
    expect(r.telefono).toBe(contacto.telefono.visible);
  });

  it("incluye quién atiende, el procedimiento completo y la vigencia", () => {
    const titulos = politicaPrivacidad.secciones.map((s) => s.titulo).join(" | ");
    expect(titulos).toMatch(/Quién atiende/);
    expect(titulos).toMatch(/Procedimiento/);
    expect(titulos).toMatch(/Vigencia/);
    expect(texto).toMatch(/diez \(10\) días hábiles/);
    expect(texto).toMatch(/cinco \(5\) días hábiles adicionales/);
    expect(texto).toMatch(/quince \(15\) días hábiles/);
    expect(texto).toMatch(/ocho \(8\) días hábiles adicionales/);
    expect(texto).toMatch(/descripción de los hechos/);
    // Art. 15: los dos meses del desistimiento se cuentan desde el requerimiento, no desde el recibo.
    expect(texto).toMatch(/dos \(2\) meses desde ese requerimiento/);
    expect(texto).toMatch(/Revocatoria y supresión/);
    expect(texto).toMatch(/entra en vigencia el/);
    expect(texto).toMatch(/base de datos/);
  });
});

describe("metadatos para buscadores y redes", () => {
  it('los títulos caben en el resultado de Google con la plantilla "| MAVI"', () => {
    const sufijo = ` | ${sitio.nombreCorto}`;
    const titulos = [
      sitio.tituloInicio,
      ...lineasDeServicio.map((l) => l.seo.titulo + sufijo),
      ...Object.values(paginas).map((x) => x.titulo + sufijo),
    ];
    for (const t of titulos) expect(t.length, t).toBeLessThanOrEqual(65);
    expect(sitio.tituloInicio).toMatch(/Envigado/);
  });

  it("las descripciones no pasan de 160 caracteres", () => {
    for (const d of [sitio.descripcion, ...Object.values(paginas).map((x) => x.descripcion)])
      expect(d.length, d).toBeLessThanOrEqual(160);
    expect(sitio.descripcion.indexOf("Envigado")).toBeLessThan(120);
  });

  it("metaPagina conserva imagen, site_name y locale aunque la página declare openGraph", () => {
    const m = metaPagina({ titulo: "Contacto", descripcion: "Desc", ruta: "/contacto" });
    expect(m.alternates?.canonical).toBe("/contacto");
    expect(m.openGraph).toMatchObject({
      type: "website",
      locale: "es_CO",
      siteName: sitio.nombre,
      url: "/contacto",
      title: `Contacto | ${sitio.nombre}`,
    });
    // Con versión: WhatsApp y Facebook guardan la tarjeta por URL.
    expect(JSON.stringify(m.openGraph)).toContain(`/opengraph-image?v=${VERSION_OG}`);
    expect(m.twitter).toMatchObject({
      card: "summary_large_image",
      title: `Contacto | ${sitio.nombre}`,
    });
  });

  it("con imagen de segmento no declara images (si no, Next descarta el opengraph-image.tsx)", () => {
    const m = metaPagina({ titulo: "X", descripcion: "Y", ruta: "/x", imagen: "segmento" });
    expect(Object.prototype.hasOwnProperty.call(m.openGraph, "images")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(m.twitter, "images")).toBe(false);
  });

  it("sin ruta (404) no declara canonical ni og:url", () => {
    const m = metaPagina({ titulo: "Página no encontrada", descripcion: "Z" });
    expect(m.alternates?.canonical).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(m.openGraph, "url")).toBe(false);
  });

  it("la franja de la imagen OG se dibuja como SVG (no como degradado)", () => {
    const svg = Buffer.from(franjaOg().split(",")[1] ?? "", "base64").toString("utf8");
    expect(svg).toContain("<polygon");
    expect(svg).not.toContain("gradient");
  });

  it("el negocio en JSON-LD no inventa coordenadas ni rango de precios", () => {
    const n = jsonLdNegocio() as Record<string, unknown>;
    expect(n.hasMap).toMatch(/^https:\/\/www\.google\.com\/maps/);
    expect(n.priceRange).toBeUndefined();
    if (!contacto.direccion.geo) expect(n.geo).toBeUndefined();
  });
});

describe("analítica sin cookies", () => {
  it("solo se activa con las dos variables y un host https", () => {
    expect(analiticaSinCookies({})).toBeNull();
    expect(analiticaSinCookies({ NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "mavi.co" })).toBeNull();
    expect(analiticaSinCookies({ NEXT_PUBLIC_PLAUSIBLE_HOST: "https://plausible.io" })).toBeNull();
    expect(
      analiticaSinCookies({
        NEXT_PUBLIC_PLAUSIBLE_HOST: "http://plausible.io",
        NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "mavi.co",
      }),
    ).toBeNull();
    expect(
      analiticaSinCookies({
        NEXT_PUBLIC_PLAUSIBLE_HOST: "https://plausible.io/",
        NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "mavi.co",
      }),
    ).toEqual({ src: "https://plausible.io/js/script.js", dominio: "mavi.co" });
  });

  it("la política de datos solo la menciona si el layout la carga", () => {
    const menciona = JSON.stringify(politicaPrivacidad).includes("herramienta de estadísticas");
    expect(menciona).toBe(analiticaSinCookies() !== null);
  });
});

describe("fichas de servicio con texto propio", () => {
  it("cada línea tiene guía, datos para cotizar y preguntas", () => {
    for (const l of lineasDeServicio) {
      const d = detallesDeServicio[l.slug];
      expect(d, l.slug).toBeDefined();
      expect(d?.guia.pasos.length, l.slug).toBeGreaterThanOrEqual(3);
      expect(d?.datosParaCotizar.length, l.slug).toBeGreaterThanOrEqual(2);
      expect(d?.preguntas.length, l.slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("la guía solo cita equipos que existen en el brochure de esa línea", () => {
    for (const l of lineasDeServicio) {
      const nombres = new Set(l.equipos.map((e) => e.nombre));
      for (const paso of detallesDeServicio[l.slug]?.guia.pasos ?? [])
        for (const e of paso.equipos) expect(nombres.has(e), `${l.slug}: ${e}`).toBe(true);
    }
  });

  it("no introduce cifras que no estén en el brochure", () => {
    const delBrochure = new Set(JSON.stringify(lineasDeServicio).match(/\d+/g) ?? []);
    for (const [slug, d] of Object.entries(detallesDeServicio))
      for (const n of JSON.stringify(d).match(/\d+/g) ?? [])
        expect(delBrochure.has(n), `${slug} cita ${n}`).toBe(true);
  });

  it("no promete condiciones comerciales que el brochure no dice", () => {
    // "Incluye", "gratis", "sin costo"… se leen como condiciones del alquiler: solo las da el dueño.
    const condiciones = /\bincluy[ea]n?\b|gratis|sin costo|sin cargo|garantizad/i;
    for (const [slug, d] of Object.entries(detallesDeServicio))
      expect(JSON.stringify(d), slug).not.toMatch(condiciones);
  });
});
