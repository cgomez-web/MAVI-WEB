/**
 * Verificación de Cloudflare Turnstile en servidor.
 * Si no hay clave secreta configurada se omite (el formulario conserva honeypot, tiempo mínimo y
 * rate limit). En producción se recomienda configurarlo: ver docs/PENDIENTES.md.
 */
import { registrar } from "./log";

export function turnstileActivo(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verificarTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
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
