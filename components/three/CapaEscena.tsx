import { PosterObra } from "./PosterObra";
import { EscenaCliente } from "./EscenaCliente";
import { VelosTexto } from "./VelosTexto";

/**
 * Capa de fondo persistente del home: póster 2D por capas (fallback, siempre presente) y, encima,
 * la escena 3D en carga diferida cuando el dispositivo lo permite. `aria-hidden`: la descripción
 * textual equivalente está en el hero.
 *
 * Contraste: los velos fijos de esta capa solo dan ambiente (y oscurecen la franja de la cabecera
 * transparente, que es fija como ellos). El contraste de cada texto que flota sobre la escena lo
 * garantizan los velos de texto (VelosTexto), que se mueven con él.
 */
export function CapaEscena() {
  return (
    <>
      <div
        aria-hidden="true"
        className="bg-ink pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <PosterObra />
        <EscenaCliente />
        {/* Franja de la cabecera: su texto (p. ej. el conmutador en gris concreto) exige casi negro. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgb(11 11 12 / 0.9) 0, rgb(11 11 12 / 0.84) var(--header-h), rgb(11 11 12 / 0) calc(var(--header-h) + 14svh))",
          }}
        />
        {/* Ambiente: la base de la pantalla y, en escritorio, la columna del texto, en penumbra. */}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_11_12/0.55)_0%,rgb(11_11_12/0.2)_20%,rgb(11_11_12/0)_42%)]" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgb(11_11_12/0.55)_0%,rgb(11_11_12/0)_48%)] md:block" />
      </div>
      <VelosTexto />
    </>
  );
}
