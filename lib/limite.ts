/**
 * Rate limiting por ventana fija.
 * - Producción: Upstash Redis vía su API REST (INCR + PEXPIRE NX en un pipeline), global entre instancias.
 * - Sin Upstash configurado: memoria del proceso (válido en desarrollo / un solo servidor; en serverless
 *   cada instancia cuenta por separado — documentado en SECURITY.md).
 * La clave es un hash de la IP: nunca se guarda la IP en claro.
 */
import { registrar } from "./log";

export interface ReglaLimite {
  nombre: string;
  maximo: number;
  ventanaMs: number;
}

export const REGLAS_COTIZACION: ReglaLimite[] = [
  { nombre: "10min", maximo: 5, ventanaMs: 10 * 60 * 1000 },
  { nombre: "dia", maximo: 20, ventanaMs: 24 * 60 * 60 * 1000 },
];

export interface ResultadoLimite {
  permitido: boolean;
  reintentarEnSeg: number;
}

const memoria = new Map<string, { cuenta: number; vence: number }>();

function enMemoria(clave: string, regla: ReglaLimite, ahora: number): { cuenta: number; vence: number } {
  // Limpieza oportunista para que el mapa no crezca sin límite.
  if (memoria.size > 5000) {
    for (const [k, v] of memoria) if (v.vence <= ahora) memoria.delete(k);
  }
  const actual = memoria.get(clave);
  if (!actual || actual.vence <= ahora) {
    const nuevo = { cuenta: 1, vence: ahora + regla.ventanaMs };
    memoria.set(clave, nuevo);
    return nuevo;
  }
  actual.cuenta += 1;
  return actual;
}

async function enUpstash(clave: string, regla: ReglaLimite, ahora: number): Promise<{ cuenta: number; vence: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const respuesta = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", clave],
      ["PEXPIRE", clave, String(regla.ventanaMs), "NX"],
      ["PTTL", clave],
    ]),
    cache: "no-store",
    signal: AbortSignal.timeout(2500),
  });
  if (!respuesta.ok) throw new Error(`upstash ${respuesta.status}`);
  const datos = (await respuesta.json()) as Array<{ result?: number; error?: string }>;
  const cuenta = Number(datos[0]?.result ?? 0);
  const ttl = Number(datos[2]?.result ?? regla.ventanaMs);
  return { cuenta, vence: ahora + Math.max(0, ttl) };
}

export async function hashClave(texto: string): Promise<string> {
  const sal = process.env.RATE_LIMIT_SALT ?? "mavi-rl";
  const bytes = new TextEncoder().encode(`${sal}:${texto}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function comprobarLimite(
  identificador: string,
  reglas: ReglaLimite[] = REGLAS_COTIZACION,
  ahora = Date.now(),
): Promise<ResultadoLimite> {
  const id = await hashClave(identificador);
  const usarUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  for (const regla of reglas) {
    const clave = `rl:cotizacion:${regla.nombre}:${id}`;
    let estado: { cuenta: number; vence: number };
    try {
      estado = usarUpstash ? await enUpstash(clave, regla, ahora) : enMemoria(clave, regla, ahora);
    } catch (error) {
      // Si el almacén externo falla se degrada a memoria: nunca se deja el formulario sin límite.
      registrar("warn", "rate_limit_degradado", { motivo: error instanceof Error ? error.message : "desconocido" });
      estado = enMemoria(clave, regla, ahora);
    }
    if (estado.cuenta > regla.maximo) {
      return { permitido: false, reintentarEnSeg: Math.max(1, Math.ceil((estado.vence - ahora) / 1000)) };
    }
  }
  return { permitido: true, reintentarEnSeg: 0 };
}

/** Solo para pruebas. */
export function reiniciarLimitesEnMemoria() {
  memoria.clear();
}
