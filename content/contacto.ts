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
  /**
   * El brochure (pág. 8) lista los dos correos sin cargo ni área. No se les asigna un rol
   * ("Comercial", "Gerencia"…) hasta que el dueño lo confirme.
   * `etiqueta` es el rótulo de cada correo y nunca va vacío. La vista (pie y tarjeta de Cotización)
   * los agrupa por rótulo con `correosPorEtiqueta()`: un <dt> por cada rótulo distinto y, debajo, un
   * <dd> por correo. Mientras los dos compartan el mismo, el rótulo sale una sola vez.
   * TODO(owner): si confirma que cada correo corresponde a un área, escriba aquí la de cada uno.
   */
  correos: [
    { usuario: "maviproyectoseinversiones", dominio: "gmail.com", etiqueta: "Correo" },
    { usuario: "jorgemariovillamejia", dominio: "gmail.com", etiqueta: "Correo" },
  ],
  direccion: {
    linea: "Cr 25 # 41B Sur 37",
    ciudad: "Envigado",
    departamento: "Antioquia",
    pais: "Colombia",
    codigoPais: "CO",
    /** Búsqueda para el enlace a Google Maps (no se embebe el mapa: requeriría cookies de terceros). */
    consultaMapa: "Carrera 25 # 41B Sur 37, Envigado, Antioquia, Colombia",
    /**
     * TODO(owner): coordenadas exactas del pin de la ficha de Google (Perfil de Empresa), con al
     * menos 5 decimales. Mientras sea null no se publican en los datos estructurados: unas
     * coordenadas aproximadas serían peores que ninguna.
     */
    geo: null as { latitud: number; longitud: number } | null,
    /** TODO(owner): código postal confirmado de la dirección. Mientras sea null no se publica. */
    codigoPostal: null as string | null,
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
  /** Zona de servicio del brochure. Va tal cual, sin artículos, a los datos estructurados (areaServed). */
  zonaDeServicio: ["Envigado", "Medellín", "Valle de Aburrá", "Antioquia"],
} as const;

/** Nombres de la zona que en una frase llevan artículo: "atendemos obras en el Valle de Aburrá". */
const articuloEnFrase: Partial<Record<string, string>> = { "Valle de Aburrá": "el" };

export function urlWhatsApp(mensaje: string = contacto.whatsapp.mensajeGeneral): string {
  return `https://wa.me/${contacto.whatsapp.numero}?text=${encodeURIComponent(mensaje)}`;
}

/** "Envigado, Medellín, el Valle de Aburrá y Antioquia": la zona de servicio como frase. */
export function zonaDeServicioTexto(): string {
  const zona = contacto.zonaDeServicio.map((nombre) => {
    const articulo = articuloEnFrase[nombre];
    return articulo ? `${articulo} ${nombre}` : nombre;
  });
  const ultima = zona.pop();
  return zona.length > 0 ? `${zona.join(", ")} y ${ultima}` : (ultima ?? "");
}

type Correo = { readonly usuario: string; readonly dominio: string; readonly etiqueta: string };

/**
 * Correos agrupados por rótulo, en el orden de `contacto.correos`: cada grupo es un <dt> con sus
 * <dd>. Así cada correo queda bajo su propio rótulo aunque el dueño les asigne áreas distintas.
 */
export function correosPorEtiqueta(
  correos: readonly Correo[] = contacto.correos,
): { etiqueta: string; correos: Correo[] }[] {
  const grupos: { etiqueta: string; correos: Correo[] }[] = [];
  for (const correo of correos) {
    const etiqueta = correo.etiqueta.trim();
    const grupo = grupos.find((g) => g.etiqueta === etiqueta);
    if (grupo) grupo.correos.push(correo);
    else grupos.push({ etiqueta, correos: [correo] });
  }
  return grupos;
}

/** "Cr 25 # 41B Sur 37, Envigado, Antioquia". */
export function direccionCompleta(): string {
  const d = contacto.direccion;
  return `${d.linea}, ${d.ciudad}, ${d.departamento}`;
}

export function urlMapa(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contacto.direccion.consultaMapa)}`;
}

/** Mensaje precargado de WhatsApp para un equipo o línea concreta. */
export function mensajeWhatsApp(equipo: string): string {
  return `Hola MAVI, quiero cotizar *${equipo.toLowerCase()}* para una obra en ___`;
}
