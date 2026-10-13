import { ImageResponse } from "next/og";
import { home } from "@/content/home";
import { sitio } from "@/content/sitio";
import { ALT_OG_GENERAL, COLOR_OG, TAMANO_OG, franjaOg, fuentesOg } from "@/lib/metadatos";

export const alt = ALT_OG_GENERAL;
export const size = TAMANO_OG;
export const contentType = "image/png";

/**
 * Imagen para compartir del sitio (WhatsApp, Facebook, LinkedIn). Textos tomados del hero
 * (content/home.ts) para que la tarjeta diga lo mismo que la portada. Medidas pensadas para que
 * nada se monte: el titular va a 92 px y se parte por palabras dentro del ancho útil (1056 px).
 */
export default async function ImagenOg() {
  const fuentes = await fuentesOg();
  const [linea1 = "", linea2 = ""] = home.hero.titular;

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
        {home.hero.eyebrow.toUpperCase()}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
          fontFamily: "Archivo",
          fontSize: 92,
          lineHeight: 0.9,
          letterSpacing: -3,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap" }}>{linea1.toUpperCase()}</div>
        <div style={{ display: "flex", flexWrap: "wrap", color: COLOR_OG.amarillo, marginTop: 8 }}>
          {linea2.toUpperCase()}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: "Archivo", fontSize: 60, lineHeight: 1, letterSpacing: -1 }}>
            {sitio.nombreCorto}
          </span>
          <span
            style={{
              fontFamily: "Martian",
              fontSize: 16,
              letterSpacing: 2,
              color: COLOR_OG.concretoClaro,
              marginTop: 8,
            }}
          >
            {sitio.nombre.replace(sitio.nombreCorto, "").trim().toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontFamily: "Martian", fontSize: 19, color: COLOR_OG.concretoClaro }}>
            {home.hero.ficha.join(" · ").toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: "Martian",
              fontSize: 19,
              color: COLOR_OG.amarillo,
              marginTop: 8,
            }}
          >
            {sitio.lema.toUpperCase()}
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
    { ...size, fonts: fuentes },
  );
}
