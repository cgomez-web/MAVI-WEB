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
    // Corte de línea preferente antes de la @ (<wbr>); solo si el usuario no cabe ni solo se parte
    // dentro de él. `word-break: normal` anula un `break-all` heredado del contenedor, que partiría el
    // dominio en cualquier letra («gmail.c / om»).
    <a
      href={href}
      className={`[overflow-wrap:anywhere] [word-break:normal] ${className ?? ""}`.trim()}
      translate="no"
    >
      <span>{usuario}</span>
      {/* aria-hidden: Chrome convierte el <wbr> en un espacio del nombre accesible ("usuario @gmail.com"). */}
      <span aria-hidden="true">
        <wbr />
      </span>
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
    // Nunca se parte en dos renglones («322 559» / «9325»).
    <a href={href} className={`whitespace-nowrap ${className ?? ""}`.trim()} translate="no">
      {partes.map((p, i) => (
        // Un solo nodo de texto por grupo, con su espacio dentro: así el nombre accesible es
        // "322 559 9325" y no "3225599325" (un espacio suelto tras <!-- --> se pierde en Chrome).
        <span key={`${p}-${i}`}>{i < partes.length - 1 ? `${p} ` : p}</span>
      ))}
    </a>
  );
}
