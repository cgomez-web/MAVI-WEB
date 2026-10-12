/**
 * Construcción de la Content-Security-Policy. Función pura para poder probarla.
 *
 * Decisiones (ver SECURITY.md):
 * - script-src: nonce por petición + 'strict-dynamic'. Los scripts de Next llevan el nonce; lo que
 *   ellos cargan (chunks dinámicos, three.js) hereda la confianza. Sin 'unsafe-inline' ni 'unsafe-eval'
 *   en producción. En desarrollo React necesita 'unsafe-eval' para sus trazas.
 * - style-src: 'self' + nonce. Excepción mínima documentada: style-src-attr 'unsafe-inline', porque el
 *   HTML renderizado en servidor lleva atributos style (dimensiones de imágenes, variables CSS por
 *   elemento). Un atributo style no puede ejecutar código.
 * - worker-src blob: lo exige three/drei para decodificadores en workers.
 * - Turnstile (Cloudflare) solo se permite si está configurado.
 */
export interface OpcionesCsp {
  nonce: string;
  desarrollo: boolean;
  /** Omitir upgrade-insecure-requests cuando se sirve por http en localhost (pruebas locales). */
  local: boolean;
  turnstile: boolean;
  analitica?: string;
}

export function construirCsp({ nonce, desarrollo, local, turnstile, analitica }: OpcionesCsp): string {
  const cloudflare = "https://challenges.cloudflare.com";
  const directivas: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(desarrollo ? ["'unsafe-eval'"] : []),
      ...(turnstile ? [cloudflare] : []),
    ],
    "style-src": desarrollo ? ["'self'", "'unsafe-inline'"] : ["'self'", `'nonce-${nonce}'`],
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      ...(turnstile ? [cloudflare] : []),
      ...(analitica ? [analitica] : []),
      ...(desarrollo ? ["ws:"] : []),
    ],
    "frame-src": turnstile ? [cloudflare] : ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const partes = Object.entries(directivas).map(([clave, valores]) => `${clave} ${valores.join(" ")}`);
  if (!desarrollo && !local) partes.push("upgrade-insecure-requests");
  return partes.join("; ");
}

/** Nonce criptográfico de 128 bits en base64 (Web Crypto, disponible en Edge y Node). */
export function generarNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}
