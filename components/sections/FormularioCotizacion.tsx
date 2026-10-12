"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ciudadesFormulario,
  duracionesFormulario,
  serviciosFormulario,
  textosFormulario,
} from "@/content/formulario";
import { urlWhatsApp } from "@/content/contacto";
import { esquemaCotizacion, type DatosCotizacion, type EntradaCotizacion } from "@/lib/validacion";

type Estado =
  | { tipo: "inactivo" }
  | { tipo: "enviando" }
  | { tipo: "exito" }
  | { tipo: "error"; mensaje: string };

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opciones: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const CLAVE_TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const t = textosFormulario;

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
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="mono-etiqueta text-concrete-dark">
        {etiqueta}
        {requerido ? (
          <span aria-hidden="true" className="text-strut-red">
            {" "}
            *
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

const claseControl =
  "w-full rounded-none border-0 border-b-[3px] border-ink bg-bone-2/60 px-3 py-3 text-1 text-ink placeholder:text-concrete-dark focus:bg-bone-2 aria-[invalid=true]:border-strut-red";

export function FormularioCotizacion() {
  const uid = useId();
  const [estado, setEstado] = useState<Estado>({ tipo: "inactivo" });
  const resumen = useRef<HTMLDivElement>(null);
  const cajaTurnstile = useRef<HTMLDivElement>(null);
  const idTurnstile = useRef<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    getValues,
    formState: { errors },
  } = useForm<EntradaCotizacion, unknown, DatosCotizacion>({
    resolver: zodResolver(esquemaCotizacion),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      nombre: "",
      empresa: "",
      telefono: "",
      correo: "",
      mensaje: "",
      sitioWeb: "",
      iniciado: 0,
      duracion: "",
    },
  });

  // Marca de tiempo de apertura (anti-bots) y carga diferida de Turnstile si está configurado.
  useEffect(() => {
    setValue("iniciado", Date.now());
    if (!CLAVE_TURNSTILE || !cajaTurnstile.current) return;
    const montar = () => {
      if (!window.turnstile || !cajaTurnstile.current || idTurnstile.current) return;
      idTurnstile.current = window.turnstile.render(cajaTurnstile.current, {
        sitekey: CLAVE_TURNSTILE,
        language: "es",
        theme: "light",
        callback: (token: string) => setValue("turnstileToken", token),
        "expired-callback": () => setValue("turnstileToken", undefined),
      });
    };
    if (window.turnstile) {
      montar();
      return;
    }
    // Con 'strict-dynamic', un script creado por nuestro código (con nonce) es de confianza.
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = montar;
    document.head.appendChild(s);
  }, [setValue]);

  const alFallarValidacion = (e: FieldErrors<EntradaCotizacion>) => {
    if (Object.keys(e).length > 0) requestAnimationFrame(() => resumen.current?.focus());
  };

  const enviar = async (datos: DatosCotizacion) => {
    setEstado({ tipo: "enviando" });
    try {
      const r = await fetch("/api/cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = (await r.json().catch(() => ({}))) as {
        codigo?: string;
        campos?: Record<string, string>;
      };
      if (r.ok && cuerpo.codigo === "ok") {
        setEstado({ tipo: "exito" });
        reset();
        setValue("iniciado", Date.now());
        if (idTurnstile.current) window.turnstile?.reset(idTurnstile.current);
        return;
      }
      if (cuerpo.codigo === "validacion" && cuerpo.campos) {
        for (const [campo, mensaje] of Object.entries(cuerpo.campos)) {
          setError(campo as keyof EntradaCotizacion, { type: "server", message: mensaje });
        }
        setEstado({ tipo: "inactivo" });
        requestAnimationFrame(() => resumen.current?.focus());
        return;
      }
      setEstado({
        tipo: "error",
        mensaje: cuerpo.codigo === "limite" ? t.errorLimite : t.errorGenerico,
      });
    } catch {
      setEstado({ tipo: "error", mensaje: t.errorGenerico });
    }
  };

  const id = (n: string) => `${uid}-${n}`;
  const err = (n: keyof EntradaCotizacion) => errors[n]?.message as string | undefined;
  const aria = (n: keyof EntradaCotizacion) => ({
    "aria-invalid": errors[n] ? true : undefined,
    "aria-describedby": errors[n] ? `${id(n)}-error` : undefined,
  });

  const listaErrores = Object.entries(errors).filter(
    ([k]) => k !== "sitioWeb" && k !== "iniciado" && k !== "turnstileToken",
  );
  const valores = getValues();
  const mensajeRespaldo =
    `Hola MAVI, quiero cotizar ${valores.servicio ?? "equipos"} para una obra en ${valores.ciudad ?? "___"}. ${valores.mensaje ?? ""}`.trim();

  return (
    <form
      onSubmit={handleSubmit(enviar, alFallarValidacion)}
      noValidate
      className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2"
    >
      <div ref={resumen} tabIndex={-1} className="outline-none sm:col-span-2" aria-live="assertive">
        {listaErrores.length > 0 ? (
          <div className="border-strut-red bg-bone-2 text-ink border-l-4 p-4">
            <p className="font-bold">
              Revise {listaErrores.length === 1 ? "1 campo" : `${listaErrores.length} campos`} antes
              de enviar:
            </p>
            <ul className="text-0 mt-2 list-inside list-disc">
              {listaErrores.map(([k, v]) => (
                <li key={k}>
                  <a href={`#${id(k)}`} className="underline">
                    {(t.campos as Record<string, string>)[k] ?? k}
                  </a>
                  : {v?.message as string}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <Campo id={id("nombre")} etiqueta={t.campos.nombre} error={err("nombre")} requerido>
        <input
          id={id("nombre")}
          type="text"
          autoComplete="name"
          maxLength={80}
          className={claseControl}
          {...aria("nombre")}
          {...register("nombre")}
        />
      </Campo>
      <Campo id={id("empresa")} etiqueta={t.campos.empresa} error={err("empresa")}>
        <input
          id={id("empresa")}
          type="text"
          autoComplete="organization"
          maxLength={100}
          className={claseControl}
          {...aria("empresa")}
          {...register("empresa")}
        />
      </Campo>
      <Campo id={id("telefono")} etiqueta={t.campos.telefono} error={err("telefono")} requerido>
        <input
          id={id("telefono")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder="3xx xxx xxxx"
          className={`${claseControl} cifras`}
          {...aria("telefono")}
          {...register("telefono")}
        />
      </Campo>
      <Campo id={id("correo")} etiqueta={t.campos.correo} error={err("correo")}>
        <input
          id={id("correo")}
          type="email"
          autoComplete="email"
          maxLength={120}
          className={claseControl}
          {...aria("correo")}
          {...register("correo")}
        />
      </Campo>
      <Campo id={id("ciudad")} etiqueta={t.campos.ciudad} error={err("ciudad")} requerido>
        <select
          id={id("ciudad")}
          className={claseControl}
          defaultValue=""
          {...aria("ciudad")}
          {...register("ciudad")}
        >
          <option value="" disabled>
            {t.placeholderSelect}
          </option>
          {ciudadesFormulario.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Campo>
      <Campo id={id("servicio")} etiqueta={t.campos.servicio} error={err("servicio")} requerido>
        <select
          id={id("servicio")}
          className={claseControl}
          defaultValue=""
          {...aria("servicio")}
          {...register("servicio")}
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
        id={id("duracion")}
        etiqueta={t.campos.duracion}
        error={err("duracion")}
        className="sm:col-span-2"
      >
        <select
          id={id("duracion")}
          className={claseControl}
          {...aria("duracion")}
          {...register("duracion")}
        >
          <option value="">{t.placeholderSelect}</option>
          {duracionesFormulario.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </Campo>
      <Campo
        id={id("mensaje")}
        etiqueta={t.campos.mensaje}
        error={err("mensaje")}
        requerido
        className="sm:col-span-2"
      >
        <textarea
          id={id("mensaje")}
          rows={5}
          maxLength={1500}
          className={`${claseControl} resize-y`}
          {...aria("mensaje")}
          {...register("mensaje")}
        />
      </Campo>

      {/* Honeypot: fuera de pantalla, sin tabulación y oculto a lectores de pantalla. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("sitioWeb")}>No llene este campo</label>
        <input
          id={id("sitioWeb")}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("sitioWeb")}
        />
      </div>
      <input type="hidden" {...register("iniciado", { valueAsNumber: true })} />

      <div className="sm:col-span-2">
        <div className="flex items-start gap-3">
          <input
            id={id("consentimiento")}
            type="checkbox"
            className="border-ink bg-bone checked:bg-ink aria-[invalid=true]:border-strut-red mt-1 h-6 w-6 shrink-0 appearance-none rounded-none border-[3px] checked:[background-image:linear-gradient(45deg,transparent_42%,var(--color-brand-yellow)_42%,var(--color-brand-yellow)_58%,transparent_58%)]"
            {...aria("consentimiento")}
            {...register("consentimiento")}
          />
          <label htmlFor={id("consentimiento")} className="text-0 text-ink">
            {t.consentimiento}{" "}
            <Link href="/politica-de-privacidad" className="font-semibold underline">
              {t.enlacePolitica}
            </Link>
            .{" "}
            <span aria-hidden="true" className="text-strut-red">
              *
            </span>
          </label>
        </div>
        {err("consentimiento") ? (
          <p
            id={`${id("consentimiento")}-error`}
            className="text-0 text-strut-red mt-2 font-semibold"
          >
            ▲ {err("consentimiento")}
          </p>
        ) : null}
      </div>

      {CLAVE_TURNSTILE ? <div ref={cajaTurnstile} className="sm:col-span-2" /> : null}

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          className="boton boton-primario"
          disabled={estado.tipo === "enviando"}
        >
          {estado.tipo === "enviando" ? t.enviando : t.enviar}
        </button>
        <p className="mono-etiqueta text-concrete-dark">* Obligatorio</p>
      </div>

      <div className="sm:col-span-2" role="status" aria-live="polite">
        {estado.tipo === "exito" ? (
          <p className="border-ink bg-brand-yellow text-ink border-l-4 p-4 font-semibold">
            {t.exito}
          </p>
        ) : null}
        {estado.tipo === "error" ? (
          <div className="border-strut-red bg-bone-2 text-ink border-l-4 p-4">
            <p className="font-semibold">{estado.mensaje}</p>
            <a
              href={urlWhatsApp(mensajeRespaldo)}
              target="_blank"
              rel="noopener noreferrer"
              className="boton boton-secundario mt-3"
            >
              {t.alternativaWhatsApp}
            </a>
          </div>
        ) : null}
      </div>
    </form>
  );
}
