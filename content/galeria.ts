/**
 * Galería "Inventario real". Fuente: fotos originales en la carpeta superior (E:\PAGINA WEB),
 * procesadas por `pnpm images` (scripts/process-images.ts) hacia public/img/bodega/.
 *
 * - `recorte`: rectángulo en píxeles del original que se conserva.
 * - `parches`: rectángulos (coordenadas del original) que se cubren con un parche opaco del color
 *   circundante. Se usan para eliminar por completo rótulos pintados de OTRA empresa (decisión del
 *   dueño: ese nombre no puede aparecer en el sitio) y datos personales. No basta con difuminar.
 * - `publicar: false` oculta la foto sin borrarla.
 * - El ORDEN importa: la primera foto de cada categoría es la foto principal de su línea de servicio
 *   (grande, 4/5) en el home y en /servicios/<línea>; las tres primeras salen en el bloque de la línea.
 *
 * Para añadir una foto: agregue una entrada, ejecute `pnpm images` y revise el resultado.
 */
import type { CategoriaGaleria } from "./servicios";

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface FotoGaleria {
  id: string;
  /** Nombre del archivo original en la carpeta de activos. */
  original: string;
  categoria: CategoriaGaleria;
  titulo: string;
  alt: string;
  enObra?: boolean;
  recorte?: Rect;
  parches?: Rect[];
  publicar: boolean;
}

export { categoriasGaleria } from "./categorias";

