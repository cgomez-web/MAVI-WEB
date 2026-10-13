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
    correo: "Correo electrónico (opcional)",
    ciudad: "Municipio de la obra",
    servicio: "Línea de servicio",
    duracion: "Tiempo estimado de alquiler (opcional)",
    mensaje: "¿Qué necesita? Equipos, cantidades, fechas",
  },
  /** Va antes de los campos; el asterisco es visual (los lectores de pantalla oyen "obligatorio"). */
  leyendaObligatorio: "Los campos con * son obligatorios.",
  placeholderSelect: "Seleccione…",
  /** Pista de formato del celular (sin un número real: no se sugiere el de MAVI ni uno inventado). */
  placeholderTelefono: "3xx xxx xxxx",
  /**
   * La autorización cubre las mismas finalidades que declara la política (content/legal.ts §3 y §4):
   * atender la solicitud, la relación comercial, las PQR y las obligaciones legales y contables.
   */
  consentimiento:
    "Autorizo a MAVI Proyectos e Inversiones a tratar mis datos personales para atender esta solicitud y las demás finalidades descritas en la",
  enlacePolitica: "política de tratamiento de datos",
  /** Nombre de la casilla de autorización en el resumen de errores. */
  etiquetaConsentimiento: "Autorización de datos personales",
  enviar: "Enviar solicitud",
  enviando: "Enviando…",
  exito: "Recibimos su solicitud. Le contactaremos pronto con disponibilidad y valor.",
  errorGenerico:
    "No pudimos enviar la solicitud en este momento. Escríbanos por WhatsApp y le respondemos lo antes posible.",
  errorLimite:
    "Recibimos demasiadas solicitudes desde su conexión. Intente de nuevo en unos minutos o escríbanos por WhatsApp.",
  /** Con Turnstile configurado, si se pulsa Enviar antes de que termine la verificación anti-robots. */
  errorVerificando:
    "Estamos comprobando que la solicitud la envía una persona. Espere unos segundos y pulse de nuevo «Enviar solicitud», o escríbanos por WhatsApp.",
  alternativaWhatsApp: "Escribir por WhatsApp",
  /** Sin JavaScript el formulario no puede enviarse: se ofrece WhatsApp en su lugar. */
  sinJavaScript:
    "Para enviar este formulario su navegador necesita JavaScript. También puede cotizar por WhatsApp.",
  /** Si la parte interactiva del formulario no carga (mala señal, bloqueo de la red). */
  errorCarga:
    "No pudimos cargar el formulario. Revise su conexión e intente de nuevo, o escríbanos por WhatsApp.",
  reintentarCarga: "Intentar de nuevo",
  cargando: "Cargando el formulario…",
  /** Título del resumen de errores que recibe el foco al enviar con campos por corregir. */
  resumenErrores: (n: number) => `Revise ${n === 1 ? "1 campo" : `${n} campos`} antes de enviar:`,
  /** Etiqueta del campo trampa (honeypot): invisible y oculto a lectores de pantalla. */
  honeypot: "No llene este campo",
  /** Mensaje precargado de WhatsApp cuando el envío falla: lleva lo que la persona ya escribió. */
  mensajeRespaldo: (servicio?: string, ciudad?: string, mensaje?: string) =>
    `Hola MAVI, quiero cotizar ${servicio || "equipos"} para una obra en ${ciudad || "___"}. ${mensaje ?? ""}`.trim(),
} as const;

/**
 * Mensajes de validación (los mismos en el navegador y en el servidor: lib/validacion.ts).
 * El ejemplo del celular es genérico a propósito: no se usa el número de MAVI como dato del cliente.
 */
export const mensajesValidacion = {
  maximo: (n: number) => `Máximo ${n} caracteres.`,
  maximoMensaje: "Máximo 1.500 caracteres.",
  caracteresNoPermitidos: "Contiene caracteres no permitidos.",
  nombre: "Escriba su nombre.",
  nombreLetras: "Use solo letras y espacios.",
  telefonoLargo: "Número demasiado largo.",
  telefono: "Escriba un celular colombiano de 10 dígitos que empiece por 3.",
  correo: "Revise el correo electrónico.",
  ciudad: "Seleccione el municipio de la obra.",
  servicio: "Seleccione una línea de servicio.",
  duracion: "Seleccione una opción.",
  mensajeCorto: "Cuéntenos un poco más (mínimo 10 caracteres).",
  consentimiento: "Debe autorizar el tratamiento de sus datos para enviar la solicitud.",
} as const;
