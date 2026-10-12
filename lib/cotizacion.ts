/**
 * Lógica del endpoint de cotización, separada del Route Handler para poder probarla.
 * Orden de controles: método/origen → tipo y tamaño → rate limit → JSON + Zod → honeypot y tiempo →
 * Turnstile → envío. Al cliente solo le llegan códigos genéricos.
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
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  if (host) permitidos.add(`${proto}://${host}`);
  return permitidos;
}

export function ipDeLaPeticion(request: Request): string {
  const reenviada = request.headers.get("x-forwarded-for");
  const primera = reenviada?.split(",")[0]?.trim();
  return primera || request.headers.get("x-real-ip") || "desconocida";
}

const respuesta = (estado: number, codigo: CodigoRespuesta, extra: Partial<RespuestaCotizacion> = {}): RespuestaCotizacion => ({
  estado,
  cuerpo: { ok: codigo === "ok", codigo, ...(extra.cuerpo ?? {}) },
  cabeceras: extra.cabeceras,
});

export async function procesarCotizacion(request: Request, ahora = Date.now()): Promise<RespuestaCotizacion> {
  // 1. CSRF: solo se aceptan peticiones del propio sitio (el navegador siempre envía Origin en POST).
  const origen = request.headers.get("origin");
  if (!origen || !origenesPermitidos(request).has(origen)) {
    registrar("warn", "cotizacion_origen_rechazado");
    return respuesta(403, "origen");
  }

  // 2. Solo JSON (fuerza preflight CORS para cualquier origen ajeno) y cuerpo acotado.
  const tipo = request.headers.get("content-type") ?? "";
  if (!tipo.toLowerCase().startsWith("application/json")) return respuesta(415, "tipo");
  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (declarado > TAMANO_MAXIMO_BYTES) return respuesta(413, "tamano");

  // 3. Rate limit por IP (hasheada).
  const ip = ipDeLaPeticion(request);
  const limite = await comprobarLimite(ip, undefined, ahora);
  if (!limite.permitido) {
    registrar("warn", "cotizacion_limite");
    return respuesta(429, "limite", { cabeceras: { "Retry-After": String(limite.reintentarEnSeg) } });
  }

  // 4. Lectura acotada + JSON + Zod.
  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > TAMANO_MAXIMO_BYTES) return respuesta(413, "tamano");
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return respuesta(400, "validacion");
  }
  const resultado = esquemaCotizacion.safeParse(bruto);
  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const clave = String(problema.path[0] ?? "formulario");
      // No se revela qué campos anti-spam fallaron.
      if (clave === "sitioWeb" || clave === "iniciado" || clave === "turnstileToken") continue;
      campos[clave] ??= problema.message;
    }
    if (Object.keys(campos).length === 0) return respuesta(400, "verificacion");
    return respuesta(400, "validacion", { cuerpo: { ok: false, codigo: "validacion", campos } });
  }
  const datos = resultado.data;

  // 5. Honeypot y tiempo de llenado: a un bot se le responde "ok" para no darle señales.
  if (datos.sitioWeb || !tiempoDeLlenadoValido(datos.iniciado, ahora)) {
    registrar("warn", "cotizacion_spam_descartado", { honeypot: Boolean(datos.sitioWeb) });
    return respuesta(200, "ok");
  }

  // 6. Turnstile (si está configurado).
  if (!(await verificarTurnstile(datos.turnstileToken, ip === "desconocida" ? undefined : ip))) {
    return respuesta(400, "verificacion");
  }

  // 7. Envío.
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
    registrar("error", "cotizacion_envio_excepcion", { motivo: error instanceof Error ? error.name : "desconocido" });
    return respuesta(502, "envio");
  }
  registrar("info", "cotizacion_enviada", { servicio: datos.servicio, ciudad: datos.ciudad });
  return respuesta(200, "ok");
}