export const fotosGaleria: FotoGaleria[] = [
  {
    id: "plumas-de-cargue-01",
    original: "photo_2026-10-08_10-18-16.jpg",
    categoria: "otros",
    titulo: "Plumas de cargue",
    alt: "Fila de plumas de cargue con malacates azules y tambor de cable, montadas sobre bases rojas en la bodega.",
    publicar: true,
  },
  {
    id: "andamio-tubular-en-obra-01",
    original: "photo_2026-10-08_10-18-19.jpg",
    categoria: "andamiaje",
    titulo: "Andamio tubular en obra",
    alt: "Andamio tubular armado alrededor de una estructura de concreto en obra, con trabajadores con casco al fondo.",
    enObra: true,
    publicar: true,
  },
  {
    id: "herramienta-rotomartillo-01",
    original: "photo_2026-10-08_10-18-36.jpg",
    categoria: "otros",
    titulo: "Rotomartillo eléctrico",
    alt: "Rotomartillo eléctrico con mango lateral sobre un piso de baldosa.",
    // Se recorta la placa de un vehículo (arriba), el pie del fotógrafo y la marca de agua (abajo).
    recorte: { x: 0, y: 262, ancho: 576, alto: 632 },
    publicar: true,
  },
  {
    id: "andamio-de-fachada-01",
    original: "photo_2026-10-08_10-18-39.jpg",
    categoria: "andamiaje",
    titulo: "Andamio de fachada",
    alt: "Andamio de marco rojo armado a lo largo de la fachada de una edificación en construcción.",
    enObra: true,
    publicar: true,
  },
  {
    id: "compactador-de-placa-01",
    original: "photo_2026-10-08_10-18-42.jpg",
    categoria: "otros",
    titulo: "Compactador de placa",
    alt: "Compactador de placa con motor a gasolina en el pasillo de la bodega, con un apisonador detrás.",
    publicar: true,
  },
  {
    id: "apisonador-canguro-01",
    original: "photo_2026-10-08_10-18-45.jpg",
    categoria: "otros",
    titulo: "Apisonador tipo canguro",
    alt: "Apisonador tipo canguro azul con zapata metálica, listo para compactar.",
    publicar: true,
  },
  {
    id: "compresor-remolcable-01",
    original: "photo_2026-10-08_10-18-49.jpg",
    categoria: "otros",
    titulo: "Compresor remolcable",
    alt: "Compresor de aire remolcable con chasis y rueda, estacionado en la bodega frente a formaletas apiladas.",
    // Rótulos pintados de otra empresa (lado oscuro y lado azul), calcomanía de distribuidor y adhesivo superior.
    parches: [
      { x: 316, y: 92, ancho: 72, alto: 132 },
      { x: 606, y: 192, ancho: 124, alto: 102 },
      { x: 538, y: 136, ancho: 106, alto: 62 },
      { x: 403, y: 53, ancho: 60, alto: 47 },
    ],
    publicar: true,
  },
  {
    id: "puntales-metalicos-01",
    original: "photo_2026-10-08_10-18-53.jpg",
    categoria: "losas",
    titulo: "Puntales metálicos",
    alt: "Lote de puntales metálicos telescópicos recostados contra el muro de la bodega.",
    publicar: true,
  },
  {
    id: "andamios-de-marco-01",
    original: "photo_2026-10-08_10-18-57.jpg",
    categoria: "andamiaje",
    titulo: "Cuerpos de andamio",
    alt: "Cuerpos de andamio de marco rojos apilados, con formaletas de madera detrás.",
    // Se recorta el equipo de otra empresa que aparece a la izquierda.
    recorte: { x: 166, y: 0, ancho: 794, alto: 1280 },
    publicar: true,
  },
  {
    id: "mezcladora-de-concreto-01",
    original: "photo_2026-10-08_10-19-00.jpg",
    categoria: "otros",
    titulo: "Mezcladora de concreto",
    alt: "Mezcladora de concreto roja con volante y ruedas, rodeada de puntales y tableros.",
    // Rótulo de otra empresa en el gabinete azul del fondo.
    parches: [{ x: 718, y: 498, ancho: 96, alto: 116 }],
    publicar: true,
  },
  {
    id: "plumas-de-cargue-02",
    original: "photo_2026-10-08_10-19-03.jpg",
    categoria: "otros",
    titulo: "Plumas de cargue en estantería",
    alt: "Plumas de cargue almacenadas en dos niveles de estantería bajo la cubierta de la bodega.",
    publicar: true,
  },
  {
    id: "equipos-de-izaje-01",
    original: "photo_2026-10-08_10-19-07.jpg",
    categoria: "otros",
    titulo: "Equipos de izaje",
    // TODO(owner): confirmar la identificación exacta de este equipo.
    alt: "Equipos de izaje con estructura roja, motor y mangueras, guardados en la bodega.",
    // Rótulo de otra empresa en la caja superior.
    parches: [{ x: 503, y: 146, ancho: 112, alto: 116 }],
    publicar: true,
  },
  {
    // Camisas metálicas partidas de unos 30 cm, con placa base y pernos de cierre: el molde de los
    // cilindros de ensayo del concreto, no formaleta. Por eso van en "otros" y no en "encofrados".
    id: "moldes-cilindricos-01",
    original: "photo_2026-10-08_10-19-10.jpg",
    categoria: "otros",
    titulo: "Moldes para cilindros de concreto",
    // TODO(owner): confirmar que son moldes para cilindros de ensayo y si se alquilan.
    alt: "Moldes metálicos partidos para cilindros de concreto, con placa base y pernos de cierre, alineados sobre un estante.",
    publicar: true,
  },
  {
    // Antes figuraba como "andamios en bodega", pero la foto NO muestra andamios: muestra un carrete
    // y caballetes hechos en varilla corrugada.
    id: "carretes-de-varilla-01",
    original: "photo_2026-10-08_10-19-12.jpg",
    categoria: "otros",
    titulo: "Carretes y estructuras de varilla",
    // TODO(owner): confirmar qué equipo es y si se alquila (si no, poner `publicar: false`).
    alt: "Carrete hecho en varilla corrugada sobre su base, con caballetes y más estructuras de varilla apiladas al fondo de la bodega, junto a una mezcladora.",
    // Folleto impreso en el piso.
    parches: [{ x: 276, y: 922, ancho: 132, alto: 100 }],
    publicar: true,
  },
  {
    id: "plumas-de-cargue-03",
    original: "photo_2026-10-08_10-19-15.jpg",
    categoria: "otros",
    titulo: "Inventario de plumas de cargue",
    alt: "Vista amplia de la estantería con decenas de plumas de cargue ordenadas en la bodega.",
    publicar: true,
  },
  {
    // Primera de "encofrados": es la foto principal (4/5) de esa línea en el home y en su página.
    id: "formaletas-metalicas-01",
    original: "photo_2026-10-08_10-19-40.jpg",
    categoria: "encofrados",
    titulo: "Formaletas metálicas",
    alt: "Pilas de formaletas metálicas perforadas, ordenadas en la bodega.",
    publicar: true,
  },
  {
    id: "esquineros-de-formaleta-01",
    original: "photo_2026-10-08_10-19-21.jpg",
    categoria: "encofrados",
    titulo: "Esquineros de formaleta",
    alt: "Esquineros metálicos de formaleta apilados en estantería, con paneles perforados debajo.",
    publicar: true,
  },
  {
    id: "formaletas-metalicas-02",
    original: "photo_2026-10-08_10-19-29.jpg",
    categoria: "encofrados",
    titulo: "Formaletas en estantería",
    alt: "Formaletas metálicas perforadas apiladas en una estantería metálica, vista frontal.",
    publicar: true,
  },
  {
    id: "formaletas-metalicas-03",
    original: "photo_2026-10-08_10-19-33.jpg",
    categoria: "encofrados",
    titulo: "Formaletas y esquineros",
    alt: "Formaletas y esquineros metálicos en estantería, con una escalera al costado.",
    publicar: true,
  },
  {
    id: "tableros-01",
    original: "photo_2026-10-08_10-19-36.jpg",
    categoria: "losas",
    titulo: "Tableros",
    alt: "Tableros metálicos rojos y azules apilados sobre tableros amarillos en la bodega.",
    // Trazos pintados a mano en los cantos (precaución).
    parches: [
      { x: 338, y: 246, ancho: 84, alto: 24 },
      { x: 598, y: 244, ancho: 94, alto: 24 },
    ],
    publicar: true,
  },
  {
    id: "puntales-metalicos-02",
    original: "photo_2026-10-08_10-19-45.jpg",
    categoria: "losas",
    titulo: "Puntales telescópicos",
    alt: "Puntales telescópicos rojo y azul con sus pasadores, apilados y vistos desde arriba.",
    publicar: true,
  },
  {
    id: "allanadora-de-concreto-01",
    original: "photo_2026-10-08_10-19-48.jpg",
    categoria: "otros",
    titulo: "Allanadora de concreto",
    alt: "Allanadora mecánica de concreto con motor a gasolina y aro de protección, sobre el piso de la bodega.",
    publicar: true,
  },
];
