"use client";

import { useEffect, useState } from "react";

/**
 * Correo y teléfono "difíciles de raspar": el HTML de servidor no contiene la dirección completa en
 * una sola cadena ni el esquema mailto:/tel:, que se arma en el cliente. El texto visible sigue siendo
 * legible para lectores de pantalla y se puede copiar.
 */
export function CorreoProtegido({
  usuario,
  dominio,
  className,
}: {
  usuario: string;
  dominio: string;
  className?: string;
}) {
  const [href, setHref] = useState<string | undefined>(undefined);
  useEffect(() => setHref(`mailto:${usuario}@${dominio}`), [usuario, dominio]);
  return (
    <a href={href} className={className} translate="no">
      <span>{usuario}</span>
      <span>@</span>
      <span>{dominio}</span>
    </a>
  );
}

export function TelefonoProtegido({
  e164,
  visible,
  className,
}: {
  e164: string;
  visible: string;
  className?: string;
}) {
  const [href, setHref] = useState<string | undefined>(undefined);
  useEffect(() => setHref(`tel:${e164}`), [e164]);
  const partes = visible.split(" ");
  return (
    <a href={href} className={className} translate="no">
      {partes.map((p, i) => (
        <span key={`${p}-${i}`}>
          {p}
          {i < partes.length - 1 ? " " : ""}
        </span>
      ))}
    </a>
  );
}
