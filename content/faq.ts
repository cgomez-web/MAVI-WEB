/**
 * Preguntas frecuentes construidas solo con datos del brochure (alimentan también el JSON-LD FAQPage).
 * El teléfono, la dirección y la zona salen de content/contacto.ts: si cambian allá, cambian aquí.
 * Cada pregunta se exporta por separado para reutilizarla en la ficha de su línea
 * (content/servicios-detalle.ts) sin duplicar el texto.
 */
import { contacto, zonaDeServicioTexto } from "./contacto";

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export const preguntaUbicacion: PreguntaFrecuente = {
  pregunta: "¿Dónde están ubicados y en qué zona prestan servicio?",
  respuesta: `Estamos en ${contacto.direccion.ciudad}, ${contacto.direccion.departamento} (${contacto.direccion.linea}) y atendemos obras en ${zonaDeServicioTexto()}.`,
};

export const preguntaExcavadoras: PreguntaFrecuente = {
  pregunta: "¿Qué tamaños de excavadora tienen?",
  respuesta:
    "Excavadoras de 60 a 330 HP, retroexcavadoras cargadoras de 70 a 120 HP y mini retroexcavadoras y mini cargadores de 30, 40 y 50 HP.",
};

export const preguntaGruas: PreguntaFrecuente = {
  pregunta: "¿Hasta cuántas toneladas levantan sus grúas?",
  respuesta:
    "Contamos con grúas de hasta 100 toneladas para izaje y montaje de estructuras, equipos y materiales, además de planchones y camabajas de 20 a 60 toneladas.",
};

export const preguntaAndamios: PreguntaFrecuente = {
  pregunta: "¿Los andamios son certificados? ¿Hacen el montaje?",
  respuesta:
    "Sí. Alquilamos andamios certificados de fachada y en torre, con accesorios y complementos, y ofrecemos montaje y asesoría técnica.",
};

export const preguntaCotizacion: PreguntaFrecuente = {
  pregunta: "¿Cómo pido una cotización?",
  respuesta: `Escríbanos por WhatsApp al ${contacto.telefono.visible} o diligencie el formulario de cotización con el equipo, el municipio de la obra y el tiempo estimado.`,
};

/** Las preguntas generales del inicio y de /contacto, en orden. */
export const preguntasFrecuentes: readonly PreguntaFrecuente[] = [
  preguntaUbicacion,
  preguntaExcavadoras,
  preguntaGruas,
  preguntaAndamios,
  preguntaCotizacion,
];
