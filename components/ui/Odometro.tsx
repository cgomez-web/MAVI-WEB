"use client";

import { useEffect, useRef, useState } from "react";
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
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setGirado(true);
          obs.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(caja.current);
    return () => obs.disconnect();
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
                transform: `translateY(${girado ? -Number(c) * 10 : 0}%)`,
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
