"use client";

/**
 * La obra que se construye con el scroll: puntales → correas → losa (equipos para losas),
 * formaletas + vaciado de concreto (encofrados), andamios (andamiaje) y equipos en la terraza.
 * Elementos repetidos con InstancedMesh: una llamada de dibujo por tipo.
 */
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type {
  Group,
  InstancedMesh,
  Mesh} from "three";
import {
  BoxGeometry,
  Color,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PALETA } from "./paleta";
import { enFase, limitar } from "./fases";

const ANCHO = 8; // x
const FONDO = 6; // z
const NIVEL = 3; // altura de entrepiso
const aux = new Object3D();

/* Posiciones */
const PUNTALES: Array<[number, number]> = [];
for (let x = -3.5; x <= 3.5; x += 1) for (let z = -2.5; z <= 2.5; z += 1) PUNTALES.push([x, z]);
const CORREAS = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
const COLUMNAS: Array<[number, number]> = [
  [-3.6, -2.6],
  [0, -2.6],
  [3.6, -2.6],
  [-3.6, 2.6],
  [0, 2.6],
  [3.6, 2.6],
];
const MARCOS: Array<{ x: number; y: number; z: number; giro: number }> = [];
for (let n = 0; n < 4; n++) {
  for (let i = 0; i < 6; i++) MARCOS.push({ x: -3.75 + i * 1.5, y: n * 1.9, z: FONDO / 2 + 0.9, giro: 0 });
  for (let i = 0; i < 4; i++) MARCOS.push({ x: ANCHO / 2 + 0.9, y: n * 1.9, z: -2.25 + i * 1.5, giro: Math.PI / 2 });
}

