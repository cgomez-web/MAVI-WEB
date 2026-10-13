import { sitio } from "./sitio";

const ANIOS = sitio.experiencia.anios;
/**
 * Número de líneas de servicio (content/servicios.ts). Va como número y no como
 * `lineasDeServicio.length`: este archivo lo importan componentes de cliente (galería, marquee) y
 * así no arrastra las fichas técnicas al JavaScript del navegador. tests/unit/contenido.test.ts
 * comprueba que coincide con las líneas reales.
 */
export const NUMERO_DE_LINEAS = 6;

/** Textos del home que no vienen literalmente del brochure (redacción propia, revisable por el dueño). */
export const home = {
  hero: {
    eyebrow: "Alquiler de maquinaria y equipos para construcción · Envigado, Antioquia",
    titular: ["Su obra avanza.", "Nosotros la movemos."],
    entradilla:
      "Maquinaria pesada, transporte, equipos para losas, formaletería, andamios y equipos menores, disponibles en Envigado para obras de todo Antioquia.",
    ctaPrimario: "Cotizar por WhatsApp",
    ctaSecundario: "Ver equipos",
    ficha: [`+${ANIOS} años`, `${NUMERO_DE_LINEAS} líneas`, "Envigado · Antioquia"],
    descripcionEscena:
      "Ilustración animada: un terreno vacío al amanecer donde, a medida que se avanza en la página, entran una excavadora, una volqueta y una grúa, se levantan puntales, formaletas y andamios, y la obra queda terminada al atardecer con el logo de MAVI.",
  },
  confianza: [
    {
      valor: ANIOS,
      prefijo: "+",
      unidad: "AÑOS",
      texto: "de experiencia en construcción e infraestructura",
    },
    // Contador de las líneas de servicio (PROMPT §2.2).
    // «Equipos en óptimas condiciones» sigue en Nosotros (valor «Calidad»).
    {
      valor: NUMERO_DE_LINEAS,
      unidad: "LÍNEAS",
      texto: "de servicio para su obra",
    },
    { texto: "Envigado, Antioquia", detalle: "Bodega con inventario disponible" },
    { texto: "Acompañamiento en todo el proceso", detalle: "De la cotización al soporte técnico" },
  ],
  // El titular y el párrafo del índice de servicios son los del brochure: content/empresa.ts →
  // solucionesIntegrales.
  servicios: {
    eyebrow: "Seis líneas de servicio",
    verFicha: "Ver ficha completa",
    cotizar: "Cotizar esta línea",
  },
  /** Nombre, para lectores de pantalla, de la franja de equipos. */
  marqueeEtiqueta: "Equipos disponibles",
  marquee: [
    "Excavadoras",
    "Retroexcavadoras",
    "Mini cargadores",
    "Volquetas",
    "Grúas",
    "Planchones",
    "Camabajas",
    "Puntales",
    "Sopandas",
    "Correas",
    "Tableros",
    "Formaletas",
    "Andamios",
    "Plumas de cargue",
    "Generadores",
    "Compresores",
    "Vibradores",
    "Mezcladoras",
  ],
  nosotros: {
    eyebrow: "Quiénes somos",
    titular: `Más de ${ANIOS} años facilitando el avance de cada obra`,
    mision: "Nuestra misión",
    vision: "Nuestra visión",
  },
  inventario: {
    eyebrow: "Fotografías de nuestra bodega",
    titular: "Inventario real, listo para su obra",
    texto:
      "Sin fotos de catálogo: estos son equipos que tenemos en bodega y en obra. Filtre por línea y pida el que necesita.",
    todos: "Todo",
    ayudaArrastre: "Arrastre o use las flechas para recorrer la galería",
    /** Mensaje precargado de WhatsApp mientras la galería está a la vista. */
    mensajeWhatsApp:
      "Hola MAVI, vi su inventario en la web y quiero cotizar equipos para una obra en ___",
  },
  proceso: {
    eyebrow: "Cómo trabajamos",
    titular: "De la cotización a la obra, sin frenar",
  },
  preguntas: {
    titular: "Preguntas frecuentes",
  },
  cierre: {
    /** El titular del cierre es el lema (content/sitio.ts → lema); el CTA de WhatsApp es hero.ctaPrimario. */
    ctaFormulario: "Llenar el formulario",
  },
  cotizacion: {
    eyebrow: "Cotización",
    titular: "Cuéntenos qué necesita su obra",
    texto:
      "Déjenos los datos básicos y le contactamos con disponibilidad y valor. Si prefiere, escríbanos directamente por WhatsApp.",
  },
} as const;

/** Preloader de la escena 3D (decorativo: va oculto para lectores de pantalla). */
export const textosEscena = {
  nivelando: "Nivelando escena",
} as const;
