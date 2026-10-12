"use client";

import { useEffect, useRef } from "react";

/** Barra superior de progreso de lectura con marcas de cinta métrica. */
export function BarraProgreso() {
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let pendiente = 0;
    const actualizar = () => {
      pendiente = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      barra.current?.style.setProperty("transform", `scaleX(${p})`);
    };
    const alDesplazar = () => {
      if (!pendiente) pendiente = requestAnimationFrame(actualizar);
    };
    actualizar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    window.addEventListener("resize", alDesplazar);
    return () => {
      window.removeEventListener("scroll", alDesplazar);
      window.removeEventListener("resize", alDesplazar);
      cancelAnimationFrame(pendiente);
    };
  }, []);

  return (
    <div aria-hidden="true" className="no-imprimir pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
      <div
        ref={barra}
        className="h-full origin-left scale-x-0 bg-brand-yellow"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--color-ink) 0 1px, transparent 1px 8px)",
          backgroundSize: "100% 50%",
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
