/**
 * Envío del correo de cotización con la API REST de Resend (sin SDK).
 * - El asunto solo usa valores de listas cerradas (servicio, ciudad): ningún texto libre del usuario
 *   llega a una cabecera.
 * - Cuerpo en texto plano + HTML con TODO el contenido del usuario escapado.
 */
import type { DatosCotizacion } from "./validacion";
import { escaparHtml, limpiarCabecera } from "./escape";

export interface ConfigCorreo {
  apiKey: string;
  desde: string;
  para: string[];
}

export function configCorreo(): ConfigCorreo | null {
  const apiKey = process.env.RESEND_API_KEY;
  const desde = process.env.QUOTE_FROM_EMAIL;
  const para = (process.env.QUOTE_TO_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || !desde || para.length === 0) return null;
  return { apiKey, desde, para };
}

function filas(d: DatosCotizacion): Array<[string, string]> {
  return [
    ["Nombre", d.nombre],
    ["Empresa", d.empresa || "—"],
    ["Celular", d.telefono],
    ["Correo", d.correo || "—"],
    ["Municipio de la obra", d.ciudad],
    ["Línea de servicio", d.servicio],
    ["Tiempo estimado", d.duracion || "—"],
  ];
}

export function construirCorreo(d: DatosCotizacion) {
  const asunto = limpiarCabecera(`Cotización web — ${d.servicio} — ${d.ciudad}`);
  const texto = [
    "Nueva solicitud de cotización desde el sitio web",
    "",
    ...filas(d).map(([k, v]) => `${k}: ${v}`),
    "",
    "Necesidad:",
    d.mensaje,
    "",
    "El cliente autorizó el tratamiento de datos personales (Ley 1581 de 2012).",
  ].join("\n");

  const html = `<!doctype html><html lang="es"><body style="font-family:Arial,sans-serif;color:#0b0b0c">
<h1 style="font-size:20px;margin:0 0 16px">Nueva solicitud de cotización</h1>
<table cellpadding="6" style="border-collapse:collapse">${filas(d)
    .map(
      ([k, v]) =>
        `<tr><th align="left" style="border-bottom:1px solid #ddd">${escaparHtml(k)}</th><td style="border-bottom:1px solid #ddd">${escaparHtml(v)}</td></tr>`,
    )
    .join("")}</table>
<h2 style="font-size:16px;margin:24px 0 8px">Necesidad</h2>
<p style="white-space:pre-wrap">${escaparHtml(d.mensaje)}</p>
<p style="color:#5b5b57;font-size:12px">El cliente autorizó el tratamiento de datos personales (Ley 1581 de 2012).</p>
</body></html>`;

  return { asunto, texto, html };
}

export async function enviarCotizacion(d: DatosCotizacion, config: ConfigCorreo): Promise<boolean> {
  const { asunto, texto, html } = construirCorreo(d);
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.desde,
      to: config.para,
      subject: asunto,
      text: texto,
      html,
      // reply_to solo con un correo ya validado por Zod (sin saltos de línea).
      ...(d.correo ? { reply_to: limpiarCabecera(d.correo) } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  return respuesta.ok;
}
