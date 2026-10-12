"use client";

import Link from "next/link";
import { urlWhatsApp } from "@/content/contacto";

/** Error de página: mensaje genérico, sin detalles técnicos (no se filtra la traza al visitante). */
export default function ErrorDePagina({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      className="flex min-h-[80svh] items-end pt-[calc(var(--header-h)+4rem)] pb-20"
      aria-labelledby="titulo-error"
    >
      <div className="reticula w-full gap-y-6">
        <p className="cifras text-figure text-brand-yellow col-span-12 leading-none font-bold">
          500
        </p>
        <h1
          id="titulo-error"
          className="text-4 col-span-12 uppercase [font-stretch:85%] md:col-span-8"
        >
          Algo se trabó en la obra
        </h1>
        <p className="text-2 text-concrete-light col-span-12 max-w-[48ch] md:col-span-6">
          Intente de nuevo. Si necesita cotizar ya, escríbanos por WhatsApp.
        </p>
        <div className="col-span-12 flex flex-wrap gap-4">
          <button type="button" onClick={reset} className="boton boton-primario">
            Reintentar
          </button>
          <a
            href={urlWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-secundario"
          >
            WhatsApp
          </a>
          <Link href="/" className="boton boton-secundario">
            Inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
