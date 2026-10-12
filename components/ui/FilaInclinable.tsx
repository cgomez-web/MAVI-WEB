"use client";

import { useRef } from "react";
import { movimientoPermitido } from "@/lib/preferencias";

/**
 * Inclinación 3D leve (máx. 6°) siguiendo el puntero, y estado "activo" que revela la ficha
 * (hover, foco del enlace interno o toque).
 */
export function FilaInclinable({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = caja.current;
    if (!el || e.pointerType !== "mouse" || !movimientoPermitido()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty(
        "transform",
        `perspective(1200px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg)`,
      );
    });
  };

  const activar = () => caja.current?.setAttribute("data-activa", "true");
  const desactivar = () => {
    cancelAnimationFrame(raf.current);
    caja.current?.style.removeProperty("transform");
    caja.current?.removeAttribute("data-activa");
  };

  return (
    <div
      ref={caja}
      className={`fila-inclinable ${className}`}
      onPointerMove={alMover}
      onPointerEnter={activar}
      onPointerLeave={desactivar}
      onFocus={activar}
      onBlur={desactivar}
    >
      {children}
    </div>
  );
}
