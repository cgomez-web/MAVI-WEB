/**
 * Identidad, metadatos globales y textos de cada página para buscadores y redes.
 * TODO(owner): confirmar el dominio definitivo (variable NEXT_PUBLIC_SITE_URL).
 */
import { contacto } from "./contacto";

/** Años de experiencia (brochure pág. 1). Todas las menciones de "+15 años" salen de aquí. */
const ANIOS = 15;

export const sitio = {
  nombre: "MAVI Proyectos e Inversiones",
  nombreCorto: "MAVI",
  lema: "Facilitamos su avance",
  frases: {
    compromiso: "Su proyecto, nuestro compromiso.",
    movimiento: "En movimiento para que su proyecto avance.",
    atencion: "Estamos listos para atenderle.",
    completas: "Soluciones completas para todas sus necesidades.",
  },
  experiencia: {
    anios: ANIOS,
    texto: `Más de ${ANIOS} años de experiencia en el sector de la construcción, infraestructura y desarrollo de proyectos.`,
  },
  urlPorDefecto: "https://www.maviproyectos.com",
  /**
   * Título del inicio en Google. Corto (≈ 470 px a 20 px Arial, Google muestra ≈ 580 px) y con la
   * palabra clave y "Envigado" al principio para que no queden en la parte recortada.
   */
  tituloInicio: "Alquiler de maquinaria y equipos en Envigado | MAVI",
  /** Meta description del inicio (≤ 155 caracteres: lo que Google alcanza a mostrar). */
  descripcion: `Alquiler de maquinaria pesada, volquetas, grúas, andamios certificados y formaletería en Envigado y Medellín. Más de ${ANIOS} años. Cotice por WhatsApp.`,
  palabrasClave: [
    "alquiler de maquinaria pesada en Envigado",
    "alquiler de maquinaria pesada en Medellín",
    "alquiler de andamios certificados",
    "encofrados y formaletería",
    "alquiler de volquetas y grúas Antioquia",
    "alquiler de puntales y equipos para losas",
    "alquiler de equipos para construcción",
  ],
  locale: "es-CO",
} as const;

/**
 * Título (va antes de "| MAVI" en la pestaña y en Google) y descripción de cada página.
 * Mantener el título por debajo de ~55 caracteres y la descripción por debajo de 155.
 */
export const paginas = {
  servicios: {
    titulo: "Alquiler de equipos para construcción: seis líneas",
    descripcion:
      "Maquinaria pesada, transporte y elevación, equipos para losas, encofrados y formaletería, andamiaje y otros equipos en alquiler en Envigado y Medellín.",
  },
  nosotros: {
    titulo: "Quiénes somos",
    descripcion: `Empresa de Envigado con más de ${ANIOS} años en construcción e infraestructura: alquiler de maquinaria, transporte, equipos para losas, formaletas y andamios.`,
  },
  contacto: {
    titulo: "Contacto y cotizaciones",
    descripcion: `Cotice maquinaria, transporte, equipos para losas, formaletería y andamios: WhatsApp ${contacto.telefono.visible}, ${contacto.direccion.linea}, ${contacto.direccion.ciudad}, ${contacto.direccion.departamento}.`,
  },
  privacidad: {
    titulo: "Política de tratamiento de datos personales",
    descripcion:
      "Cómo MAVI Proyectos e Inversiones trata sus datos personales conforme a la Ley 1581 de 2012 y cómo ejercer sus derechos de consulta, reclamo y supresión.",
  },
  noEncontrada: {
    titulo: "Página no encontrada",
    descripcion: "La página que busca no existe o cambió de dirección.",
  },
} as const;

/** Textos de las páginas de error (404, error de página y error global). */
export const textosSistema = {
  noEncontrada: {
    codigo: "404",
    titular: "Esta página no está en la obra",
    texto:
      "Puede que el enlace haya cambiado. Vuelva al inicio o revise nuestras líneas de servicio.",
    inicio: "Volver al inicio",
    servicios: "Ver equipos",
  },
  error: {
    codigo: "500",
    titular: "Algo se trabó en la obra",
    texto: "Intente de nuevo. Si necesita cotizar ya, escríbanos por WhatsApp.",
    reintentar: "Reintentar",
    whatsapp: "WhatsApp",
    inicio: "Inicio",
  },
  errorGlobal: {
    titular: "Algo salió mal",
    texto: `Intente de nuevo en unos segundos o escríbanos por WhatsApp al ${contacto.telefono.visible}.`,
    reintentar: "Reintentar",
  },
} as const;

export function urlDelSitio(): string {
  const desdeEntorno = process.env.NEXT_PUBLIC_SITE_URL;
  return (desdeEntorno && desdeEntorno.length > 0 ? desdeEntorno : sitio.urlPorDefecto).replace(
    /\/$/,
    "",
  );
}

/**
 * Analítica sin cookies (Plausible). Solo existe cuando están las DOS variables y el host es https;
 * si no, devuelve null y ni el layout carga el script ni la política de datos lo menciona.
 * NEXT_PUBLIC_PLAUSIBLE_HOST también lo usa middleware.ts para permitir el envío de eventos en
 * connect-src de la CSP. Vive aquí (sin dependencias de Node) para que content/legal.ts lo use.
 */
export function analiticaSinCookies(
  entorno: Record<string, string | undefined> = {
    NEXT_PUBLIC_PLAUSIBLE_HOST: process.env.NEXT_PUBLIC_PLAUSIBLE_HOST,
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  },
): { src: string; dominio: string } | null {
  const host = entorno.NEXT_PUBLIC_PLAUSIBLE_HOST?.trim().replace(/\/+$/, "");
  const dominio = entorno.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  if (!host || !dominio || !/^https:\/\/[^/\s]+$/.test(host)) return null;
  return { src: `${host}/js/script.js`, dominio };
}
