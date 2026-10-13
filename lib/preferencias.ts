"use client";

/**
 * Preferencia de movimiento del visitante (conveniencia local; puede no existir o fallar el
 * almacenamiento en modo privado, por eso todo va en try/catch y el sitio funciona sin ella).
 */
const CLAVE = "mavi:movimiento";
export const EVENTO_MOVIMIENTO = "mavi:movimiento";

export function leerMovimientoGuardado(): "on" | "off" | null {
  try {
    const v = window.localStorage.getItem(CLAVE);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

export function guardarMovimiento(valor: "on" | "off") {
  try {
    window.localStorage.setItem(CLAVE, valor);
  } catch {
    /* sin almacenamiento: la preferencia dura solo esta visita */
  }
  document.documentElement.dataset.movimiento = valor;
  window.dispatchEvent(new CustomEvent(EVENTO_MOVIMIENTO, { detail: valor }));
}

export function prefiereMovimientoReducido(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** ¿Están permitidas las animaciones no esenciales ahora mismo? */
export function movimientoPermitido(): boolean {
  if (prefiereMovimientoReducido()) return false;
  return (
    (document.documentElement.dataset.movimiento ?? leerMovimientoGuardado() ?? "on") !== "off"
  );
}

/**
 * Tarea en tiempo ocioso (Safari no tiene requestIdleCallback), para lo que no hace falta al cargar
 * (los import() diferidos de Movimiento y TransicionPagina). Devuelve cómo cancelarla.
 */
export function enOcio(tarea: () => void): () => void {
  if (window.requestIdleCallback) {
    const id = window.requestIdleCallback(tarea, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(tarea, 200);
  return () => window.clearTimeout(id);
}

/**
 * Avisa cuando puede cambiar `movimientoPermitido()`: el conmutador "Animaciones" de la cabecera o la
 * preferencia del sistema (`prefers-reduced-motion`) cambiada con la página abierta.
 * Devuelve la función que quita las escuchas.
 */
export function escucharMovimiento(alCambiar: (permitido: boolean) => void): () => void {
  const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
  const avisar = () => alCambiar(movimientoPermitido());
  window.addEventListener(EVENTO_MOVIMIENTO, avisar);
  consulta.addEventListener("change", avisar);
  return () => {
    window.removeEventListener(EVENTO_MOVIMIENTO, avisar);
    consulta.removeEventListener("change", avisar);
  };
}
