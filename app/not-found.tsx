import Link from "next/link";
import { Icono } from "@/components/icons/Icono";

export default function NoEncontrada() {
  return (
    <section className="con-grano flex min-h-[80svh] items-end pb-20 pt-[calc(var(--header-h)+4rem)]" aria-labelledby="titulo-404">
      <div className="reticula w-full gap-y-6">
        <p className="cifras col-span-12 text-figure font-bold leading-none text-brand-yellow">404</p>
        <h1 id="titulo-404" className="col-span-12 text-4 uppercase [font-stretch:85%] md:col-span-8">
          Esta página no está en la obra
        </h1>
        <p className="col-span-12 max-w-[48ch] text-2 text-concrete-light md:col-span-6">
          Puede que el enlace haya cambiado. Vuelva al inicio o revise nuestras líneas de servicio.
        </p>
        <div className="col-span-12 flex flex-wrap gap-4">
          <Link href="/" className="boton boton-primario">
            Volver al inicio
          </Link>
          <Link href="/#servicios" className="boton boton-secundario">
            Ver equipos
          </Link>
        </div>
        <Icono id="puntal" className="col-span-12 mt-8 h-16 w-16 text-concrete-dark" />
      </div>
    </section>
  );
}
