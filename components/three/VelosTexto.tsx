"use client";

import { useEffect, useRef } from "react";
import { EVENTO_MOVIMIENTO } from "@/lib/preferencias";

/**
 * Velos de contraste para el texto que flota sobre la escena (WCAG 1.4.3).
 *
 * La escena cambia de luz y de encuadre con el scroll, así que un degradado fijo no garantiza el
 * contraste en todas las posiciones. Aquí, cada renglón de texto de cada ventana `[data-ventana-3d]`
 * lleva detrás una franja de tinta ajustada a sus letras, con la opacidad justa para que ese texto
 * (por su color y tamaño) supere 4,5:1 —o 3:1 si es texto grande— incluso sobre el píxel más claro
 * que la escena puede poner detrás (el halo del sol). Las franjas se miden sobre los rectángulos
 * reales de cada línea (`Range.getClientRects()`), cortados por su recorte si lo hay (odómetro); los
 * botones y sellos, que ya tienen marco propio, la llevan a la medida de ese marco. El resto de la
 * escena queda limpia: nada de manchas sobre espacio vacío.
 *
 * Cada ventana pinta sus franjas en un lienzo propio a 1/4 de resolución. Donde dos franjas se
 * tocan gana la más opaca (no se suman ni dejan costuras), y el escalado del lienzo da un borde
 * corto, de 8 px (12 px en texto grande): se lee como una franja, no como una sombra.
 *
 * Los lienzos van en una capa absoluta del documento, por encima de la capa fija de la escena y
 * por debajo del contenido: se desplazan con el texto de forma nativa (sin retraso al hacer scroll)
 * y solo se recalculan cuando cambia la maqueta (tamaño, fuentes, fin de las entradas).
 */

type RGB = [number, number, number];

const TINTA: RGB = [11, 11, 12];
/** El píxel más claro que la escena (o el póster) puede dejar detrás de un texto. */
const FONDO_PEOR: RGB = [255, 244, 222];
/** Margen sobre el mínimo de WCAG (el borde de la franja es gradual). */
const HOLGURA = 1.12;
/** Píxeles CSS por píxel de lienzo: el escalado suave hace de borde (un píxel de lienzo de rampa). */
const ESCALA = 4;
/** Rampa del borde, de dentro afuera, en fracciones del alfa (un anillo de 1 píxel de lienzo cada una). */
const RAMPA_NORMAL = [0.5];
const RAMPA_GRANDE = [0.68, 0.3];

const lineal = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const luminancia = ([r, g, b]: RGB) => 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
const contraste = (a: RGB, b: RGB) => {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
const mezcla = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Opacidad mínima del velo para que un texto de color `texto` (con su alfa) cumpla `objetivo`. */
function alfaNecesario(texto: RGB, alfaTexto: number, objetivo: number): number {
  for (let a = 0; a <= 0.94; a += 0.01) {
    const fondo = mezcla(FONDO_PEOR, TINTA, a);
    if (contraste(mezcla(fondo, texto, alfaTexto), fondo) >= objetivo) return a;
  }
  return 0.94;
}

/** Los colores de texto son pocos: la opacidad se calcula una vez por color y tamaño. */
const alfasGuardados = new Map<string, number>();
function alfaPara(color: string, rgb: RGB, alfaTexto: number, grande: boolean): number {
  const clave = `${color}|${grande ? "g" : "n"}`;
  let a = alfasGuardados.get(clave);
  if (a === undefined) {
    a = alfaNecesario(rgb, alfaTexto, (grande ? 3 : 4.5) * HOLGURA);
    alfasGuardados.set(clave, a);
  }
  return a;
}

/** Convierte cualquier color CSS (rgb, oklab, color-mix…) a sRGB + alfa con un lienzo 1×1. */
function crearLectorColor() {
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 1;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  const cache = new Map<string, [RGB, number]>();
  return (color: string): [RGB, number] => {
    const guardado = cache.get(color);
    if (guardado) return guardado;
    let res: [RGB, number] = [[0, 0, 0], 0];
    if (ctx) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      const a = (d[3] ?? 0) / 255;
      res = a > 0 ? [[d[0] ?? 0, d[1] ?? 0, d[2] ?? 0], a] : [[0, 0, 0], 0];
    }
    cache.set(color, res);
    return res;
  };
}

