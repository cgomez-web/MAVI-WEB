"use client";

import { useEffect, useState } from "react";
import { contacto, urlWhatsApp } from "@/content/contacto";

/**
 * Botón flotante de WhatsApp. El mensaje precargado cambia según la sección visible:
 * cualquier elemento con `data-whatsapp="…"` aporta su mensaje mientras está en pantalla.
 */
export function WhatsAppFlotante() {
  const [mensaje, setMensaje] = useState<string>(contacto.whatsapp.mensajeGeneral);

  useEffect(() => {
    const visibles = new Map<Element, number>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visibles.set(e.target, e.intersectionRatio);
          else visibles.delete(e.target);
        }
        let mejor: Element | null = null;
        let ratio = 0;
        for (const [el, r] of visibles) {
          if (r > ratio) {
            ratio = r;
            mejor = el;
          }
        }
        setMensaje(mejor?.getAttribute("data-whatsapp") ?? contacto.whatsapp.mensajeGeneral);
      },
      { threshold: [0, 0.25, 0.5, 0.75] },
    );
    const conectar = () => document.querySelectorAll("[data-whatsapp]").forEach((el) => observador.observe(el));
    conectar();
    // Las páginas cambian sin recargar: se vuelve a conectar ante cambios del DOM principal.
    const mutaciones = new MutationObserver(() => conectar());
    const main = document.getElementById("contenido");
    if (main) mutaciones.observe(main, { childList: true, subtree: false });
    return () => {
      observador.disconnect();
      mutaciones.disconnect();
    };
  }, []);

  return (
    <a
      href={urlWhatsApp(mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className="boton boton-primario no-imprimir fixed bottom-4 right-4 z-40 min-h-14 gap-3 px-4 shadow-[4px_4px_0_0_var(--color-ink)] sm:bottom-6 sm:right-6"
      aria-label="Cotizar por WhatsApp (se abre en una pestaña nueva)"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="square"
        aria-hidden="true"
      >
        <path d="M4 28l2.5-6.5A12 12 0 1 1 11 26z" />
        <path d="M12 12c0 5 3 8 8 8l2-3-3-1.5-1.5 1.5c-1.5-.5-3-2-3.5-3.5L15.5 12 14 9z" strokeWidth={2} />
      </svg>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
