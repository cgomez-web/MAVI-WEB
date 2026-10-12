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
            className="text-5 col-span-12 uppercase [font-stretch:96%] md:col-span-9"
          >
            {home.servicios.titular}
          </h2>
          <p className="text-2 text-concrete-light col-span-12 max-w-[56ch] md:col-span-6 md:col-start-4">
            {home.servicios.texto}
          </p>
        </div>

        <ol className="border-line mt-16 border-t-2">
          {lineasDeServicio.map((l) => (
            <li key={l.slug} className="border-line border-b-2">
              <FilaInclinable className="reticula items-center gap-y-4 py-6 md:py-8">
                <span
                  className="cifras text-2 text-concrete col-span-2 md:col-span-1"
                  aria-hidden="true"
                >
                  {l.codigo}
                </span>
                <span className="col-span-10 flex items-center gap-4 md:col-span-6">
                  <Icono
                    id={l.icono}
                    className="text-brand-yellow h-10 w-10 shrink-0 md:h-12 md:w-12"
                  />
                  <a
                    href={`#${l.slug}`}
                    className="fila-enlace font-display text-4 leading-none font-extrabold uppercase"
                  >
                    {l.nombre}
                  </a>
                </span>
                <span className="cifra-fila mono-etiqueta text-concrete col-span-12 md:col-span-5 md:col-start-8 md:row-start-1 md:self-center md:text-right">
                  {l.cifra.prefijo}
                  {l.cifra.valor} {l.cifra.unidad} · {l.cifra.etiqueta}
                </span>
                <span className="ficha-fila col-span-12 grid grid-cols-2 gap-x-6 gap-y-2 md:col-span-5 md:col-start-8 md:row-start-1">
                  {l.equipos.slice(0, 4).map((e) => (
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
