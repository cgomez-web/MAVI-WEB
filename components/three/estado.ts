/**
 * Estado compartido entre el DOM y la escena, sin pasar por React (cero re-renders por scroll).
 * El cliente escribe; la escena lee en cada fotograma.
 */
export interface EstadoEscena {
  /** Progreso objetivo según el scroll (0–1). */
  objetivo: number;
  /** Puntero normalizado (-1..1), solo con puntero fino. */
  puntero: { x: number; y: number };
  /** Escritorio ancho: la acción se compone a la derecha del texto. */
  ancho: boolean;
  /** Calidad: 1 normal, 0 reducida (sin sombras, DPR 1). */
  calidad: 0 | 1;
}

export function crearEstado(): EstadoEscena {
  return { objetivo: 0, puntero: { x: 0, y: 0 }, ancho: false, calidad: 1 };
}
