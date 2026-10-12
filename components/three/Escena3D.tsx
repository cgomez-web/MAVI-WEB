"use client";

/**
 * Escena 3D "La obra que avanza con usted". Se importa de forma diferida (no está en el JS inicial).
 *
 * Presupuesto: < 40k triángulos, 0 KB de modelos (todo procedural), DPR ≤ 1.5, sombras solo en
 * escritorio con calidad normal. El render se pausa cuando no hay ninguna "ventana" de la escena
 * a la vista o la pestaña está oculta (lo decide EscenaCliente con `activa`).
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { PCFShadowMap, SRGBColorSpace, Vector3, ACESFilmicToneMapping } from "three";
import type { EstadoEscena } from "./estado";
import { Cielo, Engranaje, Luces, Polvo, Terreno } from "./Entorno";
import { Excavadora, Grua, Minicargador, Monticulo, Volqueta } from "./Maquinas";
import { EquiposTerraza, Obra } from "./Obra";

/** Cámara: posición y objetivo en cada frontera de fase (PLAN.md §3). */
const TOMAS: Array<{ p: number; pos: [number, number, number]; mira: [number, number, number] }> = [
  { p: 0.0, pos: [5, 2.6, 18], mira: [3.5, 2.8, 0] },
  { p: 0.12, pos: [14, 4.6, 16], mira: [7, 1.6, 3] },
  { p: 0.28, pos: [4, 9, 25], mira: [1, 2.5, 3] },
  { p: 0.42, pos: [14, 10, 16], mira: [0, 2.2, 0] },
  { p: 0.56, pos: [13, 8.5, 14], mira: [0, 4.2, 0] },
  { p: 0.7, pos: [4, 7.5, 22], mira: [0, 4, 0] },
  { p: 0.82, pos: [10, 13.5, 14], mira: [0.5, 6.6, 0] },
  { p: 0.92, pos: [-2, 9, 26], mira: [0, 5, 0] },
  { p: 1.0, pos: [-6, 13, 33], mira: [0, 6.5, 0] },
];

const suave = (t: number) => t * t * (3 - 2 * t);
const vPos = new Vector3();
const vMira = new Vector3();
const a = new Vector3();
const b = new Vector3();

function tomaEn(p: number) {
  for (let i = 0; i < TOMAS.length - 1; i++) {
    const t0 = TOMAS[i]!;
    const t1 = TOMAS[i + 1]!;
    if (p <= t1.p) {
      const k = suave((p - t0.p) / (t1.p - t0.p));
      vPos.copy(a.fromArray(t0.pos)).lerp(b.fromArray(t1.pos), k);
      vMira.copy(a.fromArray(t0.mira)).lerp(b.fromArray(t1.mira), k);
      return;
    }
  }
  const ultima = TOMAS[TOMAS.length - 1]!;
  vPos.fromArray(ultima.pos);
  vMira.fromArray(ultima.mira);
}

function Director({ estado, progreso }: { estado: EstadoEscena; progreso: { p: number } }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const mira = useRef(new Vector3(3, 2.2, 0));

  // En escritorio ancho la acción se compone a la derecha del texto (desplazamiento de la vista).
  useEffect(() => {
    const persp = camera as typeof camera & { setViewOffset?: (...a: number[]) => void; clearViewOffset?: () => void };
    if (estado.ancho && size.width >= 1024) persp.setViewOffset?.(size.width, size.height, -size.width * 0.18, 0, size.width, size.height);
    else persp.clearViewOffset?.();
  }, [camera, size, estado.ancho]);

  useFrame((_, dt) => {
    // El progreso persigue al objetivo con amortiguación (inercia de máquina pesada).
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 3.2);
    progreso.p += (estado.objetivo - progreso.p) * k;
    tomaEn(progreso.p);
    // Leve paralaje con el puntero.
    vPos.x += estado.puntero.x * 0.6;
    vPos.y += estado.puntero.y * 0.3;
    camera.position.lerp(vPos, 0.12);
    mira.current.lerp(vMira, 0.12);
    camera.lookAt(mira.current);
  });
  return null;
}

interface Props {
  estado: EstadoEscena;
  activa: boolean;
  alListo: () => void;
  alRendimientoBajo: () => void;
}

export default function Escena3D({ estado, activa, alListo, alRendimientoBajo }: Props) {
  const progreso = useRef({ p: estado.objetivo }).current;
  const sombras = estado.ancho && estado.calidad === 1;

  return (
    <Canvas
      aria-hidden="true"
      frameloop={activa ? "always" : "never"}
      dpr={[1, estado.calidad === 1 ? 1.5 : 1]}
      shadows={sombras ? { type: PCFShadowMap } : false}
      camera={{ fov: 34, near: 0.5, far: 400, position: [5, 2.4, 17] }}
      gl={{
        antialias: estado.calidad === 1,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        outputColorSpace: SRGBColorSpace,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={() => alListo()}
      style={{ position: "absolute", inset: 0 }}
    >
      <PerformanceMonitor onDecline={alRendimientoBajo} flipflops={2} />
      <Director estado={estado} progreso={progreso} />
      <Cielo progreso={progreso} />
      <Luces progreso={progreso} sombras={sombras} />
      <Terreno />
      <Engranaje progreso={progreso} />
      <Polvo progreso={progreso} cantidad={estado.ancho ? 520 : 260} />
      <Excavadora estado={estado} progreso={progreso} />
      <Minicargador progreso={progreso} />
      <Monticulo progreso={progreso} />
      <Volqueta progreso={progreso} />
      <Grua progreso={progreso} />
      <Obra progreso={progreso} sombras={sombras} />
      <EquiposTerraza progreso={progreso} />
    </Canvas>
  );
}