/** Rectángulo en coordenadas de la capa de velos (px CSS). */
interface Caja {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Franja extends Caja {
  alfa: number;
  grande: boolean;
  /** Tamaño de letra (px): mide la separación que aún cuenta como el mismo renglón. */
  tam: number;
  /** Marco propio (botón, sello): no se une con otras franjas. */
  marco: boolean;
  /** Marco girado (sello): centro, semiejes sin girar y ángulo, para seguir su contorno. */
  giro?: Giro;
}

interface Giro {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
  angulo: number;
}

/** El giro propio de un marco (p. ej. el sello a −4°), o `undefined` si no está girado. */
function giroDe(el: Element, cs: CSSStyleDeclaration, c: Caja): Giro | undefined {
  if (cs.transform === "none" || !(el instanceof HTMLElement)) return undefined;
  const m = new DOMMatrixReadOnly(cs.transform);
  const angulo = Math.atan2(m.b, m.a);
  if (Math.abs(angulo) < 0.003) return undefined;
  // Con el origen de transformación en el centro, el centro de la caja girada es el de su
  // envolvente; los semiejes salen del tamaño de maqueta por la escala del giro.
  return {
    cx: (c.x0 + c.x1) / 2,
    cy: (c.y0 + c.y1) / 2,
    hw: (el.offsetWidth / 2) * Math.hypot(m.a, m.b),
    hh: (el.offsetHeight / 2) * Math.hypot(m.c, m.d),
    angulo,
  };
}

function interseccion(a: Caja, b: Caja): Caja {
  return {
    x0: Math.max(a.x0, b.x0),
    y0: Math.max(a.y0, b.y0),
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
  };
}

const visible = (c: Caja) => c.x1 - c.x0 >= 2 && c.y1 - c.y0 >= 2;

/** Mide las franjas de todas las ventanas: una lista por ventana con al menos un texto visible. */
function medirFranjas(base: DOMRect, leer: (c: string) => [RGB, number]): Franja[][] {
  const caja = (r: DOMRect): Caja => ({
    x0: r.left - base.left,
    y0: r.top - base.top,
    x1: r.right - base.left,
    y1: r.bottom - base.top,
  });
  // Un getComputedStyle por elemento y medición (los ancestros se comparten entre textos).
  const estilos = new Map<Element, CSSStyleDeclaration>();
  const estilo = (el: Element) => {
    let cs = estilos.get(el);
    if (!cs) {
      cs = getComputedStyle(el);
      estilos.set(el, cs);
    }
    return cs;
  };
  const rango = document.createRange();
  const resultado: Franja[][] = [];

  for (const ventana of document.querySelectorAll<HTMLElement>("[data-ventana-3d]")) {
    // ¿El texto ya tiene fondo propio opaco (botón primario)? Entonces no necesita velo.
    const conFondo = new Map<Element, boolean>();
    const tieneFondo = (el: Element | null): boolean => {
      if (!el || el === ventana) return false;
      const guardado = conFondo.get(el);
      if (guardado !== undefined) return guardado;
      const cs = estilo(el);
      const r =
        cs.backgroundImage !== "none" ||
        leer(cs.backgroundColor)[1] >= 0.9 ||
        tieneFondo(el.parentElement);
      conFondo.set(el, r);
      return r;
    };
    // Recorte acumulado de los ancestros con overflow distinto de visible (odómetro, .linea del
    // titular, texto solo para lectores); `null` si nada recorta.
    const recortes = new Map<Element, Caja | null>();
    const recorteDe = (el: Element | null): Caja | null => {
      if (!el || el === ventana) return null;
      const guardado = recortes.get(el);
      if (guardado !== undefined) return guardado;
      const arriba = recorteDe(el.parentElement);
      const cs = estilo(el);
      let r = arriba;
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
        const propio = caja(el.getBoundingClientRect());
        r = arriba ? interseccion(propio, arriba) : propio;
      }
      recortes.set(el, r);
      return r;
    };

    const franjas: Franja[] = [];
    const marcos = new Map<Element, Franja>();
    const recorrido = document.createTreeWalker(ventana, NodeFilter.SHOW_TEXT);
    while (recorrido.nextNode()) {
      const n = recorrido.currentNode;
      const texto = n.nodeValue ?? "";
      const padre = n.parentElement;
      const inicio = texto.search(/\S/);
      if (inicio < 0 || !padre || tieneFondo(padre)) continue;
      const cs = estilo(padre);
      if (cs.visibility === "hidden") continue;
      const [rgb, alfaTexto] = leer(cs.color);
      if (alfaTexto === 0) continue;
      const tam = parseFloat(cs.fontSize) || 16;
      const peso = Number(cs.fontWeight) || 400;
      const grande = tam >= 24 || (tam >= 18.66 && peso >= 700);
      const alfa = alfaPara(cs.color, rgb, alfaTexto, grande);

      // Primer ancestro no "inline": si es una caja en línea con borde (botón secundario, sello),
      // la franja toma su marco entero, que es lo que se lee como una unidad.
      let bloque: Element = padre;
      while (bloque !== ventana && bloque.parentElement && estilo(bloque).display === "inline")
        bloque = bloque.parentElement;
      const cb = estilo(bloque);
      if (
        bloque !== ventana &&
        cb.display.startsWith("inline-") &&
        cb.borderTopStyle !== "none" &&
        parseFloat(cb.borderTopWidth) > 0
      ) {
        const previo = marcos.get(bloque);
        if (previo) {
          previo.alfa = Math.max(previo.alfa, alfa);
          previo.grande = previo.grande && grande;
          continue;
        }
        const recorte = recorteDe(bloque.parentElement);
        const r = caja(bloque.getBoundingClientRect());
        const c = recorte ? interseccion(r, recorte) : r;
        if (!visible(c)) continue;
        // Si algo lo recorta, basta la caja recortada; si no, la franja sigue el giro del marco.
        const entero = c.x0 === r.x0 && c.y0 === r.y0 && c.x1 === r.x1 && c.y1 === r.y1;
        const giro = entero ? giroDe(bloque, cb, r) : undefined;
        const f: Franja = { ...c, alfa, grande, tam, marco: true, giro };
        marcos.set(bloque, f);
        franjas.push(f);
        continue;
      }

      // Renglones reales del texto (sin los espacios de los extremos), cortados por su recorte.
      const recorte = recorteDe(padre);
      rango.setStart(n, inicio);
      rango.setEnd(n, texto.trimEnd().length);
      for (const r of rango.getClientRects()) {
        const propia = caja(r);
        const c = recorte ? interseccion(propia, recorte) : propia;
        if (visible(c)) franjas.push({ ...c, alfa, grande, tam, marco: false });
      }
    }
    if (franjas.length) resultado.push(unirRenglones(franjas));
  }
  return resultado;
}

