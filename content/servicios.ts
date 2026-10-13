/**
 * Las seis líneas de servicio, transcritas del brochure (págs. 3–8).
 * Orden = orden narrativo del home y de la escena 3D.
 * Corrección aplicada: la pág. 6 del brochure trae una errata en "Formaletería"; aquí va bien escrita.
 */
import type { IconoId } from "./iconos";

export type CategoriaGaleria = "losas" | "encofrados" | "andamiaje" | "otros";

export interface Equipo {
  nombre: string;
  /** Rango técnico tal como figura en el brochure (vacío si el brochure no lo da). */
  rango?: string;
  descripcion: string;
  icono: IconoId;
}

/**
 * Dato protagonista de cada línea (franja del home, índice y cabecera de su página).
 * Solo es una cifra cuando el brochure da el número (330 HP, 100 t, 250 kg). En las demás
 * líneas es un dato textual del brochure: nunca un conteo que pueda leerse como inventario.
 */
export type CifraDestacada =
  | {
      tipo: "cifra";
      prefijo?: string;
      valor: number;
      unidad: string;
      etiqueta: string;
    }
  | {
      tipo: "texto";
      /** Dato literal del brochure que ocupa el lugar de la cifra. */
      texto: string;
      etiqueta: string;
    };

export interface LineaDeServicio {
  slug: string;
  codigo: string;
  nombre: string;
  /** Subtítulo literal del brochure. */
  subtitulo: string;
  /** Frase de cierre del brochure, si existe. */
  frase?: string;
  icono: IconoId;
  cifra: CifraDestacada;
  /** Sello estarcido (se usan 4 en todo el sitio). */
  sello?: string;
  equipos: Equipo[];
  atributos?: string[];
  categoriaGaleria?: CategoriaGaleria;
  seo: {
    titulo: string;
    descripcion: string;
    h1: string;
    introduccion: string;
  };
}

