/**
 * Lógica del endpoint de cotización, separada del Route Handler para poder probarla.
 * Orden de controles: método/origen → tipo y tamaño → rate limit → lectura acotada + JSON → honeypot →
 * Zod → tiempo de llenado → Turnstile → envío. Al cliente solo le llegan códigos genéricos.
 */
import { comprobarLimite } from "./limite";
import { configCorreo, enviarCotizacion } from "./email";
import { registrar } from "./log";
import { verificarTurnstile } from "./turnstile";
import { esquemaCotizacion, tiempoDeLlenadoValido } from "./validacion";

export const TAMANO_MAXIMO_BYTES = 16 * 1024;

export type CodigoRespuesta =
  | "ok"
  | "origen"
  | "tipo"
  | "tamano"
  | "limite"
  | "validacion"
  | "verificacion"
  | "no_configurado"
  | "envio";

export interface RespuestaCotizacion {
  estado: number;
  cuerpo: { ok: boolean; codigo: CodigoRespuesta; campos?: Record<string, string> };
  cabeceras?: Record<string, string>;
}

/** Campos anti-spam: si fallan no se dice cuál (el cliente recibe "verificacion"). */
const CAMPOS_ANTISPAM = new Set(["sitioWeb", "transcurridoMs", "turnstileToken"]);

function origenesPermitidos(request: Request): Set<string> {
  const permitidos = new Set<string>();
  const sitio = process.env.NEXT_PUBLIC_SITE_URL;
  if (sitio) {
    try {
      permitidos.add(new URL(sitio).origin);
    } catch {
      /* URL mal configurada: se ignora */
    }
  }
  // El propio host que sirve la petición (previews de Vercel, localhost).
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  if (host) permitidos.add(`${proto}://${host}`);
  return permitidos;
}

export function ipDeLaPeticion(request: Request): string {
  const reenviada = request.headers.get("x-forwarded-for");
  const primera = reenviada?.split(",")[0]?.trim();
  return primera || request.headers.get("x-real-ip") || "desconocida";
}

const respuesta = (
  estado: number,
  codigo: CodigoRespuesta,
  extra: Partial<RespuestaCotizacion> = {},
): RespuestaCotizacion => ({
  estado,
  cuerpo: { ok: codigo === "ok", codigo, ...(extra.cuerpo ?? {}) },
  cabeceras: extra.cabeceras,
});

/**
 * Lee el cuerpo contando bytes y corta en cuanto pasa del máximo, aunque la petición no declare
 * Content-Length (envío "chunked"). Devuelve null si se pasa del límite.
 */
export async function leerCuerpoAcotado(request: Request, maximo: number): Promise<string | null> {
  if (!request.body) return "";
  const lector = request.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximo) {
      await lector.cancel().catch(() => undefined);
      return null;
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(total);
  let posicion = 0;
  for (const parte of partes) {
    bytes.set(parte, posicion);
    posicion += parte.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function procesarCotizacion(
  request: Request,
  ahora = Date.now(),
): Promise<RespuestaCotizacion> {
  // 1. CSRF: solo se aceptan peticiones del propio sitio (el navegador siempre envía Origin en POST).
  const origen = request.headers.get("origin");
  if (!origen || !origenesPermitidos(request).has(origen)) {
    registrar("warn", "cotizacion_origen_rechazado");
    return respuesta(403, "origen");
  }

  // 2. Solo JSON (fuerza preflight CORS para cualquier origen ajeno) y cuerpo acotado. El tamaño
  //    declarado es un atajo; la lectura real (paso 4) vuelve a contar los bytes.
  const tipo = request.headers.get("content-type") ?? "";
  if (!tipo.toLowerCase().startsWith("application/json")) return respuesta(415, "tipo");
  const declarado = request.headers.get("content-length");
  if (declarado !== null) {
    const bytes = Number(declarado);
    if (!Number.isFinite(bytes) || bytes > TAMANO_MAXIMO_BYTES) return respuesta(413, "tamano");
  }

  // 3. Rate limit por IP (hasheada).
  const ip = ipDeLaPeticion(request);
  const limite = await comprobarLimite(ip, undefined, ahora);
  if (!limite.permitido) {
    registrar("warn", "cotizacion_limite");
    return respuesta(429, "limite", {
      cabeceras: { "Retry-After": String(limite.reintentarEnSeg) },
    });
  }

  // 4. Lectura acotada (corta al pasar de 16 KB, con o sin Content-Length) + JSON.
  const texto = await leerCuerpoAcotado(request, TAMANO_MAXIMO_BYTES);
  if (texto === null) return respuesta(413, "tamano");
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return respuesta(400, "validacion");
  }

  // 5. Honeypot, antes de validar: a un bot que lo llena se le responde "ok" y no se envía nada,
  //    sea cual sea el resto del contenido (así no aprende que el campo es una trampa).
  const honeypot =
    typeof bruto === "object" && bruto !== null
      ? (bruto as { sitioWeb?: unknown }).sitioWeb
      : undefined;
  if (honeypot !== undefined && honeypot !== "") {
    registrar("warn", "cotizacion_spam_descartado", { motivo: "honeypot" });
    return respuesta(200, "ok");
  }

  // 6. Zod: errores por campo para el formulario, sin revelar los campos anti-spam.
  const resultado = esquemaCotizacion.safeParse(bruto);
  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const clave = String(problema.path[0] ?? "formulario");
      if (CAMPOS_ANTISPAM.has(clave)) continue;
      campos[clave] ??= problema.message;
    }
    if (Object.keys(campos).length === 0) return respuesta(400, "verificacion");
    return respuesta(400, "validacion", { cuerpo: { ok: false, codigo: "validacion", campos } });
  }
  const datos = resultado.data;

  // 7. Tiempo de llenado (medido en el navegador con un reloj monótono). Fuera de rango NO se finge
  //    éxito: se responde "verificacion", el formulario muestra el error con la salida por WhatsApp y
  //    la persona puede reintentar. Ninguna cotización real se pierde en silencio.
  if (!tiempoDeLlenadoValido(datos.transcurridoMs)) {
    registrar("warn", "cotizacion_tiempo_fuera_de_rango", { transcurridoMs: datos.transcurridoMs });
    return respuesta(400, "verificacion");
  }

  // 8. Turnstile (si está configurado). El token es de un solo uso: el cliente pide uno nuevo tras
  //    cualquier respuesta que no sea "ok".
  if (!(await verificarTurnstile(datos.turnstileToken, ip === "desconocida" ? undefined : ip))) {
    return respuesta(400, "verificacion");
  }

  // 9. Envío.
  const config = configCorreo();
  if (!config) {
    registrar("error", "cotizacion_correo_no_configurado");
    return respuesta(503, "no_configurado");
  }
  try {
    const enviado = await enviarCotizacion(datos, config);
    if (!enviado) {
      registrar("error", "cotizacion_envio_fallido");
      return respuesta(502, "envio");
    }
  } catch (error) {
    registrar("error", "cotizacion_envio_excepcion", {
      motivo: error instanceof Error ? error.name : "desconocido",
    });
    return respuesta(502, "envio");
  }
  registrar("info", "cotizacion_enviada", { servicio: datos.servicio, ciudad: datos.ciudad });
  return respuesta(200, "ok");
}
