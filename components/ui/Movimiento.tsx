"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { EVENTO_MOVIMIENTO, movimientoPermitido } from "@/lib/preferencias";

const SELECTOR_REVELABLES = "[data-sello], .ficha, [data-revelar]";

/**
 * Orquestador global de movimiento (docs/MOTION.md):
 *  - Marca `html[data-js=on]` solo después de dejar visibles los elementos que ya están en pantalla
 *    (así nunca hay parpadeo ni contenido oculto sin JS).
 *  - Revelados por IntersectionObserver (sellos, fichas, cintas).
 *  - GSAP + ScrollTrigger (carga diferida): tipografía viva en encabezados sticky.
 *  - Lenis opcional: solo con puntero fino y movimiento permitido.
 */
export function Movimiento() {
  const ruta = usePathname();

  useEffect(() => {
    const raiz = document.documentElement;
    const elementos = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR_REVELABLES));
    const alto = window.innerHeight;

    if (!movimientoPermitido()) {
      for (const el of elementos) el.dataset.visible = "true";
      raiz.dataset.js = "on";
      return;
    }

    for (const el of elementos) {
      const r = el.getBoundingClientRect();
      if (r.top < alto && r.bottom > 0) el.dataset.visible = "true";
    }
    raiz.dataset.js = "on";

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.visible = "true";
          observador.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    for (const el of elementos) if (el.dataset.visible !== "true") observador.observe(el);

    let cancelado = false;
    let limpiarGsap: (() => void) | undefined;
    let limpiarLenis: (() => void) | undefined;

    const iniciar = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelado) return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // Tipografía viva: el titular sticky se "compacta" (wdth 125→62) a medida que se fija.
        gsap.utils.toArray<HTMLElement>("[data-tipografia-viva]").forEach((el) => {
          gsap.fromTo(
            el,
            { fontStretch: "112%", fontWeight: 900 },
            {
              fontStretch: "62%",
              fontWeight: 780,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 80%", end: "top top+=96", scrub: 0.4 },
            },
          );
        });
      });
      limpiarGsap = () => ctx.revert();

      const fino = window.matchMedia("(pointer: fine)").matches;
      if (fino) {
        const { default: Lenis } = await import("lenis");
        if (cancelado) return;
        const lenis = new Lenis({ lerp: 0.14, smoothWheel: true, anchors: { offset: -80 } });
        lenis.on("scroll", ScrollTrigger.update);
        const tic = (t: number) => lenis.raf(t * 1000);
        gsap.ticker.add(tic);
        gsap.ticker.lagSmoothing(0);
        limpiarLenis = () => {
          gsap.ticker.remove(tic);
          lenis.destroy();
        };
      }
      ScrollTrigger.refresh();
    };

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const tarea = idle(() => void iniciar());

    const alCambiarPreferencia = () => {
      if (!movimientoPermitido()) {
        limpiarLenis?.();
        limpiarLenis = undefined;
        limpiarGsap?.();
        limpiarGsap = undefined;
        for (const el of elementos) el.dataset.visible = "true";
      }
    };
    window.addEventListener(EVENTO_MOVIMIENTO, alCambiarPreferencia);

    return () => {
      cancelado = true;
      if (typeof tarea === "number") {
        window.cancelIdleCallback?.(tarea);
        window.clearTimeout(tarea);
      }
      observador.disconnect();
      window.removeEventListener(EVENTO_MOVIMIENTO, alCambiarPreferencia);
      limpiarLenis?.();
      limpiarGsap?.();
    };
  }, [ruta]);

  return null;
}
