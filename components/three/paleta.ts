import { Color } from "three";

/** Paleta de la escena (tokens de DISEÑO.md trasladados a 3D, en sRGB). */
export const PALETA = {
  amarillo: "#FCBF06",
  amarilloOscuro: "#D99A00",
  grafito: "#1A1A1C",
  tinta: "#0B0B0C",
  concreto: "#8A8A85",
  concretoClaro: "#A9A7A1",
  concretoFresco: "#5E5C58",
  rojoPuntal: "#C8321E",
  madera: "#C79A4B",
  tierra: "#4A3A2A",
  tierraOscura: "#2E241A",
  azulPluma: "#2B4FA6",
  vidrio: "#20262B",
  acero: "#6E6F72",
} as const;

/** Estados de luz del día (amanecer → mediodía → atardecer). Tonos cálidos: nada de cielos morados. */
export const CIELOS = {
  amanecer: {
    arriba: new Color("#16120E"),
    horizonte: new Color("#E08A1E"),
    suelo: new Color("#1E1810"),
    sol: new Color("#FFC870"),
  },
  dia: {
    arriba: new Color("#6B6355"),
    horizonte: new Color("#D8C6A6"),
    suelo: new Color("#2A241C"),
    sol: new Color("#FFF1D6"),
  },
  atardecer: {
    arriba: new Color("#120D0A"),
    horizonte: new Color("#D2561C"),
    suelo: new Color("#1A120C"),
    sol: new Color("#FF9A4A"),
  },
} as const;