/** Shader sencillo de "vaciado": descarta lo que está sobre el nivel de llenado y pinta una banda húmeda. */
function crearMaterialConcreto() {
  return new ShaderMaterial({
    uniforms: {
      uLlenado: { value: 0 },
      uAlto: { value: NIVEL },
      uColor: { value: new Color(PALETA.concretoClaro) },
      uHumedo: { value: new Color(PALETA.concretoFresco) },
      uLuz: { value: new Vector3(0.4, 0.8, 0.45).normalize() },
    },
    vertexShader: /* glsl */ `
      varying float vY;
      varying vec3 vN;
      void main() {
        vY = position.y;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uLlenado;
      uniform float uAlto;
      uniform vec3 uColor;
      uniform vec3 uHumedo;
      uniform vec3 uLuz;
      varying float vY;
      varying vec3 vN;
      void main() {
        float nivel = -uAlto * 0.5 + uAlto * uLlenado;
        if (vY > nivel) discard;
        float banda = smoothstep(nivel - 0.35, nivel, vY) * (1.0 - step(0.999, uLlenado));
        vec3 base = mix(uColor, uHumedo, banda);
        float luz = 0.42 + 0.58 * max(dot(normalize(vN), uLuz), 0.0);
        gl_FragColor = vec4(base * luz, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

function geometriaMarco() {
  const piezas = [
    new BoxGeometry(0.06, 1.9, 0.06).translate(-0.7, 0.95, 0),
    new BoxGeometry(0.06, 1.9, 0.06).translate(0.7, 0.95, 0),
    new BoxGeometry(1.46, 0.06, 0.06).translate(0, 0.03, 0),
    new BoxGeometry(1.46, 0.06, 0.06).translate(0, 1.87, 0),
    new BoxGeometry(0.05, 2.25, 0.05).rotateZ(Math.atan2(1.4, 1.84)).translate(0, 0.95, 0),
    new BoxGeometry(1.46, 0.05, 0.42).translate(0, 1.9, -0.3), // plataforma
  ];
  const geo = mergeGeometries(piezas);
  for (const g of piezas) g.dispose();
  return geo;
}

export function Obra({ progreso, sombras }: { progreso: { p: number }; sombras: boolean }) {
  const puntales = useRef<InstancedMesh>(null);
  const correas = useRef<InstancedMesh>(null);
  const losa1 = useRef<Mesh>(null);
  const losa2 = useRef<Mesh>(null);
  const varillas = useRef<InstancedMesh>(null);
  const formaletas = useRef<InstancedMesh>(null);
  const marcos = useRef<InstancedMesh>(null);
  const columnas = useRef<Group>(null);
  const ultimo = useRef({ losas: -1, encofrados: -1, andamios: -1 });

  const concreto = useMemo(crearMaterialConcreto, []);
  const geoMarco = useMemo(geometriaMarco, []);
  const colorTablero = useMemo(() => new Color(PALETA.madera), []);
  const colorConcreto = useMemo(() => new Color(PALETA.concreto), []);
  const matLosa1 = useMemo(() => new MeshStandardMaterial({ color: PALETA.madera, roughness: 0.85, flatShading: true }), []);

  // Estado inicial: todo oculto (escala 0).
  useLayoutEffect(() => {
    for (const ref of [puntales, correas, varillas, formaletas, marcos]) {
      const m = ref.current;
      if (!m) continue;
      aux.scale.set(0, 0, 0);
      aux.updateMatrix();
      for (let i = 0; i < m.count; i++) m.setMatrixAt(i, aux.matrix);
      m.instanceMatrix.needsUpdate = true;
    }
    return () => {
      concreto.dispose();
      geoMarco.dispose();
      matLosa1.dispose();
    };
  }, [concreto, geoMarco, matLosa1]);

  useFrame(() => {
    const p = progreso.p;
    const u = ultimo.current;

    /* ── Equipos para losas ── */
    const fLosas = enFase(p, "equipos-para-losas", 0, 1);
    if (Math.abs(fLosas - u.losas) > 0.0005) {
      u.losas = fLosas;
      const m = puntales.current;
      if (m) {
        PUNTALES.forEach(([x, z], i) => {
          // Se levantan uno a uno, en diagonal, durante la primera mitad de la fase.
          const orden = (i % 8) / 8 + Math.floor(i / 8) / 48;
          const k = enFase(p, "equipos-para-losas", orden * 0.4, orden * 0.4 + 0.15);
          aux.position.set(x, (NIVEL * k) / 2, z);
          aux.rotation.set(0, 0, 0);
          aux.scale.set(1, Math.max(0.0001, k * NIVEL), 1);
          aux.updateMatrix();
          m.setMatrixAt(i, aux.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
      }
      const c = correas.current;
      if (c) {
        CORREAS.forEach((z, i) => {
          const k = enFase(p, "equipos-para-losas", 0.5 + i * 0.04, 0.62 + i * 0.04);
          aux.position.set(0, NIVEL - 0.08, z);
          aux.rotation.set(0, 0, 0);
          aux.scale.set(Math.max(0.0001, k), 1, 1);
          aux.updateMatrix();
          c.setMatrixAt(i, aux.matrix);
        });
        c.instanceMatrix.needsUpdate = true;
      }
      if (losa1.current) {
        const k = enFase(p, "equipos-para-losas", 0.75, 0.98);
        losa1.current.visible = k > 0.001;
        losa1.current.scale.set(1, 1, Math.max(0.0001, k));
      }
    }

    /* ── Encofrados y formaletería (nivel 2) ── */
    const fEnc = enFase(p, "encofrados-y-formaleteria", 0, 1);
    if (Math.abs(fEnc - u.encofrados) > 0.0005) {
      u.encofrados = fEnc;
      const v = varillas.current;
      const kVar = enFase(p, "encofrados-y-formaleteria", 0, 0.2);
      if (v) {
        let i = 0;
        for (const [cx, cz] of COLUMNAS) {
          for (const [dx, dz] of [
            [-0.14, -0.14],
            [0.14, -0.14],
            [-0.14, 0.14],
            [0.14, 0.14],
          ] as const) {
            aux.position.set(cx + dx, NIVEL + 0.2 + ((NIVEL + 0.5) * kVar) / 2, cz + dz);
            aux.rotation.set(0, 0, 0);
            aux.scale.set(1, Math.max(0.0001, (NIVEL + 0.5) * kVar), 1);
            aux.updateMatrix();
            v.setMatrixAt(i++, aux.matrix);
          }
        }
        v.instanceMatrix.needsUpdate = true;
      }
      // Paneles: llegan desde afuera, se cierran, y al final se retiran (desencofrado).
      const cierra = enFase(p, "encofrados-y-formaleteria", 0.15, 0.4);
      const retira = enFase(p, "encofrados-y-formaleteria", 0.82, 1);
      const f = formaletas.current;
      if (f) {
        let i = 0;
        for (const [cx, cz] of COLUMNAS) {
          for (let lado = 0; lado < 4; lado++) {
            const ang = (lado * Math.PI) / 2;
            const dist = 0.33 + (1 - cierra) * 1.2 + retira * 0.8;
            aux.position.set(cx + Math.cos(ang) * dist, NIVEL + 0.2 + NIVEL / 2, cz + Math.sin(ang) * dist);
            aux.rotation.set(0, -ang, 0);
            const s = cierra * (1 - retira);
            aux.scale.set(Math.max(0.0001, s), Math.max(0.0001, s), Math.max(0.0001, s));
            aux.updateMatrix();
            f.setMatrixAt(i++, aux.matrix);
          }
        }
        f.instanceMatrix.needsUpdate = true;
      }
      concreto.uniforms.uLlenado!.value = enFase(p, "encofrados-y-formaleteria", 0.4, 0.8);
      if (columnas.current) columnas.current.visible = fEnc > 0.38;
      if (losa2.current) {
        const k = enFase(p, "encofrados-y-formaleteria", 0.85, 1);
        losa2.current.visible = k > 0.001;
        losa2.current.position.y = NIVEL * 2 + 0.11 + (1 - k) * 1.5;
      }
      // La primera losa pasa de tablero (madera) a concreto cuando se vacía la estructura.
      matLosa1.color.copy(colorTablero).lerp(colorConcreto, enFase(p, "encofrados-y-formaleteria", 0.4, 0.8));
    }

    /* ── Andamiaje ── */
    const fAnd = enFase(p, "andamiaje", 0, 1);
    if (Math.abs(fAnd - u.andamios) > 0.0005) {
      u.andamios = fAnd;
      const m = marcos.current;
      if (m) {
        MARCOS.forEach((mc, i) => {
          const nivel = Math.floor(i / 10);
          const k = enFase(p, "andamiaje", nivel * 0.2 + (i % 10) * 0.012, nivel * 0.2 + (i % 10) * 0.012 + 0.2);
          aux.position.set(mc.x, mc.y + (1 - k) * 0.8, mc.z);
          aux.rotation.set(0, mc.giro, 0);
          // Un marco aún no montado se oculta del todo (aplastado seguiría viéndose como un listón).
          const visible = k > 0.002 ? 1 : 0;
          aux.scale.set(visible, Math.max(0.0001, k), visible);
          aux.updateMatrix();
          m.setMatrixAt(i, aux.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {/* Placa de concreto bajo la obra */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ANCHO + 3, FONDO + 3]} />
        <meshStandardMaterial color={PALETA.concreto} roughness={1} />
      </mesh>

      <instancedMesh ref={puntales} args={[undefined, undefined, PUNTALES.length]} castShadow={sombras}>
        <cylinderGeometry args={[0.055, 0.055, 1, 6]} />
        <meshStandardMaterial color={PALETA.rojoPuntal} roughness={0.6} flatShading />
      </instancedMesh>

      <instancedMesh ref={correas} args={[undefined, undefined, CORREAS.length]} castShadow={sombras}>
        <boxGeometry args={[ANCHO + 0.2, 0.16, 0.16]} />
        <meshStandardMaterial color={PALETA.amarillo} roughness={0.6} flatShading />
      </instancedMesh>

      <mesh ref={losa1} position={[0, NIVEL + 0.11, 0]} material={matLosa1} castShadow={sombras} receiveShadow visible={false}>
        <boxGeometry args={[ANCHO + 0.6, 0.22, FONDO + 0.6]} />
      </mesh>

      <instancedMesh ref={varillas} args={[undefined, undefined, COLUMNAS.length * 4]}>
        <cylinderGeometry args={[0.025, 0.025, 1, 4]} />
        <meshStandardMaterial color="#6B3B22" roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={formaletas} args={[undefined, undefined, COLUMNAS.length * 4]} castShadow={sombras}>
        <boxGeometry args={[0.06, NIVEL, 0.72]} />
        <meshStandardMaterial color={PALETA.rojoPuntal} roughness={0.55} metalness={0.2} flatShading />
      </instancedMesh>

      {/* Concreto de columnas y muro posterior (shader de vaciado) */}
      <group ref={columnas} visible={false}>
        {COLUMNAS.map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, NIVEL + 0.2 + NIVEL / 2, z]} material={concreto}>
            <boxGeometry args={[0.6, NIVEL, 0.6]} />
          </mesh>
        ))}
        <mesh position={[0, NIVEL + 0.2 + NIVEL / 2, -FONDO / 2 + 0.05]} material={concreto}>
          <boxGeometry args={[ANCHO - 0.6, NIVEL, 0.25]} />
        </mesh>
      </group>

      <mesh ref={losa2} position={[0, NIVEL * 2 + 0.11, 0]} castShadow={sombras} receiveShadow visible={false}>
        <boxGeometry args={[ANCHO + 0.6, 0.22, FONDO + 0.6]} />
        <meshStandardMaterial color={PALETA.concretoClaro} roughness={0.95} flatShading />
      </mesh>

      <instancedMesh ref={marcos} args={[geoMarco, undefined, MARCOS.length]} castShadow={sombras}>
        <meshStandardMaterial color={PALETA.rojoPuntal} roughness={0.55} metalness={0.15} flatShading />
      </instancedMesh>
    </group>
  );
}

/* ───────────────────────── Equipos en la terraza (otros equipos) ───────────────────────── */
export function EquiposTerraza({ progreso }: { progreso: { p: number } }) {
  const generador = useRef<Group>(null);
  const compresor = useRef<Group>(null);
  const pluma = useRef<Group>(null);
  const brazo = useRef<Group>(null);
  const techo = NIVEL * 2 + 0.22;

  useFrame(({ clock }) => {
    const p = progreso.p;
    const caer = (g: Group | null, a: number, b: number) => {
      if (!g) return;
      const k = enFase(p, "otros-equipos", a, b);
      g.visible = k > 0.001;
      // Aterrizaje con leve sobrepaso (resorte), como una carga depositada por la grúa.
      const rebote = k < 1 ? Math.sin(k * Math.PI) * 0.12 : 0;
      g.position.y = techo + (1 - k) * 3 + rebote;
    };
    caer(generador.current, 0, 0.35);
    caer(compresor.current, 0.2, 0.55);
    caer(pluma.current, 0.4, 0.8);
    if (brazo.current) brazo.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.4 * limitar(enFase(p, "otros-equipos", 0.8, 1));
  });

  return (
    <group>
      <group ref={generador} position={[-2.2, techo, -1.2]} visible={false}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.5, 1.0, 0.85]} />
          <meshStandardMaterial color={PALETA.amarillo} roughness={0.55} flatShading />
        </mesh>
        {[-0.45, -0.15, 0.15, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.55, 0.43]}>
            <boxGeometry args={[0.16, 0.6, 0.02]} />
            <meshStandardMaterial color={PALETA.grafito} />
          </mesh>
        ))}
      </group>
      <group ref={compresor} position={[0.6, techo, -1.5]} visible={false}>
        <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 1.4, 10]} />
          <meshStandardMaterial color={PALETA.amarillo} roughness={0.5} flatShading />
        </mesh>
        <mesh position={[0, 0.98, 0]} castShadow>
          <boxGeometry args={[0.6, 0.35, 0.5]} />
          <meshStandardMaterial color={PALETA.grafito} roughness={0.6} flatShading />
        </mesh>
      </group>
      {/* Pluma de cargue: base roja + mástil y brazo azules (como las de la bodega) */}
      <group ref={pluma} position={[3.2, techo, 2.6]} visible={false}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[1.0, 0.3, 1.0]} />
          <meshStandardMaterial color={PALETA.rojoPuntal} roughness={0.6} flatShading />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.14, 2.1, 0.14]} />
          <meshStandardMaterial color={PALETA.azulPluma} roughness={0.5} flatShading />
        </mesh>
        <group ref={brazo} position={[0, 2.2, 0]}>
          <mesh position={[0.75, 0, 0]} castShadow>
            <boxGeometry args={[1.6, 0.12, 0.12]} />
            <meshStandardMaterial color={PALETA.azulPluma} roughness={0.5} flatShading />
          </mesh>
          <mesh position={[1.5, -0.6, 0]}>
            <boxGeometry args={[0.02, 1.2, 0.02]} />
            <meshStandardMaterial color={PALETA.grafito} />
          </mesh>
          <mesh position={[1.5, -1.25, 0]}>
            <boxGeometry args={[0.16, 0.14, 0.1]} />
            <meshStandardMaterial color={PALETA.amarillo} />
          </mesh>
        </group>
        <mesh position={[-0.25, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.3, 10]} />
          <meshStandardMaterial color={PALETA.azulPluma} roughness={0.5} flatShading />
        </mesh>
      </group>
    </group>
  );
}
