"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { textosEscena } from "@/content/home";
import { EVENTO_MOVIMIENTO, movimientoPermitido } from "@/lib/preferencias";
import { evaluarCapacidades, type MotivoSin3D } from "./capacidades";
import { crearEstado, type EstadoEscena } from "./estado";
import { limitar, medirDocumento, tramo } from "./fases";
import { actualizarPoster } from "./posterCapas";

type PropsEscena = {
  estado: EstadoEscena;
  activa: boolean;
  alListo: () => void;
  alRendimientoBajo: () => void;
};

type Modo =
  { tipo: "poster"; motivo?: MotivoSin3D | "rendimiento" } | { tipo: "cargando" } | { tipo: "3d" };

/** Promesa que se resuelve en el siguiente momento ocioso (cede el hilo entre fases de carga). */
function ocioso(): Promise<void> {
  return new Promise((resolver) => enOcio(resolver, 600));
}

/** Ejecuta `fn` en tiempo ocioso (o en la siguiente tarea si no hay requestIdleCallback). */
function enOcio(fn: () => void, espera = 1500) {
  if (typeof window.requestIdleCallback === "function")
    window.requestIdleCallback(fn, { timeout: espera });
  else window.setTimeout(fn, 120);
}

/**
 * Decide si se monta la escena 3D y la carga en diferido (después de `load` y en tiempo ocioso),
 * de modo que ni el HTML ni el LCP dependen de three.js. Mientras carga muestra el preloader
 * "nivelando" (una burbuja de nivel que oscila); cuando la escena está lista la burbuja se centra
 * y, al centrarse, la cinta amarilla barre la capa y revela la escena del hero.
 * Sin 3D, el póster 2D cuenta la misma historia por capas (ver posterCapas.ts).
 */
