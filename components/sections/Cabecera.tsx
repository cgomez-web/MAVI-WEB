"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { navegacion, textosCabecera } from "@/content/navegacion";
import { urlWhatsApp } from "@/content/contacto";
import { IsotipoMavi, WordmarkMavi } from "@/components/brand/Logo";
import {
  EVENTO_MOVIMIENTO,
  guardarMovimiento,
  leerMovimientoGuardado,
  prefiereMovimientoReducido,
} from "@/lib/preferencias";

export function Cabecera() {
  const [abierto, setAbierto] = useState(false);
  const [solida, setSolida] = useState(false);
  const [movimiento, setMovimiento] = useState<"on" | "off">("on");
  const idMenu = useId();
  const botonMenu = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const ruta = usePathname();

  // Estado inicial del conmutador de movimiento.
  useEffect(() => {
    const guardado = leerMovimientoGuardado();
    const valor = guardado ?? (prefiereMovimientoReducido() ? "off" : "on");
    document.documentElement.dataset.movimiento = valor;
    setMovimiento(valor);
    const alCambiar = (e: Event) => setMovimiento((e as CustomEvent<"on" | "off">).detail);
    window.addEventListener(EVENTO_MOVIMIENTO, alCambiar);
    return () => window.removeEventListener(EVENTO_MOVIMIENTO, alCambiar);
  }, []);

  // Fondo sólido al bajar del hero.
  useEffect(() => {
    const alDesplazar = () => setSolida(window.scrollY > 24);
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  const cerrar = useCallback((devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) botonMenu.current?.focus();
  }, []);

  // Cerrar el menú al navegar.
  useEffect(() => {
    setAbierto(false);
  }, [ruta]);

  // Escape cierra; el foco queda atrapado dentro del panel mientras está abierto.
  useEffect(() => {
    if (!abierto) return;
    const enfocables = () =>
      Array.from(panel.current?.querySelectorAll<HTMLElement>("a, button") ?? []).filter(
        (el) => !el.hasAttribute("disabled"),
      );
    enfocables()[0]?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
      if (e.key !== "Tab") return;
      const lista = [botonMenu.current, ...enfocables()].filter(Boolean) as HTMLElement[];
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo?.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero?.focus();
      }
    };
    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
    };
  }, [abierto, cerrar]);

  const alternarMovimiento = () => guardarMovimiento(movimiento === "on" ? "off" : "on");
  // Transparente solo sobre el hero oscuro del home; en el resto (p. ej. páginas de fondo claro) es sólida.
  const transparente = ruta === "/" && !solida && !abierto;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-[var(--dur-ui)] ease-[var(--ease-weight)] ${
        transparente
          ? "border-b-2 border-transparent bg-transparent"
          : "border-line bg-ink border-b-2"
      }`}
    >
      <div className="flex h-[var(--header-h)] items-center justify-between gap-4 px-[var(--margin)]">
        <Link href="/" className="flex items-center gap-3" aria-label={textosCabecera.inicio}>
          <IsotipoMavi className="h-9 w-9 shrink-0" />
          <WordmarkMavi className="h-5 w-auto" titulo="" />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {navegacion.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="enlace-cinta mono-etiqueta text-bone">
                  {item.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={alternarMovimiento}
            aria-pressed={movimiento === "on"}
            aria-label={
              movimiento === "on"
                ? textosCabecera.movimientoActivo
                : textosCabecera.movimientoInactivo
            }
            className="mono-etiqueta border-line text-concrete-light hover:border-bone hover:text-bone hidden items-center gap-2 border-2 px-3 py-2 transition-colors duration-[var(--dur-micro)] md:inline-flex"
          >
            <span
              aria-hidden="true"
              className={`inline-block h-2.5 w-2.5 ${movimiento === "on" ? "bg-brand-yellow" : "bg-concrete-dark"}`}
            />
            {textosCabecera.movimiento}
          </button>
          <a
            href={urlWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-primario hidden min-h-11 px-4 py-2 sm:inline-flex"
          >
            {textosCabecera.cotizar}
          </a>
          <button
            ref={botonMenu}
            type="button"
            className="border-bone relative h-11 w-11 border-2 lg:hidden"
            aria-expanded={abierto}
            aria-controls={idMenu}
            aria-label={abierto ? textosCabecera.cerrarMenu : textosCabecera.abrirMenu}
            onClick={() => (abierto ? cerrar() : setAbierto(true))}
          >
            <span
              aria-hidden="true"
              className={`bg-bone absolute right-2 left-2 h-[3px] transition-transform duration-[var(--dur-ui)] ease-[var(--ease-weight)] ${
                abierto ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[13px]"
              }`}
            />
            <span
              aria-hidden="true"
              className={`bg-bone absolute right-2 left-2 h-[3px] transition-transform duration-[var(--dur-ui)] ease-[var(--ease-weight)] ${
                abierto ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-[13px]"
              }`}
            />
          </button>
        </div>
      </div>

      <div
        id={idMenu}
        ref={panel}
        hidden={!abierto}
        className="con-grano bg-ink fixed inset-x-0 top-[var(--header-h)] bottom-0 overflow-y-auto px-[var(--margin)] pt-8 pb-10 lg:hidden"
      >
        <nav aria-label="Menú móvil">
          <ul className="flex flex-col">
            {navegacion.map((item, i) => (
              <li key={item.href} className="border-line border-b-2">
                <Link
                  href={item.href}
                  onClick={() => cerrar(false)}
                  className="font-display text-4 flex items-baseline justify-between py-4 font-extrabold [font-stretch:80%]"
                >
                  {item.etiqueta}
                  <span className="mono-etiqueta text-concrete">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={urlWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-primario"
          >
            Cotizar por WhatsApp
          </a>
          <button
            type="button"
            onClick={alternarMovimiento}
            aria-pressed={movimiento === "on"}
            className="boton boton-secundario"
          >
            {movimiento === "on" ? "Desactivar animaciones" : "Activar animaciones"}
          </button>
        </div>
      </div>
    </header>
  );
}
