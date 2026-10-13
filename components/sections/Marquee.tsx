"use client";

import { useEffect, useRef, useState } from "react";
import { home } from "@/content/home";
import { textosMarquee } from "@/content/interfaz";
import { EVENTO_MOVIMIENTO, movimientoPermitido } from "@/lib/preferencias";

/**
 * Marquee de equipos sobre la franja de peligro (única aparición de la franja en el sitio).
 * Velocidad base + inercia proporcional a la velocidad de scroll. Se pausa con hover y foco.
 * Con movimiento reducido se muestra como lista estática.
 */
export function Marquee() {
  const pista = useRef<HTMLDivElement>(null);
  const [animado, setAnimado] = useState(false);
  const pausado = useRef(false);
  const [detenido, setDetenido] = useState(false);

  useEffect(() => {
    const sincronizar = () => setAnimado(movimientoPermitido());
    sincronizar();
    window.addEventListener(EVENTO_MOVIMIENTO, sincronizar);
    return () => window.removeEventListener(EVENTO_MOVIMIENTO, sincronizar);
  }, []);

  const detenidoRef = useRef(false);
  useEffect(() => {
    detenidoRef.current = detenido;
  }, [detenido]);

  useEffect(() => {
    if (!animado || !pista.current) return;
    const el = pista.current;
    let x = 0;
    let impulso = 0;
    let ultimoScroll = window.scrollY;
    let anterior = performance.now();
    let raf = 0;
    let visible = false;

    const paso = (t: number) => {
      const dt = Math.min(64, t - anterior) / 1000;
      anterior = t;
      const ancho = el.scrollWidth / 2;
      if (!pausado.current && !detenidoRef.current) x -= (40 + impulso) * dt;
      impulso *= Math.pow(0.04, dt); // decae en ~600 ms
      if (-x >= ancho) x += ancho;
      el.style.setProperty("transform", `translate3d(${x.toFixed(1)}px,0,0)`);
      raf = visible ? requestAnimationFrame(paso) : 0;
    };

    const alDesplazar = () => {
      const y = window.scrollY;
      impulso = Math.min(900, impulso + Math.abs(y - ultimoScroll) * 6);
      ultimoScroll = y;
    };

    const obs = new IntersectionObserver(([e]) => {
      visible = Boolean(e?.isIntersecting);
      if (visible && !raf) {
        anterior = performance.now();
        raf = requestAnimationFrame(paso);
      }
    });
    obs.observe(el);
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", alDesplazar);
      el.style.removeProperty("transform");
    };
  }, [animado]);

  const elementos = home.marquee;

  return (
    <section aria-label={home.marqueeEtiqueta} className="bg-ink relative">
      <div
        className="border-ink bg-brand-yellow text-ink overflow-hidden border-y-[3px] py-5"
        onPointerEnter={() => (pausado.current = true)}
        onPointerLeave={() => (pausado.current = false)}
        onFocus={() => (pausado.current = true)}
        onBlur={() => (pausado.current = false)}
      >
        {animado ? (
          <div ref={pista} className="flex w-max will-change-transform" aria-hidden="true">
            {[0, 1].map((copia) => (
              <ul key={copia} className="flex shrink-0 items-center">
                {elementos.map((e) => (
                  <li key={`${copia}-${e}`} className="flex items-center">
                    <span className="font-display text-4 px-6 leading-none font-black uppercase [font-stretch:70%]">
                      {e}
                    </span>
                    <span className="bg-ink h-3 w-3 rotate-45" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ) : null}
        <ul className={animado ? "solo-lectores" : "contenedor flex flex-wrap gap-x-6 gap-y-2"}>
          {elementos.map((e) => (
            <li
              key={e}
              className={
                animado ? undefined : "font-display text-3 font-black uppercase [font-stretch:70%]"
              }
            >
              {e}
            </li>
          ))}
        </ul>
      </div>
      <div className="franja-peligro relative h-6">
        {animado ? (
          <button
            type="button"
            onClick={() => setDetenido((d) => !d)}
            className="mono-etiqueta border-ink bg-bone text-ink absolute top-1/2 right-[var(--margin)] -translate-y-1/2 border-2 px-2 py-0.5"
          >
            {/* El rótulo dice la acción y cambia con el estado; por eso no hay aria-pressed. */}
            {detenido ? textosMarquee.reanudar : textosMarquee.pausar}
          </button>
        ) : null}
      </div>
    </section>
  );
}
