"use client";

/** Último recurso si falla el layout raíz. Sin estilos externos ni detalles técnicos. */
export default function ErrorGlobal({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-CO">
      <body
        style={{
          background: "#0B0B0C",
          color: "#F4F1EA",
          fontFamily: "Arial, sans-serif",
          padding: "10vh 6vw",
        }}
      >
        <h1 style={{ fontSize: "2.5rem" }}>Algo salió mal</h1>
        <p>Intente de nuevo en unos segundos o escríbanos por WhatsApp al 322 559 9325.</p>
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
          Reintentar
        </button>
      </body>
    </html>
  );
}
