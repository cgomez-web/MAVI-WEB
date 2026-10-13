"use client";

/**
 * Escena 3D "La obra que avanza con usted". Se importa de forma diferida (no está en el JS inicial).
 *
 * Presupuesto: < 40k triángulos, 0 KB de modelos (todo procedural), DPR ≤ 1.5, sombras solo en
 * escritorio con calidad normal. El render se pausa cuando no hay ninguna "ventana" de la escena
 * a la vista o la pestaña está oculta (lo decide EscenaCliente con `activa`).
 *
 * Arranque sin bloquear el hilo principal: la escena se monta por etapas, cada una en una tarea
 * aparte (en tiempo ocioso), y los shaders de cada etapa se compilan con `compileAsync`
 * (KHR_parallel_shader_compile) antes de pintar el primer fotograma. Así un toque del visitante
 * durante la carga no espera a una tarea larga (INP).
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { PerspectiveCamera } from "three";
import { PCFShadowMap, SRGBColorSpace, Vector3, ACESFilmicToneMapping } from "three";
import type { EstadoEscena } from "./estado";
import { Cielo, Engranaje, Luces, Polvo, Terreno } from "./Entorno";
import { Excavadora, Grua, Minicargador, Monticulo, Volqueta } from "./Maquinas";
import { tramo } from "./fases";
import { EquiposTerraza, Obra } from "./Obra";

/** Cámara: posición y objetivo en cada frontera de fase (PLAN.md §3). */
const TOMAS: Array<{ p: number; pos: [number, number, number]; mira: [number, number, number] }> = [
  { p: 0.0, pos: [7.2, 2.7, 23], mira: [6.6, 1.5, 4.2] },
  { p: 0.12, pos: [14, 4.6, 16], mira: [7, 1.6, 3] },
  { p: 0.28, pos: [1.5, 8, 26], mira: [7.5, 2, 2.5] },
  // Mitad de "transporte": la vía, la volqueta que descarga y la grúa siguen en cuadro.
  { p: 0.36, pos: [4.5, 8.5, 25], mira: [8, 2, 3] },
  { p: 0.42, pos: [14, 10, 16], mira: [0, 2.2, 0] },
  { p: 0.56, pos: [13, 8.5, 14], mira: [0, 4.2, 0] },
  { p: 0.7, pos: [4, 7.5, 22], mira: [0, 4, 0] },
  { p: 0.82, pos: [10, 13.5, 14], mira: [0.5, 6.6, 0] },
  { p: 0.92, pos: [-2, 9, 26], mira: [0, 5, 0] },
  { p: 1.0, pos: [-6, 13, 33], mira: [0, 6.5, 0] },
];

type Toma = (typeof TOMAS)[number];

/**
 * Ajustes para pantallas verticales (campo horizontal estrecho): el hero se acerca a la excavadora,
 * que se compone en el tercio superior, sobre el titular; en "transporte y elevación" la toma se
 * corre hacia la vía para que entren la volqueta y la grúa.
 */
const TOMAS_VERTICAL: Partial<Record<number, Toma>> = {
  0: { p: 0, pos: [4.6, 3.5, 20.2], mira: [4.9, 1.5, 4.2] },
  2: { p: 0.28, pos: [4, 8, 26], mira: [9.2, 2, 3.5] },
  3: { p: 0.36, pos: [6, 8.5, 25.5], mira: [9.4, 2, 3.5] },
};

const suave = (t: number) => t * t * (3 - 2 * t);
const vPos = new Vector3();
const vMira = new Vector3();
const a = new Vector3();
const b = new Vector3();

