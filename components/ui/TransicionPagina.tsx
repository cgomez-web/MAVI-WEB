"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { enOcio, escucharMovimiento, movimientoPermitido } from "@/lib/preferencias";
import type { Cinta } from "./movimiento-diferido";

/**
 * Transición de página "cinta" (PROMPT §2.2, MOTION.md #5: máscara amarilla diagonal con grano).
 *
 * En cada navegación del cliente, una placa inclinada −12° (la geometría de las demás cintas) cubre la
 * ventana y sale por la derecha: su borde es la cinta amarilla y lo que queda a su izquierda ya es la
 * página nueva. Dura 300 ms EN TOTAL, así que nada tapa el contenido más de eso (MOTION.md, regla 2);
 * con --ease-weight casi toda la pantalla queda a la vista en la primera mitad.
 *
 * Aquí solo está la capa oculta y el disparo: va en el JS inicial de todas las rutas. La animación
 * (montarCinta, en ./movimiento-diferido) llega con import() en tiempo ocioso, en el mismo chunk que usa
 * Movimiento; se puede porque la primera carga nunca anima. Una navegación antes de que llegue (o si no
 * llega) simplemente no tiene cinta. Sin movimiento permitido no se descarga; si se activa después, sí.
 *
 * Se arranca en un layout effect, antes del primer pintado de la página nueva (sin corte seco). Va por
 * encima del contenido y del acceso a WhatsApp y por debajo de la cabecera; no recibe eventos
 * (pointer-events: none) ni existe para los lectores de pantalla. No corre en la primera carga, con
 * prefers-reduced-motion ni con el conmutador "Animaciones" apagado (y se corta si se apaga a mitad).
 * Solo clases de Tailwind, atributos style y la Web Animations API: nada de <style> en línea (CSP).
 */
export function TransicionPagina() {
  const ruta = usePathname();
  const capa = useRef<HTMLDivElement>(null);
  const rutaAnterior = useRef<string | null>(null);
  const cinta = useRef<Cinta | null>(null);

  useLayoutEffect(() => {
    const anterior = rutaAnterior.current;
    rutaAnterior.current = ruta;
    if (anterior !== null && anterior !== ruta) cinta.current?.animar();
  }, [ruta]);

  useEffect(() => {
    let vigente = true;
    let pedida = false;
    const cargar = () => {
      if (pedida || !movimientoPermitido()) return;
      pedida = true;
      import("./movimiento-diferido").then(
        ({ montarCinta }) => {
          if (vigente && capa.current) cinta.current = montarCinta(capa.current);
        },
        () => {
          pedida = false; // sin el módulo (red caída, despliegue nuevo) no hay cinta; se reintenta luego
        },
      );
    };
    const cancelarOcio = enOcio(cargar);
    const quitarEscucha = escucharMovimiento(cargar);
    return () => {
      vigente = false;
      cancelarOcio();
      quitarEscucha();
      cinta.current?.destruir();
      cinta.current = null;
    };
  }, []);

  return (
    <div
      ref={capa}
      aria-hidden="true"
      data-transicion-pagina=""
      hidden
      className="pointer-events-none fixed inset-0 z-[45] overflow-hidden"
    >
      <div className="absolute inset-y-0 left-0 flex will-change-transform">
        <div className="flex-none bg-blend-multiply [background:var(--grain),var(--color-brand-yellow)]" />
        <div className="bg-ink flex-auto" />
      </div>
    </div>
  );
}
