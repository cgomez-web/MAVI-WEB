import { serializarJsonLd } from "@/lib/jsonld";

/** Datos estructurados. `application/ld+json` no se ejecuta, por lo que no requiere nonce. */
export function JsonLd({ datos }: { datos: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(datos) }} />;
}