export const lineasDeServicio: LineaDeServicio[] = [
  {
    slug: "maquinaria-pesada",
    codigo: "01",
    nombre: "Maquinaria pesada",
    subtitulo: "Equipos de alto rendimiento para trabajos exigentes y de gran escala.",
    icono: "excavadora",
    cifra: { tipo: "cifra", valor: 330, unidad: "HP", etiqueta: "Potencia máxima en excavadoras" },
    sello: "HASTA 330 HP",
    equipos: [
      {
        nombre: "Excavadoras",
        rango: "60 – 330 HP",
        descripcion: "Ideales para movimiento de tierras, excavaciones y obras civiles.",
        icono: "excavadora",
      },
      {
        nombre: "Retroexcavadoras cargadoras",
        rango: "70 – 120 HP",
        descripcion: "Versátiles, potentes y eficientes en múltiples tareas.",
        icono: "retroexcavadora",
      },
      {
        nombre: "Mini retroexcavadoras",
        rango: "30 · 40 · 50 HP",
        descripcion: "Ideales para espacios reducidos y trabajos de precisión.",
        icono: "retroexcavadora",
      },
      {
        nombre: "Mini cargadores",
        rango: "30 · 40 · 50 HP",
        descripcion: "Perfectos para cargue, movimiento de materiales y superficies compactas.",
        icono: "minicargador",
      },
    ],
    atributos: ["Rendimiento", "Seguridad", "Soporte técnico"],
    seo: {
      titulo: "Alquiler de maquinaria pesada en Envigado y Medellín",
      descripcion:
        "Alquiler de excavadoras de 60 a 330 HP, retroexcavadoras cargadoras de 70 a 120 HP, mini retroexcavadoras y mini cargadores en Envigado, Medellín y Antioquia.",
      h1: "Alquiler de maquinaria pesada en Envigado y Medellín",
      introduccion:
        "Excavadoras, retroexcavadoras y minicargadores para movimiento de tierras, excavaciones y obras civiles en el Valle de Aburrá y Antioquia, con soporte técnico durante su obra.",
    },
  },
  {
    slug: "transporte-y-elevacion",
    codigo: "02",
    nombre: "Transporte y elevación",
    subtitulo: "Soluciones confiables para movilizar, cargar y elevar sus proyectos.",
    frase: "En movimiento para que su proyecto avance.",
    icono: "grua",
    cifra: { tipo: "cifra", valor: 100, unidad: "T", etiqueta: "Capacidad de izaje en grúas" },
    sello: "CAP. MÁX 100 T",
    equipos: [
      {
        nombre: "Volquetas",
        rango: "7 – 20 m³",
        descripcion: "Transporte seguro y eficiente de materiales.",
        icono: "volqueta",
      },
      {
        nombre: "Grúas",
        rango: "Hasta 100 t",
        descripcion: "Para izaje y montaje de estructuras, equipos y materiales.",
        icono: "grua",
      },
      {
        nombre: "Planchones",
        rango: "20 – 60 t",
        descripcion: "Transporte de maquinaria y equipos especiales.",
        icono: "camabaja",
      },
      {
        nombre: "Camabajas",
        rango: "20 – 60 t",
        descripcion: "Transporte de maquinaria pesada y equipos de gran formato.",
        icono: "camabaja",
      },
    ],
    seo: {
      titulo: "Alquiler de volquetas, grúas y camabajas en Antioquia",
      descripcion:
        "Volquetas de 7 a 20 m³, grúas de hasta 100 toneladas, planchones y camabajas de 20 a 60 toneladas para transporte de maquinaria y materiales en Antioquia.",
      h1: "Alquiler de volquetas, grúas y transporte de maquinaria en Antioquia",
      introduccion:
        "Movilizamos, cargamos y elevamos lo que su obra necesita: materiales en volqueta, izaje con grúa y traslado de maquinaria pesada en planchón o camabaja.",
    },
  },
  {
    slug: "equipos-para-losas",
    codigo: "03",
    nombre: "Equipos para losas",
    subtitulo: "Sistemas seguros y eficientes para la construcción de losas.",
    frase: "Cada detalle cuenta para un trabajo seguro y eficiente.",
    icono: "puntal",
    cifra: {
      tipo: "texto",
      texto: "Correas, portacorreas, sopandas, puntales y tableros",
      etiqueta: "Componentes del sistema de losa",
    },
    equipos: [
      { nombre: "Correas", descripcion: "Soportan el peso de la losa.", icono: "correa" },
      {
        nombre: "Portacorreas",
        descripcion: "Distribuyen la carga de manera uniforme.",
        icono: "correa",
      },
      { nombre: "Sopandas", descripcion: "Diferentes alturas y capacidades.", icono: "puntal" },
      {
        nombre: "Puntales / tacos",
        descripcion: "Estabilidad y seguridad en la estructura.",
        icono: "puntal",
      },
      {
        nombre: "Tableros",
        descripcion: "Superficies resistentes y de alta durabilidad.",
        icono: "encofrado",
      },
    ],
    categoriaGaleria: "losas",
    seo: {
      titulo: "Alquiler de puntales, correas y tableros para losas",
      descripcion:
        "Alquiler de equipos para losas en Envigado y Medellín: puntales metálicos, sopandas, correas, portacorreas y tableros resistentes. Inventario disponible en bodega.",
      h1: "Equipos para losas: puntales, correas y tableros",
      introduccion:
        "Sistemas seguros y eficientes para la construcción de losas: puntales y sopandas que dan estabilidad, correas y portacorreas que reparten la carga y tableros de alta durabilidad.",
    },
  },
  {
    slug: "encofrados-y-formaleteria",
    codigo: "04",
    nombre: "Encofrados y formaletería",
    subtitulo: "Sistemas versátiles y de alta calidad para todo tipo de estructuras.",
    frase: "Precisión y calidad en cada estructura.",
    icono: "encofrado",
    cifra: {
      tipo: "texto",
      texto: "Columnas, vigas y muros",
      etiqueta: "Encofrados metálicos y de madera",
    },
    equipos: [
      {
        nombre: "Encofrados metálicos y de madera",
        descripcion: "Sistemas versátiles para todo tipo de estructuras.",
        icono: "encofrado",
      },
      { nombre: "Formaletería", descripcion: "Para columnas, vigas y muros.", icono: "encofrado" },
      { nombre: "Tableros", descripcion: "Resistentes y reutilizables.", icono: "encofrado" },
      { nombre: "Accesorios", descripcion: "Abrazaderas, cuñas, puntales y más.", icono: "puntal" },
    ],
    categoriaGaleria: "encofrados",
    seo: {
      titulo: "Encofrados y formaletería para columnas, vigas y muros",
      descripcion:
        "Alquiler de encofrados metálicos y de madera, formaletería para columnas, vigas y muros, tableros reutilizables y accesorios en Envigado, Medellín y Antioquia.",
      h1: "Encofrados y formaletería para columnas, vigas y muros",
      introduccion:
        "Formaletas metálicas y de madera, tableros reutilizables y accesorios —abrazaderas, cuñas y puntales— para vaciar estructuras con precisión.",
    },
  },
  {
    slug: "andamiaje",
    codigo: "05",
    nombre: "Andamiaje",
    subtitulo: "Seguridad y soporte en cada nivel.",
    icono: "andamio",
    cifra: { tipo: "texto", texto: "Fachada y en torre", etiqueta: "Andamios certificados" },
    sello: "CERTIFICADOS",
    equipos: [
      {
        nombre: "Andamios certificados",
        descripcion: "Seguridad y soporte en cada nivel.",
        icono: "andamio",
      },
      {
        nombre: "Fachada y en torre",
        descripcion: "Configuraciones para cada frente de obra.",
        icono: "andamio",
      },
      {
        nombre: "Accesorios y complementos",
        descripcion: "Todo lo necesario para armar y asegurar.",
        icono: "puntal",
      },
      {
        nombre: "Montaje y asesoría técnica",
        descripcion: "Acompañamiento técnico en el armado.",
        icono: "engranaje",
      },
    ],
    categoriaGaleria: "andamiaje",
    seo: {
      titulo: "Alquiler de andamios certificados en Envigado y Medellín",
      descripcion:
        "Alquiler de andamios certificados de fachada y en torre, accesorios y complementos, con montaje y asesoría técnica en Envigado, Medellín y Antioquia.",
      h1: "Alquiler de andamios certificados",
      introduccion:
        "Andamios certificados de fachada y en torre, con sus accesorios y complementos, y montaje con asesoría técnica para trabajar seguro en cada nivel.",
    },
  },
  {
    slug: "otros-equipos",
    codigo: "06",
    nombre: "Otros equipos y accesorios",
    subtitulo: "Todo lo que necesita para complementar su proyecto.",
    frase: "Soluciones completas para todas sus necesidades.",
    icono: "pluma",
    cifra: {
      tipo: "cifra",
      valor: 250,
      unidad: "KG",
      etiqueta: "Capacidad de las plumas de cargue",
    },
    sello: "CAP. MÁX 250 KG",
    equipos: [
      {
        nombre: "Plumas de cargue",
        rango: "Hasta 250 kg",
        descripcion: "Para trabajo en alturas y lugares de difícil acceso.",
        icono: "pluma",
      },
      { nombre: "Generadores", descripcion: "De diferentes capacidades.", icono: "generador" },
      { nombre: "Compresores", descripcion: "Para herramientas neumáticas.", icono: "compresor" },
      { nombre: "Vibradores", descripcion: "Para concreto.", icono: "generador" },
      { nombre: "Herramientas", descripcion: "Eléctricas y manuales.", icono: "engranaje" },
      {
        nombre: "Equipos menores",
        descripcion: "Cortadoras, mezcladoras, rompepavimento, etc.",
        icono: "mezcladora",
      },
    ],
    categoriaGaleria: "otros",
    seo: {
      titulo: "Plumas de cargue, generadores y equipos menores",
      descripcion:
        "Alquiler de plumas de cargue de hasta 250 kg, generadores, compresores, vibradores para concreto, herramientas y equipos menores en Envigado y Medellín.",
      h1: "Otros equipos y accesorios para obra",
      introduccion:
        "Plumas de cargue para trabajo en alturas, generadores, compresores, vibradores para concreto, herramientas eléctricas y manuales y equipos menores: todo lo que complementa su proyecto.",
    },
  },
];

export function lineaPorSlug(slug: string): LineaDeServicio | undefined {
  return lineasDeServicio.find((l) => l.slug === slug);
}
