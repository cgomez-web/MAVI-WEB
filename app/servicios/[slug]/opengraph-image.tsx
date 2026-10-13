import { ImageResponse } from "next/og";
import { contacto } from "@/content/contacto";
import { lineaPorSlug, type LineaDeServicio } from "@/content/servicios";
import { sitio } from "@/content/sitio";
import { textosFichaServicio } from "@/content/servicios-detalle";
import { textosPie } from "@/content/interfaz";
import { COLOR_OG, TAMANO_OG, franjaOg, fuentesOg } from "@/lib/metadatos";

export const contentType = "image/png";

/** "330 HP" cuando el brochure da la cifra; si no, su dato textual ("Fachada y en torre"). */
function textoCifra(linea: LineaDeServicio): string {
  const c = linea.cifra;
  return c.tipo === "cifra" ? `${c.prefijo ?? ""}${c.valor} ${c.unidad}` : c.texto;
}

/** Una imagen por línea, con su propio texto alternativo (la URL queda en …/opengraph-image/ficha). */
export async function generateImageMetadata({ params }: { params: { slug: string } }) {
  const linea = lineaPorSlug(params.slug);
  if (!linea) return [];
  return [
    {
      id: "ficha",
      size: TAMANO_OG,
      contentType,
      alt: `${sitio.nombre} — ${linea.seo.h1}. ${linea.cifra.etiqueta}: ${textoCifra(linea)}.`,
    },
  ];
}

/** El titular baja de tamaño según su largo para quedar en 2–3 renglones sin montarse. */
function tamanoTitular(texto: string): number {
  if (texto.length <= 34) return 84;
  if (texto.length <= 52) return 70;
  return 60;
}

export default async function ImagenOgServicio({ params }: { params: { slug: string } }) {
  const linea = lineaPorSlug(params.slug);
  if (!linea) return new Response("No encontrada", { status: 404 });

  const fuentes = await fuentesOg();
  const titular = linea.seo.h1.toUpperCase();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: COLOR_OG.ink,
        color: COLOR_OG.hueso,
        padding: "56px 72px 74px",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Martian",
          fontSize: 19,
          letterSpacing: 1,
          color: COLOR_OG.amarillo,
        }}
      >
        {`${textosFichaServicio.linea.toUpperCase()} ${linea.codigo} · ${linea.nombre.toUpperCase()}`}
      </div>

      <div
        style={{
          display: "flex",
          flexGrow: 1,
          alignItems: "center",
          fontFamily: "Archivo",
          fontSize: tamanoTitular(titular),
          lineHeight: 0.92,
          letterSpacing: -2,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 1056 }}>{titular}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
          <span
            style={{
              fontFamily: "Archivo",
              // Una cifra ("330 HP") va grande; un dato textual del brochure, más contenido.
              fontSize: linea.cifra.tipo === "cifra" ? 64 : 26,
              lineHeight: 1,
              letterSpacing: linea.cifra.tipo === "cifra" ? -2 : -0.5,
              color: COLOR_OG.amarillo,
            }}
          >
            {linea.cifra.tipo === "cifra" ? textoCifra(linea) : textoCifra(linea).toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: "Martian",
              fontSize: 17,
              letterSpacing: 1,
              color: COLOR_OG.concretoClaro,
              marginTop: 10,
            }}
          >
            {linea.cifra.etiqueta.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontFamily: "Archivo", fontSize: 44, lineHeight: 1, letterSpacing: -1 }}>
            {sitio.nombreCorto}
          </span>
          <span
            style={{
              fontFamily: "Martian",
              fontSize: 17,
              letterSpacing: 1,
              color: COLOR_OG.concretoClaro,
              marginTop: 8,
            }}
          >
            {`${textosPie.whatsapp.toUpperCase()} ${contacto.telefono.visible}`}
          </span>
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- Satori solo acepta <img>. */}
      <img
        src={franjaOg()}
        width={TAMANO_OG.width}
        height={18}
        alt=""
        style={{ position: "absolute", left: 0, bottom: 0 }}
      />
    </div>,
    { ...TAMANO_OG, fonts: fuentes },
  );
}
