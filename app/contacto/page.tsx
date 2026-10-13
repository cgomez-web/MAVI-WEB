import { paginas } from "@/content/sitio";
import { metaPagina } from "@/lib/metadatos";
import { Cotizacion } from "@/components/sections/Cotizacion";
import { PreguntasFrecuentes } from "@/components/sections/PreguntasFrecuentes";

export const metadata = metaPagina({
  titulo: paginas.contacto.titulo,
  descripcion: paginas.contacto.descripcion,
  ruta: "/contacto",
});

export default function PaginaContacto() {
  return (
    <>
      <div className="bg-bone pt-[var(--header-h)]" />
      <Cotizacion nivel="h1" />
      <PreguntasFrecuentes />
    </>
  );
}
