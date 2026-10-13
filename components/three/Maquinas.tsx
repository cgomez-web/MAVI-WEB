"use client";

/**
 * Maquinaria low-poly construida con primitivas (sin modelos externos → sin licencias de terceros).
 * Cada máquina recibe su estado por refs y se anima en useFrame según el progreso de la escena.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { PALETA } from "./paleta";
import { enFase, limitar, tramo } from "./fases";
import type { EstadoEscena } from "./estado";

const Y = PALETA.amarillo;
const OSC = PALETA.grafito;

function Rueda({
  posicion,
  radio = 0.32,
  ancho = 0.25,
}: {
  posicion: [number, number, number];
  radio?: number;
  ancho?: number;
}) {
  return (
    <mesh position={posicion} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[radio, radio, ancho, 10]} />
      <meshStandardMaterial color={OSC} roughness={0.9} flatShading />
    </mesh>
  );
}

/* ───────────────────────── Excavadora ───────────────────────── */
/** Fuera de cuadro a la derecha: de aquí arranca la excavadora al entrar en el hero. */
const ENTRADA_X = 14.5;

export function Excavadora({
  estado,
  progreso,
}: {
  estado: EstadoEscena;
  progreso: { p: number };
}) {
  const raiz = useRef<Group>(null);
  const tornamesa = useRef<Group>(null);
  const pluma = useRef<Group>(null);
  const brazo = useRef<Group>(null);
  const cucharon = useRef<Group>(null);
  const t0 = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const p = progreso.p;
    const t = clock.elapsedTime;
    if (t0.current === null) t0.current = t;
    // Entrada en el hero: llega sola desde la derecha en cuanto la escena aparece (no espera al
    // scroll) y queda en primer plano, a la derecha del titular; bajar por el hero también la trae.
    const llegada = Math.max(tramo(t - t0.current, 0.5, 3.1), enFase(p, "inicio", 0, 0.5));
    const destino = estado.vertical ? 6.1 : 6.6;
    const enMarcha = 1 - llegada;
    if (raiz.current) {
      raiz.current.position.x = ENTRADA_X - (ENTRADA_X - destino) * llegada;
      // Traqueteo de las orugas mientras avanza.
      raiz.current.position.y = Math.abs(Math.sin(t * 11)) * 0.035 * Math.min(1, enMarcha * 4);
    }
    // En el hero la máquina reacciona al puntero (en táctil, al scroll): gira la cabina y sube la pluma.
    const enHero = 1 - enFase(p, "inicio", 0.75, 1);
    const reaccion = enHero * Math.min(1, llegada * 1.4);
    // Ciclo de excavación durante "maquinaria pesada" (y suavemente en reposo el resto del tiempo).
    const cavando =
      enFase(p, "maquinaria-pesada", 0.05, 0.6) * (1 - enFase(p, "maquinaria-pesada", 0.9, 1));
    const ciclo = (Math.sin(t * 1.6) + 1) / 2;
    const plumaHero = 0.55 + enMarcha * 0.25 + reaccion * estado.puntero.y * 0.22;
    if (pluma.current) {
      const objetivoPluma = plumaHero - cavando * (0.25 + ciclo * 0.35);
      pluma.current.rotation.z += (objetivoPluma - pluma.current.rotation.z) * 0.1;
    }
    if (brazo.current) brazo.current.rotation.z = -1.25 + cavando * ciclo * 0.7 + enMarcha * 0.35;
    if (cucharon.current) cucharon.current.rotation.z = -0.4 + cavando * (ciclo - 0.5) * 1.2;
    // La cabina mira hacia el puntero: a la izquierda sigue mirando la obra; a la derecha gira hacia
    // quien mira. Fuera del hero vuelve a la obra.
    if (tornamesa.current) {
      const haciaPuntero = reaccion * (0.3 + estado.puntero.x * 0.8);
      const objetivo = Math.PI + haciaPuntero - cavando * 0.5 + Math.sin(t * 0.8) * cavando * 0.25;
      tornamesa.current.rotation.y += (objetivo - tornamesa.current.rotation.y) * 0.08;
    }
  });

  return (
    <group ref={raiz} position={[ENTRADA_X, 0, 4.2]}>
      {/* Orugas */}
      {[0.68, -0.68].map((z) => (
        <mesh key={z} position={[0, 0.28, z]} castShadow>
          <boxGeometry args={[2.7, 0.56, 0.55]} />
          <meshStandardMaterial color={OSC} roughness={0.95} flatShading />
        </mesh>
      ))}
      <group ref={tornamesa} position={[0, 0.62, 0]} rotation={[0, Math.PI, 0]}>
        <mesh position={[-0.15, 0.38, 0]} castShadow>
          <boxGeometry args={[2.1, 0.72, 1.62]} />
          <meshStandardMaterial color={Y} roughness={0.55} flatShading />
        </mesh>
        <mesh position={[-1.15, 0.45, 0]} castShadow>
          <boxGeometry args={[0.5, 0.62, 1.55]} />
          <meshStandardMaterial color={OSC} roughness={0.8} flatShading />
        </mesh>
        {/* Cabina con vidrio */}
        <mesh position={[0.4, 1.2, 0.38]} castShadow>
          <boxGeometry args={[0.85, 0.95, 0.78]} />
          <meshStandardMaterial color={Y} roughness={0.5} flatShading />
        </mesh>
        <mesh position={[0.84, 1.25, 0.38]}>
          <boxGeometry args={[0.04, 0.6, 0.62]} />
          <meshStandardMaterial color={PALETA.vidrio} roughness={0.2} metalness={0.4} />
        </mesh>
        {/* Pluma → brazo → cucharón (jerarquía articulada) */}
        <group ref={pluma} position={[0.7, 0.75, -0.25]} rotation={[0, 0, 0.55]}>
          <mesh position={[1.15, 0, 0]} castShadow>
            <boxGeometry args={[2.4, 0.28, 0.32]} />
            <meshStandardMaterial color={Y} roughness={0.5} flatShading />
          </mesh>
          <group ref={brazo} position={[2.3, 0, 0]} rotation={[0, 0, -1.25]}>
            <mesh position={[0.8, 0, 0]} castShadow>
              <boxGeometry args={[1.7, 0.22, 0.26]} />
              <meshStandardMaterial color={Y} roughness={0.5} flatShading />
            </mesh>
            <group ref={cucharon} position={[1.65, 0, 0]} rotation={[0, 0, -0.4]}>
              <mesh position={[0.2, -0.12, 0]} castShadow>
                <boxGeometry args={[0.5, 0.45, 0.62]} />
                <meshStandardMaterial color={PALETA.amarilloOscuro} roughness={0.7} flatShading />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ───────────────────────── Minicargador ───────────────────────── */
export function Minicargador({ progreso }: { progreso: { p: number } }) {
  const raiz = useRef<Group>(null);
  const brazos = useRef<Group>(null);
  useFrame(({ clock }) => {
    const p = progreso.p;
    const activo = enFase(p, "maquinaria-pesada", 0.15, 0.4);
    // Terminado el nivelado, despeja la vía hacia la izquierda para que entre la volqueta.
    const sale = enFase(p, "transporte-y-elevacion", 0, 0.3);
    const vaiven = activo * (1 - sale) * (Math.sin(clock.elapsedTime * 0.9) * 1.6);
    if (raiz.current) {
      raiz.current.visible = activo > 0.01 && sale < 0.99;
      raiz.current.position.x = 10 - 3 * activo + vaiven - sale * 22;
      raiz.current.scale.setScalar(Math.max(0.001, activo));
    }
    if (brazos.current)
      brazos.current.rotation.z = -0.15 + Math.max(0, Math.sin(clock.elapsedTime * 0.9)) * 0.35;
  });
  return (
    <group ref={raiz} position={[10, 0, 7.4]} visible={false}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[1.3, 0.62, 1.0]} />
        <meshStandardMaterial color={Y} roughness={0.55} flatShading />
      </mesh>
      <mesh position={[-0.1, 1.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.85]} />
        <meshStandardMaterial color={OSC} roughness={0.6} flatShading />
      </mesh>
      {[
        [0.42, 0.3, 0.55],
        [-0.42, 0.3, 0.55],
        [0.42, 0.3, -0.55],
        [-0.42, 0.3, -0.55],
      ].map((pos) => (
        <Rueda
          key={pos.join()}
          posicion={pos as [number, number, number]}
          radio={0.3}
          ancho={0.22}
        />
      ))}
      <group ref={brazos} position={[-0.5, 0.9, 0]}>
        <mesh position={[-0.6, -0.25, 0]} castShadow>
          <boxGeometry args={[0.3, 0.38, 1.15]} />
          <meshStandardMaterial color={PALETA.amarilloOscuro} roughness={0.7} flatShading />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────────────────── Volqueta ───────────────────────── */
const VOLQUETA_X0 = 26;
const VOLQUETA_X = 10.6;

export function Volqueta({ progreso }: { progreso: { p: number } }) {
  const raiz = useRef<Group>(null);
  const platon = useRef<Group>(null);
  useFrame(() => {
    const p = progreso.p;
    const llega = enFase(p, "transporte-y-elevacion", 0.02, 0.42);
    const bascula =
      enFase(p, "transporte-y-elevacion", 0.5, 0.8) *
      (1 - enFase(p, "equipos-para-losas", 0.2, 0.5));
    if (raiz.current) {
      raiz.current.visible = llega > 0.001;
      raiz.current.position.x = VOLQUETA_X0 - (VOLQUETA_X0 - VOLQUETA_X) * llega;
    }
    if (platon.current) platon.current.rotation.z = -bascula * 0.75;
  });
  return (
    <group ref={raiz} position={[VOLQUETA_X0, 0, 7.4]} visible={false}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[4.4, 0.3, 1.3]} />
        <meshStandardMaterial color={OSC} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-1.75, 1.3, 0]} castShadow>
        <boxGeometry args={[1.0, 1.2, 1.4]} />
        <meshStandardMaterial color={Y} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[-2.26, 1.45, 0]}>
        <boxGeometry args={[0.04, 0.55, 1.15]} />
        <meshStandardMaterial color={PALETA.vidrio} roughness={0.2} metalness={0.4} />
      </mesh>
      {/* El platón bascula sobre su eje trasero */}
      <group ref={platon} position={[2.1, 0.75, 0]}>
        <mesh position={[-1.4, 0.55, 0]} castShadow>
          <boxGeometry args={[2.9, 1.0, 1.45]} />
          <meshStandardMaterial color={Y} roughness={0.55} flatShading />
        </mesh>
      </group>
      {[-1.7, 0.9, 1.7].flatMap((x) =>
        [0.62, -0.62].map((z) => (
          <Rueda key={`${x}${z}`} posicion={[x, 0.36, z]} radio={0.38} ancho={0.28} />
        )),
      )}
    </group>
  );
}

