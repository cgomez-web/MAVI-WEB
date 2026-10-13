import * as z from "zod/mini";
import {
  ciudadesFormulario,
  duracionesFormulario,
  mensajesValidacion as m,
  serviciosFormulario,
} from "@/content/formulario";

/**
 * Esquemas del formulario de cotización (los mismos campos se validan en cliente y servidor).
 * Se usa `zod/mini` (API funcional, tree-shakable) para no sumar ~25 kB gz al JS inicial.
 * Listas cerradas, longitudes máximas y sin caracteres de control (evita inyección de cabeceras).
 */
const SIN_CONTROL = /^[^\u0000-\u001F\u007F]*$/;
const SIN_CONTROL_SALVO_SALTOS = /^[^\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]*$/;
const NOMBRE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;
const CORREO = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/** Celular colombiano (3xx xxx xxxx) o fijo nacional (60x xxx xxxx), con o sin +57. */
export const TELEFONO_CO = /^(?:\+?57)?(?:3\d{9}|60\d{8})$/;

export function normalizarTelefono(valor: string): string {
  return valor.replace(/[\s().-]/g, "");
}

const vacio = z.literal("");

const textoOpcional = (max: number) =>
  z.optional(
    z.union([
      vacio,
      z
        .string()
        .check(
          z.trim(),
          z.maxLength(max, m.maximo(max)),
          z.regex(SIN_CONTROL, m.caracteresNoPermitidos),
        ),
    ]),
  );

/**
 * Lo que el usuario llena en el navegador (lo valida react-hook-form en el cliente).
 * El servidor valida el mismo esquema más los campos anti-spam que agrega el envío (`esquemaCotizacion`).
 */
export const esquemaFormulario = z.object({
  nombre: z
    .string()
    .check(
      z.trim(),
      z.minLength(2, m.nombre),
      z.maxLength(80, m.maximo(80)),
      z.regex(NOMBRE, m.nombreLetras),
    ),
  empresa: textoOpcional(100),
  telefono: z.pipe(
    z.string().check(z.trim(), z.maxLength(20, m.telefonoLargo)),
    z.transform(normalizarTelefono).check(z.refine((v: string) => TELEFONO_CO.test(v), m.telefono)),
  ),
  correo: z.optional(
    z.union([
      vacio,
      z.string().check(z.trim(), z.maxLength(120, m.maximo(120)), z.regex(CORREO, m.correo)),
    ]),
  ),
  ciudad: z.enum(ciudadesFormulario, m.ciudad),
  servicio: z.enum(serviciosFormulario, m.servicio),
  duracion: z.optional(z.union([vacio, z.enum(duracionesFormulario, m.duracion)])),
  mensaje: z
    .string()
    .check(
      z.trim(),
      z.minLength(10, m.mensajeCorto),
      z.maxLength(1500, m.maximoMensaje),
      z.regex(SIN_CONTROL_SALVO_SALTOS, m.caracteresNoPermitidos),
    ),
  consentimiento: z.literal(true, m.consentimiento),
  // Campos anti-spam:
  /**
   * Honeypot: invisible para personas; los bots lo llenan. En el navegador debe venir vacío; el servidor
   * lo revisa antes de este esquema y, si viene lleno, responde "ok" sin enviar nada.
   */
  sitioWeb: z.optional(z.string().check(z.maxLength(0))),
  turnstileToken: z.optional(z.string().check(z.maxLength(2048))),
});

/** Un envío humano tarda al menos unos segundos desde que el formulario aparece en pantalla. */
export const TIEMPO_MINIMO_MS = 3000;
/**
 * Tope de cordura (7 días). No filtra a nadie: el navegador recorta su medición a este valor, así que una
 * pestaña abierta durante días sigue enviando. Solo rechaza valores absurdos de clientes que no son el sitio.
 */
export const TIEMPO_MAXIMO_MS = 7 * 24 * 60 * 60 * 1000;

/** Lo que recibe el endpoint: el formulario más la duración del llenado medida en el navegador. */
export const esquemaCotizacion = z.extend(esquemaFormulario, {
  /**
   * Milisegundos entre la aparición del formulario y el envío, medidos con `performance.now()` (reloj
   * monótono del navegador). No se compara con el reloj del servidor: un PC con la hora mal puesta no
   * debe hacer perder una cotización.
   */
  transcurridoMs: z.number().check(z.int(), z.nonnegative()),
});

export type DatosFormulario = z.infer<typeof esquemaFormulario>;
export type EntradaFormulario = z.input<typeof esquemaFormulario>;
export type DatosCotizacion = z.infer<typeof esquemaCotizacion>;
export type EntradaCotizacion = z.input<typeof esquemaCotizacion>;

/** Rango razonable para un envío humano: ni instantáneo ni un valor imposible. */
export function tiempoDeLlenadoValido(transcurridoMs: number): boolean {
  return transcurridoMs >= TIEMPO_MINIMO_MS && transcurridoMs <= TIEMPO_MAXIMO_MS;
}

/** Duración que envía el navegador: entera y recortada al tope para no caer nunca fuera de rango. */
export function duracionDeLlenado(desdeMs: number, hastaMs: number): number {
  return Math.min(TIEMPO_MAXIMO_MS, Math.max(0, Math.round(hastaMs - desdeMs)));
}
