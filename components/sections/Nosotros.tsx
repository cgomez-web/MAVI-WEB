import { empresa } from "@/content/empresa";
import { home } from "@/content/home";
import { Icono } from "@/components/icons/Icono";

const ICONOS_VALORES = ["engranaje", "andamio", "puntal", "camabaja"] as const;

export function Nosotros({ nivel = "h2", id = "nosotros" }: { nivel?: "h1" | "h2"; id?: string }) {
  const Titulo = nivel;
  return (
    <section
      id={id}
      aria-labelledby={`titulo-${id}`}
      className="con-grano bg-ink relative py-24 md:py-32"
    >
      <div className="reticula gap-y-10">
        <p className="mono-etiqueta text-brand-yellow col-span-12 md:col-span-3">
          {home.nosotros.eyebrow}
        </p>
        <Titulo
          id={`titulo-${id}`}
          className="text-5 col-span-12 uppercase [font-stretch:92%] md:col-span-9"
        >
          {home.nosotros.titular}
        </Titulo>
        <p
          className="text-2 text-bone/90 col-span-12 max-w-[50ch] md:col-span-6 md:col-start-4"
          data-revelar="sube"
        >
          {empresa.presentacion}
        </p>

        <ul className="col-span-12 grid grid-cols-1 gap-[var(--gutter)] sm:grid-cols-2 md:col-span-9 md:col-start-4">
          {empresa.valores.map((v, i) => (
            <li
              key={v.nombre}
              className={`border-line flex gap-5 border-t-2 pt-6 ${i % 2 === 1 ? "sm:translate-y-12" : ""}`}
              data-revelar="sube"
            >
              <Icono
                id={ICONOS_VALORES[i] ?? "engranaje"}
                className="text-brand-yellow h-12 w-12 shrink-0"
              />
              <div>
                <h3 className="text-3 uppercase [font-stretch:80%]">{v.nombre}</h3>
                <p className="text-concrete-light mt-2">{v.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="reticula mt-28 gap-y-[var(--gutter)]">
        <div
          className="border-brand-yellow bg-ink-2 col-span-12 border-[3px] p-8 md:col-span-6 md:p-12"
          data-revelar="sube"
        >
          <h3 className="mono-etiqueta text-brand-yellow">Nuestra misión</h3>
          <p className="font-display text-3 mt-4 leading-tight font-bold [font-stretch:88%]">
            {empresa.mision}
          </p>
        </div>
        <div
          className="sobre-claro bg-brand-yellow text-ink col-span-12 p-8 md:col-span-6 md:mt-16 md:p-12"
          data-revelar="sube"
        >
          <h3 className="mono-etiqueta">Nuestra visión</h3>
          <p className="font-display text-3 mt-4 leading-tight font-bold [font-stretch:88%]">
            {empresa.vision}
          </p>
        </div>
        <p className="font-display text-4 text-brand-yellow col-span-12 mt-12 font-black uppercase italic [font-stretch:75%] md:col-span-8 md:col-start-3">
          {empresa.cierre}
        </p>
      </div>
    </section>
  );
}
