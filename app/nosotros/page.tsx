import type { Metadata } from "next";
import { empresa } from "@/content/empresa";
import { Nosotros } from "@/components/sections/Nosotros";
import { Proceso } from "@/components/sections/Proceso";
import { Cotizacion } from "@/components/sections/Cotizacion";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: `${empresa.presentacion} Más de 15 años en el sector de la construcción en Envigado y Antioquia.`,
  alternates: { canonical: "/nosotros" },
};

export default function PaginaNosotros() {
  return (
    <>
      <div className="pt-[var(--header-h)]" />
      <Nosotros nivel="h1" id="quienes-somos" />
      <Proceso />
      <Cotizacion />
    </>
  );
}
