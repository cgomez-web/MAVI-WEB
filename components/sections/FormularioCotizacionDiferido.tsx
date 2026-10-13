"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { textosFormulario } from "@/content/formulario";
import { urlWhatsApp } from "@/content/contacto";
import { avisoPestanaNueva } from "@/content/navegacion";

const t = textosFormulario;

/** Distancia (por encima y por debajo de la pantalla) a la que se empieza a descargar el formulario. */
const MARGEN_DE_CARGA = "1000px 0px";
/** Si la descarga tarda más que esto, el aviso «Cargando el formulario…» se hace visible. */
const ESPERA_AVISO_MS = 300;

let carga: Promise<ComponentType> | null = null;

/** Descarga el formulario una sola vez por página; si falla, permite reintentar. */
function cargarFormulario(): Promise<ComponentType> {
  carga ??= import("./FormularioCotizacion")
    .then((m) => m.FormularioCotizacion)
    .catch((error: unknown) => {
      carga = null;
      throw error;
    });
  return carga;
}

/**
 * Carga diferida del formulario de cotización: react-hook-form, zod y el propio formulario no van en
 * el JS inicial. Mientras tanto se ve `children` (el esqueleto pintado en el servidor, con el mismo
 * marcado y alto que el formulario: no hay salto de diseño). La descarga empieza cuando la sección se
 * acerca a la pantalla, o en cuanto la página hidrata si `inmediato` (en /contacto el formulario es
 * el contenido principal).
 *
 * Si la descarga se demora (mala señal en obra), los controles del esqueleto se atenúan y aparece un
 * aviso visible «Cargando el formulario…» que acompaña el desplazamiento por encima del formulario.
 * Ni el aviso ni la atenuación ocupan espacio: no mueven la página (CLS 0).
 */
export function FormularioCotizacionDiferido({
  children,
  inmediato = false,
}: {
  children: ReactNode;
  inmediato?: boolean;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);
  const [intento, setIntento] = useState(0);
  const [fallo, setFallo] = useState(false);
  /** La descarga ya tardó más de ESPERA_AVISO_MS (o la persona tocó el esqueleto): aviso visible. */
  const [lento, setLento] = useState(false);
  const [Formulario, setFormulario] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (inmediato) {
      // Sin esperar al IntersectionObserver: la descarga empieza en el primer efecto.
      cargarFormulario().catch(() => undefined);
      setCerca(true);
      return;
    }
    const el = caja.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setCerca(true);
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setCerca(true);
          observador.disconnect();
        }
      },
      { rootMargin: MARGEN_DE_CARGA },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [inmediato]);

  useEffect(() => {
    if (!cerca) return;
    let vigente = true;
    cargarFormulario()
      .then((componente) => {
        if (vigente) setFormulario(() => componente);
      })
      .catch(() => {
        if (vigente) setFallo(true);
      });
    return () => {
      vigente = false;
    };
  }, [cerca, intento]);

  const cargando = cerca && !fallo && !Formulario;

  useEffect(() => {
    if (!cargando || lento) return;
    const temporizador = window.setTimeout(() => setLento(true), ESPERA_AVISO_MS);
    return () => window.clearTimeout(temporizador);
  }, [cargando, lento]);

  if (Formulario) return <Formulario />;

  const avisoVisible = cargando && lento;

  return (
    <div
      ref={caja}
      aria-busy={cargando ? true : undefined}
      // El esqueleto es `inert`: un toque sobre él llega aquí. Se adelanta la descarga (por si aún no
      // había empezado) y el aviso se muestra ya, sin esperar los 300 ms.
      onPointerDown={() => {
        setCerca(true);
        setLento(true);
      }}
      className={`relative ${avisoVisible ? "[&_:is(input,select,textarea)]:opacity-50" : ""}`}
    >
      {cargando && !avisoVisible ? <p className="solo-lectores">{t.cargando}</p> : null}
      {avisoVisible ? (
        // Capa sin espacio propio: el aviso arranca centrado en el margen libre sobre el formulario
        // (mt-12 en Cotizacion) y queda fijo bajo la cabecera mientras se recorre el esqueleto.
        <div className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 z-10">
          <p className="mono-etiqueta border-brand-yellow bg-ink text-bone sticky top-[calc(var(--header-h)+0.75rem)] w-fit max-w-full border-l-4 px-3 py-1.5">
            {t.cargando}
          </p>
        </div>
      ) : null}
      {fallo ? (
        <div role="alert" className="border-strut-red bg-bone-2 text-ink mb-7 border-l-4 p-4">
          <p className="font-semibold">{t.errorCarga}</p>
          <div className="mt-3 flex flex-wrap gap-4">
            <button
              type="button"
              className="boton boton-secundario"
              onClick={() => {
                setFallo(false);
                setIntento((n) => n + 1);
              }}
            >
              {t.reintentarCarga}
            </button>
            <a
              href={urlWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="boton boton-primario"
            >
              {t.alternativaWhatsApp}
              <span className="solo-lectores">{avisoPestanaNueva}</span>
            </a>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
