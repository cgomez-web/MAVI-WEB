/**
 * Estado compartido entre el DOM y la escena, sin pasar por React (cero re-renders por scroll).
 * El cliente escribe; la escena lee en cada fotograma.
 */
export interface EstadoEscena {
  /** Progreso objetivo según el scroll (0–1). */
  objetivo: number;
  /** Puntero normalizado (-1..1). Con puntero fino sigue al ratón; en táctil lo mueve el scroll del hero. */
  puntero: { x: number; y: number };
  /** Escritorio ancho: la acción se compone a la derecha del texto. */
  ancho: boolean;
  /** Pantalla más alta que ancha: toma más abierta y acción en el tercio superior de cada ventana. */
  vertical: boolean;
  /** Dónde (0 arriba → 1 abajo) debe quedar el centro de la toma: sigue a la ventana visible. */
  foco: number;
  /** Calidad: 1 normal, 0 reducida (sin sombras, DPR 1). */
  calidad: 0 | 1;
  /** Colocar cámara, progreso y encuadre sin transición en el siguiente fotograma (diagnóstico). */
  saltar: boolean;
}

export function crearEstado(): EstadoEscena {
  return {
    objetivo: 0,
    puntero: { x: 0, y: 0 },
    ancho: false,
    vertical: false,
    foco: 0.5,
    calidad: 1,
    saltar: false,
  };
}
