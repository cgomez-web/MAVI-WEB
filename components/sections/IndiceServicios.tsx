import { home } from "@/content/home";
import { lineasDeServicio } from "@/content/servicios";
import { Icono } from "@/components/icons/Icono";
import { FilaInclinable } from "@/components/ui/FilaInclinable";

/**
 * Índice de las seis líneas: filas grandes (no una rejilla de tarjetas) que se inclinan en 3D
 * siguiendo el puntero y revelan su ficha técnica al hover / foco / toque.
 * El enlace cubre toda la fila (patrón "enlace estirado") pero su nombre accesible es solo la línea.
 */
export function IndiceServicios() {
  return (
    <section id="servicios" aria-labelledby="titulo-servicios" className="relative bg-ink pt-28" data-revelar="cinta">
      <div className="revelar-contenido">
        <div className="reticula items-end gap-y-6">
          <p className="mono-etiqueta col-span-12 text-brand-yellow md:col-span-3">{home.servicios.eyebrow}</p>
          <h2 id="titulo-servicios" className="col-span-12 text-5 uppercase md:col-span-9 [font-stretch:96%]">
            {home.servicios.titular}
          </h2>
          <p className="col-span-12 max-w-[56ch] text-2 text-concrete-light md:col-span-6 md:col-start-4">
            {home.servicios.texto}
          </p>
        </div>

        <ol className="mt-16 border-t-2 border-line">
          {lineasDeServicio.map((l) => (
            <li key={l.slug} className="border-b-2 border-line">
              <FilaInclinable className="reticula items-center gap-y-4 py-6 md:py-8">
                <span className="cifras col-span-2 text-2 text-concrete md:col-span-1" aria-hidden="true">
                  {l.codigo}
                </span>
                <span className="col-span-10 flex items-center gap-4 md:col-span-6">
                  <Icono id={l.icono} className="h-10 w-10 shrink-0 text-brand-yellow md:h-12 md:w-12" />
                  <a
                    href={`#${l.slug}`}
                    className="fila-enlace font-display text-4 font-extrabold uppercase leading-none"
                  >
                    {l.nombre}
                  </a>
                </span>
                <span className="ficha-fila col-span-12 grid grid-cols-2 gap-x-6 gap-y-2 md:col-span-5">
                  {l.equipos.slice(0, 4).map((e) => (
                    <span key={e.nombre} className="flex flex-col">
                      <span className="text-0 text-bone/85">{e.nombre}</span>
                      {e.rango ? <span className="cifras text-0 text-brand-yellow">{e.rango}</span> : null}
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
