import { empresa } from "@/content/empresa";
import { home } from "@/content/home";
import { lineasDeServicio, type CifraDestacada } from "@/content/servicios";
import { Icono } from "@/components/icons/Icono";
import { FilaInclinable } from "@/components/ui/FilaInclinable";

/** Pista de la fila: la cifra del brochure ("330 HP · …") o, si no la hay, su dato textual. */
function pista(c: CifraDestacada) {
  return c.tipo === "cifra" ? `${c.prefijo ?? ""}${c.valor} ${c.unidad} · ${c.etiqueta}` : c.texto;
}

/**
 * Índice de las seis líneas: filas grandes (no una rejilla de tarjetas) que se inclinan en 3D
 * siguiendo el puntero y revelan su ficha técnica al hover / foco / toque.
 * El enlace cubre toda la fila (patrón "enlace estirado") pero su nombre accesible es solo la línea.
 *
 * Medidas: el nombre se dimensiona para que su palabra más larga ("Formaletería", 6,8 em a
 * wdth 78 %) quepa entera en su columna de 320 a 1440 px, y la ficha baja debajo del nombre
 * hasta lg (solo desde 1024 px hay sitio para ponerla al lado sin solaparse).
 */
export function IndiceServicios() {
  return (
    <section
      id="servicios"
      aria-labelledby="titulo-servicios"
      className="bg-ink relative pt-28"
      data-revelar="cinta"
    >
      <div className="revelar-contenido">
        <div className="reticula items-end gap-y-6">
          <p className="mono-etiqueta text-brand-yellow col-span-12 md:col-span-3">
            {home.servicios.eyebrow}
          </p>
          <h2
            id="titulo-servicios"
            className="text-5 col-span-12 uppercase [font-stretch:96%] max-[340px]:text-[length:13vw] md:col-span-9"
          >
            {empresa.solucionesIntegrales.titulo}
          </h2>
          <p className="text-2 text-concrete-light col-span-12 max-w-[56ch] md:col-span-6 md:col-start-4">
            {empresa.solucionesIntegrales.texto}
          </p>
        </div>

        <ol className="border-line mt-16 border-t-2">
          {lineasDeServicio.map((l) => (
            <li key={l.slug} className="border-line border-b-2">
              <FilaInclinable className="reticula items-center gap-y-4 py-6 md:py-8">
                <span
                  className="cifras text-2 text-concrete col-span-2 row-start-1 md:col-span-1"
                  aria-hidden="true"
                >
                  {l.codigo}
                </span>
                <span className="col-span-10 row-start-1 flex min-w-0 items-center gap-3 md:col-span-11 md:gap-4 lg:col-span-6">
                  <Icono
                    id={l.icono}
                    className="text-brand-yellow h-8 w-8 shrink-0 md:h-12 md:w-12"
                  />
                  {/* font-stretch fijo en línea: el estado activo de .fila-enlace lo ensanchaba
                      al 100 % y el nombre se salía de su columna o se montaba sobre la ficha. */}
                  <a
                    href={`#${l.slug}`}
                    className="fila-enlace font-display md:text-4 min-w-0 text-[length:clamp(1.5rem,8vw,2.125rem)] leading-none font-extrabold uppercase lg:text-[length:min(var(--text-4),5.2vw)]"
                    style={{ fontStretch: "78%" }}
                  >
                    {l.nombre}
                  </a>
                </span>
                {/* Pista y ficha comparten celda: en puntero fino una se funde en la otra. */}
                <span className="cifra-fila mono-etiqueta text-concrete col-span-12 col-start-1 row-start-2 md:col-span-11 md:col-start-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-center lg:text-right">
                  {pista(l.cifra)}
                </span>
                <span className="ficha-fila col-span-12 col-start-1 row-start-2 grid grid-cols-2 gap-x-6 gap-y-2 md:col-span-11 md:col-start-2 lg:col-span-5 lg:col-start-8 lg:row-start-1">
                  {l.equipos.map((e) => (
                    <span key={e.nombre} className="flex flex-col">
                      <span className="text-0 text-bone/85">{e.nombre}</span>
                      {e.rango ? (
                        <span className="cifras text-0 text-brand-yellow">{e.rango}</span>
                      ) : null}
                    </span>
                  ))}
                </span>
              </FilaInclinable>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