/* ───────────────────────── Grúa telescópica ───────────────────────── */
const GRUA_X0 = 27;
const GRUA_X = 9;

export function Grua({ progreso }: { progreso: { p: number } }) {
  const raiz = useRef<Group>(null);
  const pluma = useRef<Group>(null);
  const extension = useRef<Group>(null);
  const torre = useRef<Group>(null);
  const cable = useRef<Group>(null);
  const carga = useRef<Group>(null);
  useFrame(() => {
    const p = progreso.p;
    // Entra por la vía de atrás en "transporte y elevación" (antes no está: el hero es terreno
    // vacío), despliega la pluma e iza el paquete de formaletas.
    const llega = enFase(p, "transporte-y-elevacion", 0.1, 0.42);
    const eleva = enFase(p, "transporte-y-elevacion", 0.4, 0.66);
    const extiende = enFase(p, "transporte-y-elevacion", 0.48, 0.78);
    const iza = enFase(p, "transporte-y-elevacion", 0.66, 1);
    const gira = enFase(p, "equipos-para-losas", 0, 0.5);
    if (raiz.current) {
      raiz.current.visible = llega > 0.001;
      raiz.current.position.x = GRUA_X0 - (GRUA_X0 - GRUA_X) * llega;
    }
    // La grúa está detrás a la derecha de la obra; la torreta apunta hacia el edificio y gira al descargar.
    if (torre.current) torre.current.rotation.y = -2.45 - gira * 0.6;
    if (pluma.current) pluma.current.rotation.z = 0.15 + eleva * 0.75;
    if (extension.current) extension.current.position.x = 1.2 + extiende * 2.6;
    // El cable cuelga siempre vertical desde la punta: se compensa la rotación de la pluma.
    const largo = 4.2 - iza * 3.2;
    if (cable.current) {
      cable.current.rotation.z = -(0.15 + eleva * 0.75);
      cable.current.scale.y = Math.max(0.05, largo);
    }
    if (carga.current) {
      carga.current.rotation.z = -(0.15 + eleva * 0.75);
      carga.current.position.set(
        Math.sin(0.15 + eleva * 0.75) * -largo,
        -Math.cos(0.15 + eleva * 0.75) * largo,
        0,
      );
      carga.current.visible = gira < 0.95;
    }
  });
  return (
    <group ref={raiz} position={[GRUA_X0, 0, -3.5]} visible={false}>
      {/* Portador */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[4.6, 0.5, 1.5]} />
        <meshStandardMaterial color={OSC} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[2.0, 1.45, 0.35]} castShadow>
        <boxGeometry args={[0.9, 1.0, 0.8]} />
        <meshStandardMaterial color={Y} roughness={0.5} flatShading />
      </mesh>
      {[-1.6, -0.6, 0.6, 1.7].flatMap((x) =>
        [0.7, -0.7].map((z) => (
          <Rueda key={`${x}${z}`} posicion={[x, 0.38, z]} radio={0.38} ancho={0.3} />
        )),
      )}
      <group ref={torre} position={[-0.8, 1.05, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.6, 0.7, 1.3]} />
          <meshStandardMaterial color={Y} roughness={0.55} flatShading />
        </mesh>
        <group ref={pluma} position={[0.3, 0.75, 0]} rotation={[0, 0, 0.15]}>
          <mesh position={[1.8, 0, 0]} castShadow>
            <boxGeometry args={[3.8, 0.42, 0.42]} />
            <meshStandardMaterial color={Y} roughness={0.5} flatShading />
          </mesh>
          <group ref={extension} position={[1.2, 0, 0]}>
            <mesh position={[1.8, 0, 0]} castShadow>
              <boxGeometry args={[3.6, 0.3, 0.3]} />
              <meshStandardMaterial color={PALETA.amarilloOscuro} roughness={0.5} flatShading />
            </mesh>
            {/* Punta: cable + carga (paquete de formaletas) */}
            <group position={[3.6, 0, 0]}>
              <group ref={cable}>
                <mesh position={[0, -0.5, 0]}>
                  <boxGeometry args={[0.03, 1, 0.03]} />
                  <meshStandardMaterial color={OSC} />
                </mesh>
              </group>
              <group ref={carga}>
                <mesh position={[0, -0.25, 0]} castShadow>
                  <boxGeometry args={[1.6, 0.18, 0.9]} />
                  <meshStandardMaterial color={PALETA.rojoPuntal} roughness={0.7} flatShading />
                </mesh>
                <mesh position={[0, -0.45, 0]} castShadow>
                  <boxGeometry args={[1.6, 0.18, 0.9]} />
                  <meshStandardMaterial color={PALETA.madera} roughness={0.8} flatShading />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ───────────────────────── Montículo de tierra ───────────────────────── */
export function Monticulo({ progreso }: { progreso: { p: number } }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const crece =
      0.15 +
      0.85 * enFase(progreso.p, "maquinaria-pesada", 0.1, 0.9) +
      0.35 * enFase(progreso.p, "transporte-y-elevacion", 0.5, 0.8);
    if (ref.current) ref.current.scale.set(1, limitar(crece, 0.15, 1.35), 1);
  });
  return (
    <group ref={ref} position={[11, 0, 1.2]}>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <coneGeometry args={[2.4, 1.4, 7]} />
        <meshStandardMaterial color={PALETA.tierra} roughness={1} flatShading />
      </mesh>
    </group>
  );
}
