"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { movimientoPermitido } from "@/lib/preferencias";

const DIGITOS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

interface PropsOdometro {
  valor: number;
  prefijo?: string;
  className?: string;
}

/**
 * Contador de rodillos mecánicos. El HTML de servidor ya muestra el valor final (funciona sin JS);
 * al hidratar, si hay movimiento, los rodillos vuelven a 0 y giran al entrar en pantalla.
 */
export function Odometro({ valor, prefijo, className }: PropsOdometro) {
  const caja = useRef<HTMLSpanElement>(null);
  const [girado, setGirado] = useState(true);
  const cifras = String(valor).split("");

  useEffect(() => {
    if (!movimientoPermitido() || !caja.current) return;
    const r = caja.current.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // ya visible: no se anima hacia atrás
    setGirado(false);
    // Al imprimir o guardar en PDF, la cifra real aunque no se haya llegado a ella (síncrono: la
    // hoja se compone justo después del evento).
    const impresion = window.matchMedia("print");
    const limpiar = () => {
      obs.disconnect();
      window.removeEventListener("beforeprint", alImprimir);
      impresion.removeEventListener("change", alImprimir);
    };
    const alImprimir = () => {
      flushSync(() => setGirado(true));
      limpiar();
    };
    // Arranca un poco antes de entrar en pantalla (15 % del alto por debajo): cuando la cifra se
    // ve, el giro ya va avanzado y no se queda leyendo "00" ni rodillos a medio camino.
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        setGirado(true);
        limpiar();
      },
      { rootMargin: "0px 0px 15% 0px" },
    );
    obs.observe(caja.current);
    window.addEventListener("beforeprint", alImprimir);
    impresion.addEventListener("change", alImprimir);
    return limpiar;
  }, []);

  return (
    <span ref={caja} className={className}>
      <span className="solo-lectores">
        {prefijo}
        {valor}
      </span>
      <span aria-hidden="true" className="inline-flex items-start">
        {prefijo ? <span>{prefijo}</span> : null}
        {cifras.map((c, i) => (
          <span key={i} className="odometro">
            <span
              className="odometro-rodillo"
              style={{
                transform: `translateY(${girado ? -Number(c) : 0}em)`,
                transitionDelay: `${i * 90}ms`,
              }}
            >
              {DIGITOS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
