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
      className="relative flex min-h-[100svh] flex-col justify-end pb-[max(2.5rem,6vh)] pt-[calc(var(--header-h)+3rem)]"
    >
      <p className="solo-lectores">{hero.descripcionEscena}</p>
      <div className="reticula">
        <p className="mono-etiqueta col-span-12 mb-6 text-brand-yellow md:col-span-7">{hero.eyebrow}</p>
        <h1
          id="titulo-hero"
          className="titular-peso col-span-12 font-display text-hero font-black uppercase [letter-spacing:-0.035em]"
          style={{ ["--n" as string]: totalPalabras }}
        >
          {hero.titular.map((linea, l) => (
            // Dos voces del mismo eje wdth: línea 1 extendida, línea 2 condensada y en amarillo.
            <span
              key={linea}
              className={`linea ${
                l === 0 ? "[font-stretch:112%]" : "text-brand-yellow [font-stretch:66%] md:pl-[calc((100%-11*var(--gutter))/12+var(--gutter))]"
              }`}
            >
              {linea.split(" ").map((palabra) => {
                const i = indice++;
                return (
                  <span key={`${palabra}-${i}`} className="palabra" style={{ ["--i" as string]: i }}>
                    {palabra}{" "}
                  </span>
                );
              })}
            </span>
          ))}
          <span className="base" aria-hidden="true" />
        </h1>

        <p className="col-span-12 mt-8 max-w-[52ch] text-2 text-bone/90 md:col-span-6">{hero.entradilla}</p>

        <div className="col-span-12 mt-10 flex flex-wrap items-center gap-5 md:col-span-7">
          <a href={urlWhatsApp()} target="_blank" rel="noopener noreferrer" className="boton boton-primario text-1">
            {hero.ctaPrimario}
            <span aria-hidden="true">→</span>
          </a>
          <a href="#servicios" className="boton boton-secundario text-1">
            {hero.ctaSecundario}
          </a>
        </div>

        <ul
          className="mono-etiqueta col-span-12 mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t-2 border-bone/30 pt-4 text-concrete-light md:col-span-5 md:col-start-8 md:mt-0 md:self-end md:justify-end md:border-t-0 md:pt-0"
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
