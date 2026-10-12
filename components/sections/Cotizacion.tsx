import { home } from "@/content/home";
import { contacto, urlMapa, urlWhatsApp } from "@/content/contacto";
import { sitio } from "@/content/sitio";
import { FormularioCotizacion } from "./FormularioCotizacion";
import { CorreoProtegido, TelefonoProtegido } from "@/components/ui/ContactoProtegido";

/** Única sección clara del home: un formulario de obra impreso + bloque de contacto directo. */
export function Cotizacion({ nivel = "h2" }: { nivel?: "h1" | "h2" }) {
  const Titulo = nivel;
  return (
    <section
      id="cotizacion"
      aria-labelledby="titulo-cotizacion"
      className="sobre-claro bg-bone text-ink relative py-24 md:py-32"
      data-whatsapp={contacto.whatsapp.mensajeGeneral}
    >
      <div className="reticula gap-y-14">
        <div className="col-span-12 lg:col-span-7">
          <p className="mono-etiqueta text-concrete-dark">{home.cotizacion.eyebrow}</p>
          <Titulo id="titulo-cotizacion" className="text-5 mt-4 uppercase [font-stretch:88%]">
            {home.cotizacion.titular}
          </Titulo>
          <p className="text-2 text-concrete-dark mt-6 max-w-[52ch]">{home.cotizacion.texto}</p>
          <div className="mt-12">
            <FormularioCotizacion />
          </div>
        </div>

        <aside
          aria-label="Contacto directo"
          className="con-grano bg-ink text-bone col-span-12 self-start p-8 shadow-[10px_10px_0_0_var(--color-brand-yellow)] md:p-10 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-span-5"
        >
          <p className="font-display text-3 text-brand-yellow font-extrabold italic [font-stretch:80%]">
            {sitio.frases.atencion}
          </p>
          <dl className="mt-8 space-y-6">
            <div>
              <dt className="mono-etiqueta text-concrete-light">Celular / WhatsApp</dt>
              <dd className="cifras text-4 mt-2 leading-none font-bold">
                <TelefonoProtegido
                  e164={contacto.telefono.e164}
                  visible={contacto.telefono.visible}
                />
              </dd>
            </div>
            <div>
              <dt className="mono-etiqueta text-concrete-light">Correo</dt>
              {contacto.correos.map((c) => (
                <dd key={c.usuario} className="mt-2 break-all">
                  <CorreoProtegido
                    usuario={c.usuario}
                    dominio={c.dominio}
                    className="enlace-cinta"
                  />
                </dd>
              ))}
            </div>
            <div>
              <dt className="mono-etiqueta text-concrete-light">Dirección</dt>
              <dd className="mt-2">
                <a
                  href={urlMapa()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="enlace-cinta"
                >
                  {contacto.direccion.linea}, {contacto.direccion.ciudad},{" "}
                  {contacto.direccion.departamento}
                  <span className="solo-lectores"> (abre Google Maps en una pestaña nueva)</span>
                </a>
              </dd>
            </div>
          </dl>
          <a
            href={urlWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-primario mt-10 w-full justify-center"
          >
            Escribir por WhatsApp
          </a>
        </aside>
      </div>
    </section>
  );
}
