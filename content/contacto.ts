/**
 * Datos de contacto reales (brochure pág. 8 + capturas suministradas por el dueño).
 * Para cambiar un dato basta con editar este archivo.
 */
export const contacto = {
  telefono: {
    /** Como se muestra en pantalla. */
    visible: "322 559 9325",
    /** Formato E.164 para enlaces tel: y WhatsApp. */
    e164: "+573225599325",
  },
  whatsapp: {
    /** Número sin "+" para wa.me */
    numero: "573225599325",
    mensajeGeneral: "Hola MAVI, quiero cotizar equipos para una obra en ___",
  },
  correos: [
    { usuario: "maviproyectoseinversiones", dominio: "gmail.com", etiqueta: "Comercial" },
    { usuario: "jorgemariovillamejia", dominio: "gmail.com", etiqueta: "Gerencia" },
  ],
  direccion: {
    linea: "Cr 25 # 41B Sur 37",
    ciudad: "Envigado",
    departamento: "Antioquia",
    pais: "Colombia",
    codigoPais: "CO",
    /** Búsqueda para el enlace a Google Maps (no se embebe el mapa: requeriría cookies de terceros). */
    consultaMapa: "Carrera 25 # 41B Sur 37, Envigado, Antioquia, Colombia",
  },
  instagram: {
    usuario: "maviproyectos",
    url: "https://www.instagram.com/maviproyectos/",
  },
  /** TODO(owner): confirmar horario real de atención. */
  horario: {
    texto: "Lunes a viernes 7:00 a. m. – 5:00 p. m. · Sábados 7:00 a. m. – 12:00 m.",
    aConfirmar: true,
    /** Para JSON-LD (openingHoursSpecification). */
    especificacion: [
      {
        dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        abre: "07:00",
        cierra: "17:00",
      },
      { dias: ["Saturday"], abre: "07:00", cierra: "12:00" },
    ],
  },
  zonaDeServicio: ["Envigado", "Medellín", "Valle de Aburrá", "Antioquia"],
} as const;

export function urlWhatsApp(mensaje: string = contacto.whatsapp.mensajeGeneral): string {
  return `https://wa.me/${contacto.whatsapp.numero}?text=${encodeURIComponent(mensaje)}`;
}

export function urlMapa(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contacto.direccion.consultaMapa)}`;
}

/** Mensaje precargado de WhatsApp para un equipo o línea concreta. */
export function mensajeWhatsApp(equipo: string): string {
  return `Hola MAVI, quiero cotizar *${equipo.toLowerCase()}* para una obra en ___`;
}
