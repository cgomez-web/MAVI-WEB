import { sitio } from "@/content/sitio";
import { urlWhatsApp } from "@/content/contacto";
import { IsotipoMavi } from "@/components/brand/Logo";

/**
 * Cierre narrativo: ventana a la escena con la obra terminada al atardecer y el lema.
 * Sin fondo propio: deja ver la capa 3D (o el póster).
 */
export function Cierre() {
  return (
    <section
      aria-labelledby="titulo-cierre"
      data-fase="cierre"
      data-ventana-3d=""
      className="relative flex min-h-[88svh] items-end pt-32 pb-20"
    >
      <div className="reticula w-full gap-y-8">
        <IsotipoMavi className="col-span-12 h-14 w-14" />
        <h2
          id="titulo-cierre"
          className="col-span-12 text-[clamp(2.75rem,0.5rem+7.2vw,8.5rem)] leading-[0.86] uppercase md:col-span-10"
        >
          {/* En móvil, ancho moderado: "FACILITAMOS" a 112 % no cabe en 360 px y ensancharía la página. */}
          <span className="block [font-stretch:88%] sm:[font-stretch:112%]">Facilitamos</span>
          <span className="text-brand-yellow block [font-stretch:66%]">su avance.</span>
        </h2>
        <p className="text-2 text-bone/90 col-span-12 max-w-[44ch] md:col-span-6">
          {sitio.frases.compromiso} {sitio.frases.atencion}
        </p>
        <div className="col-span-12 flex flex-wrap gap-4">
          <a
            href={urlWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-primario text-1"
          >
            Cotizar por WhatsApp <span aria-hidden="true">→</span>
          </a>
          <a href="#cotizacion" className="boton boton-secundario text-1">
            Llenar el formulario
          </a>
        </div>
      </div>
    </section>
  );
}
