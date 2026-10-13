import type { CSSProperties, ReactNode } from "react";
import { rutaEngranaje } from "@/components/brand/Logo";
import { kCapa, solEn, type IdCapaPoster } from "./posterCapas";
import { rutaM } from "./marca";

/**
 * Póster de la escena (fallback 2D sin WebGL o con movimiento reducido, y estado mientras carga el
 * 3D). SVG vectorial, sin imágenes ni peticiones: nunca compite por el LCP.
 *
 * Cuenta la misma historia que la escena 3D: amanecer con el lote vacío y la excavadora → el
 * montículo y el minicargador → la volqueta y la grúa que iza → puntales, correas y losa → hierros,
 * formaletas y vaciado → andamios piso a piso → equipos en la terraza → atardecer con el engranaje.
 * Cada capa lleva `data-capa`; EscenaCliente escribe su avance en `--k` según la fase en pantalla
 * (posterCapas.ts). El HTML de servidor ya trae el estado del hero.
 *
 * Composición: en horizontal la obra va a la derecha del texto (xMaxYMid); en vertical el póster
 * se reduce y se sube para que la obra quede en el tercio superior, sobre el texto.
 */

const AMARILLO = "#FCBF06";
const MAQUINA = "#B88A05"; // amarillo máquina a contraluz
const MAQUINA_OSC = "#8F6B04";
const SILUETA = "#161618";
const TINTA = "#0B0B0C";
const ROJO = "#C8321E";
const MADERA = "#C79A4B";
const CONCRETO = "#8A8A85";
const CONCRETO_CLARO = "#A9A7A1";
const VIDRIO = "#20262B";
const AZUL = "#2B4FA6";
const TIERRA = "#4A3A2A";

type Efecto =
  | { tipo: "funde" }
  | { tipo: "sube"; d?: number }
  | { tipo: "entra"; d: number }
  | { tipo: "cae"; d?: number }
  | { tipo: "crece" }
  | { tipo: "escala" }
  | { tipo: "gira"; origen: [number, number]; desde: number; hasta: number }
  | { tipo: "cable"; origen: [number, number]; final: number };

function estiloDe(efecto: Efecto, k0: number): CSSProperties {
  const k = "var(--k, 0)";
  const base: Record<string, string | number> = { "--k": Number(k0.toFixed(3)) };
  switch (efecto.tipo) {
    case "funde":
      return { ...base, opacity: k };
    case "sube":
      return {
        ...base,
        opacity: k,
        transform: `translateY(calc((1 - ${k}) * ${efecto.d ?? 28}px))`,
      };
    case "entra":
      return {
        ...base,
        opacity: `min(1, calc(${k} * 3))`,
        transform: `translateX(calc((1 - ${k}) * ${efecto.d}px))`,
      };
    case "cae":
      return {
        ...base,
        opacity: `min(1, calc(${k} * 4))`,
        transform: `translateY(calc((${k} - 1) * ${efecto.d ?? 90}px))`,
      };
    case "crece":
      return {
        ...base,
        opacity: `min(1, calc(${k} * 20))`,
        transformBox: "fill-box",
        transformOrigin: "50% 100%",
        transform: `scaleY(${k})`,
      };
    case "escala":
      return {
        ...base,
        opacity: k,
        transformBox: "fill-box",
        transformOrigin: "50% 50%",
        transform: `scale(calc(0.7 + ${k} * 0.3))`,
      };
    case "gira":
      return {
        ...base,
        transformBox: "view-box",
        transformOrigin: `${efecto.origen[0]}px ${efecto.origen[1]}px`,
        transform: `rotate(calc(${efecto.desde}deg + ${k} * ${efecto.hasta - efecto.desde}deg))`,
      };
    case "cable":
      return {
        ...base,
        transformBox: "view-box",
        transformOrigin: `${efecto.origen[0]}px ${efecto.origen[1]}px`,
        transform: `scaleY(calc(1 - ${k} * ${1 - efecto.final}))`,
      };
  }
}

function Capa({ id, efecto, children }: { id: IdCapaPoster; efecto: Efecto; children: ReactNode }) {
  return (
    <g data-capa={id} style={estiloDe(efecto, kCapa(id, 0))}>
      {children}
    </g>
  );
}

