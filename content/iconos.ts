/** Identificadores del set de iconos propio (components/icons). */
export const iconos = [
  "excavadora",
  "retroexcavadora",
  "minicargador",
  "volqueta",
  "grua",
  "camabaja",
  "puntal",
  "correa",
  "encofrado",
  "andamio",
  "generador",
  "compresor",
  "mezcladora",
  "pluma",
  "engranaje",
] as const;

export type IconoId = (typeof iconos)[number];
