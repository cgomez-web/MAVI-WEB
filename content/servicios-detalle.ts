/**
 * Texto propio de cada ficha de servicio (/servicios/[slug]) y del índice /servicios.
 *
 * Regla de contenido: solo datos del brochure (equipos, rangos, usos y componentes, que viven en
 * content/servicios.ts) reorganizados para ayudar a elegir y a cotizar, más afirmaciones generales
 * verdaderas. Nada de precios, plazos, tiempos de respuesta, flota propia, operadores ni
 * certificaciones que el brochure no mencione.
 * TODO(owner): si quiere añadir condiciones de alquiler, transporte o montaje por línea, van aquí.
 */
import { contacto, direccionCompleta, zonaDeServicioTexto } from "./contacto";
import {
  preguntaAndamios,
  preguntaExcavadoras,
  preguntaGruas,
  type PreguntaFrecuente,
} from "./faq";

export interface PasoGuia {
  /** La necesidad de la obra, dicha como la diría el cliente. */
  necesidad: string;
  /**
   * Nombres EXACTOS de equipos de la línea (content/servicios.ts → equipos[].nombre). El rango y el
   * uso se toman de allá, así que las cifras nunca se duplican aquí.
   */
  equipos: string[];
}

export interface DetalleServicio {
  guia: { titulo: string; pasos: PasoGuia[] };
  /** Datos que conviene tener a mano al cotizar (preguntas al cliente, no promesas). */
  datosParaCotizar: string[];
  preguntas: PreguntaFrecuente[];
}

/** Rótulos de la plantilla de ficha (app/servicios/[slug]/page.tsx). */
export const textosFichaServicio = {
  migas: { etiqueta: "Migas de pan", inicio: "Inicio", servicios: "Servicios" },
  linea: "Línea",
  fotos: (nombre: string) => `Inventario real de ${nombre.toLowerCase()}`,
  guia: { etiqueta: "Guía rápida", necesidad: "Lo que necesita", equipo: "Equipo" },
  cotizar: {
    etiqueta: "Antes de cotizar",
    titulo: (nombre: string) => `Para cotizar ${nombre.toLowerCase()} más rápido`,
    texto:
      "Envíenos estos datos por WhatsApp o en el formulario y le contactamos con disponibilidad y valor.",
    whatsapp: "Cotizar por WhatsApp",
    formulario: "Ir al formulario",
  },
  zona: {
    etiqueta: "Zona de servicio",
    texto: () =>
      `Atendemos obras en ${zonaDeServicioTexto()}. Estamos en ${direccionCompleta()} (celular y WhatsApp ${contacto.telefono.visible}).`,
  },
  preguntas: (nombre: string) => `Preguntas frecuentes sobre ${nombre.toLowerCase()}`,
  otras: "Otras líneas de servicio",
  todas: "Ver las seis líneas",
} as const;

/** Textos del índice /servicios. */
export const indiceServicios = {
  eyebrow: "Seis líneas de servicio",
  h1: "Alquiler de equipos para construcción",
  introduccion: () =>
    `Ponemos a su disposición maquinaria, equipos, transporte y servicios especializados para obras en ${zonaDeServicioTexto()}. Elija una línea para ver su ficha técnica completa.`,
  equipos: "Equipos de la línea",
  verFicha: "Ver ficha",
} as const;