/** Tramo de andamio: postes, larguero, diagonales y plataforma entre dos alturas. */
function TramoAndamio({ abajo, arriba }: { abajo: number; arriba: number }) {
  const postes = [925, 991, 1057, 1123, 1189, 1255];
  return (
    <g stroke={ROJO} strokeLinecap="square" fill="none">
      <path strokeWidth="3" d={postes.map((x) => `M${x} ${abajo}V${arriba - 6}`).join("")} />
      <path strokeWidth="3" d={`M925 ${arriba}H1255`} />
      <path
        strokeWidth="2"
        d={[0, 2, 4].map((i) => `M${postes[i]} ${abajo}L${postes[i + 1]} ${arriba}`).join("")}
      />
      <rect
        x="925"
        y={arriba - 5}
        width="330"
        height="4"
        fill={MADERA}
        stroke="none"
        opacity="0.8"
      />
    </g>
  );
}

export function PosterObra() {
  const [solX, solY] = solEn(0);
  const columnas = [960, 1090, 1220];
  const puntales = [952, 986, 1020, 1054, 1088, 1122, 1156, 1190, 1224];
  const puntal = (xs: number[]) => xs.map((x) => `M${x} 752V650`).join("");

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMaxYMid slice"
      className="absolute inset-0 h-full w-full portrait:top-[8svh] portrait:left-[calc(50%-80svh)] portrait:h-[60svh] portrait:w-[106.67svh]"
      aria-hidden="true"
      focusable="false"
      data-poster-obra=""
    >
      <defs>
        <linearGradient id="poster-amanecer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={TINTA} />
          <stop offset="0.55" stopColor="#2a1a08" />
          <stop offset="0.78" stopColor="#7a4a06" />
          <stop offset="0.845" stopColor="#c98a05" />
        </linearGradient>
        <linearGradient id="poster-dia" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#121110" />
          <stop offset="0.5" stopColor="#3b3328" />
          <stop offset="0.78" stopColor="#6e5f46" />
          <stop offset="0.845" stopColor="#968463" />
        </linearGradient>
        <linearGradient id="poster-tarde" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={TINTA} />
          <stop offset="0.55" stopColor="#2a0f08" />
          <stop offset="0.78" stopColor="#8a2f12" />
          <stop offset="0.845" stopColor="#c4521b" />
        </linearGradient>
        <radialGradient id="poster-sol" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={AMARILLO} stopOpacity="0.35" />
          <stop offset="1" stopColor={AMARILLO} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cielo: amanecer → mediodía → atardecer (horizonte a 660 u) */}
      <rect y="-100" width="1600" height="900" fill="url(#poster-amanecer)" />
      <Capa id="dia" efecto={{ tipo: "funde" }}>
        <rect y="-100" width="1600" height="900" fill="url(#poster-dia)" />
      </Capa>
      <Capa id="tarde" efecto={{ tipo: "funde" }}>
        <rect y="-100" width="1600" height="900" fill="url(#poster-tarde)" />
      </Capa>
      <g data-sol="" style={{ transform: `translate(${solX}px, ${solY}px)` }}>
        <circle r="70" fill="url(#poster-sol)" />
        <circle r="20" fill={AMARILLO} opacity="0.75" />
      </g>

      {/* Engranaje MAVI: al fondo en el hero; vuelve sobre la obra en el cierre */}
      <Capa id="engranaje-inicio" efecto={{ tipo: "funde" }}>
        <g opacity="0.5">
          <path d={rutaEngranaje(1230, 250, 120, 104, 16)} fill={AMARILLO} />
          <circle cx="1230" cy="250" r="92" fill={TINTA} />
          <path d={rutaM(1230, 250, 92)} fill="#F4F1EA" />
        </g>
      </Capa>
      <Capa id="engranaje-cierre" efecto={{ tipo: "escala" }}>
        <g opacity="0.75">
          <path d={rutaEngranaje(1090, 270, 125, 108, 16)} fill={AMARILLO} />
          <circle cx="1090" cy="270" r="95" fill={TINTA} />
          <path d={rutaM(1090, 270, 96)} fill="#F4F1EA" />
        </g>
      </Capa>

      {/* La obra y el terreno, subidos 100 u: horizonte a 660 u (73 % del alto). */}
      <g transform="translate(0 -100)">
        {/* Grúa telescópica: entra por detrás de la obra, despliega la pluma e iza un paquete */}
        <Capa id="grua" efecto={{ tipo: "entra", d: 560 }}>
          <Capa id="grua-cable" efecto={{ tipo: "funde" }}>
            <Capa id="grua-iza" efecto={{ tipo: "cable", origen: [1384, 435], final: 0.213 }}>
              <path d="M1384 435V740" stroke={SILUETA} strokeWidth="3" />
            </Capa>
            <Capa id="grua-iza" efecto={{ tipo: "sube", d: 240 }}>
              <rect x="1350" y="500" width="68" height="10" fill={ROJO} />
              <rect x="1350" y="510" width="68" height="10" fill={MADERA} />
            </Capa>
          </Capa>
          <Capa
            id="grua-pluma"
            efecto={{ tipo: "gira", origen: [1121, 708], desde: -8, hasta: -46 }}
          >
            <rect x="1108" y="701" width="392" height="14" fill={MAQUINA} />
            <rect x="1300" y="703" width="200" height="10" fill={MAQUINA_OSC} />
          </Capa>
          <rect x="1040" y="724" width="210" height="24" fill={SILUETA} />
          <rect x="1090" y="704" width="62" height="20" fill={MAQUINA} />
          <rect x="1214" y="692" width="36" height="32" fill={MAQUINA} />
          <rect x="1232" y="698" width="14" height="16" fill={VIDRIO} />
          <g fill={SILUETA} stroke={AMARILLO} strokeOpacity="0.35" strokeWidth="2">
            {[1068, 1104, 1186, 1222].map((x) => (
              <circle key={x} cx={x} cy="750" r="11" />
            ))}
          </g>
        </Capa>

        {/* Obra: placa, puntales, correas y losas, columnas, terraza */}
        <Capa id="placa" efecto={{ tipo: "funde" }}>
          <rect x="930" y="752" width="320" height="8" fill="#5E5C58" />
        </Capa>
        <Capa id="puntales-a" efecto={{ tipo: "crece" }}>
          <path d={puntal(puntales.slice(0, 3))} stroke={ROJO} strokeWidth="5" />
        </Capa>
        <Capa id="puntales-b" efecto={{ tipo: "crece" }}>
          <path d={puntal(puntales.slice(3, 6))} stroke={ROJO} strokeWidth="5" />
        </Capa>
        <Capa id="puntales-c" efecto={{ tipo: "crece" }}>
          <path d={puntal(puntales.slice(6))} stroke={ROJO} strokeWidth="5" />
        </Capa>
        <Capa id="correas" efecto={{ tipo: "sube", d: 16 }}>
          <rect x="935" y="642" width="310" height="8" fill="#D99A00" />
        </Capa>
        <Capa id="losa1" efecto={{ tipo: "sube", d: 20 }}>
          <rect x="925" y="628" width="330" height="14" fill={MADERA} />
        </Capa>
        <Capa id="losa1-concreto" efecto={{ tipo: "funde" }}>
          <rect x="925" y="628" width="330" height="14" fill={CONCRETO} />
        </Capa>
        <Capa id="varillas" efecto={{ tipo: "crece" }}>
          <path
            d={columnas
              .map((x) => `M${x - 7} 628V500M${x - 2} 628V500M${x + 3} 628V500M${x + 8} 628V500`)
              .join("")}
            stroke="#6B3B22"
            strokeWidth="2"
          />
        </Capa>
        <Capa id="vaciado" efecto={{ tipo: "crece" }}>
          {columnas.map((x) => (
            <rect key={x} x={x - 11} y="518" width="22" height="110" fill={CONCRETO_CLARO} />
          ))}
        </Capa>
        <Capa id="formaletas" efecto={{ tipo: "sube", d: 30 }}>
          {columnas.map((x) => (
            <g key={x} fill={ROJO}>
              <rect x={x - 17} y="518" width="6" height="110" />
              <rect x={x + 11} y="518" width="6" height="110" />
            </g>
          ))}
        </Capa>
        <Capa id="losa2" efecto={{ tipo: "cae", d: 60 }}>
          <rect x="925" y="506" width="330" height="12" fill={CONCRETO_CLARO} />
        </Capa>
        <Capa id="generador" efecto={{ tipo: "cae" }}>
          <rect x="960" y="466" width="72" height="40" fill={MAQUINA} />
          <path
            d="M972 474v24M984 474v24M996 474v24M1008 474v24"
            stroke={SILUETA}
            strokeWidth="4"
          />
        </Capa>
        <Capa id="compresor" efecto={{ tipo: "cae" }}>
          <rect x="1062" y="478" width="66" height="28" fill={MAQUINA} />
          <rect x="1082" y="464" width="26" height="14" fill={SILUETA} />
        </Capa>
        <Capa id="pluma" efecto={{ tipo: "cae" }}>
          <rect x="1168" y="494" width="30" height="12" fill={ROJO} />
          <rect x="1180" y="430" width="6" height="64" fill={AZUL} />
          <rect x="1183" y="430" width="62" height="6" fill={AZUL} />
          <path d="M1241 436V468" stroke={SILUETA} strokeWidth="2" />
          <rect x="1236" y="468" width="10" height="7" fill={AMARILLO} />
        </Capa>
        <Capa id="andamio-1" efecto={{ tipo: "sube" }}>
          <TramoAndamio abajo={760} arriba={688} />
        </Capa>
        <Capa id="andamio-2" efecto={{ tipo: "sube" }}>
          <TramoAndamio abajo={688} arriba={616} />
        </Capa>
        <Capa id="andamio-3" efecto={{ tipo: "sube" }}>
          <TramoAndamio abajo={616} arriba={544} />
          <path d="M925 520H1255" stroke={ROJO} strokeWidth="3" />
        </Capa>

        {/* Montículo de tierra (crece con la excavación y con la descarga de la volqueta) */}
        <Capa id="monticulo" efecto={{ tipo: "crece" }}>
          <path d="M1232 760L1262 726L1300 710L1340 722L1376 760Z" fill={TIERRA} />
        </Capa>
        <Capa id="monticulo-descarga" efecto={{ tipo: "crece" }}>
          <path d="M1250 760L1276 736L1310 730L1342 760Z" fill="#5A4733" />
        </Capa>

        {/* Excavadora: en el lote desde el hero; cava en "maquinaria pesada" */}
        <g>
          <rect x="1390" y="738" width="150" height="22" fill={SILUETA} />
          <path d="M1390 738H1540" stroke={AMARILLO} strokeOpacity="0.45" strokeWidth="2" />
          <rect x="1400" y="704" width="115" height="34" fill={MAQUINA} />
          <rect x="1505" y="708" width="27" height="28" fill="#1A1A1C" />
          <rect x="1404" y="662" width="44" height="42" fill={MAQUINA} />
          <rect x="1407" y="668" width="15" height="28" fill={VIDRIO} />
        </g>
        <Capa id="brazo-reposo" efecto={{ tipo: "funde" }}>
          <path d="M1418 710L1336 630L1300 690" fill="none" stroke={MAQUINA} strokeWidth="12" />
          <path d="M1288 684H1312L1306 714L1284 710Z" fill={MAQUINA_OSC} />
        </Capa>
        <Capa id="brazo-cava" efecto={{ tipo: "funde" }}>
          <path d="M1418 712L1338 664L1300 736" fill="none" stroke={MAQUINA} strokeWidth="12" />
          <path d="M1287 732H1313L1309 758L1285 754Z" fill={MAQUINA_OSC} />
        </Capa>

        {/* Terreno, horizonte y vía de acceso */}
        <rect y="760" width="1600" height="240" fill={TINTA} />
        <path d="M0 760H1600" stroke={AMARILLO} strokeWidth="2" opacity="0.4" />
        <rect y="790" width="1600" height="56" fill="#131315" />
        <path
          d="M0 818H1600"
          stroke={AMARILLO}
          strokeWidth="2"
          strokeDasharray="40 34"
          opacity="0.16"
        />

        {/* Estacas con cinta: el lote del amanecer */}
        <g>
          <path
            d="M930 788V762M1030 788V762M1130 788V762M1230 788V762"
            stroke={MADERA}
            strokeWidth="4"
          />
          <path
            d="M930 768H1230"
            stroke={AMARILLO}
            strokeWidth="3"
            strokeDasharray="16 10"
            opacity="0.8"
          />
        </g>

        {/* Minicargador (nivela y despeja la vía) */}
        <Capa id="minicargador" efecto={{ tipo: "entra", d: 220 }}>
          <rect x="1440" y="800" width="60" height="26" fill={MAQUINA} />
          <rect x="1452" y="778" width="30" height="22" fill={SILUETA} />
          <rect x="1414" y="812" width="26" height="16" fill={MAQUINA_OSC} />
          <g fill={SILUETA} stroke={AMARILLO} strokeOpacity="0.35" strokeWidth="2">
            <circle cx="1452" cy="830" r="10" />
            <circle cx="1490" cy="830" r="10" />
          </g>
        </Capa>

        {/* Volqueta: llega por la vía y bascula el platón */}
        <Capa id="volqueta" efecto={{ tipo: "entra", d: 560 }}>
          <rect x="1150" y="818" width="230" height="10" fill={SILUETA} />
          <rect x="1150" y="780" width="46" height="38" fill={MAQUINA} />
          <rect x="1154" y="786" width="16" height="18" fill={VIDRIO} />
          <Capa id="platon" efecto={{ tipo: "gira", origen: [1378, 818], desde: 0, hasta: 24 }}>
            <rect x="1202" y="784" width="176" height="34" fill={MAQUINA} />
            <path d="M1202 784H1378" stroke={AMARILLO} strokeOpacity="0.5" strokeWidth="2" />
          </Capa>
          <g fill={SILUETA} stroke={AMARILLO} strokeOpacity="0.35" strokeWidth="2">
            {[1176, 1300, 1350].map((x) => (
              <circle key={x} cx={x} cy="832" r="12" />
            ))}
          </g>
        </Capa>
      </g>
    </svg>
  );
}
