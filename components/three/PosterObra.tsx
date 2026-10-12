import { rutaEngranaje } from "@/components/brand/Logo";

/**
 * Póster estático de la escena (fallback 2D y estado mientras carga el 3D).
 * Composición: cielo de hora dorada, terreno, engranaje MAVI y siluetas de equipos de obra.
 * SVG puro: < 4 kB, sin peticiones.
 */
export function PosterObra({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="poster-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B0B0C" />
          <stop offset="0.55" stopColor="#2a1a08" />
          <stop offset="0.78" stopColor="#7a4a06" />
          <stop offset="0.86" stopColor="#c98a05" />
        </linearGradient>
        <radialGradient id="poster-sol" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FCBF06" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FCBF06" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#poster-cielo)" />
      <circle cx="1180" cy="700" r="260" fill="url(#poster-sol)" />
      {/* Engranaje lejano */}
      <g opacity="0.16">
        <path
          d={rutaEngranaje(1180, 520, 300, 262, 16)}
          fill="none"
          stroke="#FCBF06"
          strokeWidth="6"
        />
        <circle cx="1180" cy="520" r="200" fill="none" stroke="#FCBF06" strokeWidth="3" />
      </g>
      {/* Andamio y estructura en contraluz */}
      <g fill="none" stroke="#0B0B0C" strokeWidth="7" strokeLinecap="square">
        <path d="M1240 760V430 M1330 760V430 M1420 760V430 M1240 430h180 M1240 540h180 M1240 650h180 M1240 540l90 110 M1330 540l90 110 M1240 430l90 110 M1330 430l90 110" />
        {/* Grúa */}
        <path d="M980 760V250 M960 270h420 M980 300l60-50 M1340 270v170" />
        <path d="M1325 440h30l-15 22z" fill="#0B0B0C" />
      </g>
      {/* Excavadora */}
      <g fill="#0B0B0C">
        <path d="M640 760h300v34H640z" />
        <path d="M670 760V690h220v70z" />
        <path d="M740 690v-80h110l26 80z" />
        <path d="M880 700l120-150 14 10-108 150z" />
        <path d="M1000 550l110 95-14 14-110-92z" />
        <path d="M1100 640l30 60h-72l-10-38z" />
      </g>
      {/* Terreno */}
      <path d="M0 780 L1600 740 L1600 900 L0 900 Z" fill="#0B0B0C" />
      <path d="M0 780 L1600 740" stroke="#FCBF06" strokeWidth="3" opacity="0.65" />
      {/* Estacas con cinta */}
      <g stroke="#FCBF06" strokeWidth="4">
        <path d="M180 800v-60 M330 796v-60 M480 792v-60" />
        <path d="M180 752L480 744" strokeDasharray="18 12" />
      </g>
    </svg>
  );
}
