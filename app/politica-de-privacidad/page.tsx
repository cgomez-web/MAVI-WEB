import type { Metadata } from "next";
import { politicaPrivacidad } from "@/content/legal";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales",
  description: "Cómo MAVI Proyectos e Inversiones trata sus datos personales conforme a la Ley 1581 de 2012.",
  alternates: { canonical: "/politica-de-privacidad" },
};

export default function PaginaPrivacidad() {
  const p = politicaPrivacidad;
  return (
    <article className="sobre-claro bg-bone pb-24 pt-[calc(var(--header-h)+4rem)] text-ink">
      <div className="reticula gap-y-8">
        <header className="col-span-12 lg:col-span-8">
          <p className="mono-etiqueta text-concrete-dark">Actualizada: {p.actualizada}</p>
          <h1 className="mt-4 text-4 uppercase [font-stretch:85%]">{p.titulo}</h1>
        </header>
        <dl className="col-span-12 grid grid-cols-1 gap-4 border-y-2 border-ink py-6 sm:grid-cols-2 lg:col-span-8">
          <div>
            <dt className="mono-etiqueta text-concrete-dark">Responsable</dt>
            <dd>{p.responsable.nombre}</dd>
          </div>
          <div>
            <dt className="mono-etiqueta text-concrete-dark">NIT</dt>
            <dd>{p.responsable.nit}</dd>
          </div>
          <div>
            <dt className="mono-etiqueta text-concrete-dark">Dirección</dt>
            <dd>{p.responsable.direccion}</dd>
          </div>
          <div>
            <dt className="mono-etiqueta text-concrete-dark">Teléfono</dt>
            <dd className="cifras">{p.responsable.telefono}</dd>
          </div>
        </dl>
        <div className="col-span-12 max-w-[68ch] space-y-10 lg:col-span-8">
          {p.secciones.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-3 uppercase [font-stretch:85%]">{s.titulo}</h2>
              {s.parrafos.map((parrafo) => (
                <p key={parrafo} className="mt-3 text-1 text-ink/85">
                  {parrafo}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
