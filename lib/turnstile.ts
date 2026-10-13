/**
 * Verificación de Cloudflare Turnstile en servidor.
 * Si no hay clave secreta configurada se omite (el formulario conserva honeypot, tiempo mínimo y
 * rate limit). En producción se recomienda configurarlo: ver docs/PENDIENTES.md.
 */
import { registrar } from "./log";

export function turnstileActivo(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

let avisoConfigIncompleta = false;

/**
 * Si solo está una de las dos claves, el widget puede verse en el navegador mientras el servidor no
 * verifica nada (o al revés). El formulario sigue funcionando con las otras capas, pero se deja un
 * error en los registros (una vez por proceso) para que el dueño lo note y complete la configuración.
 */
export function avisarConfigIncompleta(): void {
  const secreta = Boolean(process.env.TURNSTILE_SECRET_KEY);
  const publica = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  if (secreta === publica || avisoConfigIncompleta) return;
  avisoConfigIncompleta = true;
  registrar("error", "turnstile_config_incompleta", { secreta, publica });
}

export async function verificarTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  avisarConfigIncompleta();
  if (!turnstileActivo()) return true;
  if (!token) return false;
  const cuerpo = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY ?? "",
    response: token,
  });
  if (ip) cuerpo.set("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: cuerpo,
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const datos = (await r.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!datos.success)
      registrar("warn", "turnstile_rechazo", { codigos: (datos["error-codes"] ?? []).join(",") });
    return datos.success === true;
  } catch (error) {
    registrar("error", "turnstile_fallo", {
      motivo: error instanceof Error ? error.message : "desconocido",
    });
    return false;
  }
}

/** Solo para pruebas. */
export function reiniciarAvisoTurnstile(): void {
  avisoConfigIncompleta = false;
}
