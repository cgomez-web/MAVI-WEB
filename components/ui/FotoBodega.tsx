import { srcPorDefecto, srcSet, type FotoCliente } from "@/lib/imagenes";

interface PropsFoto {
  foto: FotoCliente;
  sizes: string;
  className?: string;
  /** Duotono amarillo/tinta en miniaturas (vuelve a color con hover/foco). */
  duotono?: boolean;
  prioridad?: boolean;
  /** Forzar proporción del contenedor (p. ej. "4 / 5"); por defecto la de la foto. */
  proporcion?: string;
}

/**
 * Foto real de bodega con AVIF/WebP pre-generados, LQIP de fondo y dimensiones fijas (CLS 0).
 * Ver PLAN.md §4 sobre por qué <picture> en lugar de next/image.
 */
export function FotoBodega({
  foto,
  sizes,
  className = "",
  duotono,
  prioridad,
  proporcion,
}: PropsFoto) {
  return (
    <div
      className={`foto-bodega ${duotono ? "foto-duotono" : ""} ${className}`}
      style={{
        aspectRatio: proporcion ?? `${foto.ancho} / ${foto.alto}`,
        ...(foto.lqip ? { backgroundImage: `url(${foto.lqip})` } : {}),
      }}
    >
      <picture>
        <source type="image/avif" srcSet={srcSet(foto, "avif")} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet(foto, "webp")} sizes={sizes} />
        <img
          src={srcPorDefecto(foto)}
          alt={foto.alt}
          width={foto.ancho}
          height={foto.alto}
          loading={prioridad ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={prioridad ? "high" : "auto"}
        />
      </picture>
    </div>
  );
}
