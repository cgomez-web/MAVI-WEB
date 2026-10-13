import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mensajeWhatsApp, urlWhatsApp } from "@/content/contacto";
import { avisoPestanaNueva } from "@/content/navegacion";
import { lineaPorSlug, lineasDeServicio, type LineaDeServicio } from "@/content/servicios";
import { detalleDeServicio, textosFichaServicio as t } from "@/content/servicios-detalle";
import { paginas } from "@/content/sitio";
import { fotosDeCategoria } from "@/lib/galeria";
import { jsonLdMigas, jsonLdServicio } from "@/lib/jsonld";
import { metaPagina } from "@/lib/metadatos";
import { JsonLd } from "@/components/seo/JsonLd";
import { LineaServicio } from "@/components/sections/LineaServicio";
import { Cotizacion } from "@/components/sections/Cotizacion";
import { FotoBodega } from "@/components/ui/FotoBodega";
import { Icono } from "@/components/icons/Icono";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const linea = lineaPorSlug(slug);
  // Slug desconocido: los mismos metadatos de la 404 (sin canonical ni og:url heredados del layout).
  if (!linea)
    return metaPagina({
      titulo: paginas.noEncontrada.titulo,
      descripcion: paginas.noEncontrada.descripcion,
    });
  // La imagen OG la genera app/servicios/[slug]/opengraph-image.tsx (una por línea).
  return metaPagina({
    titulo: linea.seo.titulo,
    descripcion: linea.seo.descripcion,
    ruta: `/servicios/${linea.slug}`,
    imagen: "segmento",
  });
}

/** Equipos de la línea citados por un paso de la guía (el rango y el uso salen del brochure). */
function equiposDelPaso(linea: LineaDeServicio, nombres: string[]) {
  return nombres.flatMap((n) => linea.equipos.filter((e) => e.nombre === n));
}

