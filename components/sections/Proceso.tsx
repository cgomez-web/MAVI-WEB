import { home } from "@/content/home";
import { pasos } from "@/content/proceso";

/** Cómo trabajamos: cuatro pasos sobre una cinta métrica. */
export function Proceso() {
  return (
    <section
      id="proceso"
      aria-labelledby="titulo-proceso"
      className="bg-ink relative py-24 md:py-32"
      data-revelar="cinta"
    >
      <div className="reticula items-end gap-y-6">
        <p className="mono-etiqueta text-brand-yellow col-span-12 md:col-span-3">
          {home.proceso.eyebrow}
        </p>
        <h2
          id="titulo-proceso"
          className="text-5 col-span-12 uppercase [font-stretch:88%] md:col-span-9"
        >
          {home.proceso.titular}
        </h2>
      </div>

      <div className="contenedor mt-16">
        <div className="regla text-bone" aria-hidden="true" />
        {/* 2×2 hasta xl: con 4 columnas a 1024–1279 px "Disponibilidad" no cabía en la suya. */}
        <ol className="grid grid-cols-1 gap-[var(--gutter)] sm:grid-cols-2 xl:grid-cols-4">
          {pasos.map((p, i) => (
            <li
              key={p.codigo}
              className="border-line relative border-l-2 pt-8 pb-4 pl-5 lg:pt-10"
              data-revelar="sube"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <span
                aria-hidden="true"
                className="bg-brand-yellow absolute top-0 -left-[7px] h-3 w-3"
              />
              <span className="cifras text-brand-yellow block text-[clamp(3rem,2rem+3vw,5rem)] leading-none font-bold">
                {p.codigo}
              </span>
              <h3 className="text-3 mt-4 uppercase [font-stretch:80%] xl:[font-stretch:68%]">
                {p.titulo}
              </h3>
              <p className="text-concrete-light mt-3 max-w-[32ch]">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
