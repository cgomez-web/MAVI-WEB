import { Fragment } from "react";
import { home } from "@/content/home";
import { urlWhatsApp } from "@/content/contacto";

/**
 * Hero. El titular se anima solo con CSS (palabras que caen y asientan) para no depender de la
 * hidratación: es el elemento LCP.
 */
export function Hero() {
  const { hero } = home;
  let indice = 0;
  const totalPalabras = hero.titular.join(" ").split(" ").length;

  return (
    <section
      id="inicio"
      aria-labelledby="titulo-hero"
      data-fase="inicio"
      data-ventana-3d=""
      className="relative flex min-h-[100svh] flex-col justify-end pt-[calc(var(--header-h)+1.5rem)] pb-[max(1.5rem,5vh)] md:pt-[calc(var(--header-h)+3rem)]"
    >
      <p className="solo-lectores">{hero.descripcionEscena}</p>
      <div className="reticula">
        <p className="mono-etiqueta text-brand-yellow col-span-12 mb-4 md:col-span-7 md:mb-6">
          {hero.eyebrow}
        </p>
        <h1
          id="titulo-hero"
          className="titular-peso titular-hero font-display col-span-12 font-black [letter-spacing:-0.035em] uppercase"
          style={{ ["--n" as string]: totalPalabras }}
        >
          {hero.titular.map((linea, l) => (
            // Dos voces del mismo eje wdth: línea 1 extendida, línea 2 condensada y en amarillo.
            <span
              key={linea}
              className={`linea ${
                l === 0
                  ? "[font-stretch:112%]"
                  : "text-brand-yellow [font-stretch:66%] md:pl-[calc((100%-11*var(--gutter))/12+var(--gutter))]"
              }`}
            >
              {linea.split(" ").map((palabra, j, palabras) => {
                const i = indice++;
                // Cortes de línea fijos (4 renglones en móvil, 2 en escritorio): la altura del titular
                // no depende de la fuente cargada, así el cambio de fuente no desplaza el hero (CLS).
                const corteMovil = j === Math.ceil(palabras.length / 2) - 1;
                return (
                  <Fragment key={`${palabra}-${i}`}>
                    <span className="palabra" style={{ ["--i" as string]: i }}>
                      {palabra}{" "}
                    </span>
                    {corteMovil ? <br className="md:hidden" /> : null}
                  </Fragment>
                );
              })}
            </span>
          ))}
          <span className="base" aria-hidden="true" />
        </h1>

        <p className="text-1 text-bone/90 md:text-2 col-span-12 mt-6 max-w-[52ch] md:col-span-6 md:mt-8">
          {hero.entradilla}
        </p>

        <div className="col-span-12 mt-7 flex flex-wrap items-center gap-4 md:col-span-7 md:mt-10 md:gap-5">
          <a
            href={urlWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-primario text-1"
          >
            {hero.ctaPrimario}
            <span aria-hidden="true">→</span>
          </a>
          <a href="#servicios" className="boton boton-secundario text-1">
            {hero.ctaSecundario}
          </a>
        </div>

        <ul
          className="mono-etiqueta text-concrete-light col-span-12 hidden flex-wrap gap-x-6 gap-y-2 md:col-span-5 md:col-start-8 md:flex md:justify-end md:self-end"
          aria-label="Datos clave"
        >
          {hero.ficha.map((dato) => (
            <li key={dato}>{dato}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
