import { home } from "@/content/home";
import { Odometro } from "@/components/ui/Odometro";

export function BarraConfianza() {
  return (
    <section
      aria-label="Por qué confiar en MAVI"
      className="border-line bg-ink relative border-y-2"
    >
      <ul className="reticula py-0">
        {home.confianza.map((item, i) => (
          <li
            key={item.texto}
            className={`border-line col-span-12 flex items-end gap-4 py-7 sm:col-span-6 lg:col-span-3 ${
              i > 0 ? "border-t-2 sm:border-t-0" : ""
            } ${i % 2 === 1 ? "sm:border-l-2 sm:pl-[var(--gutter)]" : ""} ${i >= 1 ? "lg:border-l-2 lg:pl-[var(--gutter)]" : ""} ${
              i >= 2 ? "sm:border-t-2 lg:border-t-0" : ""
            }`}
          >
            {"valor" in item ? (
              <>
                <span className="font-display text-brand-yellow text-[clamp(4rem,2rem+4vw,6.5rem)] leading-[0.8] font-black [letter-spacing:-0.04em] [font-stretch:100%]">
                  <Odometro valor={item.valor} prefijo={item.prefijo} />
                </span>
                <span className="pb-1">
                  <span className="mono-etiqueta text-brand-yellow block">{item.unidad}</span>
                  <span className="text-0 text-concrete-light mt-1 block max-w-[20ch]">
                    {item.texto}
                  </span>
                </span>
              </>
            ) : (
              <span>
                <span className="font-display text-3 block font-extrabold [font-stretch:80%]">
                  {item.texto}
                </span>
                <span className="mono-etiqueta text-concrete-light mt-2 block">{item.detalle}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
