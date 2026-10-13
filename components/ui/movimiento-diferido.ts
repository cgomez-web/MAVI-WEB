/**
 * Movimiento diferido: el código que solo hace falta DESPUÉS de la primera carga.
 *
 * Nunca se importa de forma estática: components/ui/Movimiento.tsx y components/ui/TransicionPagina.tsx
 * lo piden con import() en tiempo ocioso, así que no entra al JS inicial de ninguna ruta (presupuesto de
 * 150 kB gz, scripts/presupuesto-js.mjs) y llega en un solo chunk compartido. GSAP y Lenis tampoco se
 * importan aquí: Movimiento los descarga en paralelo solo cuando hay destinos y los pasa como argumento.
 *  - tipografiaViva: titulares sticky de las líneas de servicio (solo en el inicio).
 *  - montarLenis: scroll suave con la rueda (solo con puntero fino).
 *  - montarCinta: la transición de página "cinta" (TransicionPagina).
 * Todo respeta prefers-reduced-motion y el conmutador "Animaciones": quien lo llama no lo monta sin
 * movimiento permitido y la cinta se corta sola si se apaga a mitad.
 */
import type { gsap as GsapTipo } from "gsap";
import type LenisTipo from "lenis";
import { escucharMovimiento, movimientoPermitido } from "@/lib/preferencias";

type Limpieza = () => void;

/**
 * Tipografía viva: el titular sticky de cada línea se compacta (font-stretch 112 % → 62 %, wght
 * 900 → 780) desde que su borde superior entra al 80 % de la ventana hasta que llega a 96 px.
 * Equivale al ScrollTrigger `scrub: 0.4` de antes: el valor alcanza al scroll en 0,4 s.
 * Hasta que GSAP llega, el titular está en su reposo del CSS (100 %, 850); el primer valor se aplica
 * fuera de la vista o, si el titular ya se ve, se alcanza con suavizado desde ese reposo (sin salto).
 */
export function tipografiaViva(gsap: typeof GsapTipo, objetivos: HTMLElement[]): Limpieza {
  const progreso = (arriba: number) => {
    const inicio = window.innerHeight * 0.8;
    return Math.min(1, Math.max(0, (inicio - arriba) / Math.max(1, inicio - 96)));
  };
  /** Progreso cuyo font-stretch coincide con el reposo del CSS: (112 − 100) / (112 − 62). */
  const P_REPOSO = 0.24;
  const hacia = new Map<Element, (valor: number, inicio?: number) => unknown>();
  const ultimo = new Map<Element, number>();
  /** `desde`: valor de partida; igual a `p` salta sin suavizado (solo se usa fuera de la vista). */
  const llevar = (el: Element, p: number, desde?: number) => {
    if (desde === undefined && Math.abs((ultimo.get(el) ?? -1) - p) < 0.001) return;
    ultimo.set(el, p);
    const f = hacia.get(el);
    if (desde === undefined) f?.(p);
    else f?.(p, desde);
  };
  const ctx = gsap.context(() => {
    for (const el of objetivos) {
      const compactar = gsap.fromTo(
        el,
        { fontStretch: "112%", fontWeight: 900 },
        // Sin render inmediato: nada cambia hasta que el titular recibe su primer valor.
        { fontStretch: "62%", fontWeight: 780, ease: "none", paused: true, immediateRender: false },
      );
      const estado = { p: 0 };
      const aplicar = () => void compactar.progress(estado.p);
      hacia.set(
        el,
        gsap.quickTo(estado, "p", { duration: 0.4, ease: "power3", onUpdate: aplicar }),
      );
    }
  });

  // Solo se miden los titulares cercanos a la ventana: así no se fuerza el layout de secciones aplazadas.
  const cercanos = new Set<Element>();
  let raf = 0;
  const medir = () => {
    raf = 0;
    for (const el of cercanos) llevar(el, progreso(el.getBoundingClientRect().top));
  };
  const pedir = () => {
    if (!raf && cercanos.size > 0) raf = requestAnimationFrame(medir);
  };
  const iniciados = new Set<Element>();
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) cercanos.add(e.target);
        else cercanos.delete(e.target);
        const r = e.boundingClientRect;
        if (r.height <= 0) continue; // dentro de una sección aplazada aún sin maquetar
        const p = progreso(r.top);
        const aLaVista = r.bottom > 0 && r.top < window.innerHeight;
        // Al entrar o salir de la zona vigilada (aún fuera de la vista) se fija el valor sin suavizado.
        llevar(e.target, p, aLaVista && !iniciados.has(e.target) ? P_REPOSO : p);
        iniciados.add(e.target);
      }
      pedir();
    },
    { rootMargin: "25% 0px" },
  );
  for (const el of objetivos) observador.observe(el);
  addEventListener("scroll", pedir, { passive: true });
  addEventListener("resize", pedir);

  return () => {
    observador.disconnect();
    removeEventListener("scroll", pedir);
    removeEventListener("resize", pedir);
    cancelAnimationFrame(raf);
    ctx.revert();
    // Sin render inmediato, revert() deja el estado "desde" (112 %, 900) en línea: vuelve el reposo del CSS.
    for (const el of objetivos) {
      el.style.removeProperty("font-stretch");
      el.style.removeProperty("font-weight");
    }
  };
}

