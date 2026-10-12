import type { IconoId } from "@/content/iconos";
import { rutaEngranaje } from "@/components/brand/Logo";

/**
 * Set de iconos propio: retícula 48, trazo 3 px, terminaciones y uniones rectas,
 * coherente con el engranaje del logo. Sin librerías de iconos.
 */
const TRAZOS: Record<IconoId, string> = {
  excavadora: "M4 34h26v8H4z M8 34V24h18v10 M14 24v-8h9l3 8 M26 27l10-15 8 10 M44 22l2 8h-8l-2-6",
  retroexcavadora: "M2 22h7v10 M9 30h27v-8H22v-9H12v17 M36 22l5-10 5 8-4 5",
  minicargador: "M8 33h28V21H24l-4-9h-8v21 M36 25l6 5v6h-7",
  volqueta: "M30 20h8l6 8v6H30z M4 14l24 4v12H4z M4 34h40",
  grua: "M4 32h30v4H4z M10 30L38 6 M38 6v16 M35 22h6l-3 4 M24 30v-7",
  camabaja: "M2 34h44 M36 22h8v12h-8 M4 30h32 M12 22h16v8H12z",
  puntal: "M18 6v36 M30 6v36 M12 42h12 M24 42h12 M12 6h12 M24 6h12 M14 20h8 M26 26h8",
  correa: "M4 16h40v14H4z M4 23h40 M10 16v14 M38 16v14",
  encofrado: "M8 6h32v36H8z M8 18h32 M8 30h32 M24 6v36",
  andamio: "M8 4v40 M40 4v40 M8 14h32 M8 28h32 M8 42h32 M8 14l32 14 M40 28L8 42",
  generador: "M6 14h36v22H6z M12 20v10 M17 20v10 M22 20v10 M30 20h6v6h-6z M8 36v6 M40 36v6",
  compresor: "M8 18h28v14H8z M14 18v-8h12v8 M36 25h6v-9 M4 40h40",
  mezcladora: "M10 12l18-5 10 14-13 12-12-8z M24 33l-8 9 M24 33l10 9 M12 42h26",
  pluma: "M14 42V8 M14 10h26 M38 10v18 M35 28h6l-3 4 M6 42h16 M14 24l14-14",
  engranaje: "",
};

const RUEDAS: Partial<Record<IconoId, Array<[number, number, number]>>> = {
  retroexcavadora: [
    [14, 37, 5],
    [33, 37, 5],
  ],
  minicargador: [
    [14, 38, 4],
    [30, 38, 4],
  ],
  volqueta: [
    [10, 38, 4],
    [22, 38, 4],
    [37, 38, 4],
  ],
  grua: [
    [9, 40, 3],
    [27, 40, 3],
  ],
  camabaja: [
    [8, 39, 3],
    [16, 39, 3],
    [40, 39, 3],
  ],
  compresor: [
    [13, 37, 3],
    [31, 37, 3],
  ],
  pluma: [[14, 32, 4]],
};

interface PropsIcono {
  id: IconoId;
  className?: string;
  /** Si se pasa, el icono es significativo; si no, es decorativo (aria-hidden). */
  titulo?: string;
}

export function Icono({ id, className, titulo }: PropsIcono) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      {id === "engranaje" ? (
        <>
          <path d={rutaEngranaje(24, 24, 21, 16, 10)} />
          <circle cx="24" cy="24" r="6" />
        </>
      ) : (
        <path d={TRAZOS[id]} />
      )}
      {RUEDAS[id]?.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
    </svg>
  );
}
