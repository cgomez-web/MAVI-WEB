import { PosterObra } from "./PosterObra";

/**
 * Capa de fondo persistente del home. En esta fase muestra el póster estático;
 * la escena 3D (carga diferida) se monta encima cuando el dispositivo lo permite.
 */
export function CapaEscena() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <PosterObra className="absolute inset-0 h-full w-full" />
      {/* Velos de tinta para garantizar contraste del texto sobre la escena. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_11_12/0.94)_0%,rgb(11_11_12/0.7)_42%,rgb(11_11_12/0)_78%)]" />
      <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgb(11_11_12/0.75)_0%,rgb(11_11_12/0)_55%)] md:block" />
    </div>
  );
}
