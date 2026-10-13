"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { textosFormulario } from "@/content/formulario";
import { urlWhatsApp } from "@/content/contacto";
import { avisoPestanaNueva } from "@/content/navegacion";
import {
  duracionDeLlenado,
  esquemaFormulario,
  type DatosFormulario,
  type EntradaFormulario,
} from "@/lib/validacion";
import {
  CLAVE_TURNSTILE,
  CuerpoFormulario,
  claseCajaTurnstile,
  claseRejillaFormulario,
  type NombreCampo,
  type PropsControl,
} from "./CamposCotizacion";

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

const t = textosFormulario;

/** Campos que no ve la persona: si fallan no se listan en el resumen. */
const CAMPOS_OCULTOS = new Set(["sitioWeb", "turnstileToken"]);

const ORDEN_CAMPOS: NombreCampo[] = [
  "nombre",
  "empresa",
  "telefono",
  "correo",
  "ciudad",
  "servicio",
  "duracion",
  "mensaje",
  "consentimiento",
];

const suscribirNada = () => () => undefined;

/**
 * Formulario de cotización (solo cliente: lo monta FormularioCotizacionDiferido cuando la sección se
 * acerca a la pantalla). La validación es la misma que hace el servidor (lib/validacion.ts).
 */
export function FormularioCotizacion() {
  const uid = useId();
  const [estado, setEstado] = useState<Estado>({ tipo: "inactivo" });
  /** Hubo un intento de envío con errores: desde entonces se muestra el resumen. */
  const [intentado, setIntentado] = useState(false);
  /** Cambia en cada envío fallido: fuerza el render que pinta el resumen antes de enfocarlo. */
  const [, setPedirFocoResumen] = useState(0);
  /** Hay que llevar el foco al resumen en cuanto exista (ver el efecto sin dependencias, abajo). */
  const focoPendiente = useRef(false);
  /**
   * El botón de enviar está presionado (pointerdown → click). Mientras tanto no se valida al salir
   * de un campo: el mensaje de error que aparecería empujaría el botón hacia abajo antes de que el
   * clic termine, y el clic caería fuera (había que pulsar dos veces). El envío valida todo igual.
   */
  const pulsandoEnviar = useRef(false);
  const resumen = useRef<HTMLDivElement>(null);
  const cajaTurnstile = useRef<HTMLDivElement>(null);
  const idTurnstile = useRef<string | undefined>(undefined);
  /**
   * El widget de Turnstile no pudo cargar o falló (script bloqueado por la red o un bloqueador,
   * clave pública mal escrita, error del desafío). Mientras sea true el envío sigue sin token y
   * decide el servidor: con las dos claves responde «verificacion» (se ofrece WhatsApp); con una
   * sola deja pasar y registra turnstile_config_incompleta. Nunca se bloquea el formulario.
   */
  const fallaTurnstile = useRef(false);
  /** Instante (reloj monótono del navegador) en que el formulario quedó listo para llenarse. */
  const inicio = useRef(0);
  const enviando = useRef(false);
  // false en el HTML del servidor y durante la hidratación; true en cuanto React controla el formulario.
  // Mientras sea false el botón está deshabilitado: nunca hay un envío nativo del navegador.
  const listo = useSyncExternalStore(
    suscribirNada,
    () => true,
    () => false,
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    reset,
    getValues,
    formState: { errors },
  } = useForm<EntradaFormulario, unknown, DatosFormulario>({
    resolver: zodResolver(esquemaFormulario),
    mode: "onBlur",
    reValidateMode: "onChange",
    // El foco lo lleva el código al resumen de errores (si lo moviera RHF, competirían).
    shouldFocusError: false,
    defaultValues: {
      nombre: "",
      empresa: "",
      telefono: "",
      correo: "",
      mensaje: "",
      sitioWeb: "",
      duracion: "",
    },
  });

  // Tiempo de llenado (anti-bots) y carga diferida de Turnstile si está configurado.
  useEffect(() => {
    inicio.current = performance.now();
    if (!CLAVE_TURNSTILE || !cajaTurnstile.current) return;
    const montar = () => {
      if (!window.turnstile || !cajaTurnstile.current || idTurnstile.current) return;
      try {
        idTurnstile.current = window.turnstile.render(cajaTurnstile.current, {
          sitekey: CLAVE_TURNSTILE,
          language: "es",
          theme: "light",
          callback: (token: string) => {
            // El widget se recuperó (reintenta solo tras un error): vuelve a exigirse el token.
            fallaTurnstile.current = false;
            setValue("turnstileToken", token);
          },
          "expired-callback": () => setValue("turnstileToken", undefined),
          "timeout-callback": () => setValue("turnstileToken", undefined),
          "error-callback": () => {
            fallaTurnstile.current = true;
            setValue("turnstileToken", undefined);
          },
        });
      } catch {
        fallaTurnstile.current = true;
      }
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
    s.onload = () => {
      if (!window.turnstile) fallaTurnstile.current = true;
      montar();
    };
    s.onerror = () => {
      fallaTurnstile.current = true;
    };
    document.head.appendChild(s);
  }, [setValue]);

  // El resumen se enfoca después de pintarse, en el primer render en que ya existe: react-hook-form
  // publica los errores en un render posterior al del intento, así que depender solo de
  // `pedirFocoResumen` dejaba el foco en el botón. Sin dependencias a propósito.
  useEffect(() => {
    if (!focoPendiente.current || !resumen.current) return;
    focoPendiente.current = false;
    resumen.current.focus();
  });

  /** El token de Turnstile es de un solo uso: tras cualquier respuesta se pide uno nuevo. */
  const renovarTurnstile = () => {
    setValue("turnstileToken", undefined);
    if (idTurnstile.current) window.turnstile?.reset(idTurnstile.current);
  };

  const alFallarValidacion = (e: FieldErrors<EntradaFormulario>) => {
    const visibles = Object.keys(e).filter((k) => !CAMPOS_OCULTOS.has(k));
    if (visibles.length > 0) {
      setIntentado(true);
      focoPendiente.current = true;
      setPedirFocoResumen((n) => n + 1);
      return;
    }
    // Solo fallaron campos que la persona no ve (p. ej. el navegador autollenó el honeypot):
    // no se la deja sin respuesta; se le ofrece WhatsApp.
    if (Object.keys(e).length > 0) setEstado({ tipo: "error", mensaje: t.errorGenerico });
  };

  const enviar = async (datos: DatosFormulario) => {
    if (enviando.current) return;
    // Solo se pide esperar si el widget sigue resolviendo; si falló, se envía sin token.
    if (CLAVE_TURNSTILE && !datos.turnstileToken && !fallaTurnstile.current) {
      setEstado({ tipo: "error", mensaje: t.errorVerificando });
      return;
    }
    enviando.current = true;
    setEstado({ tipo: "enviando" });
    try {
      const r = await fetch("/api/cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          transcurridoMs: duracionDeLlenado(inicio.current, performance.now()),
        }),
      });
      const cuerpo = (await r.json().catch(() => ({}))) as {
        codigo?: string;
        campos?: Record<string, string>;
      };
      renovarTurnstile();
      if (r.ok && cuerpo.codigo === "ok") {
        setEstado({ tipo: "exito" });
        setIntentado(false);
        reset();
        inicio.current = performance.now();
        return;
      }
      if (cuerpo.codigo === "validacion" && cuerpo.campos) {
        for (const [campo, mensaje] of Object.entries(cuerpo.campos)) {
          setError(campo as keyof EntradaFormulario, { type: "server", message: mensaje });
        }
        setEstado({ tipo: "inactivo" });
        setIntentado(true);
        focoPendiente.current = true;
        setPedirFocoResumen((n) => n + 1);
        return;
      }
      setEstado({
        tipo: "error",
        mensaje: cuerpo.codigo === "limite" ? t.errorLimite : t.errorGenerico,
      });
    } catch {
      renovarTurnstile();
      setEstado({ tipo: "error", mensaje: t.errorGenerico });
    } finally {
      enviando.current = false;
    }
  };

  const id = (n: string) => `${uid}-${n}`;
  const err = (n: NombreCampo) => errors[n]?.message;
  const control = (n: NombreCampo): PropsControl => {
    const registro = register(n);
    return {
      ...registro,
      onBlur: (evento) => (pulsandoEnviar.current ? undefined : registro.onBlur(evento)),
      // Siempre explícito: con `required`, Chrome marcaría un select o una casilla vacíos como
      // "no válido" antes de que la persona los toque.
      "aria-invalid": Boolean(errors[n]),
      "aria-describedby": errors[n] ? `${id(n)}-error` : undefined,
    };
  };
  const soltarEnviar = () => {
    // Después del click, que llega justo tras pointerup.
    window.setTimeout(() => (pulsandoEnviar.current = false), 0);
  };

  // En el mismo orden en que aparecen los campos (el validador no siempre los devuelve así).
  const posicion = (k: string) => {
    const i = ORDEN_CAMPOS.indexOf(k as NombreCampo);
    return i === -1 ? ORDEN_CAMPOS.length : i;
  };
  const listaErrores = Object.entries(errors)
    .filter(([k]) => !CAMPOS_OCULTOS.has(k))
    .sort(([a], [b]) => posicion(a) - posicion(b));
  // El resumen aparece solo tras un intento de envío; antes, cada campo muestra su propio error.
  const mostrarResumen = intentado && listaErrores.length > 0;
  const valores = getValues();
  const mensajeRespaldo = t.mensajeRespaldo(valores.servicio, valores.ciudad, valores.mensaje);
  const ocupado = estado.tipo === "enviando";

  return (
    <form
      // Si algo fallara antes de que React controle el envío, los datos nunca van en la URL.
      method="post"
      onSubmit={handleSubmit(enviar, alFallarValidacion)}
      noValidate
      className={claseRejillaFormulario}
    >
      <CuerpoFormulario
        idDe={id}
        control={control}
        error={err}
        resumen={
          mostrarResumen ? (
            <div
              ref={resumen}
              tabIndex={-1}
              role="group"
              aria-labelledby={id("resumen-titulo")}
              className="border-strut-red bg-bone-2 text-ink border-l-4 p-4 outline-none sm:col-span-2"
            >
              <p id={id("resumen-titulo")} className="font-bold">
                {t.resumenErrores(listaErrores.length)}
              </p>
              <ul className="text-0 mt-2 list-inside list-disc">
                {listaErrores.map(([k, v]) => (
                  <li key={k}>
                    <a
                      href={`#${id(k)}`}
                      className="underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setFocus(k as keyof EntradaFormulario);
                      }}
                    >
                      {k === "consentimiento"
                        ? t.etiquetaConsentimiento
                        : ((t.campos as Record<string, string>)[k] ?? k)}
                    </a>
                    {`: ${v?.message ?? ""}`}
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        }
        ocultos={
          // Honeypot: fuera de pantalla, sin tabulación y oculto a lectores de pantalla.
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor={id("sitioWeb")}>{t.honeypot}</label>
            <input
              id={id("sitioWeb")}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...register("sitioWeb")}
            />
          </div>
        }
        turnstile={
          CLAVE_TURNSTILE ? <div ref={cajaTurnstile} className={claseCajaTurnstile} /> : null
        }
        boton={
          <button
            type="submit"
            className="boton boton-primario"
            disabled={!listo}
            onPointerDown={() => (pulsandoEnviar.current = true)}
            onPointerUp={soltarEnviar}
            onPointerCancel={soltarEnviar}
            onPointerLeave={soltarEnviar}
            // Mientras se envía no se usa `disabled`: el botón conserva el foco del teclado.
            aria-disabled={ocupado ? true : undefined}
          >
            {ocupado ? t.enviando : t.enviar}
          </button>
        }
        estado={
          <>
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
                  <span className="solo-lectores">{avisoPestanaNueva}</span>
                </a>
              </div>
            ) : null}
          </>
        }
      />
    </form>
  );
}
