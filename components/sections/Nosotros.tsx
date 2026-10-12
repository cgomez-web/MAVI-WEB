import { empresa } from "@/content/empresa";
import { home } from "@/content/home";
import { Icono } from "@/components/icons/Icono";

const ICONOS_VALORES = ["engranaje", "andamio", "puntal", "camabaja"] as const;

export function Nosotros({ nivel = "h2", id = "nosotros" }: { nivel?: "h1" | "h2"; id?: string }) {
  const Titulo = nivel;
  return (
    <section id={id} aria-labelledby={`titulo-${id}`} className="con-grano relative bg-ink py-24 md:py-32">
      <div className="reticula gap-y-10">
        <p className="mono-etiqueta col-span-12 text-brand-yellow md:col-span-3">{home.nosotros.eyebrow}</p>
        <Titulo id={`titulo-${id}`} className="col-span-12 text-5 uppercase [font-stretch:92%] md:col-span-9">
          {home.nosotros.titular}
        </Titulo>
        <p className="col-span-12 max-w-[50ch] text-2 text-bone/90 md:col-span-6 md:col-start-4" data-revelar="sube">
          {empresa.presentacion}
        </p>

        <ul className="col-span-12 grid grid-cols-1 gap-[var(--gutter)] sm:grid-cols-2 md:col-span-9 md:col-start-4">
          {empresa.valores.map((v, i) => (
            <li
              key={v.nombre}
              className={`flex gap-5 border-t-2 border-line pt-6 ${i % 2 === 1 ? "sm:translate-y-12" : ""}`}
              data-revelar="sube"
            >
              <Icono id={ICONOS_VALORES[i] ?? "engranaje"} className="h-12 w-12 shrink-0 text-brand-yellow" />
              <div>
                <h3 className="text-3 uppercase [font-stretch:80%]">{v.nombre}</h3>
                <p className="mt-2 text-concrete-light">{v.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="reticula mt-28 gap-y-[var(--gutter)]">
        <div className="col-span-12 border-[3px] border-brand-yellow bg-ink-2 p-8 md:col-span-6 md:p-12" data-revelar="sube">
          <h3 className="mono-etiqueta text-brand-yellow">Nuestra misión</h3>
          <p className="mt-4 font-display text-3 font-bold leading-tight [font-stretch:88%]">{empresa.mision}</p>
        </div>
        <div className="sobre-claro col-span-12 bg-brand-yellow p-8 text-ink md:col-span-6 md:mt-16 md:p-12" data-revelar="sube">
          <h3 className="mono-etiqueta">Nuestra visión</h3>
          <p className="mt-4 font-display text-3 font-bold leading-tight [font-stretch:88%]">{empresa.vision}</p>
        </div>
        <p className="col-span-12 mt-12 font-display text-4 font-black uppercase italic text-brand-yellow [font-stretch:75%] md:col-span-8 md:col-start-3">
          {empresa.cierre}
        </p>
      </div>
    </section>
  );
}
