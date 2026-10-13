import { paginas } from "@/content/sitio";
import { metaPagina } from "@/lib/metadatos";
import { Nosotros } from "@/components/sections/Nosotros";
import { Proceso } from "@/components/sections/Proceso";
import { Cotizacion } from "@/components/sections/Cotizacion";

export const metadata = metaPagina({
  titulo: paginas.nosotros.titulo,
  descripcion: paginas.nosotros.descripcion,
  ruta: "/nosotros",
});

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