function tomaEn(p: number, vertical: boolean) {
  for (let i = 0; i < TOMAS.length - 1; i++) {
    const t0 = (vertical && TOMAS_VERTICAL[i]) || TOMAS[i]!;
    const t1 = (vertical && TOMAS_VERTICAL[i + 1]) || TOMAS[i + 1]!;
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

/**
 * Campo de visión vertical. En horizontal, 34°. En vertical se abre para conservar unos 30° de
 * campo horizontal (si no, en un teléfono solo cabría el engranaje).
 */
function campoVisual(aspecto: number): number {
  if (aspecto >= 1) return 34;
  const grados = (2 * Math.atan(Math.tan((15 * Math.PI) / 180) / aspecto) * 180) / Math.PI;
  return Math.min(62, Math.max(34, grados));
}

function Director({ estado, progreso }: { estado: EstadoEscena; progreso: { p: number } }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const mira = useRef(new Vector3(3, 2.2, 0));
  const foco = useRef(estado.foco);
  const primero = useRef(true);
  const vista = useRef({ w: 0, h: 0, x: 0, y: 0, fov: 0 });

  useFrame((state, dt) => {
    if (estado.saltar) {
      estado.saltar = false;
      progreso.p = estado.objetivo;
      primero.current = true;
    }
    const pausa = dt > 0.25; // la escena estuvo en pausa (ninguna ventana a la vista)
    // El progreso persigue al objetivo con amortiguación (inercia de máquina pesada).
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 3.2);
    progreso.p += (estado.objetivo - progreso.p) * k;
    // El encuadre sigue a la ventana visible; tras una pausa se coloca de golpe (no se ve deslizar).
    const kf = 1 - Math.exp(-Math.min(dt, 0.1) * 4.5);
    foco.current =
      primero.current || pausa ? estado.foco : foco.current + (estado.foco - foco.current) * kf;

    // Desplazamiento de la vista: en escritorio ancho, la acción a la derecha del texto; en vertical
    // (y en cualquier tamaño) el centro de la toma se dibuja a la altura del foco.
    const { width: w, height: h } = state.size;
    const x = estado.ancho && w >= 1024 ? -w * 0.18 : 0;
    const y = Math.round((0.5 - foco.current) * h);
    const fov = campoVisual(w / Math.max(1, h));
    const v = vista.current;
    if (v.w !== w || v.h !== h || v.x !== x || v.y !== y || v.fov !== fov) {
      Object.assign(v, { w, h, x, y, fov });
      camera.fov = fov;
      if (x === 0 && y === 0) camera.clearViewOffset();
      else camera.setViewOffset(w, h, x, y, w, h);
    }

    tomaEn(progreso.p, estado.vertical);
    // En vertical el campo horizontal es estrecho: pasado el hero, la cámara se aleja para que la
    // obra completa quepa en la ventana.
    if (estado.vertical) {
      const lejos = 1 + 0.5 * tramo(progreso.p, 0.04, 0.12) * (1 - 0.6 * tramo(progreso.p, 0.9, 1));
      vPos.sub(vMira).multiplyScalar(lejos).add(vMira);
    }
    // Leve paralaje con el puntero.
    vPos.x += estado.puntero.x * 0.6;
    vPos.y += estado.puntero.y * 0.3;
    if (primero.current) {
      camera.position.copy(vPos);
      mira.current.copy(vMira);
      primero.current = false;
    } else {
      camera.position.lerp(vPos, 0.12);
      mira.current.lerp(vMira, 0.12);
    }
    camera.lookAt(mira.current);
  });
  return null;
}

/** Última etapa de montaje (ver `Escena3D`). */
const ULTIMA_ETAPA = 6;

/** Ejecuta `fn` en tiempo ocioso (o en la siguiente tarea si el navegador no tiene requestIdleCallback). */
function enOcio(fn: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout: 400 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 16);
  return () => window.clearTimeout(id);
}

/**
 * Compila sin bloquear los materiales de la etapa recién montada y, en el siguiente momento ocioso,
 * pide la siguiente. Al terminar la última, la escena puede pintarse sin compilar nada en el
 * primer fotograma (ni más tarde, cuando aparecen la volqueta, la grúa o la obra).
 */
