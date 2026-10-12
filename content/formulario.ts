/**
 * Listas cerradas del formulario de cotización. El servidor rechaza cualquier valor fuera de estas listas.
 */
/** Debe coincidir con los nombres de content/servicios.ts (lo verifica tests/unit/contenido.test.ts). */
export const serviciosFormulario = [
  "Maquinaria pesada",
  "Transporte y elevación",
  "Equipos para losas",
  "Encofrados y formaletería",
  "Andamiaje",
  "Otros equipos y accesorios",
] as const;

export const ciudadesFormulario = [
  "Envigado",
  "Medellín",
  "Itagüí",
  "Sabaneta",
  "La Estrella",
  "Caldas",
  "Bello",
  "Copacabana",
  "Girardota",
  "Barbosa",
  "Rionegro",
  "Otro municipio de Antioquia",
  "Fuera de Antioquia",
] as const;

export const duracionesFormulario = [
  "Menos de una semana",
  "1 a 4 semanas",
  "1 a 3 meses",
  "Más de 3 meses",
  "Aún no sé",
] as const;

export const textosFormulario = {
  campos: {
    nombre: "Nombre completo",
    empresa: "Empresa (opcional)",
    telefono: "Celular / WhatsApp",
    correo: "Correo electrónico",
    ciudad: "Municipio de la obra",
    servicio: "Línea de servicio",
    duracion: "Tiempo estimado de alquiler",
    mensaje: "¿Qué necesita? Equipos, cantidades, fechas",
  },
  placeholderSelect: "Seleccione…",
  consentimiento:
    "Autorizo a MAVI Proyectos e Inversiones a tratar mis datos personales para responder esta solicitud, conforme a la",
  enlacePolitica: "política de tratamiento de datos",
  enviar: "Enviar solicitud",
  enviando: "Enviando…",
  exito: "Recibimos su solicitud. Le contactaremos pronto con disponibilidad y valor.",
  errorGenerico:
    "No pudimos enviar la solicitud en este momento. Escríbanos por WhatsApp y le atendemos de inmediato.",
  errorLimite:
    "Recibimos demasiadas solicitudes desde su conexión. Intente de nuevo en unos minutos o escríbanos por WhatsApp.",
  alternativaWhatsApp: "Escribir por WhatsApp",
} as const;
