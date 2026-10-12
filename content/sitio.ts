/**
 * Identidad y metadatos globales.
 * TODO(owner): confirmar el dominio definitivo (variable NEXT_PUBLIC_SITE_URL).
 */
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
    anios: 15,
    texto:
      "Más de 15 años de experiencia en el sector de la construcción, infraestructura y desarrollo de proyectos.",
  },
  urlPorDefecto: "https://www.maviproyectos.com",
  descripcion:
    "Alquiler y suministro de maquinaria pesada, transporte y elevación, equipos para losas, encofrados y formaletería, andamiaje y equipos menores para construcción en Envigado, Medellín y Antioquia. Más de 15 años de experiencia.",
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

export function urlDelSitio(): string {
  const desdeEntorno = process.env.NEXT_PUBLIC_SITE_URL;
  return (desdeEntorno && desdeEntorno.length > 0 ? desdeEntorno : sitio.urlPorDefecto).replace(/\/$/, "");
}
