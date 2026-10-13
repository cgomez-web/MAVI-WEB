"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { home } from "@/content/home";
import { categoriasGaleria } from "@/content/categorias";
import type { CategoriaGaleria } from "@/content/servicios";
import { mensajeWhatsApp, urlWhatsApp } from "@/content/contacto";
import { textosGaleria as tg } from "@/content/interfaz";
import { avisoPestanaNueva } from "@/content/navegacion";
import { srcSet, srcPorDefecto, type FotoCliente } from "@/lib/imagenes";
import { FotoBodega } from "@/components/ui/FotoBodega";
import { movimientoPermitido } from "@/lib/preferencias";

type Filtro = CategoriaGaleria | "todo";

export function Inventario({ fotos }: { fotos: FotoCliente[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const [abierta, setAbierta] = useState<number | null>(null);
  const pista = useRef<HTMLUListElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const disparador = useRef<HTMLButtonElement | null>(null);
  const arrastre = useRef({ activo: false, x: 0, inicio: 0, v: 0, t: 0, movido: false, raf: 0 });

  const visibles = useMemo(
    () => (filtro === "todo" ? fotos : fotos.filter((f) => f.categoria === filtro)),
    [filtro, fotos],
  );
  const conteos = useMemo(() => {
    const c = new Map<CategoriaGaleria, number>();
    for (const f of fotos) c.set(f.categoria, (c.get(f.categoria) ?? 0) + 1);
    return c;
  }, [fotos]);

  // Al cambiar de filtro, la pista vuelve al inicio.
  useEffect(() => {
    pista.current?.scrollTo({ left: 0 });
  }, [filtro]);

  /*
   * ── Arrastre con inercia (solo ratón; en táctil se usa el desplazamiento nativo) ──
   * El scroll-snap de la pista solo se activa con puntero grueso (pointer-coarse:): con ratón, el
   * navegador reajustaría al punto de snap cada `scrollLeft` que escribe el arrastre o la inercia,
   * y la galería se trabaría y luego saltaría una foto entera.
   */
  const alPresionar = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !pista.current) return;
    const a = arrastre.current;
    cancelAnimationFrame(a.raf);
    a.activo = true;
    a.movido = false;
    a.x = e.clientX;
    a.inicio = pista.current.scrollLeft;
    a.v = 0;
    a.t = performance.now();
  };

  const alMover = (e: React.PointerEvent<HTMLUListElement>) => {
    const a = arrastre.current;
    if (!a.activo || !pista.current) return;
    const dx = e.clientX - a.x;
    if (Math.abs(dx) > 5 && !a.movido) {
      a.movido = true;
      pista.current.setPointerCapture(e.pointerId);
      // Que el gesto no vaya seleccionando los títulos de las fotos.
      pista.current.style.userSelect = "none";
      window.getSelection()?.removeAllRanges();
    }
    if (!a.movido) return;
    const ahora = performance.now();
    const nuevo = a.inicio - dx;
    a.v = (nuevo - pista.current.scrollLeft) / Math.max(1, ahora - a.t);
    a.t = ahora;
    pista.current.scrollLeft = nuevo;
  };

  const alSoltar = (e: React.PointerEvent<HTMLUListElement>) => {
    const a = arrastre.current;
    if (!a.activo) return;
    a.activo = false;
    if (pista.current?.hasPointerCapture(e.pointerId))
      pista.current.releasePointerCapture(e.pointerId);
    if (pista.current) pista.current.style.userSelect = "";
    if (!a.movido || !movimientoPermitido()) return;
    let v = a.v * 16; // px por fotograma
    const inercia = () => {
      if (!pista.current || Math.abs(v) < 0.4) return;
      pista.current.scrollLeft += v;
      v *= 0.92;
      a.raf = requestAnimationFrame(inercia);
    };
    a.raf = requestAnimationFrame(inercia);
  };

  // Evita abrir el lightbox al terminar un arrastre.
  const alClicCaptura = (e: React.MouseEvent) => {
    if (arrastre.current.movido) {
      e.preventDefault();
      e.stopPropagation();
      arrastre.current.movido = false;
    }
  };

  const desplazar = (dir: 1 | -1) => {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({
      left: dir * el.clientWidth * 0.8,
      behavior: movimientoPermitido() ? "smooth" : "auto",
    });
  };

  /* ── Lightbox ── */
  const abrir = (i: number, boton: HTMLButtonElement) => {
    disparador.current = boton;
    setAbierta(i);
  };

  const cerrar = useCallback(() => {
    dialogo.current?.close();
  }, []);

  /*
   * Cierre al pulsar fuera: solo cuenta un gesto que empieza Y termina fuera de la foto, su pie y
   * los controles. Si empezara dentro (p. ej. seleccionando la descripción del pie) y se soltara
   * fuera, el `click` llegaría al ancestro común y cerraría el lightbox perdiendo la selección.
   */
  const gestoFuera = useRef({ inicio: false, fin: false });
  const fueraDelContenido = (t: EventTarget | null, d: Element) =>
    t instanceof Element && (t === d || !t.closest("img, figcaption, button, a"));

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta !== null && !d.open) d.showModal();
  }, [abierta]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    const alCerrar = () => {
      setAbierta(null);
      disparador.current?.focus();
    };
    d.addEventListener("close", alCerrar);
    return () => d.removeEventListener("close", alCerrar);
  }, []);

  const mover = useCallback(
    (dir: 1 | -1) =>
      setAbierta((i) => (i === null ? i : (i + dir + visibles.length) % visibles.length)),
    [visibles.length],
  );

  const actual = abierta !== null ? visibles[abierta] : undefined;

  return (
    <section
      id="inventario"
      aria-labelledby="titulo-inventario"
      className="con-grano bg-ink relative py-24 md:py-32"
      data-revelar="cinta"
      data-whatsapp={home.inventario.mensajeWhatsApp}
    >
      <div className="revelar-contenido">
        <div className="reticula items-end gap-y-6">
          <p className="mono-etiqueta text-brand-yellow col-span-12 md:col-span-3">
            {home.inventario.eyebrow}
          </p>
          <h2
            id="titulo-inventario"
            className="text-5 col-span-12 uppercase [font-stretch:90%] md:col-span-9"
          >
            {home.inventario.titular}
          </h2>
          <p className="text-2 text-concrete-light col-span-12 max-w-[52ch] md:col-span-6 md:col-start-4">
            {home.inventario.texto}
          </p>
        </div>

        <div className="reticula mt-12 gap-y-4">
          <div
            role="group"
            aria-label={tg.filtrar}
            className="col-span-12 flex flex-wrap gap-2 md:col-span-9"
          >
            {(["todo", ...Object.keys(categoriasGaleria)] as Filtro[]).map((c) => {
              const activo = filtro === c;
              const n = c === "todo" ? fotos.length : (conteos.get(c) ?? 0);
              if (n === 0) return null;
              const etiqueta = c === "todo" ? home.inventario.todos : categoriasGaleria[c];
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setFiltro(c)}
                  className={`mono-etiqueta border-2 px-3 py-2 transition-colors duration-[var(--dur-micro)] ${
                    activo
                      ? "border-brand-yellow bg-brand-yellow text-ink"
                      : "border-line text-bone hover:border-bone"
                  }`}
                >
                  {/* El nombre accesible contiene el texto visible (2.5.3): «Andamiaje 3 fotos». */}
                  {etiqueta} <span className="cifras ml-1 opacity-70">{n}</span>
                  <span className="solo-lectores"> {tg.conteo(n).replace(/^\d+\s*/, "")}</span>
                </button>
              );
            })}
          </div>
          <div className="col-span-12 flex items-center justify-end gap-2 md:col-span-3">
            <button
              type="button"
              onClick={() => desplazar(-1)}
              className="boton boton-secundario h-12 w-12 justify-center p-0"
              aria-label={tg.fotosAnteriores}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              onClick={() => desplazar(1)}
              className="boton boton-secundario h-12 w-12 justify-center p-0"
              aria-label={tg.fotosSiguientes}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className="mono-etiqueta text-concrete col-span-12" aria-live="polite">
            {`${tg.conteo(visibles.length)} · ${home.inventario.ayudaArrastre}`}
          </p>
        </div>

        <ul
          ref={pista}
          className="mt-8 flex scroll-px-[var(--margin)] [scrollbar-width:thin] [scrollbar-color:var(--color-concrete-dark)_transparent] gap-[var(--gutter)] overflow-x-auto px-[var(--margin)] pb-6 pointer-coarse:snap-x pointer-coarse:snap-proximity"
          data-cursor="gancho"
          aria-label={tg.pista}
          onPointerDown={alPresionar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onClickCapture={alClicCaptura}
        >
          {visibles.map((f, i) => {
            const ratio = f.ancho / f.alto;
            return (
              <li
                key={f.id}
                className="shrink-0 snap-start"
                style={{ width: `min(calc(var(--alto-galeria) * ${ratio.toFixed(3)}), 86vw)` }}
              >
                <button
                  type="button"
                  className="group block w-full text-left"
                  data-cursor="mas"
                  onClick={(e) => abrir(i, e.currentTarget)}
                  aria-label={tg.ampliar(f.titulo)}
                  draggable={false}
                >
                  <FotoBodega
                    foto={f}
                    sizes="(min-width: 1024px) 40vw, 86vw"
                    duotono
                    className="pointer-events-none select-none"
                  />
                </button>
                <p className="mt-3 flex items-baseline justify-between gap-4">
                  <span className="font-display text-1 font-bold uppercase [font-stretch:80%]">
                    {f.titulo}
                  </span>
                  <span className="mono-etiqueta text-concrete">
                    {categoriasGaleria[f.categoria]}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-lightbox"
        // overscroll-contain: sin Lenis (táctil, movimiento reducido o «Animaciones» apagado) la rueda
        // sobre el visor ya no arrastra la página de atrás.
        className="bg-ink/97 text-bone backdrop:bg-ink/90 m-0 h-[100dvh] max-h-none w-full max-w-none overscroll-contain p-0"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") mover(1);
          if (e.key === "ArrowLeft") mover(-1);
        }}
        onPointerDown={(e) => {
          gestoFuera.current = { inicio: fueraDelContenido(e.target, e.currentTarget), fin: false };
        }}
        onPointerUp={(e) => {
          gestoFuera.current.fin = fueraDelContenido(e.target, e.currentTarget);
        }}
        onClick={(e) => {
          // El <dialog> ocupa toda la pantalla, así que el ::backdrop nunca recibe el clic: se cierra
          // con un clic que empiece y termine fuera de la foto, su pie o un control.
          const { inicio, fin } = gestoFuera.current;
          gestoFuera.current = { inicio: false, fin: false };
          if (inicio && fin && fueraDelContenido(e.target, e.currentTarget)) cerrar();
        }}
      >
        {actual ? (
          <div className="flex h-full flex-col gap-4 p-4 md:p-8">
            <div className="flex items-center justify-between gap-4">
              {/* Región viva: el <p> se conserva entre fotos y solo cambia su texto, así que cada
                  cambio con las flechas o los botones se anuncia completo (posición, línea y título). */}
              <p
                className="mono-etiqueta text-concrete-light"
                aria-live="polite"
                aria-atomic="true"
              >
                {String((abierta ?? 0) + 1).padStart(2, "0")} /{" "}
                {String(visibles.length).padStart(2, "0")} · {categoriasGaleria[actual.categoria]}
                <span className="solo-lectores">: {actual.titulo}</span>
              </p>
              <button
                type="button"
                onClick={cerrar}
                className="boton boton-secundario min-h-11 px-4 py-2"
                autoFocus
              >
                {tg.cerrar} <span aria-hidden="true">✕</span>
              </button>
            </div>
            <figure className="flex min-h-0 flex-1 flex-col items-center justify-center">
              <picture className="flex min-h-0 flex-1 items-center justify-center">
                <source type="image/avif" srcSet={srcSet(actual, "avif")} sizes="92vw" />
                <source type="image/webp" srcSet={srcSet(actual, "webp")} sizes="92vw" />
                <img
                  src={srcPorDefecto(actual)}
                  alt={actual.alt}
                  width={actual.ancho}
                  height={actual.alto}
                  className="border-line h-auto max-h-full w-auto max-w-full border-2 object-contain"
                />
              </picture>
              <figcaption className="mt-4 text-center">
                <span
                  id="titulo-lightbox"
                  className="font-display text-3 block font-extrabold uppercase [font-stretch:80%]"
                >
                  {actual.titulo}
                </span>
                {/* Repite el alt de la imagen: visible para quien ve, oculto al lector de pantalla. */}
                <span
                  aria-hidden="true"
                  className="text-0 text-concrete-light mt-1 block max-w-[60ch]"
                >
                  {actual.alt}
                </span>
              </figcaption>
            </figure>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => mover(-1)}
                className="boton boton-secundario"
                aria-label={tg.fotoAnterior}
              >
                ← <span className="hidden sm:inline">{tg.anterior}</span>
              </button>
              <a
                href={urlWhatsApp(mensajeWhatsApp(actual.titulo))}
                target="_blank"
                rel="noopener noreferrer"
                className="boton boton-primario"
              >
                {tg.cotizar}
                <span className="solo-lectores">
                  {tg.porWhatsApp}
                  {avisoPestanaNueva}
                </span>
              </a>
              <button
                type="button"
                onClick={() => mover(1)}
                className="boton boton-secundario"
                aria-label={tg.fotoSiguiente}
              >
                <span className="hidden sm:inline">{tg.siguiente}</span> →
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
