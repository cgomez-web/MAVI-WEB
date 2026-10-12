import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { sitio } from "@/content/sitio";

export const alt =
  "MAVI Proyectos e Inversiones — Facilitamos su avance. Alquiler de maquinaria y equipos en Envigado.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen Open Graph generada en build con las fuentes propias (instancias estáticas en app/og). */
export default async function ImagenOg() {
  const [display, mono] = await Promise.all([
    readFile(path.join(process.cwd(), "app/og/archivo-900-ancha.ttf")),
    readFile(path.join(process.cwd(), "app/og/martian-mono-500.ttf")),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0B0B0C",
        color: "#F4F1EA",
        padding: "64px 72px",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Martian",
          fontSize: 22,
          letterSpacing: 2,
          color: "#FCBF06",
        }}
      >
        ALQUILER DE MAQUINARIA Y EQUIPOS · ENVIGADO, ANTIOQUIA
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontFamily: "Archivo",
          lineHeight: 0.88,
        }}
      >
        <span style={{ fontSize: 132, letterSpacing: -5 }}>SU OBRA AVANZA.</span>
        <span style={{ fontSize: 132, letterSpacing: -5, color: "#FCBF06" }}>LA MOVEMOS.</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <span style={{ fontFamily: "Archivo", fontSize: 64 }}>MAVI</span>
        <span style={{ fontFamily: "Martian", fontSize: 22, color: "#A3A39E" }}>
          {`+15 AÑOS · ${sitio.lema.toUpperCase()}`}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 18,
          display: "flex",
          background: "repeating-linear-gradient(-45deg, #FCBF06 0 22px, #0B0B0C 22px 44px)",
        }}
      />
    </div>,
    {
      ...size,
      fonts: [
        { name: "Archivo", data: display, weight: 900, style: "normal" },
        { name: "Martian", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