/**
 * Une en una franja los trozos del mismo renglón (palabras sueltas, dígitos del odómetro, datos de
 * una ficha): solapan en vertical, tienen una altura parecida y los separa poco más de un espacio.
 */
function unirRenglones(franjas: Franja[]): Franja[] {
  const lista = [...franjas];
  // Al crecer, una franja puede alcanzar a otra ya revisada: se repite hasta que no haya uniones.
  let unidas = true;
  while (unidas) {
    unidas = false;
    busqueda: for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i];
        const b = lista[j];
        if (!a || !b || a.marco || b.marco) continue;
        const ha = a.y1 - a.y0;
        const hb = b.y1 - b.y0;
        const solape = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        const hueco = Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1);
        if (
          solape >= 0.6 * Math.min(ha, hb) &&
          Math.max(ha, hb) <= 1.6 * Math.min(ha, hb) &&
          hueco <= 2.2 * Math.max(a.tam, b.tam)
        ) {
          lista[i] = {
            x0: Math.min(a.x0, b.x0),
            y0: Math.min(a.y0, b.y0),
            x1: Math.max(a.x1, b.x1),
            y1: Math.max(a.y1, b.y1),
            alfa: Math.max(a.alfa, b.alfa),
            grande: a.grande && b.grande,
            tam: Math.max(a.tam, b.tam),
            marco: false,
          };
          lista.splice(j, 1);
          unidas = true;
          break busqueda;
        }
      }
    }
  }
  return lista;
}

