import { contacto } from "@/content/contacto";
import { preguntasFrecuentes } from "@/content/faq";
import type { LineaDeServicio } from "@/content/servicios";
import { sitio, urlDelSitio } from "@/content/sitio";

const idNegocio = () => `${urlDelSitio()}/#negocio`;

export function jsonLdNegocio() {
  const url = urlDelSitio();
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": idNegocio(),
    name: sitio.nombre,
    slogan: sitio.lema,
    description: sitio.descripcion,
    url,
    logo: `${url}/icon.svg`,
    image: `${url}/opengraph-image`,
    telephone: contacto.telefono.e164,
    email: `${contacto.correos[0].usuario}@${contacto.correos[0].dominio}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: contacto.direccion.linea,
      addressLocality: contacto.direccion.ciudad,
      addressRegion: contacto.direccion.departamento,
      addressCountry: contacto.direccion.codigoPais,
    },
    areaServed: contacto.zonaDeServicio.map((nombre) => ({ "@type": "AdministrativeArea", name: nombre })),
    sameAs: [contacto.instagram.url],
    knowsLanguage: "es-CO",
    // El horario solo se publica en datos estructurados cuando el dueño lo confirme
    // (content/contacto.ts → horario.aConfirmar = false). Ver docs/PENDIENTES.md.
    ...(contacto.horario.aConfirmar
      ? {}
      : {
          openingHoursSpecification: contacto.horario.especificacion.map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.dias,
            opens: h.abre,
            closes: h.cierra,
          })),
        }),
  };
}

export function jsonLdServicio(linea: LineaDeServicio) {
  const url = urlDelSitio();
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}/servicios/${linea.slug}#servicio`,
    name: linea.seo.h1,
    serviceType: linea.nombre,
    description: linea.seo.descripcion,
    url: `${url}/servicios/${linea.slug}`,
    provider: { "@id": idNegocio() },
    areaServed: contacto.zonaDeServicio.map((nombre) => ({ "@type": "AdministrativeArea", name: nombre })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: linea.nombre,
      itemListElement: linea.equipos.map((e) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: e.nombre,
          description: e.rango ? `${e.rango}. ${e.descripcion}` : e.descripcion,
        },
      })),
    },
  };
}

export function jsonLdMigas(migas: Array<{ nombre: string; ruta: string }>) {
  const url = urlDelSitio();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: migas.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nombre,
      item: `${url}${m.ruta}`,
    })),
  };
}

export function jsonLdPreguntas() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntasFrecuentes.map((p) => ({
      "@type": "Question",
      name: p.pregunta,
      acceptedAnswer: { "@type": "Answer", text: p.respuesta },
    })),
  };
}

/** Serializa evitando que un "</script>" dentro de los datos cierre la etiqueta. */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
