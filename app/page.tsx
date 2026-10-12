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

export default function Inicio() {
  return (
    <>
      <CapaEscena />
      <Hero />
      <BarraConfianza />
      <IndiceServicios />
      <div className="cinta-corte" aria-hidden="true" />
      {lineasDeServicio.map((linea) => (
        <LineaServicio key={linea.slug} linea={linea} />
      ))}
      <Marquee />
      <Nosotros />
      {/* Miniaturas en duotono: sin LQIP (el fondo tinta basta) para aligerar el HTML. */}
      <Inventario fotos={fotosPublicas.map((f) => aFotoCliente(f))} />
      <Proceso />
      <PreguntasFrecuentes />
      <Cierre />
      <Cotizacion />
      <JsonLd datos={jsonLdPreguntas()} />
    </>
  );
}
