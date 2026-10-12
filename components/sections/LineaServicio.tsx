import Link from "next/link";
import type { LineaDeServicio } from "@/content/servicios";
import { mensajeWhatsApp, urlWhatsApp } from "@/content/contacto";
import { home } from "@/content/home";
import { fotosDeCategoria } from "@/lib/galeria";
import { Icono } from "@/components/icons/Icono";
import { FotoBodega } from "@/components/ui/FotoBodega";
import { Odometro } from "@/components/ui/Odometro";

interface Props {
  linea: LineaDeServicio;
  /** "home": bloque narrativo con ventana a la escena; "pagina": ficha dentro de /servicios/[slug]. */
  variante?: "home" | "pagina";
  nivelTitulo?: "h2" | "h3";
}

export function FichaTecnica({ linea }: { linea: LineaDeServicio }) {
  const conRango = linea.equipos.some((e) => e.rango);
  return (
    <table className="ficha">
      <caption className="solo-lectores">Ficha técnica — {linea.nombre}</caption>
      <thead>
        <tr>
          <th scope="col">Equipo</th>
          {conRango ? <th scope="col">Rango</th> : null}
          <th scope="col">Uso</th>
        </tr>
      </thead>
      <tbody>
        {linea.equipos.map((e, i) => (
          <tr key={e.nombre} style={{ ["--fila" as string]: i }}>
            <th scope="row" className="font-display text-2 font-bold [font-stretch:85%]">
              {e.nombre}
            </th>
            {conRango ? <td className="cifras whitespace-nowrap text-1 text-brand-yellow">{e.rango ?? "—"}</td> : null}
            <td className="text-0 text-concrete-light">{e.descripcion}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Lámina técnica propia para líneas sin fotografías reales (nunca fotos de stock). */
function LaminaTecnica({ linea }: { linea: LineaDeServicio }) {
  return (
    <figure className="relative border-2 border-line bg-ink-2 p-6">
      <div className="regla text-concrete" aria-hidden="true" />
      <div className="grid grid-cols-2 gap-6 py-8">
        {linea.equipos.map((e) => (
          <div key={e.nombre} className="flex flex-col items-start gap-3">
            <Icono id={e.icono} className="h-16 w-16 text-brand-yellow" />
            <span className="mono-etiqueta text-concrete-light">{e.nombre}</span>
            {e.rango ? <span className="cifras text-1 text-bone">{e.rango}</span> : null}
          </div>
        ))}
      </div>
      <div className="regla rotate-180 text-concrete" aria-hidden="true" />
      <figcaption className="mono-etiqueta mt-4 text-concrete">
        Ilustración técnica · {linea.nombre}
      </figcaption>
    </figure>
  );
}

export function LineaServicio({ linea, variante = "home", nivelTitulo = "h3" }: Props) {
  const Titulo = nivelTitulo;
  const fotos = fotosDeCategoria(linea.categoriaGaleria, 3);
  const idTitulo = `titulo-${linea.slug}`;
  const mensaje = mensajeWhatsApp(linea.nombre);

  return (
    <section
      id={variante === "home" ? linea.slug : undefined}
      aria-labelledby={idTitulo}
      data-whatsapp={mensaje}
      data-fase={linea.slug}
      className="relative"
    >
      {variante === "home" ? (
        // Ventana a la escena 3D: la cifra protagonista flota sobre la obra.
        <div className="reticula min-h-[62svh] items-end pb-10 pt-28">
          <p className="codigo-vertical col-span-1 hidden self-end text-concrete-light md:block" aria-hidden="true">
            {linea.codigo} — {linea.nombre}
          </p>
          <div className="col-span-12 md:col-span-8">
            <p className="mono-etiqueta mb-3 text-brand-yellow">
              Línea {linea.codigo} · {linea.cifra.etiqueta}
            </p>
            <p className="flex items-end gap-3">
              <span className="font-display text-figure font-black uppercase leading-[0.8] [font-stretch:112%] [letter-spacing:-0.045em]">
                <Odometro valor={linea.cifra.valor} prefijo={linea.cifra.prefijo} />
              </span>
              <span className="mono-etiqueta pb-2 text-1 text-brand-yellow">{linea.cifra.unidad}</span>
            </p>
          </div>
          {linea.sello ? (
            <p className="col-span-12 mt-6 md:col-span-3 md:mt-0 md:justify-self-end" aria-hidden="true">
              <span className="sello" data-sello>
                {linea.sello}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={variante === "home" ? "border-t-2 border-line bg-ink py-16 md:py-24" : "py-4"}>
        <div className="reticula gap-y-12">
          <div className="col-span-12 md:col-span-5">
            <div className="md:sticky md:top-[calc(var(--header-h)+1.5rem)]">
              <Titulo
                id={idTitulo}
                data-tipografia-viva={variante === "home" ? "" : undefined}
                className="text-[clamp(2rem,1rem+2.6vw,3.25rem)] uppercase leading-[0.92] [font-stretch:100%] [hyphens:auto]"
              >
                {linea.nombre}
              </Titulo>
              <p className="mt-5 max-w-[40ch] text-2 text-bone/90">{linea.subtitulo}</p>
              {linea.frase ? (
                <p className="mt-6 border-l-4 border-brand-yellow pl-4 font-display text-2 font-bold italic [font-stretch:85%]">
                  {linea.frase}
                </p>
              ) : null}
              {linea.atributos ? (
                <ul className="mono-etiqueta mt-6 flex flex-wrap gap-2 text-concrete-light" aria-label="Atributos">
                  {linea.atributos.map((a) => (
                    <li key={a} className="border-2 border-line px-2.5 py-1">
                      {a}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-8 flex flex-wrap gap-4">
                <a href={urlWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer" className="boton boton-primario">
                  {home.servicios.cotizar}
                </a>
                {variante === "home" ? (
                  <Link href={`/servicios/${linea.slug}`} className="boton boton-secundario">
                    {home.servicios.verFicha}
                    <span className="solo-lectores">: {linea.nombre}</span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="col-span-12 flex flex-col gap-10 md:col-span-7">
            <FichaTecnica linea={linea} />
            {fotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-[var(--gutter)]">
                {fotos.map((f, i) => (
                  <figure key={f.id} className={i === 0 ? "col-span-2 sm:col-span-1 sm:row-span-2" : ""}>
                    <FotoBodega
                      foto={f}
                      proporcion={i === 0 ? "4 / 5" : "4 / 3"}
                      sizes="(min-width: 768px) 28vw, (min-width: 640px) 45vw, 92vw"
                      duotono={i > 0}
                    />
                    <figcaption className="mono-etiqueta mt-2 text-concrete">{f.titulo}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <LaminaTecnica linea={linea} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
