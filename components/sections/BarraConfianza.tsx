import { home } from "@/content/home";
import { textosInicio } from "@/content/interfaz";
import { Odometro } from "@/components/ui/Odometro";

export function BarraConfianza() {
  return (
    <section aria-label={textosInicio.confianza} className="border-line bg-ink relative border-y-2">
      <ul className="reticula py-0">
        {home.confianza.map((item, i) => (
          // Rejilla 2 × 2 hasta xl: en cuartos de columna, a 1024–1279 px (iPad en horizontal),
          // «Acompañamiento» se salía de la pantalla y el texto de «+15 años» cruzaba el filete.
          <li
            key={item.texto}
            className={`border-line col-span-12 flex min-w-0 items-end gap-4 py-7 sm:col-span-6 xl:col-span-3 ${
              i > 0 ? "border-t-2 sm:border-t-0" : ""
            } ${i % 2 === 1 ? "sm:border-l-2 sm:pl-[var(--gutter)]" : ""} ${i >= 1 ? "xl:border-l-2 xl:pl-[var(--gutter)]" : ""} ${
              i >= 2 ? "sm:border-t-2 xl:border-t-0" : ""
            }`}
          >
            {"valor" in item ? (
              <>
                <span className="font-display text-brand-yellow text-[clamp(4rem,2rem+4vw,6.5rem)] leading-[0.8] font-black [letter-spacing:-0.04em] [font-stretch:100%] xl:text-[clamp(4rem,1rem+4vw,6.5rem)]">
                  <Odometro
                    valor={item.valor}
                    prefijo={"prefijo" in item ? item.prefijo : undefined}
                  />
                </span>
                <span className="pb-1">
                  <span className="mono-etiqueta text-brand-yellow block">{item.unidad}</span>
                  <span className="text-0 text-concrete-light mt-1 block max-w-[24ch] text-pretty">
                    {item.texto}
                  </span>
                </span>
              </>
            ) : (
              <span>
                <span className="font-display block text-[clamp(1.625rem,0.5rem+1.75vw,2.25rem)] leading-none font-extrabold [font-stretch:80%]">
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
