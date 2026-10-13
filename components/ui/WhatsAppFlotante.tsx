"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { contacto, urlWhatsApp } from "@/content/contacto";
import { avisoPestanaNueva, textosCabecera } from "@/content/navegacion";

const CAMPOS = "input, textarea, select";
/** Botones de llamada a la acción del hero (Hero.tsx): repiten la acción de esta barra. */
const CTA_HERO = "[data-cta-hero]";

/**
 * Acceso fijo a WhatsApp, sin tapar contenido:
 *  - Móvil y tablet (< 1024 px): barra a todo lo ancho en el borde inferior. El cuerpo reserva su
 *    altura (padding-bottom + scroll-padding), así nada queda "medio tapado" por un botón en la
 *    esquina. Se retira mientras se escribe en un formulario (el teclado la empujaría encima) y
 *    mientras los botones del hero están a la vista (en pantallas cortas los taparía).
 *  - Escritorio: botón cuadrado dentro del margen lateral, fuera de la columna de contenido.
 * El mensaje precargado cambia según la sección visible (`data-whatsapp="…"`).
 */
export function WhatsAppFlotante() {
  const ruta = usePathname();
  const [mensaje, setMensaje] = useState<string>(contacto.whatsapp.mensajeGeneral);
  const [escribiendo, setEscribiendo] = useState(false);
  // En el home la barra parte retirada (los botones del hero están en la primera pantalla): así no
  // aparece y se esconde al cargar. El observador corrige el estado de inmediato. Sin JavaScript,
  // globals.css la deja a la vista (@media (scripting: none)).
  const [ctaHeroVisible, setCtaHeroVisible] = useState(ruta === "/");

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
    // Si el hilo principal va ocupado (hidratación, escena 3D) un lote puede traer varios cruces del
    // mismo botón (sale y vuelve a entrar): vale el último. Se ignoran entradas de un botón anterior
    // que hayan quedado en cola al cambiar de página.
    let ctaActual: Element | null = null;
    const obsHero = new IntersectionObserver((entradas) => {
      const propias = entradas.filter((e) => e.target === ctaActual);
      const ultima = propias[propias.length - 1];
      if (ultima) setCtaHeroVisible(ultima.isIntersecting);
    });
    const conectar = () => {
      document.querySelectorAll("[data-whatsapp]").forEach((el) => observador.observe(el));
      obsHero.disconnect();
      ctaActual = document.querySelector(CTA_HERO);
      if (ctaActual) obsHero.observe(ctaActual);
      else setCtaHeroVisible(false);
    };
    conectar();
    // Las páginas cambian sin recargar: se vuelve a conectar ante cambios del DOM principal.
    const mutaciones = new MutationObserver(() => conectar());
    const main = document.getElementById("contenido");
    if (main) mutaciones.observe(main, { childList: true, subtree: false });

    const alEnfocar = (e: FocusEvent) =>
      setEscribiendo(e.target instanceof Element && e.target.matches(CAMPOS));
    const alDesenfocar = () =>
      // Espera un instante: el foco puede saltar de un campo a otro.
      window.setTimeout(() => setEscribiendo(document.activeElement?.matches(CAMPOS) ?? false), 50);
    document.addEventListener("focusin", alEnfocar);
    document.addEventListener("focusout", alDesenfocar);
    // El foco pudo llegar a un campo antes de hidratar (sin evento focusin que escuchar).
    setEscribiendo(document.activeElement?.matches(CAMPOS) ?? false);
    return () => {
      observador.disconnect();
      obsHero.disconnect();
      mutaciones.disconnect();
      document.removeEventListener("focusin", alEnfocar);
      document.removeEventListener("focusout", alDesenfocar);
    };
    // Se reconecta en cada cambio de ruta (además del MutationObserver, por si el contenido llega tarde).
  }, [ruta]);

  return (
    <a
      href={urlWhatsApp(mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className="cta-whatsapp boton boton-primario no-imprimir"
      data-oculto={escribiendo || ctaHeroVisible ? "true" : "false"}
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
      <span className="cta-whatsapp-texto">{textosCabecera.cotizarWhatsApp}</span>
      <span className="solo-lectores">{avisoPestanaNueva}</span>
    </a>
  );
}
