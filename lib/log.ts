/**
 * Registro de servidor SIN datos personales: solo eventos, códigos y metadatos técnicos.
 * Nunca se registran nombre, teléfono, correo, mensaje ni la IP completa.
 */
type Nivel = "info" | "warn" | "error";

export function registrar(
  nivel: Nivel,
  evento: string,
  detalle: Record<string, string | number | boolean> = {},
) {
  const linea = JSON.stringify({ t: new Date().toISOString(), nivel, evento, ...detalle });
  if (nivel === "error") console.error(linea);
  else if (nivel === "warn") console.warn(linea);
  else if (process.env.NODE_ENV !== "production") console.warn(linea);
}
