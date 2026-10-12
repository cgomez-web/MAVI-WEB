import { preguntasFrecuentes } from "@/content/faq";

/** Preguntas frecuentes con <details> nativo (accesible por teclado, sin JS). */
export function PreguntasFrecuentes() {
  return (
    <section
      id="preguntas"
      aria-labelledby="titulo-preguntas"
      className="border-line bg-ink relative border-t-2 py-24"
    >
      <div className="reticula gap-y-10">
        <h2
          id="titulo-preguntas"
          className="text-4 col-span-12 uppercase [font-stretch:85%] md:col-span-4"
        >
          Preguntas frecuentes
        </h2>
        <div className="col-span-12 md:col-span-8">
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