export const detallesDeServicio: Record<string, DetalleServicio> = {
  "maquinaria-pesada": {
    guia: {
      titulo: "¿Qué máquina necesita su obra?",
      pasos: [
        {
          necesidad: "Movimiento de tierras, excavaciones u obra civil de gran escala.",
          equipos: ["Excavadoras"],
        },
        {
          necesidad: "Una sola máquina versátil para varias tareas en el mismo frente de obra.",
          equipos: ["Retroexcavadoras cargadoras"],
        },
        {
          necesidad: "Espacios reducidos o trabajos de precisión.",
          equipos: ["Mini retroexcavadoras"],
        },
        {
          necesidad: "Cargue y movimiento de materiales en superficies compactas.",
          equipos: ["Mini cargadores"],
        },
      ],
    },
    datosParaCotizar: [
      "Qué trabajo va a hacer: movimiento de tierras, excavación, cargue de material o trabajo de precisión.",
      "Cómo es el espacio de trabajo, sobre todo si es reducido.",
      "El municipio de la obra y el tiempo estimado de alquiler.",
    ],
    preguntas: [
      preguntaExcavadoras,
      {
        pregunta: "¿Qué máquina sirve para espacios reducidos?",
        respuesta:
          "Las mini retroexcavadoras de 30, 40 y 50 HP, pensadas para espacios reducidos y trabajos de precisión. Para cargar y mover materiales en superficies compactas están los mini cargadores, con las mismas potencias.",
      },
      {
        pregunta: "¿Ofrecen soporte técnico con la maquinaria?",
        respuesta:
          "Sí. El soporte técnico hace parte de la línea de maquinaria pesada, junto con el rendimiento y la seguridad de los equipos. Consulte el alcance al cotizar.",
      },
    ],
  },
  "transporte-y-elevacion": {
    guia: {
      titulo: "¿Qué necesita mover o elevar?",
      pasos: [
        { necesidad: "Transportar materiales de obra.", equipos: ["Volquetas"] },
        { necesidad: "Izar y montar estructuras, equipos o materiales.", equipos: ["Grúas"] },
        { necesidad: "Trasladar maquinaria y equipos especiales.", equipos: ["Planchones"] },
        {
          necesidad: "Mover maquinaria pesada o equipos de gran formato.",
          equipos: ["Camabajas"],
        },
      ],
    },
    datosParaCotizar: [
      "Qué va a transportar o izar, y su peso o volumen aproximado.",
      "El punto de cargue y el de destino, o el sitio exacto del izaje.",
      "La fecha en que lo necesita.",
    ],
    preguntas: [
      preguntaGruas,
      {
        pregunta: "¿De qué capacidad son las volquetas?",
        respuesta: "De 7 a 20 m³, para transportar materiales de forma segura y eficiente.",
      },
      {
        pregunta: "¿Qué diferencia hay entre un planchón y una camabaja?",
        respuesta:
          "Los dos cargan de 20 a 60 toneladas. Los planchones se usan para transportar maquinaria y equipos especiales; las camabajas, para maquinaria pesada y equipos de gran formato.",
      },
    ],
  },
  "equipos-para-losas": {
    guia: {
      titulo: "Qué hace cada pieza del sistema",
      pasos: [
        {
          necesidad: "Apoyo vertical y estabilidad de la estructura.",
          equipos: ["Puntales / tacos", "Sopandas"],
        },
        { necesidad: "Soportar el peso de la losa.", equipos: ["Correas"] },
        { necesidad: "Repartir la carga de manera uniforme.", equipos: ["Portacorreas"] },
        {
          necesidad: "Formar la superficie sobre la que se vacía el concreto.",
          equipos: ["Tableros"],
        },
      ],
    },
    datosParaCotizar: [
      "El área aproximada de la losa y la altura de entrepiso.",
      "Qué piezas necesita y en qué cantidad, si ya las tiene calculadas.",
      "El municipio de la obra y el tiempo estimado de alquiler.",
    ],
    preguntas: [
      {
        pregunta: "¿Qué piezas tiene el sistema para losas?",
        respuesta:
          "Correas, portacorreas, sopandas, puntales o tacos y tableros. En la cotización indíquenos cuáles necesita y en qué cantidad.",
      },
      {
        pregunta: "¿Hay sopandas de diferentes alturas?",
        respuesta:
          "Sí, hay sopandas de diferentes alturas y capacidades. Indíquenos la altura de entrepiso de su obra al cotizar.",
      },
      {
        pregunta: "¿Cómo son los tableros para losas?",
        respuesta:
          "Son superficies resistentes y de alta durabilidad, que trabajan con las correas y las portacorreas para soportar el peso de la losa y repartir la carga.",
      },
    ],
  },
  "encofrados-y-formaleteria": {
    guia: {
      titulo: "Qué necesita según el elemento",
      pasos: [
        { necesidad: "Vaciar columnas, vigas o muros.", equipos: ["Formaletería"] },
        {
          necesidad: "Encofrar estructuras de distinto tipo, en metal o en madera.",
          equipos: ["Encofrados metálicos y de madera"],
        },
        {
          necesidad: "Cerrar superficies con piezas que se puedan reutilizar.",
          equipos: ["Tableros"],
        },
        { necesidad: "Ajustar, asegurar y apuntalar el encofrado.", equipos: ["Accesorios"] },
      ],
    },
    datosParaCotizar: [
      "Qué elementos va a vaciar (columnas, vigas o muros) y sus medidas aproximadas.",
      "Si prefiere encofrado metálico o de madera.",
      "Los accesorios que necesita y el tiempo estimado de alquiler.",
    ],
    preguntas: [
      {
        pregunta: "¿Tienen encofrados metálicos y de madera?",
        respuesta:
          "Sí. Alquilamos encofrados metálicos y de madera: sistemas versátiles para todo tipo de estructuras.",
      },
      {
        pregunta: "¿Para qué elementos sirve la formaletería?",
        respuesta:
          "Para columnas, vigas y muros. Se complementa con tableros resistentes y reutilizables y con accesorios como abrazaderas, cuñas y puntales.",
      },
      {
        pregunta: "¿Qué accesorios tienen?",
        respuesta:
          "Abrazaderas, cuñas, puntales y más accesorios para armar y asegurar el encofrado.",
      },
    ],
  },
  andamiaje: {
    guia: {
      titulo: "Qué andamio necesita su frente de obra",
      pasos: [
        {
          necesidad: "Trabajar con seguridad en altura, en cada nivel.",
          equipos: ["Andamios certificados"],
        },
        {
          necesidad: "Cubrir el frente de una fachada o trabajar en altura en un punto concreto.",
          equipos: ["Fachada y en torre"],
        },
        { necesidad: "Completar el armado y asegurarlo.", equipos: ["Accesorios y complementos"] },
        {
          necesidad: "Contar con apoyo técnico para el armado.",
          equipos: ["Montaje y asesoría técnica"],
        },
      ],
    },
    datosParaCotizar: [
      "El tipo de andamio (fachada o torre) y la altura o el área que debe cubrir.",
      "Si necesita montaje y asesoría técnica.",
      "El municipio de la obra y el tiempo estimado de alquiler.",
    ],
    preguntas: [
      preguntaAndamios,
      {
        pregunta: "¿Qué tipos de andamio alquilan?",
        respuesta:
          "Andamios certificados de fachada y en torre, con sus accesorios y complementos.",
      },
    ],
  },
  "otros-equipos": {
    guia: {
      titulo: "Qué equipo complementa su obra",
      pasos: [
        {
          necesidad: "Cargue en alturas o en lugares de difícil acceso.",
          equipos: ["Plumas de cargue"],
        },
        { necesidad: "Energía eléctrica en el frente de obra.", equipos: ["Generadores"] },
        { necesidad: "Mover herramientas neumáticas.", equipos: ["Compresores"] },
        { necesidad: "Vibrar el concreto.", equipos: ["Vibradores"] },
        { necesidad: "Cortar, mezclar o romper pavimento.", equipos: ["Equipos menores"] },
        { necesidad: "Herramienta eléctrica y manual para la obra.", equipos: ["Herramientas"] },
      ],
    },
    datosParaCotizar: [
      "Qué equipos necesita y cuántos de cada uno.",
      "Para las plumas de cargue, el peso aproximado de la carga.",
      "Para generadores y compresores, la capacidad o las herramientas que va a conectar.",
      "El municipio de la obra y el tiempo estimado de alquiler.",
    ],
    preguntas: [
      {
        pregunta: "¿Cuánto peso suben las plumas de cargue?",
        respuesta: "Hasta 250 kg. Se usan para trabajo en alturas y en lugares de difícil acceso.",
      },
      {
        pregunta: "¿Qué equipos menores alquilan?",
        respuesta:
          "Cortadoras, mezcladoras y rompepavimento, entre otros, además de generadores de diferentes capacidades, compresores para herramientas neumáticas, vibradores para concreto y herramientas eléctricas y manuales.",
      },
    ],
  },
};

export function detalleDeServicio(slug: string): DetalleServicio | undefined {
  return detallesDeServicio[slug];
}
