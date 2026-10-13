import { preguntasFrecuentes } from "@/content/faq";
import { home } from "@/content/home";

/** Preguntas frecuentes con <details> nativo (accesible por teclado, sin JS). */
export function PreguntasFrecuentes() {
  return (
    <section
      id="preguntas"
      aria-labelledby="titulo-preguntas"
      className="border-line bg-ink relative border-t-2 py-24"
      data-revelar="cinta"
    >
      {/* El título va encima de la lista hasta lg: en 4/12 "Frecuentes" no cabía y se montaba
          sobre las preguntas; desde lg la columna de 5/12 ya le da cabida. */}
      <div className="reticula gap-y-10">
        <h2
          id="titulo-preguntas"
          className="text-4 col-span-12 uppercase [font-stretch:85%] lg:col-span-5"
        >
          {home.preguntas.titular}
        </h2>
        <div className="col-span-12 lg:col-span-7">
          {preguntasFrecuentes.map((p) => (
            <details key={p.pregunta} className="group border-line border-b-2">
              <summary className="font-display text-2 flex cursor-pointer list-none items-start justify-between gap-6 py-5 font-bold [font-stretch:88%] [&::-webkit-details-marker]:hidden">
                {p.pregunta}
                <span
                  aria-hidden="true"
                  className="cifras text-brand-yellow mt-1 transition-transform duration-[var(--dur-ui)] ease-[var(--ease-weight)] group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-concrete-light max-w-[62ch] pb-6">{p.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
