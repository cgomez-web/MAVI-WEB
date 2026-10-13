import Link from "next/link";
import { paginas, textosSistema } from "@/content/sitio";
import { metaPagina } from "@/lib/metadatos";
import { Icono } from "@/components/icons/Icono";

/**
 * Título propio (WCAG 2.4.2) y sin canonical ni og:url: la 404 no debe declararse como el inicio.
 * El `noindex` lo añade Next en las respuestas 404 (el layout ya no declara "index, follow").
 */
export const metadata = metaPagina({
  titulo: paginas.noEncontrada.titulo,
  descripcion: paginas.noEncontrada.descripcion,
});

export default function NoEncontrada() {
  const t = textosSistema.noEncontrada;
  return (
    <section
      className="con-grano flex min-h-[80svh] items-end pt-[calc(var(--header-h)+4rem)] pb-20"
      aria-labelledby="titulo-404"
    >
      <div className="reticula w-full gap-y-6">
        <p className="cifras text-figure text-brand-yellow col-span-12 leading-none font-bold">
          {t.codigo}
        </p>
        <h1
          id="titulo-404"
          className="text-4 col-span-12 uppercase [font-stretch:85%] md:col-span-8"
        >
          {t.titular}
        </h1>
        <p className="text-2 text-concrete-light col-span-12 max-w-[48ch] md:col-span-6">
          {t.texto}
        </p>
        <div className="col-span-12 flex flex-wrap gap-4">
          <Link href="/" className="boton boton-primario">
            {t.inicio}
          </Link>
          <Link href="/servicios" className="boton boton-secundario">
            {t.servicios}
          </Link>
        </div>
        <Icono id="puntal" className="text-concrete-dark col-span-12 mt-8 h-16 w-16" />
      </div>
    </section>
  );
}
