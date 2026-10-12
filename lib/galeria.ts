import { fotosGaleria } from "@/content/galeria";
import generadas from "@/content/galeria.generated.json";
import type { CategoriaGaleria } from "@/content/servicios";
import type { FotoPublica } from "./imagenes";

export type { FotoPublica } from "./imagenes";

/** Fotos publicables que ya fueron procesadas por `pnpm images`. Úsese solo en componentes de servidor. */
export const fotosPublicas: FotoPublica[] = fotosGaleria
  .filter((f) => f.publicar)
  .flatMap((f) => {
    const g = generadas.find((x) => x.id === f.id);
    return g ? [{ ...f, ...g }] : [];
  });

export function fotosDeCategoria(categoria: CategoriaGaleria | undefined, limite?: number): FotoPublica[] {
  if (!categoria) return [];
  const lista = fotosPublicas.filter((f) => f.categoria === categoria);
  return typeof limite === "number" ? lista.slice(0, limite) : lista;
}
