export const navegacion = [
  { etiqueta: "Equipos", href: "/#servicios" },
  { etiqueta: "Inventario", href: "/#inventario" },
  { etiqueta: "Cómo trabajamos", href: "/#proceso" },
  { etiqueta: "Nosotros", href: "/nosotros" },
  { etiqueta: "Contacto", href: "/contacto" },
] as const;

export const textosCabecera = {
  cotizar: "Cotizar",
  /** Complemento solo para lectores de pantalla del botón "Cotizar" (abre WhatsApp). */
  cotizarDetalle: " por WhatsApp",
  abrirMenu: "Abrir menú",
  cerrarMenu: "Cerrar menú",
  /** Nombre visible (y accesible) del conmutador de animaciones; su estado lo anuncia aria-checked. */
  animaciones: "Animaciones",
  animacionesReducidas:
    "Desactivadas porque su dispositivo tiene activada la opción de reducir el movimiento.",
  inicio: "Inicio — MAVI Proyectos e Inversiones",
  navPrincipal: "Principal",
  navMovil: "Menú móvil",
  /** Botón del menú móvil (y texto de la barra fija de WhatsApp). */
  cotizarWhatsApp: "Cotizar por WhatsApp",
} as const;

/** Aviso, solo para lectores de pantalla, de los enlaces que abren otra pestaña o aplicación. */
export const avisoPestanaNueva = " (se abre en una pestaña nueva)";
