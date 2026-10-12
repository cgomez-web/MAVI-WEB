import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lineaPorSlug, lineasDeServicio } from "@/content/servicios";
import { fotosDeCategoria } from "@/lib/galeria";
import { jsonLdMigas, jsonLdServicio } from "@/lib/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { LineaServicio } from "@/components/sections/LineaServicio";
import { Cotizacion } from "@/components/sections/Cotizacion";
import { FotoBodega } from "@/components/ui/FotoBodega";
import { Icono } from "@/components/icons/Icono";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const linea = lineaPorSlug(slug);
  if (!linea) return {};
  return {
    title: linea.seo.titulo,
    description: linea.seo.descripcion,
    alternates: { canonical: `/servicios/${linea.slug}` },
    openGraph: { title: linea.seo.titulo, description: linea.seo.descripcion, url: `/servicios/${linea.slug}` },
  };
}

export default async function PaginaServicio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const linea = lineaPorSlug(slug);
  if (!linea) notFound();

  const fotos = fotosDeCategoria(linea.categoriaGaleria);
  const otras = lineasDeServicio.filter((l) => l.slug !== linea.slug);

  return (
    <>
      <section className="con-grano relative pb-16 pt-[calc(var(--header-h)+4rem)]" aria-labelledby="titulo-pagina">
        <div className="reticula gap-y-6">
          <nav aria-label="Migas de pan" className="mono-etiqueta col-span-12 text-concrete">
            <ol className="flex flex-wrap gap-2">
              <li>
                <Link href="/" className="enlace-cinta">
                  Inicio
                </Link>{" "}
                /
              </li>
              <li>
                <Link href="/#servicios" className="enlace-cinta">
                  Servicios
                </Link>{" "}
                /
              </li>
              <li aria-current="page" className="text-bone">
                {linea.nombre}
              </li>
            </ol>
          </nav>
          <p className="mono-etiqueta col-span-12 text-brand-yellow">
            Línea {linea.codigo} · {linea.cifra.etiqueta}
          </p>
          <h1 id="titulo-pagina" className="col-span-12 text-5 uppercase [font-stretch:92%] lg:col-span-10">
            {linea.seo.h1}
          </h1>
          <p className="col-span-12 max-w-[60ch] text-2 text-bone/90 md:col-span-7">{linea.seo.introduccion}</p>
          <div className="col-span-12 flex items-end justify-start gap-4 md:col-span-5 md:justify-end">
            <Icono id={linea.icono} className="h-24 w-24 text-brand-yellow md:h-32 md:w-32" />
          </div>
        </div>
      </section>

      <LineaServicio linea={linea} variante="pagina" nivelTitulo="h2" />

      {fotos.length > 3 ? (
        <section aria-labelledby="titulo-fotos" className="py-16">
          <div className="reticula gap-y-8">
            <h2 id="titulo-fotos" className="col-span-12 text-4 uppercase [font-stretch:85%]">
              Inventario real de {linea.nombre.toLowerCase()}
            </h2>
            {fotos.slice(3).map((f) => (
              <figure key={f.id} className="col-span-12 sm:col-span-6 lg:col-span-4">
                <FotoBodega foto={f} proporcion="4 / 3" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw" />
                <figcaption className="mono-etiqueta mt-2 text-concrete">{f.titulo}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <nav aria-labelledby="titulo-otras" className="border-t-2 border-line py-16">
        <div className="reticula gap-y-6">
          <h2 id="titulo-otras" className="mono-etiqueta col-span-12 text-brand-yellow">
            Otras líneas de servicio
          </h2>
          <ul className="col-span-12 grid grid-cols-1 gap-x-[var(--gutter)] sm:grid-cols-2 lg:grid-cols-3">
            {otras.map((l) => (
              <li key={l.slug} className="border-b-2 border-line">
                <Link href={`/servicios/${l.slug}`} className="flex items-center gap-4 py-4 hover:text-brand-yellow">
                  <Icono id={l.icono} className="h-9 w-9 shrink-0 text-brand-yellow" />
                  <span className="font-display text-2 font-bold uppercase [font-stretch:80%]">{l.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <Cotizacion />

      <JsonLd datos={jsonLdServicio(linea)} />
      <JsonLd
        datos={jsonLdMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Servicios", ruta: "/#servicios" },
          { nombre: linea.nombre, ruta: `/servicios/${linea.slug}` },
        ])}
      />
    </>
  );
}
