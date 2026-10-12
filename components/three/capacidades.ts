"use client";

import { movimientoPermitido } from "@/lib/preferencias";

export type MotivoSin3D =
  | "movimiento-reducido"
  | "sin-webgl"
  | "pocos-nucleos"
  | "poca-memoria"
  | "ahorro-de-datos"
  | "bateria-baja";

interface NavigatorExtendido extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
}

/**
 * ¿Puede este dispositivo con la escena 3D? Si no, el sitio usa el póster 2D (mismo contenido).
 * Devuelve null si puede, o el motivo por el que no.
 */
export async function evaluarCapacidades(): Promise<MotivoSin3D | null> {
  // Diagnóstico: ?escena=2d fuerza el póster; ?escena=3d omite las heurísticas de hardware
  // (sigue exigiendo WebGL2). Útil para pruebas E2E y revisión visual.
  const forzado = new URLSearchParams(window.location.search).get("escena");
  if (forzado === "2d") return "sin-webgl";
  if (!movimientoPermitido()) return "movimiento-reducido";
  const nav = navigator as NavigatorExtendido;
  if (forzado === "3d") {
    try {
      const gl = document.createElement("canvas").getContext("webgl2");
      return gl ? null : "sin-webgl";
    } catch {
      return "sin-webgl";
    }
  }
  if (nav.connection?.saveData) return "ahorro-de-datos";
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4) return "pocos-nucleos";
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return "poca-memoria";
  try {
    const lienzo = document.createElement("canvas");
    const gl = lienzo.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!gl) return "sin-webgl";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return "sin-webgl";
  }
  try {
    const bateria = await nav.getBattery?.();
    if (bateria && !bateria.charging && bateria.level < 0.2) return "bateria-baja";
  } catch {
    /* API no disponible: se ignora */
  }
  return null;
}
