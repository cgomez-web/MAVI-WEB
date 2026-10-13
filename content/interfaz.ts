/**
 * Rótulos de la interfaz: encabezados de bloque, botones del visor de fotos, nombres para lectores de
 * pantalla. Redacción propia del sitio (no son datos del brochure); para cambiar un rótulo basta con
 * editarlo aquí. Cada grupo es una exportación aparte para que un componente de cliente solo arrastre
 * a su JavaScript el grupo que usa.
 * Los datos (teléfono, correos, dirección, horario) están en content/contacto.ts.
 */

/** Rótulos de los bloques de contacto (pie de página y tarjeta «Contacto directo» de Cotización). */
export const textosContacto = {
  titulo: "Contacto",
  telefono: "Celular / WhatsApp",
  direccion: "Dirección",
  /** Complemento, solo para lectores de pantalla, del enlace de la dirección. */
  enMapa: " en Google Maps",
  horario: "Horario",
  aConfirmar: "a confirmar",
  /** Nombre (para lectores de pantalla) de la tarjeta de contacto junto al formulario. */
  tarjeta: "Contacto directo",
  escribirWhatsApp: "Escribir por WhatsApp",
} as const;

export const textosPie = {
  servicios: "Servicios",
  brochure: "Descargar brochure (PDF)",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  /** Nombre de la navegación legal del pie. */
  navLegal: "Legal",
  politica: "Política de datos personales",
  contacto: "Contacto",
} as const;

/** Ficha técnica de cada línea (home y /servicios/[slug]). */
export const textosFicha = {
  leyenda: "Ficha técnica",
  equipo: "Equipo",
  rango: "Rango",
  uso: "Uso",
  /** Pie de la lámina que sustituye a las fotos en las líneas sin fotografías reales. */
  lamina: "Ilustración técnica",
  linea: "Línea",
  atributos: "Atributos",
  /** Complemento, solo para lectores de pantalla, de «Cotizar esta línea». */
  porWhatsApp: " por WhatsApp: ",
} as const;

/** Galería de la bodega y su visor (components/sections/Inventario.tsx). */
export const textosGaleria = {
  filtrar: "Filtrar por línea",
  fotosAnteriores: "Fotos anteriores",
  fotosSiguientes: "Fotos siguientes",
  conteo: (n: number) => `${n} ${n === 1 ? "foto" : "fotos"}`,
  pista: "Fotografías del inventario",
  ampliar: (titulo: string) => `Ampliar: ${titulo}`,
  cerrar: "Cerrar",
  anterior: "Anterior",
  fotoAnterior: "Foto anterior",
  siguiente: "Siguiente",
  fotoSiguiente: "Foto siguiente",
  cotizar: "Cotizar este equipo",
  /** Complemento, solo para lectores de pantalla, de «Cotizar este equipo». */
  porWhatsApp: " por WhatsApp",
} as const;

/** Nombres, solo para lectores de pantalla, de listas y bloques del inicio. */
export const textosInicio = {
  confianza: "Por qué confiar en MAVI",
  datosClave: "Datos clave",
} as const;

/**
 * Botón que detiene la franja de equipos del inicio (components/sections/Marquee.tsx). El rótulo
 * cambia con el estado, como el control de rotación de un carrusel, así que no lleva aria-pressed:
 * un nombre que cambia más un estado «pulsado» se anunciaría dos veces.
 */
export const textosMarquee = {
  pausar: "Pausar cinta",
  reanudar: "Reanudar cinta",
} as const;

export const textosGenerales = {
  saltarAlContenido: "Saltar al contenido",
} as const;