export default async function PaginaServicio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const linea = lineaPorSlug(slug);
  if (!linea) notFound();

  const detalle = detalleDeServicio(linea.slug);
  const fotos = fotosDeCategoria(linea.categoriaGaleria);
  const otras = lineasDeServicio.filter((l) => l.slug !== linea.slug);
  const mensaje = mensajeWhatsApp(linea.nombre);

  return (
    <>
      <section
        className="con-grano relative pt-[calc(var(--header-h)+4rem)] pb-16"
        aria-labelledby="titulo-pagina"
      >
        <div className="reticula gap-y-6">
          <nav aria-label={t.migas.etiqueta} className="mono-etiqueta text-concrete col-span-12">
            <ol className="flex flex-wrap gap-2">
              <li>
                <Link href="/" className="enlace-cinta">
                  {t.migas.inicio}
                </Link>{" "}
                /
              </li>
              <li>
                <Link href="/servicios" className="enlace-cinta">
                  {t.migas.servicios}
                </Link>{" "}
                /
              </li>
              <li aria-current="page" className="text-bone">
                {linea.nombre}
              </li>
            </ol>
          </nav>
          <p className="mono-etiqueta text-brand-yellow col-span-12">
            {t.linea} {linea.codigo} · {linea.cifra.etiqueta}
          </p>
          {/* En móvil el mínimo del tamaño baja de 44 a 36 px: "FORMALETERÍA" y "CERTIFICADOS" no
              caben a 44 px en 320–356 px y ensanchaban la página. */}
          <h1
            id="titulo-pagina"
            className="text-5 col-span-12 uppercase [font-stretch:92%] max-sm:text-[length:clamp(2.25rem,1rem+6.6vw,2.75rem)] lg:col-span-10"
          >
            {linea.seo.h1}
          </h1>
          <p className="text-2 text-bone/90 col-span-12 max-w-[60ch] md:col-span-7">
            {linea.seo.introduccion}
          </p>
          <div className="col-span-12 flex items-end justify-start gap-4 md:col-span-5 md:justify-end">
            <Icono id={linea.icono} className="text-brand-yellow h-24 w-24 md:h-32 md:w-32" />
          </div>
        </div>
      </section>

      <LineaServicio linea={linea} variante="pagina" nivelTitulo="h2" />

      {fotos.length > 3 ? (
        <section aria-labelledby="titulo-fotos" className="py-16">
          <div className="reticula gap-y-8">
            <h2 id="titulo-fotos" className="text-4 col-span-12 uppercase [font-stretch:85%]">
              {t.fotos(linea.nombre)}
            </h2>
            {fotos.slice(3).map((f) => (
              <figure key={f.id} className="col-span-12 sm:col-span-6 lg:col-span-4">
                <FotoBodega
                  foto={f}
                  proporcion="4 / 3"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                />
                <figcaption className="mono-etiqueta text-concrete mt-2">{f.titulo}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {detalle ? (
        <section aria-labelledby="titulo-guia" className="border-line border-t-2 py-16 md:py-24">
          <div className="reticula gap-y-8">
            <p className="mono-etiqueta text-brand-yellow col-span-12 md:col-span-3">
              {t.guia.etiqueta}
            </p>
            <h2
              id="titulo-guia"
              className="text-4 col-span-12 uppercase [font-stretch:85%] md:col-span-9"
            >
              {detalle.guia.titulo}
            </h2>
            <ol className="border-line col-span-12 border-t-2 md:col-span-9 md:col-start-4">
              {detalle.guia.pasos.map((paso, i) => (
                <li
                  key={paso.necesidad}
                  className="border-line grid grid-cols-12 gap-x-[var(--gutter)] gap-y-3 border-b-2 py-6"
                >
                  <span
                    className="cifras text-concrete col-span-2 md:col-span-1"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="col-span-10 md:col-span-5">
                    <p className="mono-etiqueta text-concrete">{t.guia.necesidad}</p>
                    <p className="text-1 text-bone/90 mt-1">{paso.necesidad}</p>
                  </div>
                  <div className="col-span-10 col-start-3 md:col-span-6 md:col-start-auto">
                    <p className="mono-etiqueta text-concrete">{t.guia.equipo}</p>
                    {equiposDelPaso(linea, paso.equipos).map((e) => (
                      <p key={e.nombre} className="mt-1">
                        <span className="font-display text-2 block font-bold uppercase [font-stretch:85%]">
                          {e.nombre}
                        </span>
                        {e.rango ? (
                          <span className="cifras text-1 text-brand-yellow block">{e.rango}</span>
                        ) : null}
                        <span className="text-0 text-concrete-light block">{e.descripcion}</span>
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {detalle ? (
        <section
          aria-labelledby="titulo-antes-de-cotizar"
          className="con-grano bg-ink-2 border-line relative border-y-2 py-16 md:py-20"
        >
          <div className="reticula gap-y-8">
            <div className="col-span-12 md:col-span-5">
              <p className="mono-etiqueta text-brand-yellow">{t.cotizar.etiqueta}</p>
              <h2
                id="titulo-antes-de-cotizar"
                className="text-3 mt-4 [overflow-wrap:anywhere] uppercase [font-stretch:85%]"
              >
                {t.cotizar.titulo(linea.nombre)}
              </h2>
              <p className="text-1 text-concrete-light mt-4 max-w-[46ch]">{t.cotizar.texto}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={urlWhatsApp(mensaje)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="boton boton-primario"
                >
                  {t.cotizar.whatsapp}
                  <span className="solo-lectores">{avisoPestanaNueva}</span>
                </a>
                <a href="#cotizacion" className="boton boton-secundario">
                  {t.cotizar.formulario}
                </a>
              </div>
            </div>
            <div className="col-span-12 md:col-span-6 md:col-start-7">
              <ul className="border-line border-t-2">
                {detalle.datosParaCotizar.map((dato) => (
                  <li key={dato} className="border-line text-1 flex gap-4 border-b-2 py-4">
                    <span className="cifras text-brand-yellow shrink-0" aria-hidden="true">
                      —
                    </span>
                    <span>{dato}</span>
                  </li>
                ))}
              </ul>
              <p className="mono-etiqueta text-concrete mt-8">{t.zona.etiqueta}</p>
              <p className="text-0 text-concrete-light mt-2 max-w-[56ch]">{t.zona.texto()}</p>
            </div>
          </div>
        </section>
      ) : null}

      {detalle && detalle.preguntas.length > 0 ? (
        <section aria-labelledby="titulo-preguntas-linea" className="py-16 md:py-24">
          <div className="reticula gap-y-10">
            <h2
              id="titulo-preguntas-linea"
              className="text-3 col-span-12 uppercase [font-stretch:85%] md:col-span-4"
            >
              {t.preguntas(linea.nombre)}
            </h2>
            <div className="col-span-12 md:col-span-8">
              {detalle.preguntas.map((p) => (
                <details key={p.pregunta} className="group border-line border-b-2">
                  <summary className="font-display text-2 flex cursor-pointer list-none items-start justify-between gap-6 py-5 font-bold [font-stretch:88%] [&::-webkit-details-marker]:hidden">
                    {p.pregunta}
                    <span
                      aria-hidden="true"
                      className="cifras text-brand-yellow mt-1 transition-transform duration-[var(--dur-ui)] ease-[var(--ease-weight)] group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-concrete-light max-w-[62ch] pb-6">{p.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <nav aria-labelledby="titulo-otras" className="border-line border-t-2 py-16">
        <div className="reticula gap-y-6">
          <h2 id="titulo-otras" className="mono-etiqueta text-brand-yellow col-span-12">
            {t.otras}
          </h2>
          <ul className="col-span-12 grid grid-cols-1 gap-x-[var(--gutter)] sm:grid-cols-2 lg:grid-cols-3">
            {otras.map((l) => (
              <li key={l.slug} className="border-line border-b-2">
                <Link
                  href={`/servicios/${l.slug}`}
                  className="hover:text-brand-yellow flex items-center gap-4 py-4"
                >
                  <Icono id={l.icono} className="text-brand-yellow h-9 w-9 shrink-0" />
                  <span className="font-display text-2 font-bold uppercase [font-stretch:80%]">
                    {l.nombre}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="col-span-12">
            <Link href="/servicios" className="enlace-cinta mono-etiqueta">
              {t.todas}
            </Link>
          </p>
        </div>
      </nav>

      <Cotizacion />

      <JsonLd datos={jsonLdServicio(linea)} />
      <JsonLd
        datos={jsonLdMigas([
          { nombre: t.migas.inicio, ruta: "/" },
          { nombre: t.migas.servicios, ruta: "/servicios" },
          { nombre: linea.nombre, ruta: `/servicios/${linea.slug}` },
        ])}
      />
    </>
  );
}
