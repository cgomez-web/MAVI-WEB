import { home } from "@/content/home";
import { contacto, correosPorEtiqueta, urlMapa, urlWhatsApp } from "@/content/contacto";
import { sitio } from "@/content/sitio";
import { textosContacto } from "@/content/interfaz";
import { avisoPestanaNueva } from "@/content/navegacion";
import { EsqueletoFormulario } from "./CamposCotizacion";
import { FormularioCotizacionDiferido } from "./FormularioCotizacionDiferido";
import { CorreoProtegido, TelefonoProtegido } from "@/components/ui/ContactoProtegido";

/**
 * Única sección clara del home: un formulario de obra impreso + bloque de contacto directo.
 * Con `nivel="h1"` la sección es el contenido principal de la página (/contacto): el formulario se
 * descarga en cuanto la página hidrata, sin esperar a que la sección se acerque a la pantalla.
 */
export function Cotizacion({
  nivel = "h2",
  inmediato = nivel === "h1",
}: {
  nivel?: "h1" | "h2";
  /** Descargar el formulario al hidratar (por defecto, cuando la sección es el h1 de la página). */
  inmediato?: boolean;
}) {
  const Titulo = nivel;
  const { direccion } = contacto;
  return (
    <section
      id="cotizacion"
      aria-labelledby="titulo-cotizacion"
      className="sobre-claro bg-bone text-ink relative py-24 md:py-32"
      data-whatsapp={contacto.whatsapp.mensajeGeneral}
      // Cinta de sección (MOTION.md #5); en /contacto es la primera sección y la cubre la transición.
      data-revelar={nivel === "h2" ? "cinta" : undefined}
    >
      <div className="reticula gap-y-14">
        <div className="col-span-12 lg:col-span-7">
          <p className="mono-etiqueta text-concrete-dark">{home.cotizacion.eyebrow}</p>
          <Titulo id="titulo-cotizacion" className="text-5 mt-4 uppercase [font-stretch:88%]">
            {home.cotizacion.titular}
          </Titulo>
          <p className="text-2 text-concrete-dark mt-6 max-w-[52ch]">{home.cotizacion.texto}</p>
          <div className="mt-12">
            {/* El formulario (react-hook-form + zod) se descarga al acercarse a la pantalla. */}
            <FormularioCotizacionDiferido inmediato={inmediato}>
              <EsqueletoFormulario />
            </FormularioCotizacionDiferido>
          </div>
        </div>

        <aside
          aria-label={textosContacto.tarjeta}
          className="con-grano bg-ink text-bone col-span-12 self-start p-8 shadow-[10px_10px_0_0_var(--color-brand-yellow)] md:p-10 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-span-5"
        >
          <p className="font-display text-3 text-brand-yellow font-extrabold italic [font-stretch:80%]">
            {sitio.frases.atencion}
          </p>
          <dl className="mt-8 space-y-6">
            {/* @container: el número se ajusta al ancho real de la tarjeta y nunca se parte. */}
            <div className="@container">
              <dt className="mono-etiqueta text-concrete-light">{textosContacto.telefono}</dt>
              <dd className="cifras mt-2 text-[length:min(var(--text-4),11.5cqi)] leading-none font-bold whitespace-nowrap [font-stretch:87.5%]">
                <TelefonoProtegido
                  e164={contacto.telefono.e164}
                  visible={contacto.telefono.visible}
                />
              </dd>
            </div>
            {/* Un <dt> por rótulo distinto (como en el pie): cada correo queda bajo el suyo. */}
            {correosPorEtiqueta().map((grupo) => (
              <div key={grupo.etiqueta}>
                <dt className="mono-etiqueta text-concrete-light">{grupo.etiqueta}</dt>
                {grupo.correos.map((c) => (
                  <dd key={c.usuario} className="mt-2">
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
              <dt className="mono-etiqueta text-concrete-light">{textosContacto.direccion}</dt>
              <dd className="mt-2">
                <a
                  href={urlMapa()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="enlace-cinta"
                >
                  {/* Un solo nodo de texto: el nombre accesible no queda "Envigado,Antioquia". */}
                  {`${direccion.linea}, ${direccion.ciudad}, ${direccion.departamento}`}
                  <span className="solo-lectores">
                    {textosContacto.enMapa}
                    {avisoPestanaNueva}
                  </span>
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
            {textosContacto.escribirWhatsApp}
            <span className="solo-lectores">{avisoPestanaNueva}</span>
          </a>
        </aside>
      </div>
    </section>
  );
}