export function EscenaCliente() {
  const [modo, setModo] = useState<Modo>({ tipo: "poster" });
  const [Escena, setEscena] = useState<ComponentType<PropsEscena> | null>(null);
  const [centrando, setCentrando] = useState(false);
  const [lista, setLista] = useState(false);
  const [activa, setActiva] = useState(true);
  const [version, setVersion] = useState(0);
  const [cintaHecha, setCintaHecha] = useState(false);
  const estado = useRef<EstadoEscena>(crearEstado()).current;
  const [mostrada, setMostrada] = useState(false);
  const caidas = useRef(0);
  const listaRef = useRef(false);
  useEffect(() => {
    listaRef.current = lista;
  }, [lista]);
  const revelar = () => {
    setLista(true);
    setMostrada(true);
  };

  // 1. Capacidades + carga diferida.
  useEffect(() => {
    let cancelado = false;
    const intentar = async () => {
      const motivo = await evaluarCapacidades();
      if (cancelado) return;
      if (motivo) {
        setModo({ tipo: "poster", motivo });
        return;
      }
      setModo({ tipo: "cargando" });
      // Los módulos se evalúan por partes, cada uno en su tarea: three, después React Three Fiber
      // y al final la escena. Una sola importación sería una tarea larga (~250 ms con CPU ×4).
      await import("three");
      await ocioso();
      if (cancelado) return;
      await import("@react-three/fiber");
      await ocioso();
      if (cancelado) return;
      const modulo = await import("./Escena3D");
      if (cancelado) return;
      // Evaluar el módulo de three ya fue una tarea: el montaje va en otra, en tiempo ocioso.
      enOcio(() => {
        if (!cancelado) setEscena(() => modulo.default);
      }, 600);
    };
    // La escena se carga con la primera señal de lectura (mover el ratón o el lápiz, la rueda o el
    // scroll) o, si no la hay, tras 6,5 s de la carga en tiempo ocioso. No se dispara con toques ni
    // teclas: quien toca el menú o "Cotizar" no debe encontrarse con la carga justo en su siguiente
    // toque. Un dedo real tiembla 2–4 px y emite `pointermove` de tipo "touch": ese se ignora (si el
    // toque se convierte en scroll, el evento `scroll` dispara la carga).
    const EVENTOS = ["wheel", "scroll"] as const;
    let disparado = false;
    let espera = 0;
    const quitarEscuchas = () => {
      for (const ev of EVENTOS) window.removeEventListener(ev, disparar);
      window.removeEventListener("pointermove", alMoverPuntero);
    };
    function disparar() {
      if (disparado) return;
      disparado = true;
      window.clearTimeout(espera);
      quitarEscuchas();
      enOcio(() => void intentar());
    }
    function alMoverPuntero(e: PointerEvent) {
      if (e.pointerType !== "touch") disparar();
    }
    const programar = () => {
      for (const ev of EVENTOS)
        window.addEventListener(ev, disparar, { passive: true, once: true });
      window.addEventListener("pointermove", alMoverPuntero, { passive: true });
      espera = window.setTimeout(disparar, 6500);
    };
    if (document.readyState === "complete") programar();
    else window.addEventListener("load", programar, { once: true });

    // Si el visitante apaga el movimiento, se desmonta el 3D y queda el póster.
    const alCambiar = (e: Event) => {
      if ((e as CustomEvent<"on" | "off">).detail === "off") {
        setEscena(null);
        setCentrando(false);
        setLista(false);
        setModo({ tipo: "poster", motivo: "movimiento-reducido" });
      } else if (!cancelado) void intentar();
    };
    window.addEventListener(EVENTO_MOVIMIENTO, alCambiar);
    return () => {
      cancelado = true;
      window.clearTimeout(espera);
      quitarEscuchas();
      window.removeEventListener("load", programar);
      window.removeEventListener(EVENTO_MOVIMIENTO, alCambiar);
    };
  }, []);

  // 2. Scroll → progreso y encuadre (y capas del póster); puntero → excavadora; ancho → composición.
  useEffect(() => {
    let raf = 0;
    const fino = window.matchMedia("(pointer: fine)");
    const poster = document.querySelector<SVGSVGElement>("[data-poster-obra]");
    // Diagnóstico (?escena=3d): fija el progreso y el encuadre para revisar cada toma.
    let forzado: { p: number; foco: number } | null = null;
    if (new URLSearchParams(window.location.search).get("escena") === "3d") {
      (window as unknown as { __maviForzar?: unknown }).__maviForzar = (p: number, foco = 0.5) => {
        forzado = { p, foco };
        estado.saltar = true;
        pedir();
      };
    }
    const medir = () => {
      raf = 0;
      estado.ancho = window.innerWidth >= 1024;
      estado.vertical = window.innerHeight > window.innerWidth;
      const { p, foco } = forzado ?? medirDocumento(estado.vertical);
      estado.objetivo = p;
      if (foco !== null) estado.foco = foco;
      // Táctil: sin cursor al que mirar, la excavadora reacciona al scroll dentro del hero.
      if (!fino.matches) {
        const s = tramo(limitar(window.scrollY / (window.innerHeight * 0.55)), 0, 1);
        estado.puntero.x = -0.35 + 1.25 * s;
        estado.puntero.y = 0.45 * s;
      }
      // El póster solo se actualiza mientras se ve (sin 3D, o mientras carga).
      if (poster && !listaRef.current)
        actualizarPoster(poster, p, !movimientoPermitido(), estado.foco);
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    const alMover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      estado.puntero.x = (e.clientX / window.innerWidth) * 2 - 1;
      estado.puntero.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener(EVENTO_MOVIMIENTO, pedir);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener(EVENTO_MOVIMIENTO, pedir);
    };
  }, [estado]);

  // Al volver al póster (rendimiento bajo, movimiento apagado), se pone al día con el scroll actual.
  useEffect(() => {
    if (lista) return;
    const poster = document.querySelector<SVGSVGElement>("[data-poster-obra]");
    if (poster) actualizarPoster(poster, estado.objetivo, !movimientoPermitido(), estado.foco);
  }, [lista, estado]);

  // 3. Pausa: solo se renderiza si alguna "ventana" de la escena está en pantalla y la pestaña visible.
  useEffect(() => {
    const visibles = new Set<Element>();
    const actualizar = () => setActiva(visibles.size > 0 && document.visibilityState === "visible");
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) visibles.add(e.target);
        else visibles.delete(e.target);
      }
      actualizar();
    });
    document.querySelectorAll("[data-ventana-3d]").forEach((el) => obs.observe(el));
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      obs.disconnect();
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, []);

  // Respaldo: si la burbuja no llega a avisar (pestaña oculta, animación cancelada), se revela igual.
  useEffect(() => {
    if (!centrando || lista) return;
    const t = window.setTimeout(() => {
      setLista(true);
      setMostrada(true);
    }, 900);
    return () => window.clearTimeout(t);
  }, [centrando, lista]);

  const alRendimientoBajo = () => {
    // Con ?escena=3d (diagnóstico) se mantiene la escena aunque el equipo sea lento.
    if (new URLSearchParams(window.location.search).get("escena") === "3d") return;
    caidas.current += 1;
    if (caidas.current === 1) {
      // Primer aviso: calidad reducida (sin sombras, DPR 1, sin antialias). La escena se vuelve a
      // montar: mientras tanto se ve el póster.
      estado.calidad = 0;
      setLista(false);
      setVersion((v) => v + 1);
    } else {
      setEscena(null);
      setCentrando(false);
      setLista(false);
      setModo({ tipo: "poster", motivo: "rendimiento" });
    }
  };

  const alListo = () => {
    setModo({ tipo: "3d" });
    // La primera vez, la burbuja se centra y al centrarse revela la escena; en un remontaje
    // (calidad reducida) se revela directamente.
    if (mostrada) revelar();
    else setCentrando(true);
  };

  const montada = Escena !== null && modo.tipo !== "poster";
  const cargando = (modo.tipo === "cargando" || modo.tipo === "3d") && !lista && !mostrada;

  return (
    <>
      {montada ? (
        <div
          className={`escena-lienzo absolute inset-0 transition-opacity duration-[var(--dur-scene)] ease-[var(--ease-weight)] ${lista ? "opacity-100" : "opacity-0"}`}
          data-lista={lista}
        >
          <Escena
            key={version}
            estado={estado}
            activa={activa}
            alListo={alListo}
            alRendimientoBajo={alRendimientoBajo}
          />
        </div>
      ) : null}
      {cargando ? <Nivelando centrando={centrando} alCentrarse={revelar} /> : null}
      {lista && version === 0 && !cintaHecha ? (
        // Se retira al terminar: en pantallas estrechas su posición final aún asomaría por el borde.
        <span
          className="cinta-revela"
          aria-hidden="true"
          onAnimationEnd={() => setCintaHecha(true)}
        />
      ) : null}
    </>
  );
}

