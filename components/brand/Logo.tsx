/**
 * Logo MAVI redibujado en SVG a partir del brochure (no se usa el JPG pixelado).
 * Letras construidas como polígonos sobre una retícula de 100 u de alto; la "A" conserva el
 * triángulo amarillo del logo original. El engranaje se genera por cálculo (12 dientes).
 */

const LETRAS = {
  M: "M0 100V0h22l18 38L58 0h22v100H60V42L46 70H34L20 42v58z",
  A: "M0 100L30 0h26l30 100H64l-6-20H28l-6 20z",
  A_HUECO: "M33 62l10-38 10 38z",
  V: "M0 0h22l18 66L58 0h22L52 100H28z",
  I: "M0 0h22v100H0z",
} as const;

/** Polígono de engranaje: dientes trapezoidales entre radio interior y exterior. */
export function rutaEngranaje(
  cx: number,
  cy: number,
  rExt: number,
  rInt: number,
  dientes: number,
): string {
  const paso = (Math.PI * 2) / dientes;
  const puntos: string[] = [];
  for (let i = 0; i < dientes; i++) {
    const a = i * paso - Math.PI / 2;
    const angulos: Array<[number, number]> = [
      [a - paso * 0.5, rInt],
      [a - paso * 0.22, rInt],
      [a - paso * 0.15, rExt],
      [a + paso * 0.15, rExt],
      [a + paso * 0.22, rInt],
    ];
    for (const [ang, r] of angulos) {
      puntos.push(`${(cx + Math.cos(ang) * r).toFixed(2)} ${(cy + Math.sin(ang) * r).toFixed(2)}`);
    }
  }
  return `M${puntos.join("L")}Z`;
}

interface PropsWordmark {
  className?: string;
  /** Color de las letras; la "A" siempre lleva el triángulo amarillo. */
  tono?: "hueso" | "tinta";
  /** Nombre accesible (p. ej. sitio.nombre). Sin él, o vacío, el wordmark es decorativo. */
  titulo?: string;
}

/**
 * Wordmark "MAVI" solo (para header y pie). Este archivo no importa content/: va en el JS de la
 * cabecera, así que los textos (nombre, lema) llegan como props desde quien lo pinta.
 */
export function WordmarkMavi({ className, tono = "hueso", titulo }: PropsWordmark) {
  const color = tono === "hueso" ? "var(--color-bone)" : "var(--color-ink)";
  // Con título vacío el wordmark es decorativo (el enlace contenedor ya tiene nombre accesible).
  const accesible = titulo
    ? { role: "img", "aria-label": titulo }
    : { "aria-hidden": true as const };
  return (
    <svg viewBox="0 0 292 100" className={className} {...accesible}>
      <g fill={color}>
        <path d={LETRAS.M} />
        <g transform="translate(88 0)">
          <path d={LETRAS.A} />
        </g>
        <g transform="translate(182 0)">
          <path d={LETRAS.V} />
        </g>
        <g transform="translate(270 0)">
          <path d={LETRAS.I} />
        </g>
      </g>
      <g transform="translate(88 0)">
        <path d={LETRAS.A_HUECO} fill="var(--color-brand-yellow)" />
      </g>
    </svg>
  );
}

/** Marca compacta: engranaje + M. Útil como favicon/isotipo. */
export function IsotipoMavi({ className, titulo }: { className?: string; titulo?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <path d={rutaEngranaje(50, 50, 49, 41, 12)} fill="var(--color-brand-yellow)" />
      <circle cx="50" cy="50" r="33" fill="var(--color-ink)" />
      <g transform="translate(30 32) scale(0.5 0.36)" fill="var(--color-bone)">
        <path d={LETRAS.M} />
      </g>
    </svg>
  );
}

/** Logo completo: engranaje que enmarca el wordmark, banda y lema (content/sitio.ts → nombre, lema). */
export function LogoCompleto({
  className,
  idTitulo = "logo-mavi",
  nombre,
  lema,
}: {
  className?: string;
  idTitulo?: string;
  nombre: string;
  lema: string;
}) {
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-labelledby={idTitulo}>
      <title id={idTitulo}>{`${nombre} — ${lema}`}</title>
      <path d={rutaEngranaje(200, 200, 196, 168, 16)} fill="var(--color-brand-yellow)" />
      <circle cx="200" cy="200" r="150" fill="var(--color-ink)" />
      <circle
        cx="200"
        cy="200"
        r="138"
        fill="none"
        stroke="var(--color-brand-yellow)"
        strokeWidth="4"
      />
      <g transform="translate(73 120) scale(0.87)">
        <g fill="var(--color-bone)">
          <path d={LETRAS.M} />
          <g transform="translate(88 0)">
            <path d={LETRAS.A} />
          </g>
          <g transform="translate(182 0)">
            <path d={LETRAS.V} />
          </g>
          <g transform="translate(270 0)">
            <path d={LETRAS.I} />
          </g>
        </g>
        <g transform="translate(88 0)">
          <path d={LETRAS.A_HUECO} fill="var(--color-brand-yellow)" />
        </g>
      </g>
      <path d="M52 228h296l-14 34H66z" fill="var(--color-brand-yellow)" />
      <text
        x="200"
        y="253"
        textAnchor="middle"
        // Ancho fijo: sin él la frase se sale de la banda si la fuente no aplica fontStretch.
        textLength="244"
        lengthAdjust="spacingAndGlyphs"
        fill="var(--color-ink)"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontStretch: "88%",
          fontSize: "22px",
          letterSpacing: "0.02em",
        }}
      >
        PROYECTOS E INVERSIONES
      </text>
      <text
        x="200"
        y="296"
        textAnchor="middle"
        fill="var(--color-bone)"
        style={{
          fontFamily: "var(--font-hanken)",
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: "19px",
        }}
      >
        {lema}
      </text>
    </svg>
  );
}
