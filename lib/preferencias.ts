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
  return (document.documentElement.dataset.movimiento ?? leerMovimientoGuardado() ?? "on") !== "off";
}
