"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { enOcio, escucharMovimiento, movimientoPermitido } from "@/lib/preferencias";

const SELECTOR_REVELABLES = "[data-sello], .ficha, [data-revelar]";

type Limpieza = () => void;

/**
 * Orquestador global de movimiento (docs/MOTION.md):
 *  - Marca `html[data-js=on]` solo después de dejar visibles los elementos que ya están en pantalla
 *    (así nunca hay parpadeo ni contenido oculto sin JS). Se averigua con IntersectionObserver y no con
 *    getBoundingClientRect: leer la geometría obligaría a maquetar las secciones del inicio que el
 *    navegador aplaza con `content-visibility: auto` (app/page.tsx).
 *  - Revelados por IntersectionObserver (sellos, fichas, cintas).
 *  - Tipografía viva (GSAP, carga diferida) SOLO en páginas con `[data-tipografia-viva]`: sin destinos
 *    no se descarga GSAP. El progreso se mide en vivo (IntersectionObserver + scroll pasivo) en lugar de
 *    con ScrollTrigger: sin posiciones precalculadas que queden viejas cuando una sección aplazada cambia
 *    de alto y sin el bucle permanente de requestAnimationFrame de ScrollTrigger (el reloj de GSAP se
 *    duerme solo cuando no hay nada animándose).
 *  - Lenis opcional: solo con puntero fino y movimiento permitido (ver montarLenis, en el módulo diferido).
 * Aquí solo vive lo que hace falta al cargar (va en el JS inicial de TODAS las rutas, porque el layout lo
 * monta). La tipografía viva y Lenis están en ./movimiento-diferido, que llega con import() en tiempo
 * ocioso junto con GSAP o Lenis, y solo si hay algo que hacer: sin destinos ni puntero fino (móvil fuera
 * del inicio) no se descarga nada.
 * Todo lo diferido se apaga con el conmutador "Animaciones" o con prefers-reduced-motion, y vuelve a
 * encenderse si se reactivan. Las secciones aplazadas que quedan atrás se fijan siempre (ver
 * fijarSeccionesPasadas).
 */
export function Movimiento() {
  const ruta = usePathname();

  useEffect(() => {
    const raiz = document.documentElement;
    const elementos = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR_REVELABLES));
    let observador: IntersectionObserver | undefined;
    let inicial: IntersectionObserver | undefined;
    let cancelarOcio: Limpieza | undefined;
    let limpiezas: Limpieza[] = [];
    let generacion = 0;

    const detener = () => {
      generacion++;
      cancelarOcio?.();
      inicial?.disconnect();
      observador?.disconnect();
      observador = inicial = cancelarOcio = undefined;
      const pendientes = limpiezas;
      limpiezas = [];
      // Cada limpieza por separado: si una falla, las demás (p. ej. destruir Lenis) se hacen igual.
      for (const limpiar of pendientes) {
        try {
          limpiar();
        } catch (error) {
          console.error(error);
        }
      }
    };
    const mostrarTodo = () => {
      detener();
      for (const el of elementos) el.dataset.visible = "true";
      raiz.dataset.js = "on";
    };

    const encender = () => {
      if (observador || !movimientoPermitido()) return;
      const revelar = (entradas: IntersectionObserverEntry[]) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.visible = "true";
          observador?.unobserve(e.target);
        }
      };
      // Con el primer píxel a la vista: la banda de la cinta, los filetes y el sello arrancan al asomar
      // el bloque (con un umbral proporcional los bloques altos se revelaban ya a medio entrar).
      observador = new IntersectionObserver(revelar, { rootMargin: "0px", threshold: 0 });
      const pendientes = elementos.filter((el) => el.dataset.visible !== "true");
      const vigilar = () => {
        inicial?.disconnect();
        inicial = undefined;
        raiz.dataset.js = "on";
        for (const el of pendientes) if (el.dataset.visible !== "true") observador?.observe(el);
      };
      if (raiz.dataset.js === "on" || pendientes.length === 0) {
        vigilar();
      } else {
        // Primera carga: lo que ya asoma en pantalla queda visible ANTES de activar los estados ocultos.
        inicial = new IntersectionObserver((entradas) => {
          for (const e of entradas) {
            if (e.isIntersecting) (e.target as HTMLElement).dataset.visible = "true";
          }
          vigilar();
        });
        for (const el of pendientes) inicial.observe(el);
      }

      const esta = generacion;
      cancelarOcio = enOcio(async () => {
        cancelarOcio = undefined;
        const vivos = Array.from(document.querySelectorAll<HTMLElement>("[data-tipografia-viva]"));
        const fino = window.matchMedia("(pointer: fine)").matches;
        if (vivos.length === 0 && !fino) return;
        // Las tres descargas van en paralelo; el módulo diferido es el mismo chunk que usa la transición.
        const [diferido, conGsap, conLenis] = await Promise.all([
          import("./movimiento-diferido"),
          vivos.length > 0 ? import("gsap") : undefined,
          fino ? import("lenis") : undefined,
        ]);
        if (esta !== generacion) return;
        if (conGsap) limpiezas.push(diferido.tipografiaViva(conGsap.gsap, vivos));
        if (conLenis) limpiezas.push(diferido.montarLenis(conLenis.default));
      });
    };

    if (movimientoPermitido()) encender();
    else mostrarTodo();
    const quitarEscucha = escucharMovimiento((permitido) =>
      permitido ? encender() : mostrarTodo(),
    );
    const quitarFijado = fijarSeccionesPasadas();
    return () => {
      quitarEscucha();
      quitarFijado();
      detener();
    };
  }, [ruta]);

  return null;
}

/**
 * Secciones aplazadas del inicio (`content-visibility: auto`, app/page.tsx) que ya quedaron por encima de
 * la ventana: se pasan a `content-visibility: visible`.
 *
 * Mientras no se han pintado, cada sección ocupa su alto ESTIMADO. Si se pinta por primera vez estando
 * por encima de la ventana (al subir después de saltar a un ancla, entrar por /#…, arrastrar la barra o
 * pulsar Fin), todo lo visible se corre, y Chromium no lo compensa cuando el cambio viene del propio
 * content-visibility: auto (medido: CLS de 0,30–0,39 al subir desde #cotizacion). En cambio, si la
 * sección se pinta por un cambio de estilo, el anclaje de scroll nativo sí lo compensa (CLS ~0 y el
 * destino del ancla quieto). Se hace en el evento scroll, que llega antes del layout del cuadro.
 * Una sección que ya se había pintado tiene recordado su alto real (`contain-intrinsic-size: auto`):
 * pasarla a visible no mueve nada.
 */
function fijarSeccionesPasadas(): Limpieza {
  let pendientes = Array.from(
    document.querySelectorAll<HTMLElement>('[style*="content-visibility"]'),
  );
  const revisar = () => {
    pendientes = pendientes.filter((el) => {
      if (el.getBoundingClientRect().bottom > 0) return true;
      el.style.contentVisibility = "visible";
      return false;
    });
    if (pendientes.length === 0) removeEventListener("scroll", revisar);
  };
  if (pendientes.length > 0) {
    addEventListener("scroll", revisar, { passive: true });
    revisar();
  }
  return () => removeEventListener("scroll", revisar);
}
