import Link from "next/link";
import type { ReactNode } from "react";
import {
  ciudadesFormulario,
  duracionesFormulario,
  serviciosFormulario,
  textosFormulario,
} from "@/content/formulario";
import { urlWhatsApp } from "@/content/contacto";
import { avisoPestanaNueva } from "@/content/navegacion";

/**
 * Marcado compartido del formulario de cotización. Lo usan:
 *  - el formulario real (FormularioCotizacion, cliente, con react-hook-form), y
 *  - el esqueleto que se pinta en el servidor mientras ese formulario se descarga
 *    (FormularioCotizacionDiferido), con los mismos campos deshabilitados.
 * Al compartir el marcado, el esqueleto mide exactamente lo mismo que el formulario en cualquier
 * ancho: el cambio de uno a otro no mueve la página (CLS 0). Este archivo no importa
 * react-hook-form ni zod, así que no los suma al JS inicial.
 */

const t = textosFormulario;
/** Turnstile se pinta solo si está configurado (la clave pública es la misma en servidor y cliente). */
export const CLAVE_TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export const claseRejillaFormulario = "grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2";

const claseControl =
  "w-full rounded-none border-0 border-b-[3px] border-ink bg-bone-2/60 px-3 py-3 text-1 text-ink placeholder:text-concrete-dark focus:bg-bone-2 aria-[invalid=true]:border-strut-red";

export type NombreCampo =
  | "nombre"
  | "empresa"
  | "telefono"
  | "correo"
  | "ciudad"
  | "servicio"
  | "duracion"
  | "mensaje"
  | "consentimiento";

