import { home } from "@/content/home";
import { pasos } from "@/content/proceso";

/** Cómo trabajamos: cuatro pasos sobre una cinta métrica. */
export function Proceso() {
  return (
    <section id="proceso" aria-labelledby="titulo-proceso" className="relative bg-ink py-24 md:py-32">
      <div className="reticula items-end gap-y-6">
        <p className="mono-etiqueta col-span-12 text-brand-yellow md:col-span-3">{home.proceso.eyebrow}</p>
        <h2 id="titulo-proceso" className="col-span-12 text-5 uppercase [font-stretch:88%] md:col-span-9">
          {home.proceso.titular}
        </h2>
      </div>

      <div className="contenedor mt-16">
        <div className="regla text-bone" aria-hidden="true" />
        <ol className="grid grid-cols-1 gap-[var(--gutter)] sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map((p, i) => (
            <li
              key={p.codigo}
              className="relative border-l-2 border-line pb-4 pl-5 pt-8 lg:pt-10"
              data-revelar="sube"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <span aria-hidden="true" className="absolute -left-[7px] top-0 h-3 w-3 bg-brand-yellow" />
              <span className="cifras block text-[clamp(3rem,2rem+3vw,5rem)] font-bold leading-none text-brand-yellow">
                {p.codigo}
              </span>
              <h3 className="mt-4 text-3 uppercase [font-stretch:80%]">{p.titulo}</h3>
              <p className="mt-3 max-w-[32ch] text-concrete-light">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
