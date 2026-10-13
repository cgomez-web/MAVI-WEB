import { lineasDeServicio } from "@/content/servicios";
import { fotosPublicas } from "@/lib/galeria";
import { aFotoCliente } from "@/lib/imagenes";
import { jsonLdPreguntas } from "@/lib/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { CapaEscena } from "@/components/three/CapaEscena";
import { Hero } from "@/components/sections/Hero";
import { BarraConfianza } from "@/components/sections/BarraConfianza";
import { IndiceServicios } from "@/components/sections/IndiceServicios";
import { LineaServicio } from "@/components/sections/LineaServicio";
import { Marquee } from "@/components/sections/Marquee";
import { Nosotros } from "@/components/sections/Nosotros";
import { Inventario } from "@/components/sections/Inventario";
import { Proceso } from "@/components/sections/Proceso";
import { PreguntasFrecuentes } from "@/components/sections/PreguntasFrecuentes";
import { Cotizacion } from "@/components/sections/Cotizacion";
import { Cierre } from "@/components/sections/Cierre";

/**
 * Bloque bajo el pliegue que el navegador maqueta y pinta solo cuando se acerca a la ventana
 * (`content-visibility: auto`). Así el primer pintado del inicio no espera a maquetar ~2 000 cajas
 * (fichas, galería, preguntas, formulario) que no se ven, y las fuentes que llegan tarde solo obligan
 * a rehacer lo visible.
 *
 * `alto` es una estimación del alto real (mediana entre móvil y escritorio) para que la barra de
 * desplazamiento y los saltos a anclas no bailen; con `auto`, una vez pintado se recuerda el real.
 * El contenido sigue en el HTML: anclas, búsqueda en la página y lectores de pantalla lo encuentran.
 * Ninguna de estas secciones dibuja fuera de su caja (la contención de pintura no recorta nada) y sus
 * elementos sticky siguen funcionando dentro de su propia sección.
 */
function Aplazada({ alto, children }: { alto: string; children: React.ReactNode }) {
  return (
    <div style={{ contentVisibility: "auto", containIntrinsicSize: `auto ${alto}` }}>
      {children}
    </div>
  );
}

export default function Inicio() {
  return (
    <>
      <CapaEscena />
      <Hero />
      <BarraConfianza />
      <Aplazada alto="1950px">
        <IndiceServicios />
      </Aplazada>
      <div className="cinta-corte" aria-hidden="true" />
      {lineasDeServicio.map((linea) => (
        <Aplazada key={linea.slug} alto="1750px">
          <LineaServicio linea={linea} />
        </Aplazada>
      ))}
      <Aplazada alto="350px">
        <Marquee />
      </Aplazada>
      <Aplazada alto="2150px">
        <Nosotros />
      </Aplazada>
      {/* Miniaturas en duotono: sin LQIP (el fondo tinta basta) para aligerar el HTML. */}
      <Aplazada alto="1380px">
        <Inventario fotos={fotosPublicas.map((f) => aFotoCliente(f))} />
      </Aplazada>
      <Aplazada alto="1300px">
        <Proceso />
      </Aplazada>
      <Aplazada alto="680px">
        <PreguntasFrecuentes />
      </Aplazada>
      <Aplazada alto="88svh">
        <Cierre />
      </Aplazada>
      <Aplazada alto="2000px">
        <Cotizacion />
      </Aplazada>
      <JsonLd datos={jsonLdPreguntas()} />
    </>
  );
}