/**
 * Lenis (scroll suave con la rueda), sin secuestrar nada:
 *  - requestAnimationFrame solo mientras dura un desplazamiento suave (nada de bucles permanentes);
 *  - zonas con scroll propio (textarea, panel del menú, `data-lenis-prevent`) con la rueda nativa;
 *  - detenido mientras haya un `<dialog>` abierto o la página esté bloqueada (menú móvil);
 *  - si algo mueve la página por su cuenta a mitad de un recorrido (salto a un ancla, que Next o el
 *    navegador resuelven de forma nativa con scroll-padding; anclaje de scroll al pintarse una sección
 *    aplazada por encima; arrastre de la barra), Lenis se detiene ahí en lugar de devolverla de un salto.
 */
export function montarLenis(Lenis: typeof LenisTipo): Limpieza {
  const raiz = document.documentElement;
  const lenis = new Lenis({
    lerp: 0.14,
    smoothWheel: true,
    allowNestedScroll: true,
    // Sobre un <dialog> la rueda es nativa (con Lenis detenido, la página de atrás no se mueve).
    prevent: (nodo) => nodo.localName === "dialog",
    stopInertiaOnNavigate: true,
  });

  let raf = 0;
  let reloj = 0;
  const paso = (t: number) => {
    if (Math.abs(scrollY - lenis.animatedScroll) >= 1 && !lenis.isStopped) {
      lenis.stop(); // stop + start: deja la posición real como punto de partida, sin animación
      lenis.start();
    }
    reloj = Math.max(t, reloj);
    lenis.raf(reloj);
    raf = lenis.isScrolling === "smooth" ? requestAnimationFrame(paso) : 0;
  };
  /** Antes de cada desplazamiento suave: arranca el bucle y sincroniza el reloj (sin saltos). */
  const despertar = () => {
    if (raf) return;
    const ahora = document.timeline?.currentTime;
    reloj = typeof ahora === "number" ? ahora : performance.now();
    if (lenis.isScrolling !== "smooth") lenis.raf(reloj);
    raf = requestAnimationFrame(paso);
  };
  const quitarRueda = lenis.on("virtual-scroll", despertar);

  let detenido = false;
  const revisarCapas = () => {
    const capa =
      document.querySelector("dialog[open]") !== null || document.body.style.overflow === "hidden";
    if (capa === detenido) return;
    detenido = capa;
    // .lenis-stopped quita la barra de desplazamiento: se reserva su hueco para que nada se mueva.
    if (capa) {
      if (raiz.scrollHeight > raiz.clientHeight) raiz.style.scrollbarGutter = "stable";
      lenis.stop();
    } else {
      lenis.start();
      raiz.style.removeProperty("scrollbar-gutter");
    }
  };
  // `style` solo en <body> (bloqueo del menú) y `open` en todo el documento: los estilos que cambian en
  // cada cuadro (barra de progreso, tipografía viva) no despiertan al vigía.
  const vigia = new MutationObserver(revisarCapas);
  vigia.observe(document.body, { attributeFilter: ["style"] });
  vigia.observe(raiz, { attributeFilter: ["open"], subtree: true });
  revisarCapas();

  return () => {
    vigia.disconnect();
    quitarRueda();
    cancelAnimationFrame(raf);
    // Lenis 1.3.26 no cancela en destroy() el temporizador (400 ms) con que da por terminado un scroll
    // nativo: al cumplirse vuelve a escribir sus clases en <html>, ya sin instancia que las quite.
    const interno = lenis as unknown as {
      _resetVelocityTimeout?: ReturnType<typeof setTimeout> | null;
    };
    if (interno._resetVelocityTimeout != null) clearTimeout(interno._resetVelocityTimeout);
    lenis.destroy();
    raiz.style.removeProperty("scrollbar-gutter");
  };
}

