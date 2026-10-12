"use client";

import { useEffect, useRef } from "react";
import { EVENTO_MOVIMIENTO, movimientoPermitido } from "@/lib/preferencias";

/**
 * Cursor propio (solo puntero fino y con movimiento permitido): punto rojo puntal + anillo que
 * se expande sobre elementos interactivos. Sobre la galería se convierte en gancho de grúa
 * (`data-cursor="gancho"`) o en "+" (`data-cursor="mas"`).
 */
export function Cursor() {
  const punto = useRef<HTMLDivElement>(null);
  const anillo = useRef<HTMLDivElement>(null);
  const icono = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fino = window.matchMedia("(pointer: fine)");
    let activo = false;
    let raf = 0;
    const objetivo = { x: -100, y: -100 };
    const actual = { x: -100, y: -100 };

    const pintar = () => {
      actual.x += (objetivo.x - actual.x) * 0.2;
      actual.y += (objetivo.y - actual.y) * 0.2;
      anillo.current?.style.setProperty("transform", `translate3d(${actual.x}px, ${actual.y}px, 0)`);
      raf = Math.abs(objetivo.x - actual.x) + Math.abs(objetivo.y - actual.y) > 0.3 ? requestAnimationFrame(pintar) : 0;
    };

    const alMover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      objetivo.x = e.clientX;
      objetivo.y = e.clientY;
      punto.current?.style.setProperty("transform", `translate3d(${e.clientX}px, ${e.clientY}px, 0)`);
      const sobre = (e.target as Element | null)?.closest?.("a, button, [role='button'], input, select, textarea, label, [data-cursor]");
      const modo = sobre?.getAttribute("data-cursor") ?? (sobre ? "activo" : "");
      anillo.current?.setAttribute("data-modo", modo);
      if (icono.current) icono.current.textContent = modo === "mas" ? "+" : "";
      if (!raf) raf = requestAnimationFrame(pintar);
    };

    const sincronizar = () => {
      const debe = fino.matches && movimientoPermitido();
      if (debe === activo) return;
      activo = debe;
      document.documentElement.dataset.cursor = debe ? "on" : "off";
      if (debe) window.addEventListener("pointermove", alMover, { passive: true });
      else window.removeEventListener("pointermove", alMover);
    };

    sincronizar();
    fino.addEventListener("change", sincronizar);
    window.addEventListener(EVENTO_MOVIMIENTO, sincronizar);
    return () => {
      fino.removeEventListener("change", sincronizar);
      window.removeEventListener(EVENTO_MOVIMIENTO, sincronizar);
      window.removeEventListener("pointermove", alMover);
      cancelAnimationFrame(raf);
      document.documentElement.dataset.cursor = "off";
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div
        ref={anillo}
        className="cursor-anillo absolute left-0 top-0 -ml-[14px] -mt-[14px] flex h-7 w-7 items-center justify-center border-2 border-bone mix-blend-difference"
      >
        <span ref={icono} className="font-mono text-lg leading-none text-bone" />
        <svg className="cursor-gancho h-5 w-5 text-bone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 2v8 M12 10a5 5 0 1 0 5 5h-3" strokeLinecap="square" />
        </svg>
      </div>
      <div ref={punto} className="absolute left-0 top-0 -ml-1 -mt-1 h-2 w-2 bg-strut-red" />
    </div>
  );
}
