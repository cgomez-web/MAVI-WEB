"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { avisoPestanaNueva, navegacion, textosCabecera } from "@/content/navegacion";
import { urlWhatsApp } from "@/content/contacto";
import { IsotipoMavi, WordmarkMavi } from "@/components/brand/Logo";
import { EVENTO_MOVIMIENTO, guardarMovimiento, leerMovimientoGuardado } from "@/lib/preferencias";

type Movimiento = "on" | "off";

/** Interruptor visual (decorativo): el estado lo anuncia `aria-checked` en el botón. */
function Interruptor({ activo }: { activo: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block h-3.5 w-6 shrink-0 border-2 border-current"
    >
      <span
        className={`absolute inset-y-0 w-1/2 transition-[left,background-color] duration-[var(--dur-micro)] ${
          activo ? "bg-brand-yellow left-1/2" : "bg-concrete left-0"
        }`}
      />
    </span>
  );
}

export function Cabecera() {
  const [abierto, setAbierto] = useState(false);
  const [solida, setSolida] = useState(false);
  // Preferencia del visitante (guardada) y ajuste del sistema; el estado real combina ambos.
  const [preferencia, setPreferencia] = useState<Movimiento>("on");
  const [reducido, setReducido] = useState(false);
  const refPreferencia = useRef<Movimiento>("on");
  const idMenu = useId();
  const idNotaCabecera = useId();
  const idNotaMenu = useId();
  const botonMenu = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const ruta = usePathname();

  // Estado inicial del conmutador. Si el sistema pide reducir el movimiento, manda el sistema
  // (WCAG 2.3.3): el conmutador se muestra apagado y no se puede encender desde aquí.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sincronizar = (avisar: boolean) => {
      const real: Movimiento = mq.matches ? "off" : refPreferencia.current;
      const raiz = document.documentElement;
      const antes: Movimiento = raiz.dataset.movimiento === "off" ? "off" : "on";
      setReducido(mq.matches);
      if (real === antes) return;
      // html[data-movimiento] solo hace falta apagado: sin el atributo vale "on" (globals.css
      // pregunta «no apagado»). Así, en el caso común no se toca <html> al hidratar; cada escritura
      // invalida el estilo de todo el documento y la lectura de scrollY de abajo lo recalculaba.
      if (real === "off") raiz.dataset.movimiento = "off";
      else raiz.removeAttribute("data-movimiento");
      if (avisar) window.dispatchEvent(new CustomEvent(EVENTO_MOVIMIENTO, { detail: real }));
    };
    refPreferencia.current = leerMovimientoGuardado() ?? "on";
    setPreferencia(refPreferencia.current);
    sincronizar(false);
    const alCambiarSistema = () => sincronizar(true);
    mq.addEventListener("change", alCambiarSistema);
    return () => mq.removeEventListener("change", alCambiarSistema);
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

  // Menú abierto: Escape cierra, el foco queda atrapado en el panel y el resto de la página queda
  // inerte (los lectores de pantalla táctiles navegan deslizando, no con Tab).
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
    // El panel y su botón desaparecen desde lg: si la ventana crece (tablet que gira), se cierra
    // para no dejar la página bloqueada sin forma visible de cerrarlo.
    const mqEscritorio = window.matchMedia("(min-width: 64rem)");
    const alCambiarAncho = (e: MediaQueryListEvent) => {
      if (e.matches) setAbierto(false);
    };
    // La cabecera (logo, «Cotizar» y el botón de cerrar) sigue accesible: queda a la vista.
    const fondo = [
      document.querySelector("body > a.saltar"),
      document.getElementById("contenido"),
      document.querySelector("body > footer"),
      document.querySelector(".cta-whatsapp"),
    ].filter((el): el is HTMLElement => el instanceof HTMLElement);

    document.addEventListener("keydown", alTeclear);
    mqEscritorio.addEventListener("change", alCambiarAncho);
    for (const el of fondo) el.inert = true;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      mqEscritorio.removeEventListener("change", alCambiarAncho);
      for (const el of fondo) el.inert = false;
      document.body.style.overflow = "";
    };
  }, [abierto, cerrar]);

  const animacionesActivas = preferencia === "on" && !reducido;
  const alternarMovimiento = () => {
    if (reducido) return;
    const nuevo: Movimiento = preferencia === "on" ? "off" : "on";
    refPreferencia.current = nuevo;
    setPreferencia(nuevo);
    guardarMovimiento(nuevo);
  };
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
      <div className="flex h-[var(--header-h)] items-center justify-between gap-3 px-[var(--margin)]">
        <Link href="/" className="flex items-center gap-3" aria-label={textosCabecera.inicio}>
          <IsotipoMavi className="h-9 w-9 shrink-0" />
          <WordmarkMavi className="h-5 w-auto" titulo="" />
        </Link>

        <nav aria-label={textosCabecera.navPrincipal} className="hidden lg:block">
          <ul className="flex items-center gap-3 xl:gap-8">
            {navegacion.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="enlace-cinta mono-etiqueta text-bone whitespace-nowrap"
                >
                  {item.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={animacionesActivas}
            aria-disabled={reducido || undefined}
            aria-describedby={reducido ? idNotaCabecera : undefined}
            title={reducido ? textosCabecera.animacionesReducidas : undefined}
            onClick={alternarMovimiento}
            className="mono-etiqueta border-line text-concrete-light hover:border-bone hover:text-bone aria-disabled:hover:border-line aria-disabled:hover:text-concrete-light hidden items-center gap-2 border-2 px-2 py-2 whitespace-nowrap transition-colors duration-[var(--dur-micro)] aria-disabled:cursor-not-allowed aria-disabled:opacity-60 md:inline-flex"
          >
            <Interruptor activo={animacionesActivas} />
            {textosCabecera.animaciones}
          </button>
          {/* Descripción del conmutador cuando manda el sistema (oculta: se lee como descripción). */}
          <span id={idNotaCabecera} hidden>
            {textosCabecera.animacionesReducidas}
          </span>
          <a
            href={urlWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-primario hidden min-h-11 px-3 py-2 sm:inline-flex xl:px-4"
          >
            {textosCabecera.cotizar}
            <span className="solo-lectores">
              {textosCabecera.cotizarDetalle}
              {avisoPestanaNueva}
            </span>
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
        <nav aria-label={textosCabecera.navMovil}>
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
            {textosCabecera.cotizarWhatsApp}
            <span className="solo-lectores">{avisoPestanaNueva}</span>
          </a>
          <button
            type="button"
            role="switch"
            aria-checked={animacionesActivas}
            aria-disabled={reducido || undefined}
            aria-describedby={reducido ? idNotaMenu : undefined}
            onClick={alternarMovimiento}
            className="boton boton-secundario aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          >
            <Interruptor activo={animacionesActivas} />
            {textosCabecera.animaciones}
          </button>
          {reducido ? (
            <p id={idNotaMenu} className="text-0 text-concrete-light w-full max-w-[44ch]">
              {textosCabecera.animacionesReducidas}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
