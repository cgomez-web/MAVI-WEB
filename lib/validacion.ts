import * as z from "zod/mini";
import { ciudadesFormulario, duracionesFormulario, serviciosFormulario } from "@/content/formulario";

/**
 * Esquema único del formulario de cotización (cliente + servidor).
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
          z.maxLength(max, `Máximo ${max} caracteres.`),
          z.regex(SIN_CONTROL, "Contiene caracteres no permitidos."),
        ),
    ]),
  );

export const esquemaCotizacion = z.object({
  nombre: z
    .string()
    .check(
      z.trim(),
      z.minLength(2, "Escriba su nombre."),
      z.maxLength(80, "Máximo 80 caracteres."),
      z.regex(NOMBRE, "Use solo letras y espacios."),
    ),
  empresa: textoOpcional(100),
  telefono: z.pipe(
    z.string().check(z.trim(), z.maxLength(20, "Número demasiado largo.")),
    z
      .transform(normalizarTelefono)
      .check(z.refine((v: string) => TELEFONO_CO.test(v), "Escriba un celular colombiano de 10 dígitos (ej. 322 559 9325).")),
  ),
  correo: z.optional(
    z.union([
      vacio,
      z
        .string()
        .check(
          z.trim(),
          z.maxLength(120, "Máximo 120 caracteres."),
          z.regex(CORREO, "Revise el correo electrónico."),
        ),
    ]),
  ),
  ciudad: z.enum(ciudadesFormulario, "Seleccione el municipio de la obra."),
  servicio: z.enum(serviciosFormulario, "Seleccione una línea de servicio."),
  duracion: z.optional(z.union([vacio, z.enum(duracionesFormulario, "Seleccione una opción.")])),
  mensaje: z
    .string()
    .check(
      z.trim(),
      z.minLength(10, "Cuéntenos un poco más (mínimo 10 caracteres)."),
      z.maxLength(1500, "Máximo 1.500 caracteres."),
      z.regex(SIN_CONTROL_SALVO_SALTOS, "Contiene caracteres no permitidos."),
    ),
  consentimiento: z.literal(true, "Debe autorizar el tratamiento de sus datos para enviar la solicitud."),
  // Campos anti-spam:
  /** Honeypot: invisible para personas; los bots lo llenan. */
  sitioWeb: z.optional(z.string().check(z.maxLength(0))),
  /** Momento (ms) en que se mostró el formulario. */
  iniciado: z.number().check(z.int(), z.positive()),
  turnstileToken: z.optional(z.string().check(z.maxLength(2048))),
});

export type DatosCotizacion = z.infer<typeof esquemaCotizacion>;
export type EntradaCotizacion = z.input<typeof esquemaCotizacion>;

/** Un envío humano tarda al menos unos segundos y no más de un día desde que se abrió el formulario. */
export const TIEMPO_MINIMO_MS = 3000;
export const TIEMPO_MAXIMO_MS = 24 * 60 * 60 * 1000;

export function tiempoDeLlenadoValido(iniciado: number, ahora = Date.now()): boolean {
  const transcurrido = ahora - iniciado;
  return transcurrido >= TIEMPO_MINIMO_MS && transcurrido <= TIEMPO_MAXIMO_MS;
}
