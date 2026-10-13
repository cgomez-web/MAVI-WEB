"use client";

/**
 * Cielo (shader de degradado cálido con sol), luces de "hora dorada", terreno, polvo y el
 * engranaje MAVI en 3D. La luz recorre amanecer → mediodía → atardecer con el progreso.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { DirectionalLight, Group, HemisphereLight, Mesh, Points } from "three";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  ExtrudeGeometry,
  Fog,
  ShaderMaterial,
  Shape,
  Vector3,
} from "three";
import { CIELOS, PALETA } from "./paleta";
import { PUNTOS_M } from "./marca";
import { enFase, limitar, tramo } from "./fases";

const tmpA = new Color();
const tmpB = new Color();

/** Mezcla amanecer → día → atardecer según p. */
function mezclaCielo(p: number, clave: "arriba" | "horizonte" | "suelo" | "sol", destino: Color) {
  const haciaDia = tramo(p, 0.06, 0.35);
  const haciaTarde = tramo(p, 0.78, 0.98);
  tmpA.copy(CIELOS.amanecer[clave]).lerp(CIELOS.dia[clave], haciaDia);
  tmpB.copy(tmpA).lerp(CIELOS.atardecer[clave], haciaTarde);
  return destino.copy(tmpB);
}

export function Cielo({ progreso }: { progreso: { p: number } }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uArriba: { value: new Color() },
          uHorizonte: { value: new Color() },
          uSuelo: { value: new Color() },
          uSol: { value: new Color() },
          uSolDir: { value: new Vector3(-1, 0.1, -0.4).normalize() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uArriba;
          uniform vec3 uHorizonte;
          uniform vec3 uSuelo;
          uniform vec3 uSol;
          uniform vec3 uSolDir;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 c = mix(uHorizonte, uArriba, smoothstep(0.0, 0.5, h));
            c = mix(uSuelo, c, smoothstep(-0.04, 0.03, h));
            float s = max(dot(normalize(vDir), normalize(uSolDir)), 0.0);
            c += uSol * (pow(s, 280.0) * 1.6 + pow(s, 9.0) * 0.28);
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const p = progreso.p;
    const u = material.uniforms;
    mezclaCielo(p, "arriba", u.uArriba!.value as Color);
    mezclaCielo(p, "horizonte", u.uHorizonte!.value as Color);
    mezclaCielo(p, "suelo", u.uSuelo!.value as Color);
    mezclaCielo(p, "sol", u.uSol!.value as Color);
    // El sol sale a la izquierda, cruza alto y se pone a la derecha.
    const ang = -0.9 + p * 1.8;
    const alto = 0.08 + Math.sin(limitar(p) * Math.PI) * 0.55;
    (u.uSolDir!.value as Vector3).set(Math.sin(ang), alto, -Math.cos(ang)).normalize();
  });

  return (
    <mesh material={material} frustumCulled={false}>
      <sphereGeometry args={[180, 24, 16]} />
    </mesh>
  );
}

export function Luces({ progreso, sombras }: { progreso: { p: number }; sombras: boolean }) {
  const sol = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const scene = useThree((s) => s.scene);
  const niebla = useMemo(() => new Fog(new Color(PALETA.tinta), 30, 120), []);

  useEffect(() => {
    scene.fog = niebla;
    return () => {
      scene.fog = null;
    };
  }, [scene, niebla]);

  useFrame(() => {
    const p = progreso.p;
    const ang = -0.9 + p * 1.8;
    const alto = 0.15 + Math.sin(limitar(p) * Math.PI) * 0.75;
    if (sol.current) {
      sol.current.position.set(Math.sin(ang) * 30, alto * 30, -Math.cos(ang) * 10 + 14);
      mezclaCielo(p, "sol", sol.current.color);
      sol.current.intensity = 1.6 + alto * 1.4;
    }
    if (hemi.current) {
      mezclaCielo(p, "horizonte", hemi.current.color);
      hemi.current.intensity = 0.7 + alto * 0.7;
    }
    mezclaCielo(p, "horizonte", niebla.color).multiplyScalar(0.55);
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#E08A1E", PALETA.tierraOscura, 0.8]} />
      {/* Relleno cálido desde el lado de la cámara: las máquinas se leen amarillas aunque el sol
          venga de atrás (amanecer y atardecer). Sin sombras. */}
      <directionalLight position={[10, 7, 24]} intensity={0.75} color="#FFD9A6" />
      <directionalLight
        ref={sol}
        castShadow={sombras}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0006}
      />
    </>
  );
}

