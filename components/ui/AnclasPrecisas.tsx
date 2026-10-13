"use client";

import { useEffect } from "react";

const APLAZADAS = '[style*="content-visibility"]';

/**
 * Saltos a anclas exactos en el inicio.
 *
 * Las secciones bajo el pliegue usan `content-visibility: auto` (app/page.tsx): mientras no se han
 * pintado, el navegador usa una altura estimada y un salto a `#inventario` o `#proceso` aterriza
 * cientos de píxeles fuera de lugar. Justo antes de cualquier salto (clic en un enlace interno,
 * cambio de `#` en la URL o carga con `#`), se maquetan de una vez todas las secciones aplazadas y
 * se quedan así: el salto se calcula con las alturas reales. El coste (un maquetado completo) solo
 * se paga cuando el visitante pide saltar.
 */
function revelarAplazadas(): boolean {
  let cambio = false;
  document.querySelectorAll<HTMLElement>(APLAZADAS).forEach((el) => {
    if (el.style.contentVisibility !== "visible") {
      el.style.contentVisibility = "visible";
      cambio = true;
    }
  });
  return cambio;
}

function destinoDe(hash: string): HTMLElement | null {
  if (!hash || hash === "#") return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

function irA(destino: HTMLElement) {
  // scrollIntoView respeta scroll-padding-top (altura de la cabecera fija).
  destino.scrollIntoView({ block: "start" });
}

export function AnclasPrecisas() {
  useEffect(() => {
    // 1. Carga (o navegación del cliente) con # en la URL: el navegador ya saltó con alturas
    //    estimadas; se maqueta todo y se corrige la posición. Las fuentes y las imágenes que llegan
    //    después cambian alturas por encima del destino, así que se vuelve a ajustar al terminar de
    //    cargar, salvo que la persona ya haya empezado a desplazarse por su cuenta.
    let tocado = false;
    const marcarTocado = () => {
      tocado = true;
    };
    const ENTRADAS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    for (const ev of ENTRADAS)
      window.addEventListener(ev, marcarTocado, { passive: true, once: true });
    const inicial = destinoDe(window.location.hash);
    let vigilante: ResizeObserver | undefined;
    let finVigilancia = 0;
    if (inicial) {
      revelarAplazadas();
      const ajustar = () => {
        if (!tocado) irA(inicial);
      };
      requestAnimationFrame(ajustar);
      void document.fonts?.ready.then(() => requestAnimationFrame(ajustar));
      if (document.readyState !== "complete")
        window.addEventListener("load", ajustar, { once: true });
      // Una fuente que se pide tarde (p. ej. la de los sellos, sin precarga) o cualquier cambio de
      // altura del contenido en los primeros segundos vuelve a ajustar el salto.
      const contenido = document.getElementById("contenido");
      if (contenido && "ResizeObserver" in window) {
        vigilante = new ResizeObserver(() => requestAnimationFrame(ajustar));
        vigilante.observe(contenido);
        finVigilancia = window.setTimeout(() => vigilante?.disconnect(), 6000);
      }
    }

    // 2. Clic en un enlace a un ancla de esta misma página: en fase de captura, antes de que el
    //    navegador (o Lenis) calcule el destino.
    const alClic = (e: MouseEvent) => {
      const enlace = (e.target as Element | null)?.closest?.("a[href*='#']");
      if (!(enlace instanceof HTMLAnchorElement)) return;
      const url = new URL(enlace.href, window.location.href);
      if (url.pathname !== window.location.pathname || !destinoDe(url.hash)) return;
      revelarAplazadas();
    };

    // 3. Cambios de # hechos por código o con atrás/adelante.
    const alCambiarHash = () => {
      const destino = destinoDe(window.location.hash);
      if (destino && revelarAplazadas()) requestAnimationFrame(() => irA(destino));
    };

    document.addEventListener("click", alClic, { capture: true });
    window.addEventListener("hashchange", alCambiarHash);
    return () => {
      vigilante?.disconnect();
      window.clearTimeout(finVigilancia);
      for (const ev of ENTRADAS) window.removeEventListener(ev, marcarTocado);
      document.removeEventListener("click", alClic, { capture: true });
      window.removeEventListener("hashchange", alCambiarHash);
    };
  }, []);

  return null;
}
