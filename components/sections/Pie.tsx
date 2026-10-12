import Link from "next/link";
import { contacto, urlMapa, urlWhatsApp } from "@/content/contacto";
import { lineasDeServicio } from "@/content/servicios";
import { sitio } from "@/content/sitio";
import { LogoCompleto } from "@/components/brand/Logo";
import { CorreoProtegido, TelefonoProtegido } from "@/components/ui/ContactoProtegido";

export function Pie() {
  const anio = new Date().getFullYear();
  return (
    <footer className="con-grano border-line bg-ink relative border-t-2 pt-20 pb-28 sm:pb-16">
      <div className="reticula gap-y-14">
        <div className="col-span-12 md:col-span-4">
          <LogoCompleto className="h-auto w-44" idTitulo="logo-pie" />
          <p className="text-concrete-light mt-6 max-w-[34ch]">{sitio.experiencia.texto}</p>
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-4">
          <h2 className="mono-etiqueta text-brand-yellow mb-5 font-medium tracking-[0.12em]">
            Contacto
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="mono-etiqueta text-concrete">Celular / WhatsApp</dt>
              <dd className="cifras text-2 text-bone mt-1">
                <TelefonoProtegido
                  e164={contacto.telefono.e164}
                  visible={contacto.telefono.visible}
                  className="enlace-cinta"
                />
              </dd>
            </div>
            {contacto.correos.map((c) => (
              <div key={c.usuario}>
                <dt className="mono-etiqueta text-concrete">{c.etiqueta}</dt>
                <dd className="mt-1 break-all">
                  <CorreoProtegido
                    usuario={c.usuario}
                    dominio={c.dominio}
                    className="enlace-cinta"
                  />
                </dd>
              </div>
            ))}
            <div>
              <dt className="mono-etiqueta text-concrete">Dirección</dt>
              <dd className="mt-1">
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
            <div>
              <dt className="mono-etiqueta text-concrete">Horario</dt>
              <dd className="text-concrete-light mt-1">
                {contacto.horario.texto}
                {contacto.horario.aConfirmar ? (
                  <span className="mono-etiqueta border-concrete-dark text-concrete ml-2 border px-1.5 py-0.5">
                    a confirmar
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-4">
          <h2 className="mono-etiqueta text-brand-yellow mb-5 font-medium tracking-[0.12em]">
            Servicios
          </h2>
          <ul className="space-y-2">
            {lineasDeServicio.map((l) => (
              <li key={l.slug}>
                <Link href={`/servicios/${l.slug}`} className="enlace-cinta">
                  {l.nombre}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-start gap-4">
            <a
              href="/brochure-mavi-proyectos-e-inversiones.pdf"
              download
              className="boton boton-secundario"
            >
              Descargar brochure (PDF)
            </a>
            <a
              href={contacto.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="enlace-cinta mono-etiqueta"
            >
              Instagram @{contacto.instagram.usuario}
            </a>
            <a
              href={urlWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="enlace-cinta mono-etiqueta"
            >
              WhatsApp {contacto.telefono.visible}
            </a>
          </div>
        </div>

        <div className="border-line text-0 text-concrete col-span-12 flex flex-col gap-3 border-t-2 pt-6 sm:flex-row sm:justify-between">
          <p>
            © {anio} {sitio.nombre}. {sitio.lema}.
          </p>
          <nav aria-label="Legal" className="flex gap-6">
            <Link href="/politica-de-privacidad" className="enlace-cinta">
              Política de datos personales
            </Link>
            <Link href="/contacto" className="enlace-cinta">
              Contacto
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
