import Link from "next/link";
import type { LineaDeServicio } from "@/content/servicios";
import { mensajeWhatsApp, urlWhatsApp } from "@/content/contacto";
import { home } from "@/content/home";
import { textosFicha as tf } from "@/content/interfaz";
import { avisoPestanaNueva } from "@/content/navegacion";
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

/*
 * `sizes` de las fotos según el ancho real de cada hueco (margen lateral = 6vw por lado):
 *  - desde lg la columna derecha mide 7/12 y cada foto la mitad: ≈ 26vw − 1rem;
 *  - por debajo de lg la columna ocupa todo el ancho (88vw): la primera foto va a ancho completo
 *    en móvil y a media columna desde sm; las demás siempre a media columna (≈ 44vw).
 */
const SIZES_FOTO_PRINCIPAL =
  "(min-width: 1024px) calc(26vw - 1rem), (min-width: 640px) calc(44vw - 0.75rem), 88vw";
const SIZES_FOTO_SECUNDARIA = "(min-width: 1024px) calc(26vw - 1rem), calc(44vw - 0.5rem)";

export function FichaTecnica({ linea }: { linea: LineaDeServicio }) {
  const conRango = linea.equipos.some((e) => e.rango);
  return (
    // Red de seguridad: si algún día un nombre no cupiera, la tabla se desplaza dentro de su caja
    // y nunca ensancha la página (con el contenido actual cabe de 320 a 1440 px).
    // .ficha-caja es el contenedor de consulta «ficha» (globals.css): se estira al ancho de la columna.
    <div className="ficha-caja max-w-full overflow-x-auto">
      {/* Roles explícitos: en móvil las filas cambian de display y algunos lectores perderían la semántica. */}
      <table className="ficha" role="table">
        <caption className="solo-lectores">{`${tf.leyenda} — ${linea.nombre}`}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              {tf.equipo}
            </th>
            {conRango ? (
              <th scope="col" role="columnheader">
                {tf.rango}
              </th>
            ) : null}
            <th scope="col" role="columnheader">
              {tf.uso}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {linea.equipos.map((e, i) => (
            <tr key={e.nombre} role="row" style={{ ["--fila" as string]: i }}>
              <th
                scope="row"
                role="rowheader"
                className="font-display text-2 font-bold [font-stretch:85%]"
              >
                {e.nombre}
              </th>
              {conRango ? (
                <td
                  role="cell"
                  className="ficha-rango cifras text-1 text-brand-yellow whitespace-nowrap"
                >
                  {e.rango ?? "—"}
                </td>
              ) : null}
              <td role="cell" className="ficha-uso text-0 text-concrete-light">
                {e.descripcion}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lámina técnica propia para líneas sin fotografías reales (nunca fotos de stock). */
function LaminaTecnica({ linea }: { linea: LineaDeServicio }) {
  return (
    // En móvil se omite: repetiría la tabla y alargaría demasiado la página.
    <figure className="border-line bg-ink-2 relative hidden border-2 p-6 sm:block">
      <div className="regla text-concrete" aria-hidden="true" />
      <div className="grid grid-cols-2 gap-6 py-8">
        {linea.equipos.map((e) => (
          <div key={e.nombre} className="flex flex-col items-start gap-3">
            <Icono id={e.icono} className="text-brand-yellow h-16 w-16" />
            <span className="mono-etiqueta text-concrete-light">{e.nombre}</span>
            {e.rango ? <span className="cifras text-1 text-bone">{e.rango}</span> : null}
          </div>
        ))}
      </div>
      <div className="regla text-concrete rotate-180" aria-hidden="true" />
      <figcaption className="mono-etiqueta text-concrete mt-4">
        {`${tf.lamina} · ${linea.nombre}`}
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
        <div
          className="reticula min-h-[46svh] items-end pt-24 pb-10 md:min-h-[62svh] md:pt-28"
          data-ventana-3d=""
        >
          <p
            className="codigo-vertical text-concrete-light col-span-1 hidden self-end md:block"
            aria-hidden="true"
          >
            {linea.codigo} — {linea.nombre}
          </p>
          <div className="col-span-12 md:col-span-8">
            <p className="mono-etiqueta text-brand-yellow mb-3">
              {`${tf.linea} ${linea.codigo} · ${linea.cifra.etiqueta}`}
            </p>
            {linea.cifra.tipo === "cifra" ? (
              <p className="flex items-end gap-3">
                <span className="font-display text-figure leading-[0.8] font-black [letter-spacing:-0.045em] uppercase [font-stretch:112%]">
                  <Odometro valor={linea.cifra.valor} prefijo={linea.cifra.prefijo} />
                </span>
                <span className="mono-etiqueta text-1 text-brand-yellow pb-2">
                  {linea.cifra.unidad}
                </span>
              </p>
            ) : (
              // El brochure no da una cifra para esta línea: el protagonista es un dato textual,
              // nunca un contador que se lea como cantidad de inventario. Es un <p>, así que no hereda
              // el aire entre palabras de h1–h4: sin él «Y TABLEROS» se leía casi pegado.
              <p className="font-display text-4 max-w-[18ch] leading-[0.95] font-black [text-wrap:balance] uppercase [font-stretch:80%] [word-spacing:0.1em]">
                {linea.cifra.texto}
              </p>
            )}
          </div>
          {linea.sello ? (
            <p
              className="col-span-12 mt-6 md:col-span-3 md:mt-0 md:justify-self-end"
              aria-hidden="true"
            >
              <span className="sello" data-sello>
                {linea.sello}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className={variante === "home" ? "border-line bg-ink border-t-2 py-16 md:py-24" : "py-4"}
      >
        {/* Las dos columnas se apilan hasta lg: entre 768 y 1023 px la columna de 5/12 no da
            cabida a "Formaletería" ni a la ficha técnica (se partía la palabra y la tabla desbordaba). */}
        <div className="reticula gap-y-12">
          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              {/* Tamaño acotado para que la palabra más larga ("Formaletería") quepa entera en su
                  columna incluso con la tipografía viva en su punto más ancho (112 %): 9vw en
                  pantallas de 320 px y 3,7vw desde lg. Sin cortes a mitad de palabra. */}
              <Titulo
                id={idTitulo}
                data-tipografia-viva={variante === "home" ? "" : undefined}
                className="text-[length:min(clamp(2rem,1rem+2.6vw,3.25rem),9vw)] leading-[0.92] [overflow-wrap:break-word] uppercase [font-stretch:100%] lg:text-[length:min(3.25rem,3.7vw)]"
              >
                {linea.nombre}
              </Titulo>
              <p className="text-2 text-bone/90 mt-5 max-w-[40ch]">{linea.subtitulo}</p>
              {linea.frase ? (
                <p className="border-brand-yellow font-display text-2 mt-6 border-l-4 pl-4 font-bold italic [font-stretch:85%]">
                  {linea.frase}
                </p>
              ) : null}
              {linea.atributos ? (
                <ul
                  className="mono-etiqueta text-concrete-light mt-6 flex flex-wrap gap-2"
                  aria-label={tf.atributos}
                >
                  {linea.atributos.map((a) => (
                    <li key={a} className="border-line border-2 px-2.5 py-1">
                      {a}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={urlWhatsApp(mensaje)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="boton boton-primario"
                >
                  {home.servicios.cotizar}
                  <span className="solo-lectores">
                    {`${tf.porWhatsApp}${linea.nombre}`}
                    {avisoPestanaNueva}
                  </span>
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

          <div className="col-span-12 flex min-w-0 flex-col gap-10 lg:col-span-7">
            <FichaTecnica linea={linea} />
            {fotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-[var(--gutter)]">
                {fotos.map((f, i) => (
                  <figure
                    key={f.id}
                    className={i === 0 ? "col-span-2 sm:col-span-1 sm:row-span-2" : ""}
                  >
                    <FotoBodega
                      foto={f}
                      proporcion={i === 0 ? "4 / 5" : "4 / 3"}
                      sizes={i === 0 ? SIZES_FOTO_PRINCIPAL : SIZES_FOTO_SECUNDARIA}
                      duotono={i > 0}
                    />
                    <figcaption className="mono-etiqueta text-concrete mt-2">{f.titulo}</figcaption>
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
