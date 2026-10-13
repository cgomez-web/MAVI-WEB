import { Fragment, type ReactNode } from "react";
import { contacto } from "@/content/contacto";
import { politicaPrivacidad } from "@/content/legal";
import { paginas } from "@/content/sitio";
import { metaPagina } from "@/lib/metadatos";
import { CorreoProtegido, TelefonoProtegido } from "@/components/ui/ContactoProtegido";

export const metadata = metaPagina({
  titulo: paginas.privacidad.titulo,
  descripcion: paginas.privacidad.descripcion,
  ruta: "/politica-de-privacidad",
});

/**
 * Los correos del texto se parten después de "@" y no a mitad de "gmail.com" cuando no caben en
 * un renglón (320 px). <wbr> no se copia: el correo sigue intacto al seleccionarlo.
 */
function conCorteEnCorreos(texto: string): ReactNode {
  if (!texto.includes("@")) return texto;
  return texto.split("@").map((parte, i) => (
    <Fragment key={i}>
      {i > 0 ? (
        <>
          @<wbr />
        </>
      ) : null}
      {parte}
    </Fragment>
  ));
}

export default function PaginaPrivacidad() {
  const p = politicaPrivacidad;
  const correo = contacto.correos[0];
  return (
    <article className="sobre-claro bg-bone text-ink pt-[calc(var(--header-h)+4rem)] pb-24">
      <div className="reticula gap-y-8">
        <header className="col-span-12 lg:col-span-8">
          <p className="mono-etiqueta text-concrete-dark">
            {p.rotulos.actualizada}: {p.actualizada} · {p.rotulos.vigente}: {p.vigenteDesde}
          </p>
          <h1 className="text-4 mt-4 uppercase [font-stretch:85%]">{p.titulo}</h1>
        </header>
        {/* Datos del responsable del tratamiento (Decreto 1377 de 2013, art. 13, num. 1). */}
        <dl className="border-ink col-span-12 grid grid-cols-1 gap-4 border-y-2 py-6 sm:grid-cols-2 lg:col-span-8">
          <div>
            <dt className="mono-etiqueta text-concrete-dark">{p.rotulos.responsable}</dt>
            <dd>{p.responsable.nombre}</dd>
          </div>
          {p.responsable.nit ? (
            <div>
              <dt className="mono-etiqueta text-concrete-dark">{p.rotulos.nit}</dt>
              <dd className="cifras">{p.responsable.nit}</dd>
            </div>
          ) : null}
          <div>
            <dt className="mono-etiqueta text-concrete-dark">{p.rotulos.domicilio}</dt>
            <dd>{p.responsable.domicilio}</dd>
          </div>
          <div>
            <dt className="mono-etiqueta text-concrete-dark">{p.rotulos.direccion}</dt>
            <dd>{p.responsable.direccion}</dd>
          </div>
          <div>
            <dt className="mono-etiqueta text-concrete-dark">{p.rotulos.correo}</dt>
            <dd className="break-all">
              <CorreoProtegido
                usuario={correo.usuario}
                dominio={correo.dominio}
                className="enlace-cinta"
              />
            </dd>
          </div>
          <div>
            <dt className="mono-etiqueta text-concrete-dark">{p.rotulos.telefono}</dt>
            <dd className="cifras">
              <TelefonoProtegido
                e164={contacto.telefono.e164}
                visible={p.responsable.telefono}
                className="enlace-cinta"
              />
            </dd>
          </div>
        </dl>
        <div className="col-span-12 max-w-[68ch] space-y-10 [overflow-wrap:anywhere] lg:col-span-8">
          {p.secciones.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-3 uppercase [font-stretch:85%]">{s.titulo}</h2>
              {s.parrafos.map((parrafo) => (
                <p key={parrafo} className="text-1 text-ink/85 mt-3">
                  {conCorteEnCorreos(parrafo)}
                </p>
              ))}
              {s.lista ? (
                <ul className="text-1 text-ink/85 mt-3 space-y-2">
                  {s.lista.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden="true" className="cifras">
                        —
                      </span>
                      <span>{conCorteEnCorreos(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {s.cierre?.map((parrafo) => (
                <p key={parrafo} className="text-1 text-ink/85 mt-3">
                  {conCorteEnCorreos(parrafo)}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
