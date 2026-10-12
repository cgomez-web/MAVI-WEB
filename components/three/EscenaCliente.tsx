"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { EVENTO_MOVIMIENTO } from "@/lib/preferencias";
import { evaluarCapacidades, type MotivoSin3D } from "./capacidades";
import { crearEstado, type EstadoEscena } from "./estado";
import { progresoDesdeDocumento } from "./fases";

type PropsEscena = {
  estado: EstadoEscena;
  activa: boolean;
  alListo: () => void;
  alRendimientoBajo: () => void;
};

type Modo = { tipo: "poster"; motivo?: MotivoSin3D | "rendimiento" } | { tipo: "cargando" } | { tipo: "3d" };

/**
 * Decide si se monta la escena 3D y la carga en diferido (después de `load` y en tiempo ocioso),
 * de modo que ni el HTML ni el LCP dependen de three.js. Mientras carga muestra el preloader
 * "nivelando" (una burbuja de nivel que se centra); al estar lista, la cinta amarilla la revela.
 */
export function EscenaCliente() {
  const [modo, setModo] = useState<Modo>({ tipo: "poster" });
  const [Escena, setEscena] = useState<ComponentType<PropsEscena> | null>(null);
  const [lista, setLista] = useState(false);
  const [activa, setActiva] = useState(true);
  const [version, setVersion] = useState(0);
  const estado = useRef<EstadoEscena>(crearEstado()).current;
  const caidas = useRef(0);

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
      const modulo = await import("./Escena3D");
      if (cancelado) return;
      setEscena(() => modulo.default);
    };
    // La escena se carga con la primera interacción (puntero, toque, scroll, tecla) o, si no la hay,
    // tras 6,5 s de la carga en tiempo ocioso: así nunca compite con el render inicial ni con el LCP.
    const EVENTOS = ["pointermove", "pointerdown", "touchstart", "wheel", "scroll", "keydown"] as const;
    let disparado = false;
    let espera = 0;
    const disparar = () => {
      if (disparado) return;
      disparado = true;
      window.clearTimeout(espera);
      for (const ev of EVENTOS) window.removeEventListener(ev, disparar);
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120));
      idle(() => void intentar(), { timeout: 1500 });
    };
    const programar = () => {
      for (const ev of EVENTOS) window.addEventListener(ev, disparar, { passive: true, once: true });
      espera = window.setTimeout(disparar, 6500);
    };
    if (document.readyState === "complete") programar();
    else window.addEventListener("load", programar, { once: true });

    // Si el visitante apaga el movimiento, se desmonta el 3D y queda el póster.
    const alCambiar = (e: Event) => {
      if ((e as CustomEvent<"on" | "off">).detail === "off") {
        setEscena(null);
        setLista(false);
        setModo({ tipo: "poster", motivo: "movimiento-reducido" });
      } else if (!cancelado) void intentar();
    };
    window.addEventListener(EVENTO_MOVIMIENTO, alCambiar);
    return () => {
      cancelado = true;
      window.clearTimeout(espera);
      for (const ev of EVENTOS) window.removeEventListener(ev, disparar);
      window.removeEventListener("load", programar);
      window.removeEventListener(EVENTO_MOVIMIENTO, alCambiar);
    };
  }, []);

  // 2. Scroll → progreso; puntero → excavadora; ancho → composición.
  useEffect(() => {
    let raf = 0;
    const medir = () => {
      raf = 0;
      estado.objetivo = progresoDesdeDocumento();
      estado.ancho = window.innerWidth >= 1024;
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
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      window.removeEventListener("pointermove", alMover);
    };
  }, [estado]);

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

  const alRendimientoBajo = () => {
    // Con ?escena=3d (diagnóstico) se mantiene la escena aunque el equipo sea lento.
    if (new URLSearchParams(window.location.search).get("escena") === "3d") return;
    caidas.current += 1;
    if (caidas.current === 1) {
      // Primer aviso: calidad reducida (sin sombras, DPR 1, sin antialias).
      estado.calidad = 0;
      setVersion((v) => v + 1);
    } else {
      setEscena(null);
      setModo({ tipo: "poster", motivo: "rendimiento" });
    }
  };

  const montada = Escena !== null && modo.tipo !== "poster";

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
            alListo={() => {
              setModo({ tipo: "3d" });
              // Dos fotogramas para que el primer render esté listo antes del fundido.
              requestAnimationFrame(() => requestAnimationFrame(() => setLista(true)));
            }}
            alRendimientoBajo={alRendimientoBajo}
          />
        </div>
      ) : null}
      {modo.tipo === "cargando" || (modo.tipo === "3d" && !lista) ? <Nivelando /> : null}
      {lista ? <span className="cinta-revela" aria-hidden="true" /> : null}
    </>
  );
}

/** Preloader "nivelando": una burbuja de nivel que oscila y se centra. Nunca cubre el contenido. */
function Nivelando() {
  return (
    <div className="nivelando absolute bottom-6 right-6 hidden items-center gap-3 md:flex" aria-hidden="true">
      <span className="mono-etiqueta text-concrete-light">Nivelando escena</span>
      <span className="relative block h-4 w-28 border-2 border-bone/70 bg-ink/60">
        <span className="absolute inset-y-0 left-1/2 w-px bg-bone/50" />
        <span className="nivel-burbuja absolute top-1/2 h-2 w-5 -translate-y-1/2 bg-brand-yellow" />
      </span>
    </div>
  );
}
