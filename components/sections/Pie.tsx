import Link from "next/link";
import { contacto, correosPorEtiqueta, urlMapa, urlWhatsApp } from "@/content/contacto";
import { lineasDeServicio } from "@/content/servicios";
import { sitio } from "@/content/sitio";
import { avisoPestanaNueva } from "@/content/navegacion";
import { textosContacto, textosPie } from "@/content/interfaz";
import { LogoCompleto } from "@/components/brand/Logo";
import { CorreoProtegido, TelefonoProtegido } from "@/components/ui/ContactoProtegido";

export function Pie() {
  const anio = new Date().getFullYear();
  return (
    <footer className="con-grano border-line bg-ink relative border-t-2 pt-20 pb-16">
      <div className="reticula gap-y-14">
        <div className="col-span-12 lg:col-span-4">
          <LogoCompleto
            className="h-auto w-44"
            idTitulo="logo-pie"
            nombre={sitio.nombre}
            lema={sitio.lema}
          />
          <p className="text-concrete-light mt-6 max-w-[34ch]">{sitio.experiencia.texto}</p>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <h2 className="mono-etiqueta text-brand-yellow mb-5 font-medium tracking-[0.12em]">
            {textosContacto.titulo}
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="mono-etiqueta text-concrete">{textosContacto.telefono}</dt>
              <dd className="cifras text-2 text-bone mt-1">
                <TelefonoProtegido
                  e164={contacto.telefono.e164}
                  visible={contacto.telefono.visible}
                  className="enlace-cinta"
                />
              </dd>
            </div>
            {/* Un <dt> por rótulo distinto: hoy los dos correos comparten «Correo» (el brochure no
                les asigna área); si el dueño les da áreas, cada uno queda bajo la suya. */}
            {correosPorEtiqueta().map((grupo) => (
              <div key={grupo.etiqueta}>
                <dt className="mono-etiqueta text-concrete">{grupo.etiqueta}</dt>
                {grupo.correos.map((c) => (
                  <dd key={c.usuario} className="mt-1">
                    <CorreoProtegido
                      usuario={c.usuario}
                      dominio={c.dominio}
                      className="enlace-cinta"
                    />
                  </dd>
                ))}
              </div>
            ))}
            <div>
              <dt className="mono-etiqueta text-concrete">{textosContacto.direccion}</dt>
              <dd className="mt-1">
                <a
                  href={urlMapa()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="enlace-cinta"
                >
                  {/* Un solo nodo de texto: con varios, el nombre accesible quedaba «Envigado,Antioquia». */}
                  {`${contacto.direccion.linea}, ${contacto.direccion.ciudad}, ${contacto.direccion.departamento}`}
                  <span className="solo-lectores">
                    {textosContacto.enMapa}
                    {avisoPestanaNueva}
                  </span>
                </a>
              </dd>
            </div>
            <div>
              <dt className="mono-etiqueta text-concrete">{textosContacto.horario}</dt>
              <dd className="text-concrete-light mt-1">
                {contacto.horario.texto}
                {contacto.horario.aConfirmar ? (
                  <span className="mono-etiqueta border-concrete-dark text-concrete ml-2 inline-block border px-1.5 py-0.5 whitespace-nowrap">
                    {textosContacto.aConfirmar}
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <h2 className="mono-etiqueta text-brand-yellow mb-5 font-medium tracking-[0.12em]">
            {textosPie.servicios}
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
              {textosPie.brochure}
            </a>
            <a
              href={contacto.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="enlace-cinta mono-etiqueta"
            >
              {`${textosPie.instagram} @${contacto.instagram.usuario}`}
              <span className="solo-lectores">{avisoPestanaNueva}</span>
            </a>
            <a
              href={urlWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="enlace-cinta mono-etiqueta"
            >
              {`${textosPie.whatsapp} ${contacto.telefono.visible}`}
              <span className="solo-lectores">{avisoPestanaNueva}</span>
            </a>
          </div>
        </div>

        <div className="border-line text-0 text-concrete col-span-12 flex flex-col gap-3 border-t-2 pt-6 sm:flex-row sm:justify-between">
          <p>
            © {anio} {sitio.nombre}. {sitio.lema}.
          </p>
          <nav aria-label={textosPie.navLegal} className="flex gap-6">
            <Link href="/politica-de-privacidad" className="enlace-cinta">
              {textosPie.politica}
            </Link>
            <Link href="/contacto" className="enlace-cinta">
              {textosPie.contacto}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
