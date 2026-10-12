"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { home } from "@/content/home";
import { categoriasGaleria } from "@/content/categorias";
import type { CategoriaGaleria } from "@/content/servicios";
import { mensajeWhatsApp, urlWhatsApp } from "@/content/contacto";
import { srcSet, srcPorDefecto, type FotoPublica } from "@/lib/imagenes";
import { FotoBodega } from "@/components/ui/FotoBodega";
import { movimientoPermitido } from "@/lib/preferencias";

type Filtro = CategoriaGaleria | "todo";

export function Inventario({ fotos }: { fotos: FotoPublica[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const [abierta, setAbierta] = useState<number | null>(null);
  const pista = useRef<HTMLUListElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const disparador = useRef<HTMLButtonElement | null>(null);
  const arrastre = useRef({ activo: false, x: 0, inicio: 0, v: 0, t: 0, movido: false, raf: 0 });

  const visibles = useMemo(() => (filtro === "todo" ? fotos : fotos.filter((f) => f.categoria === filtro)), [filtro, fotos]);
  const conteos = useMemo(() => {
    const c = new Map<CategoriaGaleria, number>();
    for (const f of fotos) c.set(f.categoria, (c.get(f.categoria) ?? 0) + 1);
    return c;
  }, [fotos]);

  // Al cambiar de filtro, la pista vuelve al inicio.
  useEffect(() => {
    pista.current?.scrollTo({ left: 0 });
  }, [filtro]);

  /* ── Arrastre con inercia (solo ratón; en táctil se usa el desplazamiento nativo) ── */
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
    if (pista.current?.hasPointerCapture(e.pointerId)) pista.current.releasePointerCapture(e.pointerId);
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
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: movimientoPermitido() ? "smooth" : "auto" });
  };

  /* ── Lightbox ── */
  const abrir = (i: number, boton: HTMLButtonElement) => {
    disparador.current = boton;
    setAbierta(i);
  };

  const cerrar = useCallback(() => {
    dialogo.current?.close();
  }, []);

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
    (dir: 1 | -1) => setAbierta((i) => (i === null ? i : (i + dir + visibles.length) % visibles.length)),
    [visibles.length],
  );

  const actual = abierta !== null ? visibles[abierta] : undefined;

  return (
    <section
      id="inventario"
      aria-labelledby="titulo-inventario"
      className="con-grano relative bg-ink py-24 md:py-32"
      data-revelar="cinta"
      data-whatsapp="Hola MAVI, vi su inventario en la web y quiero cotizar equipos para una obra en ___"
    >
      <div className="revelar-contenido">
        <div className="reticula items-end gap-y-6">
          <p className="mono-etiqueta col-span-12 text-brand-yellow md:col-span-3">{home.inventario.eyebrow}</p>
          <h2 id="titulo-inventario" className="col-span-12 text-5 uppercase [font-stretch:90%] md:col-span-9">
            {home.inventario.titular}
          </h2>
          <p className="col-span-12 max-w-[52ch] text-2 text-concrete-light md:col-span-6 md:col-start-4">{home.inventario.texto}</p>
        </div>

        <div className="reticula mt-12 gap-y-4">
          <div role="group" aria-label="Filtrar por línea" className="col-span-12 flex flex-wrap gap-2 md:col-span-9">
            {(["todo", ...Object.keys(categoriasGaleria)] as Filtro[]).map((c) => {
              const activo = filtro === c;
              const n = c === "todo" ? fotos.length : (conteos.get(c) ?? 0);
              if (n === 0) return null;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setFiltro(c)}
                  className={`mono-etiqueta border-2 px-3 py-2 transition-colors duration-[var(--dur-micro)] ${
                    activo ? "border-brand-yellow bg-brand-yellow text-ink" : "border-line text-bone hover:border-bone"
                  }`}
                >
                  {c === "todo" ? home.inventario.todos : categoriasGaleria[c]}
                  <span className="cifras ml-2 opacity-70">{String(n).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>
          <div className="col-span-12 flex items-center justify-end gap-2 md:col-span-3">
            <button type="button" onClick={() => desplazar(-1)} className="boton boton-secundario h-12 w-12 justify-center p-0" aria-label="Fotos anteriores">
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" onClick={() => desplazar(1)} className="boton boton-secundario h-12 w-12 justify-center p-0" aria-label="Fotos siguientes">
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className="mono-etiqueta col-span-12 text-concrete" aria-live="polite">
            {visibles.length} fotos · {home.inventario.ayudaArrastre}
          </p>
        </div>

        <ul
          ref={pista}
          className="mt-8 flex snap-x snap-proximity gap-[var(--gutter)] overflow-x-auto px-[var(--margin)] pb-6 [scrollbar-color:var(--color-concrete-dark)_transparent] [scrollbar-width:thin]"
          data-cursor="gancho"
          aria-label="Fotografías del inventario"
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
                  aria-label={`Ampliar: ${f.titulo}`}
                  draggable={false}
                >
                  <FotoBodega foto={f} sizes="(min-width: 1024px) 40vw, 86vw" duotono className="pointer-events-none select-none" />
                </button>
                <p className="mt-3 flex items-baseline justify-between gap-4">
                  <span className="font-display text-1 font-bold uppercase [font-stretch:80%]">{f.titulo}</span>
                  <span className="mono-etiqueta text-concrete">{categoriasGaleria[f.categoria]}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-lightbox"
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-ink/97 p-0 text-bone backdrop:bg-ink/90"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") mover(1);
          if (e.key === "ArrowLeft") mover(-1);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrar();
        }}
      >
        {actual ? (
          <div className="flex h-full flex-col gap-4 p-4 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="mono-etiqueta text-concrete-light">
                {String((abierta ?? 0) + 1).padStart(2, "0")} / {String(visibles.length).padStart(2, "0")} ·{" "}
                {categoriasGaleria[actual.categoria]}
              </p>
              <button type="button" onClick={cerrar} className="boton boton-secundario min-h-11 px-4 py-2" autoFocus>
                Cerrar <span aria-hidden="true">✕</span>
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
                  className="h-auto max-h-full w-auto max-w-full border-2 border-line object-contain"
                />
              </picture>
              <figcaption className="mt-4 text-center">
                <span id="titulo-lightbox" className="block font-display text-3 font-extrabold uppercase [font-stretch:80%]">
                  {actual.titulo}
                </span>
                <span className="mt-1 block max-w-[60ch] text-0 text-concrete-light">{actual.alt}</span>
              </figcaption>
            </figure>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => mover(-1)} className="boton boton-secundario" aria-label="Foto anterior">
                ← <span className="hidden sm:inline">Anterior</span>
              </button>
              <a
                href={urlWhatsApp(mensajeWhatsApp(actual.titulo))}
                target="_blank"
                rel="noopener noreferrer"
                className="boton boton-primario"
              >
                Cotizar este equipo
              </a>
              <button type="button" onClick={() => mover(1)} className="boton boton-secundario" aria-label="Foto siguiente">
                <span className="hidden sm:inline">Siguiente</span> →
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