function Preparador({
  etapa,
  alAvanzar,
  alTerminar,
}: {
  etapa: number;
  alAvanzar: (n: number) => void;
  alTerminar: () => void;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const avanzar = useRef(alAvanzar);
  const terminar = useRef(alTerminar);
  useEffect(() => {
    avanzar.current = alAvanzar;
    terminar.current = alTerminar;
  });

  useEffect(() => {
    let vivo = true;
    let cancelar = () => {};
    const seguir = () => {
      if (!vivo) return;
      cancelar = enOcio(() => {
        if (!vivo) return;
        if (etapa < ULTIMA_ETAPA) avanzar.current(etapa + 1);
        else terminar.current();
      });
    };
    // Cede el hilo antes de compilar: el montaje de la etapa ya fue una tarea.
    cancelar = enOcio(() => {
      if (!vivo) return;
      gl.compileAsync(scene, camera).then(seguir, seguir);
    });
    return () => {
      vivo = false;
      cancelar();
    };
  }, [etapa, gl, scene, camera]);
  return null;
}

/**
 * Vigila los fotogramas por segundo (muestras de 250 ms en ventanas de 2,5 s): si 8 de 10 muestras
 * quedan por debajo de 50 fps, avisa (como mucho dos veces: primero se reduce la calidad y después
 * se vuelve al póster). Sustituye a PerformanceMonitor de drei, que obligaba a cargar drei entero.
 */
function MonitorRendimiento({ alCaer }: { alCaer: () => void }) {
  const muestras = useRef<number[]>([]);
  const tramoActual = useRef({ t: 0, n: 0 });
  const avisos = useRef(0);
  const aviso = useRef(alCaer);
  useEffect(() => {
    aviso.current = alCaer;
  });
  useFrame((_, dt) => {
    const a = tramoActual.current;
    // Tras una pausa (ninguna ventana a la vista) se empieza de cero.
    if (dt > 0.25) {
      a.t = 0;
      a.n = 0;
      muestras.current = [];
      return;
    }
    a.t += dt;
    a.n += 1;
    if (a.t < 0.25) return;
    muestras.current.push(a.n / a.t);
    a.t = 0;
    a.n = 0;
    if (muestras.current.length < 10) return;
    const bajas = muestras.current.filter((fps) => fps < 50).length;
    muestras.current = [];
    if (bajas >= 8 && avisos.current < 2) {
      avisos.current += 1;
      aviso.current();
    }
  });
  return null;
}

/** Avisa de que la escena está lista cuando ya se pintaron dos fotogramas. */
function AvisoListo({ alListo }: { alListo: () => void }) {
  const cuadros = useRef(0);
  const aviso = useRef(alListo);
  useEffect(() => {
    aviso.current = alListo;
  });
  useFrame(() => {
    cuadros.current += 1;
    if (cuadros.current === 2) aviso.current();
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
  const [etapa, setEtapa] = useState(0);
  const [preparada, setPreparada] = useState(false);

  return (
    <Canvas
      aria-hidden="true"
      frameloop={preparada && activa ? "always" : "never"}
      dpr={[1, estado.calidad === 1 ? 1.5 : 1]}
      shadows={sombras ? { type: PCFShadowMap } : false}
      camera={{ fov: 34, near: 0.5, far: 400, position: [6.2, 2.4, 17.5] }}
      gl={{
        antialias: estado.calidad === 1,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        outputColorSpace: SRGBColorSpace,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ gl }) => {
        // Diagnóstico (?escena=3d): expone métricas del renderer y el progreso para medir.
        if (new URLSearchParams(window.location.search).get("escena") === "3d") {
          const w = window as unknown as { __maviInfo?: () => object; __maviP?: () => number };
          w.__maviInfo = () => ({
            triangulos: gl.info.render.triangles,
            llamadas: gl.info.render.calls,
            geometrias: gl.info.memory.geometries,
            programas: gl.info.programs?.length ?? 0,
          });
          w.__maviP = () => Math.round(progreso.p * 1000) / 1000;
        }
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Preparador etapa={etapa} alAvanzar={setEtapa} alTerminar={() => setPreparada(true)} />
      {preparada ? (
        <>
          <AvisoListo alListo={alListo} />
          <MonitorRendimiento alCaer={alRendimientoBajo} />
        </>
      ) : null}
      {/* Etapa 0: solo el lienzo (crear el contexto WebGL ya es una tarea). */}
      <Director estado={estado} progreso={progreso} />
      {etapa >= 1 ? (
        <>
          <Cielo progreso={progreso} />
          <Luces progreso={progreso} sombras={sombras} />
          <Terreno />
        </>
      ) : null}
      {etapa >= 2 ? (
        <>
          <Engranaje estado={estado} progreso={progreso} />
          <Excavadora estado={estado} progreso={progreso} />
        </>
      ) : null}
      {etapa >= 3 ? (
        <>
          <Polvo progreso={progreso} cantidad={estado.ancho ? 520 : 260} />
          <Monticulo progreso={progreso} />
          <Minicargador progreso={progreso} />
        </>
      ) : null}
      {etapa >= 4 ? (
        <>
          <Volqueta progreso={progreso} />
          <Grua progreso={progreso} />
        </>
      ) : null}
      {etapa >= 5 ? <Obra progreso={progreso} sombras={sombras} /> : null}
      {etapa >= 6 ? <EquiposTerraza progreso={progreso} /> : null}
    </Canvas>
  );
}