/** Lo que recibe cada control: register + aria (formulario real) o `disabled` (esqueleto). */
export interface PropsControl {
  name?: string;
  onChange?: (evento: { target: unknown; type?: unknown }) => unknown;
  onBlur?: (evento: { target: unknown; type?: unknown }) => unknown;
  ref?: (instancia: HTMLElement | null) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

function Campo({
  id,
  etiqueta,
  error,
  requerido,
  children,
  className = "",
}: {
  id: string;
  etiqueta: string;
  error?: string;
  requerido?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="mono-etiqueta text-concrete-dark">
        {etiqueta}
        {requerido ? (
          // Solo visual: el control lleva `required` (el form usa noValidate: sin globos del navegador,
          // pero el lector de pantalla anuncia "obligatorio").
          <span aria-hidden="true" className="text-strut-red">
            {" *"}
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-0 text-strut-red flex items-start gap-2 font-semibold"
        >
          <span aria-hidden="true">▲</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface PropsCuerpo {
  /** id del control de cada campo (useId en el formulario real, fijo en el esqueleto). */
  idDe: (nombre: string) => string;
  control: (nombre: NombreCampo) => PropsControl;
  error?: (nombre: NombreCampo) => string | undefined;
  /** Resumen de errores (solo el formulario real, tras un intento de envío). */
  resumen?: ReactNode;
  /** Campos ocultos (honeypot): fuera del flujo, no ocupan espacio. */
  ocultos?: ReactNode;
  /** Caja del widget de Turnstile (reserva su alto para que no salte al aparecer). */
  turnstile?: ReactNode;
  boton: ReactNode;
  /** Región de estado (éxito / error del envío). */
  estado?: ReactNode;
  /** En el esqueleto el enlace a la política se pinta como texto (no debe recibir foco). */
  esqueleto?: boolean;
}

export function CuerpoFormulario({
  idDe,
  control,
  error = () => undefined,
  resumen,
  ocultos,
  turnstile,
  boton,
  estado,
  esqueleto = false,
}: PropsCuerpo) {
  const errorConsentimiento = error("consentimiento");
  return (
    <>
      <p className="mono-etiqueta text-concrete-dark sm:col-span-2">{t.leyendaObligatorio}</p>
      {resumen}

      <Campo id={idDe("nombre")} etiqueta={t.campos.nombre} error={error("nombre")} requerido>
        <input
          id={idDe("nombre")}
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          className={claseControl}
          {...control("nombre")}
        />
      </Campo>
      <Campo id={idDe("empresa")} etiqueta={t.campos.empresa} error={error("empresa")}>
        <input
          id={idDe("empresa")}
          type="text"
          autoComplete="organization"
          maxLength={100}
          className={claseControl}
          {...control("empresa")}
        />
      </Campo>
      <Campo id={idDe("telefono")} etiqueta={t.campos.telefono} error={error("telefono")} requerido>
        <input
          id={idDe("telefono")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder={t.placeholderTelefono}
          required
          className={`${claseControl} cifras`}
          {...control("telefono")}
        />
      </Campo>
      <Campo id={idDe("correo")} etiqueta={t.campos.correo} error={error("correo")}>
        <input
          id={idDe("correo")}
          type="email"
          autoComplete="email"
          maxLength={120}
          className={claseControl}
          {...control("correo")}
        />
      </Campo>
      <Campo id={idDe("ciudad")} etiqueta={t.campos.ciudad} error={error("ciudad")} requerido>
        <select
          id={idDe("ciudad")}
          className={claseControl}
          defaultValue=""
          required
          {...control("ciudad")}
        >
          <option value="" disabled>
            {t.placeholderSelect}
          </option>
          {ciudadesFormulario.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Campo>
      <Campo id={idDe("servicio")} etiqueta={t.campos.servicio} error={error("servicio")} requerido>
        <select
          id={idDe("servicio")}
          className={claseControl}
          defaultValue=""
          required
          {...control("servicio")}
        >
          <option value="" disabled>
            {t.placeholderSelect}
          </option>
          {serviciosFormulario.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Campo>
      <Campo
        id={idDe("duracion")}
        etiqueta={t.campos.duracion}
        error={error("duracion")}
        className="sm:col-span-2"
      >
        <select id={idDe("duracion")} className={claseControl} {...control("duracion")}>
          <option value="">{t.placeholderSelect}</option>
          {duracionesFormulario.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </Campo>
      <Campo
        id={idDe("mensaje")}
        etiqueta={t.campos.mensaje}
        error={error("mensaje")}
        requerido
        className="sm:col-span-2"
      >
        <textarea
          id={idDe("mensaje")}
          rows={5}
          maxLength={1500}
          required
          className={`${claseControl} resize-y`}
          {...control("mensaje")}
        />
      </Campo>

      {ocultos}

      <div className="sm:col-span-2">
        <div className="flex items-start gap-3">
          <input
            id={idDe("consentimiento")}
            type="checkbox"
            required
            className="border-ink bg-bone checked:bg-ink aria-[invalid=true]:border-strut-red mt-1 h-6 w-6 shrink-0 appearance-none rounded-none border-[3px] checked:[background-image:linear-gradient(45deg,transparent_42%,var(--color-brand-yellow)_42%,var(--color-brand-yellow)_58%,transparent_58%)]"
            {...control("consentimiento")}
          />
          <label htmlFor={idDe("consentimiento")} className="text-0 text-ink">
            {/* Cada espacio va pegado a su texto: así el nombre accesible no junta "lapolítica". */}
            {`${t.consentimiento} `}
            {esqueleto ? (
              <span className="font-semibold underline">{t.enlacePolitica}</span>
            ) : (
              <Link href="/politica-de-privacidad" className="font-semibold underline">
                {t.enlacePolitica}
              </Link>
            )}
            {". "}
            <span aria-hidden="true" className="text-strut-red">
              *
            </span>
          </label>
        </div>
        {errorConsentimiento ? (
          <p
            id={`${idDe("consentimiento")}-error`}
            className="text-0 text-strut-red mt-2 flex items-start gap-2 font-semibold"
          >
            <span aria-hidden="true">▲</span>
            {errorConsentimiento}
          </p>
        ) : null}
      </div>

      {turnstile}

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">{boton}</div>

      <div className="sm:col-span-2" role="status" aria-live="polite">
        {estado}
      </div>
    </>
  );
}

/** Caja del widget de Turnstile: reserva el alto del widget (65 px) para que no empuje la página. */
export const claseCajaTurnstile = "min-h-[65px] sm:col-span-2";

/**
 * Esqueleto que se pinta en el servidor: mismos campos, deshabilitados y fuera del árbol de
 * accesibilidad, más un aviso que solo se ve sin JavaScript con la salida por WhatsApp.
 * Sin JS no hay <form> que enviar, así que ningún dato puede terminar en la URL.
 */
export function EsqueletoFormulario() {
  return (
    <>
      <noscript>
        <div className="border-ink bg-bone-2 text-ink mb-7 border-l-4 p-4">
          <p className="font-semibold">{t.sinJavaScript}</p>
          <a
            href={urlWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-primario mt-3"
          >
            {t.alternativaWhatsApp}
            <span className="solo-lectores">{avisoPestanaNueva}</span>
          </a>
        </div>
      </noscript>
      <div className={claseRejillaFormulario} aria-hidden="true" inert>
        <CuerpoFormulario
          esqueleto
          idDe={(n) => `cotizacion-esqueleto-${n}`}
          control={() => ({ disabled: true })}
          turnstile={CLAVE_TURNSTILE ? <div className={claseCajaTurnstile} /> : null}
          boton={
            <button type="button" className="boton boton-primario" disabled>
              {t.enviar}
            </button>
          }
        />
      </div>
    </>
  );
}