export function Terreno() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[70, 24]} />
        <meshStandardMaterial color={PALETA.tierra} roughness={1} />
      </mesh>
      {/* Vía de acceso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.01, 8.6]} receiveShadow>
        <planeGeometry args={[46, 3.2]} />
        <meshStandardMaterial color={PALETA.tierraOscura} roughness={1} />
      </mesh>
      {/* Estacas con cinta: el terreno "vacío" del amanecer */}
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} position={[x, 0.5, 5.6]}>
          <boxGeometry args={[0.08, 1, 0.08]} />
          <meshStandardMaterial color={PALETA.madera} />
        </mesh>
      ))}
      <mesh position={[0, 0.85, 5.6]}>
        <boxGeometry args={[12, 0.05, 0.02]} />
        <meshStandardMaterial
          color={PALETA.amarillo}
          emissive={PALETA.amarillo}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

/** Polvo en suspensión: partículas aditivas que suben y derivan. Más densas en hero y excavación. */
export function Polvo({
  progreso,
  cantidad = 520,
}: {
  progreso: { p: number };
  cantidad?: number;
}) {
  const puntos = useRef<Points>(null);
  const { geometria, velocidades } = useMemo(() => {
    const pos = new Float32Array(cantidad * 3);
    const vel = new Float32Array(cantidad);
    let semilla = 7;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < cantidad; i++) {
      pos[i * 3] = (azar() - 0.5) * 34;
      pos[i * 3 + 1] = azar() * 9;
      pos[i * 3 + 2] = (azar() - 0.5) * 22;
      vel[i] = 0.08 + azar() * 0.25;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    return { geometria: g, velocidades: vel };
  }, [cantidad]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uOpacidad: { value: 0.6 },
          uColor: { value: new Color("#FFD27A") },
          uTamano: { value: 26 },
        },
        vertexShader: /* glsl */ `
          uniform float uTamano;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uTamano / -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpacidad;
          uniform vec3 uColor;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * uOpacidad;
            gl_FragColor = vec4(uColor, a);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );
  useEffect(
    () => () => {
      geometria.dispose();
      material.dispose();
    },
    [geometria, material],
  );

  useFrame((_, dt) => {
    const attr = geometria.getAttribute("position") as BufferAttribute;
    const arr = attr.array as Float32Array;
    const paso = Math.min(dt, 0.05);
    for (let i = 0; i < cantidad; i++) {
      const iy = i * 3 + 1;
      arr[iy] = (arr[iy] ?? 0) + (velocidades[i] ?? 0.1) * paso;
      arr[i * 3] = (arr[i * 3] ?? 0) + Math.sin((arr[iy] ?? 0) + i) * 0.004;
      if ((arr[iy] ?? 0) > 9) arr[iy] = 0;
    }
    attr.needsUpdate = true;
    const p = progreso.p;
    const densidad =
      0.25 +
      0.75 *
        Math.max(
          1 - enFase(p, "inicio", 0.6, 1),
          enFase(p, "maquinaria-pesada") * (1 - enFase(p, "transporte-y-elevacion", 0, 0.5)),
        );
    material.uniforms.uOpacidad!.value = 0.55 * densidad;
  });

  return <points ref={puntos} geometry={geometria} material={material} frustumCulled={false} />;
}

/**
 * Posición del engranaje: en el hero, al fondo y en la zona libre de texto (arriba a la derecha en
 * escritorio; arriba a la izquierda de la excavadora en vertical); en el cierre, sobre la obra.
 */
const ENGRANAJE_INICIO: [number, number, number] = [9.8, 13.2, -14];
const ENGRANAJE_INICIO_VERTICAL: [number, number, number] = [2.1, 1.9, -12];
const ENGRANAJE_CIERRE: [number, number, number] = [0, 9.6, -6];

/** Engranaje del logo MAVI extruido, con la "M" del isotipo. Protagonista al inicio y al cierre. */
export function Engranaje({
  estado,
  progreso,
}: {
  estado: { vertical: boolean };
  progreso: { p: number };
}) {
  const grupo = useRef<Group>(null);
  const anillo = useRef<Mesh>(null);
  const geometria = useMemo(() => {
    const dientes = 16;
    const rExt = 2.0;
    const rInt = 1.72;
    const paso = (Math.PI * 2) / dientes;
    const forma = new Shape();
    for (let i = 0; i < dientes; i++) {
      const a = i * paso;
      const puntos: Array<[number, number]> = [
        [a - paso * 0.5, rInt],
        [a - paso * 0.22, rInt],
        [a - paso * 0.15, rExt],
        [a + paso * 0.15, rExt],
        [a + paso * 0.22, rInt],
      ];
      puntos.forEach(([ang, r], j) => {
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r;
        if (i === 0 && j === 0) forma.moveTo(x, y);
        else forma.lineTo(x, y);
      });
    }
    forma.closePath();
    const hueco = new Shape();
    hueco.absarc(0, 0, 1.25, 0, Math.PI * 2, true);
    forma.holes.push(hueco);
    const g = new ExtrudeGeometry(forma, {
      depth: 0.35,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 1,
      curveSegments: 24,
    });
    g.center();
    return g;
  }, []);
  const geometriaM = useMemo(() => {
    const escala = 0.0135;
    const forma = new Shape();
    PUNTOS_M.forEach(([x, y], i) => {
      const px = (x - 40) * escala;
      const py = (50 - y) * escala;
      if (i === 0) forma.moveTo(px, py);
      else forma.lineTo(px, py);
    });
    forma.closePath();
    return new ExtrudeGeometry(forma, { depth: 0.12, bevelEnabled: false });
  }, []);
  useEffect(
    () => () => {
      geometria.dispose();
      geometriaM.dispose();
    },
    [geometria, geometriaM],
  );

  useFrame(({ clock }) => {
    const p = progreso.p;
    const g = grupo.current;
    if (!g) return;
    const inicio = 1 - enFase(p, "inicio", 0.55, 1);
    const cierre = enFase(p, "cierre", 0, 0.7);
    const s = Math.max(inicio, cierre);
    g.visible = s > 0.001;
    g.scale.setScalar(Math.max(0.001, s) * (estado.vertical && cierre < 0.5 ? 0.7 : 1.25));
    const a = estado.vertical ? ENGRANAJE_INICIO_VERTICAL : ENGRANAJE_INICIO;
    g.position.set(
      a[0] + (ENGRANAJE_CIERRE[0] - a[0]) * cierre,
      a[1] + (ENGRANAJE_CIERRE[1] - a[1]) * cierre,
      a[2] + (ENGRANAJE_CIERRE[2] - a[2]) * cierre,
    );
    // Solo gira la corona: la "M" queda derecha, como en el logo.
    if (anillo.current) anillo.current.rotation.z = clock.elapsedTime * 0.12;
  });

  return (
    <group ref={grupo} position={ENGRANAJE_INICIO}>
      <mesh ref={anillo} geometry={geometria} castShadow>
        <meshStandardMaterial
          color={PALETA.amarillo}
          roughness={0.35}
          metalness={0.55}
          flatShading
        />
      </mesh>
      <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 0.32, 32]} />
        <meshStandardMaterial color={PALETA.tinta} roughness={0.6} />
      </mesh>
      <mesh geometry={geometriaM} position={[0, 0, 0.17]}>
        <meshStandardMaterial color={PALETA.hueso} roughness={0.55} flatShading />
      </mesh>
    </group>
  );
}