/** Rectángulo de lienzo (en píxeles de lienzo) y su alfa; con `giro`, girado sobre su centro. */
interface Pieza {
  x: number;
  y: number;
  w: number;
  h: number;
  alfa: number;
  giro?: { cx: number; cy: number; cos: number; sin: number };
}

/**
 * Pinta las franjas de una ventana en `lienzo` (a 1/ESCALA de resolución) y lo coloca en la capa.
 * `limiteX` es el ancho útil de la capa: el lienzo nunca lo rebasa (sin scroll horizontal).
 */
function pintarLienzo(lienzo: HTMLCanvasElement, franjas: Franja[], limiteX: number) {
  // Núcleo: el texto con un margen corto; fuera, la rampa de anillos de 1 píxel de lienzo.
  const nucleos = franjas.map((f) => {
    const mh = f.marco ? 0 : f.grande ? 10 : 6;
    const mv = f.marco ? 0 : f.grande ? 2 : 3;
    return {
      x0: f.x0 - mh,
      y0: f.y0 - mv,
      x1: f.x1 + mh,
      y1: f.y1 + mv,
      alfa: f.alfa,
      rampa: f.grande ? RAMPA_GRANDE : RAMPA_NORMAL,
      giro: f.giro,
    };
  });
  const borde = (RAMPA_GRANDE.length + 2) * ESCALA;
  const ox = Math.max(
    0,
    Math.floor((Math.min(...nucleos.map((n) => n.x0)) - borde) / ESCALA) * ESCALA,
  );
  const oy = Math.floor((Math.min(...nucleos.map((n) => n.y0)) - borde) / ESCALA) * ESCALA;
  const fx = Math.min(limiteX, Math.max(...nucleos.map((n) => n.x1)) + borde);
  const fy = Math.max(...nucleos.map((n) => n.y1)) + borde;
  const ancho = Math.max(1, Math.floor((fx - ox) / ESCALA));
  const alto = Math.max(1, Math.ceil((fy - oy) / ESCALA));

  // Con el escalado suave, el alfa pleno llega hasta el centro del último píxel del núcleo: el
  // núcleo se amplía medio píxel por lado para cubrir el texto entero.
  const piezas: Pieza[] = [];
  for (const n of nucleos) {
    if (n.giro) {
      // Marco girado: núcleo y anillos en coordenadas propias del marco, centrados en él.
      const g = n.giro;
      const giro = {
        cx: (g.cx - ox) / ESCALA,
        cy: (g.cy - oy) / ESCALA,
        cos: Math.cos(g.angulo),
        sin: Math.sin(g.angulo),
      };
      const hw = g.hw / ESCALA + 0.75;
      const hh = g.hh / ESCALA + 0.75;
      piezas.push({ x: -hw, y: -hh, w: 2 * hw, h: 2 * hh, alfa: n.alfa, giro });
      n.rampa.forEach((t, k) => {
        const d = k + 1;
        piezas.push({
          x: -hw - d,
          y: -hh - d,
          w: 2 * (hw + d),
          h: 2 * (hh + d),
          alfa: n.alfa * t,
          giro,
        });
      });
      continue;
    }
    const i0 = Math.floor((n.x0 - ox) / ESCALA - 0.5);
    const j0 = Math.floor((n.y0 - oy) / ESCALA - 0.5);
    const i1 = Math.ceil((n.x1 - ox) / ESCALA + 0.5);
    const j1 = Math.ceil((n.y1 - oy) / ESCALA + 0.5);
    piezas.push({ x: i0, y: j0, w: i1 - i0, h: j1 - j0, alfa: n.alfa });
    n.rampa.forEach((t, k) => {
      const d = k + 1;
      piezas.push({
        x: i0 - d,
        y: j0 - d,
        w: i1 - i0 + 2 * d,
        h: j1 - j0 + 2 * d,
        alfa: n.alfa * t,
      });
    });
  }

  if (lienzo.width !== ancho || lienzo.height !== alto) {
    lienzo.width = ancho;
    lienzo.height = alto;
  }
  Object.assign(lienzo.style, {
    position: "absolute",
    left: `${ox}px`,
    top: `${oy}px`,
    width: `${ancho * ESCALA}px`,
    height: `${alto * ESCALA}px`,
  });
  const ctx = lienzo.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, ancho, alto);
  // De menos a más opaca, y cada pieza reemplaza lo que hay debajo: en los cruces gana el alfa
  // mayor, sin oscurecer de más donde dos franjas (o sus bordes) se tocan.
  piezas.sort((a, b) => a.alfa - b.alfa);
  for (const p of piezas) {
    const g = p.giro;
    if (g) ctx.setTransform(g.cos, g.sin, -g.sin, g.cos, g.cx, g.cy);
    ctx.clearRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = `rgba(11, 11, 12, ${p.alfa.toFixed(3)})`;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    if (g) ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

export function VelosTexto() {
  const capa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = capa.current;
    if (!raiz) return;
    const leer = crearLectorColor();
    // Con colores forzados el sistema pone su propio fondo al texto: la tinta sobraría (y con un
    // tema claro restaría contraste).
    const forzados = window.matchMedia("(forced-colors: active)");
    let raf = 0;
    const pintar = () => {
      raf = 0;
      const base = raiz.getBoundingClientRect();
      const limiteX = document.documentElement.clientWidth - base.left;
      const grupos = forzados.matches ? [] : medirFranjas(base, leer);
      while (raiz.children.length > grupos.length) raiz.lastElementChild?.remove();
      while (raiz.children.length < grupos.length)
        raiz.appendChild(document.createElement("canvas"));
      grupos.forEach((franjas, i) => {
        const lienzo = raiz.children[i];
        if (lienzo instanceof HTMLCanvasElement) pintarLienzo(lienzo, franjas, limiteX);
      });
      raiz.dataset.velos = String(grupos.reduce((t, g) => t + g.length, 0));
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(pintar);
    };
    // Un sello o un bloque que asienta con una transición cambia de caja sin cambiar la maqueta.
    const alTransicion = (e: TransitionEvent) => {
      if (
        e.propertyName === "transform" &&
        e.target instanceof Element &&
        e.target.closest("[data-ventana-3d]")
      )
        pedir();
    };

    pedir();
    const obs = new ResizeObserver(pedir);
    obs.observe(document.body);
    document.querySelectorAll("[data-ventana-3d]").forEach((v) => obs.observe(v));
    void document.fonts?.ready.then(pedir);
    window.addEventListener("load", pedir);
    window.addEventListener("resize", pedir);
    window.addEventListener(EVENTO_MOVIMIENTO, pedir);
    document.addEventListener("transitionend", alTransicion);
    forzados.addEventListener("change", pedir);
    // Al terminar las entradas del hero (palabras, sellos, odómetros) la maqueta queda fija.
    const tiempos = [1800, 4500].map((ms) => window.setTimeout(pedir, ms));
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener("load", pedir);
      window.removeEventListener("resize", pedir);
      window.removeEventListener(EVENTO_MOVIMIENTO, pedir);
      document.removeEventListener("transitionend", alTransicion);
      forzados.removeEventListener("change", pedir);
      tiempos.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div
      ref={capa}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-[5] h-0"
      data-velos-texto=""
    />
  );
}
