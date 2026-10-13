import Link from "next/link";
import { lineasDeServicio } from "@/content/servicios";
import { indiceServicios as t, textosFichaServicio } from "@/content/servicios-detalle";
import { paginas } from "@/content/sitio";
import { jsonLdIndiceServicios, jsonLdMigas } from "@/lib/jsonld";
import { metaPagina } from "@/lib/metadatos";
import { JsonLd } from "@/components/seo/JsonLd";
import { Cotizacion } from "@/components/sections/Cotizacion";
import { Icono } from "@/components/icons/Icono";

export const metadata = metaPagina({
  titulo: paginas.servicios.titulo,
  descripcion: paginas.servicios.descripcion,
  ruta: "/servicios",
});

/** Índice real de las seis líneas: destino de la miga "Servicios" y de quien recorta la URL. */
export default function PaginaServicios() {
  const migas = textosFichaServicio.migas;
  return (
    <>
      <section
        className="con-grano relative pt-[calc(var(--header-h)+4rem)] pb-16"
        aria-labelledby="titulo-pagina"
      >
        <div className="reticula gap-y-6">
          <nav aria-label={migas.etiqueta} className="mono-etiqueta text-concrete col-span-12">
            <ol className="flex flex-wrap gap-2">
              <li>
                <Link href="/" className="enlace-cinta">
                  {migas.inicio}
                </Link>{" "}
                /
              </li>
              <li aria-current="page" className="text-bone">
                {migas.servicios}
              </li>
            </ol>
          </nav>
          <p className="mono-etiqueta text-brand-yellow col-span-12">{t.eyebrow}</p>
          <h1
            id="titulo-pagina"
            className="text-5 col-span-12 uppercase [font-stretch:92%] max-sm:text-[length:clamp(2.25rem,1rem+6.6vw,2.75rem)] lg:col-span-10"
          >
            {t.h1}
          </h1>
          <p className="text-2 text-bone/90 col-span-12 max-w-[60ch] md:col-span-8">
            {t.introduccion()}
          </p>
        </div>
      </section>

      <ol className="border-line border-t-2">
        {lineasDeServicio.map((l) => (
          <li key={l.slug} className="border-line border-b-2">
            <article
              aria-labelledby={`indice-${l.slug}`}
              className="reticula items-start gap-y-6 py-10 md:py-14"
            >
              <span
                className="cifras text-2 text-concrete col-span-2 md:col-span-1"
                aria-hidden="true"
              >
                {l.codigo}
              </span>
              <div className="col-span-10 md:col-span-6">
                <Icono id={l.icono} className="text-brand-yellow h-12 w-12" />
                {/* En móvil el tamaño baja a 28–34 px: a 34 px "FORMALETERÍA" no cabe en la columna
                    a 320–344 px y se partía a mitad de palabra. */}
                <h2
                  id={`indice-${l.slug}`}
                  className="font-display text-4 mt-4 leading-none font-extrabold [overflow-wrap:anywhere] uppercase [font-stretch:85%] max-sm:text-[length:clamp(1.75rem,0.75rem+5vw,2.125rem)]"
                >
                  <Link href={`/servicios/${l.slug}`} className="hover:text-brand-yellow">
                    {l.nombre}
                  </Link>
                </h2>
                <p className="text-1 text-bone/90 mt-4 max-w-[46ch]">{l.subtitulo}</p>
                <p className="mono-etiqueta text-brand-yellow mt-4">
                  {l.cifra.tipo === "cifra"
                    ? `${l.cifra.prefijo ?? ""}${l.cifra.valor} ${l.cifra.unidad} · ${l.cifra.etiqueta}`
                    : `${l.cifra.etiqueta} · ${l.cifra.texto}`}
                </p>
                <Link href={`/servicios/${l.slug}`} className="boton boton-secundario mt-6">
                  {t.verFicha}
                  <span className="solo-lectores">: {l.nombre}</span>
                </Link>
              </div>
              <div className="col-span-12 md:col-span-5">
                <p className="mono-etiqueta text-concrete">{t.equipos}</p>
                <ul className="border-line mt-3 border-t-2">
                  {l.equipos.map((e) => (
                    <li
                      key={e.nombre}
                      className="border-line flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b py-3"
                    >
                      <span className="text-1 text-bone">{e.nombre}</span>
                      {e.rango ? (
                        <span className="cifras text-0 text-brand-yellow whitespace-nowrap">
                          {e.rango}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <Cotizacion />

      <JsonLd datos={jsonLdIndiceServicios()} />
      <JsonLd
        datos={jsonLdMigas([
          { nombre: migas.inicio, ruta: "/" },
          { nombre: migas.servicios, ruta: "/servicios" },
        ])}
      />
    </>
  );
}