/**
 * Preloader "nivelando": un nivel de burbuja bajo la cabecera, a la derecha (zona libre del hero
 * en escritorio y en móvil). Mientras carga, la burbuja oscila; con `centrando` se asienta en el
 * centro (480 ms, curva "aterriza") y avisa. Está en la capa de fondo: nunca cubre el contenido ni
 * recibe clics. En móvil se muestra solo el nivel, sin el rótulo.
 */
function Nivelando({ centrando, alCentrarse }: { centrando: boolean; alCentrarse: () => void }) {
  const burbuja = useRef<HTMLSpanElement>(null);
  const oscila = useRef<Animation | null>(null);
  const aviso = useRef(alCentrarse);
  useEffect(() => {
    aviso.current = alCentrarse;
  });

  useEffect(() => {
    const b = burbuja.current;
    if (!b || typeof b.animate !== "function") return;
    oscila.current = b.animate(
      [{ left: "4%" }, { left: "68%" }, { left: "28%" }, { left: "calc(50% - 0.625rem)" }],
      {
        duration: 1600,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        iterations: Infinity,
        direction: "alternate",
      },
    );
    return () => oscila.current?.cancel();
  }, []);

  useEffect(() => {
    const b = burbuja.current;
    if (!centrando || !b) return;
    if (typeof b.animate !== "function") {
      aviso.current();
      return;
    }
    // Desde donde esté en este instante hasta el centro exacto.
    const desde = getComputedStyle(b).left;
    oscila.current?.cancel();
    const asienta = b.animate([{ left: desde }, { left: "calc(50% - 0.625rem)" }], {
      duration: 480,
      easing: "cubic-bezier(0.34, 1.36, 0.64, 1)",
      fill: "forwards",
    });
    asienta.onfinish = () => aviso.current();
    return () => {
      asienta.onfinish = null;
    };
  }, [centrando]);

  return (
    <div
      className="nivelando absolute top-[calc(var(--header-h)+1.25rem)] right-[var(--margin)] z-10 flex items-center gap-3"
      aria-hidden="true"
      data-centrada={centrando || undefined}
    >
      <span className="mono-etiqueta text-bone hidden md:inline">{textosEscena.nivelando}</span>
      <span className="border-bone bg-ink relative block h-4 w-24 border-2 md:w-28">
        <span
          className={`absolute inset-y-0 left-1/2 w-0.5 transition-colors duration-[var(--dur-micro)] ${centrando ? "bg-brand-yellow" : "bg-bone/60"}`}
        />
        <span
          ref={burbuja}
          className="bg-brand-yellow absolute top-1/2 left-[calc(50%-0.625rem)] h-2 w-5 -translate-y-1/2"
        />
      </span>
    </div>
  );
}
