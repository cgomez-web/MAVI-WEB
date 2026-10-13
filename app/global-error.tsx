"use client";

import { sitio, textosSistema } from "@/content/sitio";

/** Último recurso si falla el layout raíz. Sin estilos externos ni detalles técnicos. */
export default function ErrorGlobal({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = textosSistema.errorGlobal;
  return (
    <html lang="es-CO">
      <head>
        <title>{`${t.titular} | ${sitio.nombreCorto}`}</title>
      </head>
      <body
        style={{
          background: "#0B0B0C",
          color: "#F4F1EA",
          fontFamily: "Arial, sans-serif",
          padding: "10vh 6vw",
        }}
      >
        <h1 style={{ fontSize: "2.5rem" }}>{t.titular}</h1>
        <p>{t.texto}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.9rem 1.4rem",
            background: "#FCBF06",
            color: "#0B0B0C",
            border: 0,
            fontWeight: 700,
          }}
        >
          {t.reintentar}
        </button>
      </body>
    </html>
  );
}
