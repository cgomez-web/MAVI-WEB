/** Escapa texto para insertarlo en HTML. Todo dato del usuario pasa por aquí antes de ir a un correo HTML. */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Elimina saltos de línea y caracteres de control: imprescindible en cualquier valor que vaya a una cabecera. */
export function limpiarCabecera(texto: string): string {
  return texto.replace(/[\u0000-\u001F\u007F]+/g, " ").trim();
}
