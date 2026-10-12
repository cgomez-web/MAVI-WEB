import type { Metadata } from "next";
import { Cotizacion } from "@/components/sections/Cotizacion";
import { PreguntasFrecuentes } from "@/components/sections/PreguntasFrecuentes";

export const metadata: Metadata = {
  title: "Contacto y cotizaciones",
  description:
    "Cotice alquiler de maquinaria, transporte, equipos para losas, formaletería y andamios en Envigado: WhatsApp 322 559 9325, Cr 25 # 41B Sur 37, Envigado, Antioquia.",
  alternates: { canonical: "/contacto" },
};

export default function PaginaContacto() {
  return (
    <>
      <div className="bg-bone pt-[var(--header-h)]" />
      <Cotizacion nivel="h1" />
      <PreguntasFrecuentes />
    </>
  );
}
