"use client";

import { useEffect, useState } from "react";
import { contacto, urlWhatsApp } from "@/content/contacto";

const CAMPOS = "input, textarea, select";

/**
 * Acceso fijo a WhatsApp, sin tapar contenido:
 *  - Móvil y tablet (< 1024 px): barra a todo lo ancho en el borde inferior. El cuerpo reserva su
 *    altura (padding-bottom + scroll-padding), así nada queda "medio tapado" por un botón en la
 *    esquina. Se oculta mientras se escribe en un formulario (el teclado la empujaría encima).
 *  - Escritorio: botón cuadrado dentro del margen lateral, fuera de la columna de contenido.
 * El mensaje precargado cambia según la sección visible (`data-whatsapp="…"`).
 */
export function WhatsAppFlotante() {
  const [mensaje, setMensaje] = useState<string>(contacto.whatsapp.mensajeGeneral);
  const [escribiendo, setEscribiendo] = useState(false);

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
    const conectar = () =>
      document.querySelectorAll("[data-whatsapp]").forEach((el) => observador.observe(el));
    conectar();
    // Las páginas cambian sin recargar: se vuelve a conectar ante cambios del DOM principal.
    const mutaciones = new MutationObserver(() => conectar());
    const main = document.getElementById("contenido");
    if (main) mutaciones.observe(main, { childList: true, subtree: false });

    const alEnfocar = (e: FocusEvent) =>
      setEscribiendo(e.target instanceof Element && e.target.matches(CAMPOS));
    const alDesenfocar = () =>
      // Espera un instante: el foco puede saltar de un campo a otro.
      window.setTimeout(
        () => setEscribiendo(document.activeElement?.matches(CAMPOS) ?? false),
        50,
      );
    document.addEventListener("focusin", alEnfocar);
    document.addEventListener("focusout", alDesenfocar);
    return () => {
      observador.disconnect();
      mutaciones.disconnect();
      document.removeEventListener("focusin", alEnfocar);
      document.removeEventListener("focusout", alDesenfocar);
    };
  }, []);

  return (
    <a
      href={urlWhatsApp(mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className="cta-whatsapp boton boton-primario no-imprimir"
      data-oculto={escribiendo ? "true" : "false"}
      aria-label="Cotizar por WhatsApp (se abre en una pestaña nueva)"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-6 w-6 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="square"
        aria-hidden="true"
      >
        <path d="M4 28l2.5-6.5A12 12 0 1 1 11 26z" />
        <path
          d="M12 12c0 5 3 8 8 8l2-3-3-1.5-1.5 1.5c-1.5-.5-3-2-3.5-3.5L15.5 12 14 9z"
          strokeWidth={2}
        />
      </svg>
      <span className="cta-whatsapp-texto">Cotizar por WhatsApp</span>
    </a>
  );
}