/** Transición de página ya cargada: `animar()` en cada navegación del cliente, `destruir()` al desmontar. */
export type Cinta = { animar: () => void; destruir: Limpieza };

const DURACION_CINTA_MS = 300;
const INCLINACION_CINTA = 12; // grados
const CURVA_CINTA = "cubic-bezier(0.16, 1, 0.3, 1)"; // --ease-weight (WAAPI no resuelve variables CSS)

/**
 * Cinta de TransicionPagina sobre su capa (`capa > placa > banda amarilla + resto tinta`): la placa
 * inclinada −12° cubre la ventana y sale por la derecha en 300 ms EN TOTAL (nada tapa el contenido más de
 * eso, MOTION.md regla 2). `animar()` se llama desde un layout effect, antes del primer pintado de la
 * página nueva. No anima sin movimiento permitido ni con la pestaña oculta, y se corta si se apaga el
 * movimiento a mitad. Solo atributos style y la Web Animations API: nada de <style> en línea (CSP).
 */
export function montarCinta(capa: HTMLDivElement): Cinta {
  let animacion: Animation | null = null;
  const cortar = () => {
    const a = animacion;
    animacion = null;
    capa.hidden = true;
    a?.cancel();
  };
  const quitarEscucha = escucharMovimiento((permitido) => {
    if (!permitido) cortar();
  });

  const animar = () => {
    const placa = capa.firstElementChild as HTMLElement | null;
    const banda = placa?.firstElementChild as HTMLElement | null | undefined;
    if (!placa || !banda || typeof placa.animate !== "function") return;
    cortar();
    if (!movimientoPermitido() || document.visibilityState !== "visible") return;

    // La inclinación corre los bordes ±tan(12°)·alto/2 entre arriba y abajo: el recorrido se alarga
    // en esa medida para que la placa cubra todo al empezar y no deje nada al terminar.
    const ancho = innerWidth;
    const desfase = Math.tan((INCLINACION_CINTA * Math.PI) / 180) * (innerHeight / 2);
    const anchoBanda = Math.round(Math.min(240, Math.max(64, ancho * 0.16)));
    placa.style.width = `${Math.ceil(ancho + anchoBanda + desfase * 2 + 8)}px`;
    banda.style.width = `${anchoBanda}px`;
    capa.hidden = false;
    const a = placa.animate(
      [
        { transform: `translateX(${Math.floor(-desfase - 2)}px) skewX(-${INCLINACION_CINTA}deg)` },
        {
          transform: `translateX(${Math.ceil(ancho + desfase + 2)}px) skewX(-${INCLINACION_CINTA}deg)`,
        },
      ],
      { duration: DURACION_CINTA_MS, easing: CURVA_CINTA, fill: "both" },
    );
    animacion = a;
    a.onfinish = a.oncancel = () => {
      if (animacion !== a) return;
      animacion = null;
      capa.hidden = true;
      a.cancel();
    };
  };

  return {
    animar,
    destruir: () => {
      quitarEscucha();
      cortar();
    },
  };
}
