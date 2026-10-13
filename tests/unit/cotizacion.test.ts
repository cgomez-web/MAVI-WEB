import { beforeEach, describe, expect, it, vi } from "vitest";
import { procesarCotizacion, TAMANO_MAXIMO_BYTES } from "@/lib/cotizacion";
import { reiniciarLimitesEnMemoria } from "@/lib/limite";
import { reiniciarAvisoTurnstile } from "@/lib/turnstile";

const AHORA = 2_000_000_000_000;
const ORIGEN = "https://www.maviproyectos.com";

const datosValidos = {
  nombre: "Carlos Restrepo",
  empresa: "",
  telefono: "3225599325",
  correo: "carlos@ejemplo.co",
  ciudad: "Medellín",
  servicio: "Equipos para losas",
  duracion: "",
  mensaje: "Necesito 200 puntales y 50 tableros para una losa <b>urgente</b>.",
  consentimiento: true,
  sitioWeb: "",
  transcurridoMs: 20_000,
};

function peticion(cuerpo: unknown, cabeceras: Record<string, string> = {}, ip = "203.0.113.7") {
  return new Request(`${ORIGEN}/api/cotizacion`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGEN,
      host: "www.maviproyectos.com",
      "x-forwarded-proto": "https",
      "x-forwarded-for": ip,
      ...cabeceras,
    },
    body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });
}

describe("procesarCotizacion", () => {
  let envios: Array<{ url: string; cuerpo: Record<string, unknown> }>;

  beforeEach(() => {
    reiniciarLimitesEnMemoria();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGEN);
    vi.stubEnv("RESEND_API_KEY", "re_prueba");
    vi.stubEnv("QUOTE_FROM_EMAIL", "MAVI <cotizaciones@maviproyectos.com>");
    vi.stubEnv("QUOTE_TO_EMAIL", "destino@ejemplo.co");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    envios = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        envios.push({
          url,
          cuerpo: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
        });
        return new Response(JSON.stringify({ id: "1" }), { status: 200 });
      }),
    );
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("envía el correo con el contenido del usuario escapado y sin texto libre en el asunto", async () => {
    const r = await procesarCotizacion(peticion(datosValidos), AHORA);
    expect(r.estado).toBe(200);
    expect(r.cuerpo).toEqual({ ok: true, codigo: "ok" });
    expect(envios).toHaveLength(1);
    const correo = envios[0]!.cuerpo;
    expect(envios[0]!.url).toBe("https://api.resend.com/emails");
    expect(correo.subject).toBe("Cotización web — Equipos para losas — Medellín");
    expect(String(correo.html)).toContain("&lt;b&gt;urgente&lt;/b&gt;");
    expect(String(correo.html)).not.toContain("<b>urgente</b>");
    expect(correo.reply_to).toBe("carlos@ejemplo.co");
  });

  it("rechaza peticiones sin Origin o de otro origen (CSRF)", async () => {
    expect(
      (await procesarCotizacion(peticion(datosValidos, { origin: "https://malo.example" }), AHORA))
        .estado,
    ).toBe(403);
    const sinOrigen = peticion(datosValidos);
    sinOrigen.headers.delete("origin");
    expect((await procesarCotizacion(sinOrigen, AHORA)).estado).toBe(403);
    expect(envios).toHaveLength(0);
  });

  it("exige JSON y limita el tamaño", async () => {
    expect(
      (await procesarCotizacion(peticion(datosValidos, { "content-type": "text/plain" }), AHORA))
        .estado,
    ).toBe(415);
    const grande = { ...datosValidos, mensaje: "x".repeat(20_000) };
    expect((await procesarCotizacion(peticion(grande), AHORA)).estado).toBe(413);
  });

  it("devuelve errores por campo sin detalles internos", async () => {
    const r = await procesarCotizacion(
      peticion({ ...datosValidos, telefono: "123", ciudad: "Narnia" }),
      AHORA,
    );
    expect(r.estado).toBe(400);
    expect(r.cuerpo.codigo).toBe("validacion");
    expect(Object.keys(r.cuerpo.campos ?? {})).toEqual(
      expect.arrayContaining(["telefono", "ciudad"]),
    );
    expect(JSON.stringify(r.cuerpo)).not.toMatch(/stack|Error:|at /);
  });

  it("JSON malformado → 400 genérico", async () => {
    expect((await procesarCotizacion(peticion("{nope"), AHORA)).estado).toBe(400);
  });

  it("honeypot lleno: responde ok (sin pistas para el bot) y no envía nada", async () => {
    const bot1 = await procesarCotizacion(peticion({ ...datosValidos, sitioWeb: "x" }), AHORA);
    expect(bot1.estado).toBe(200);
    expect(bot1.cuerpo).toEqual({ ok: true, codigo: "ok" });
    // Aunque el resto del contenido sea inválido, la respuesta es la misma.
    const bot2 = await procesarCotizacion(
      peticion({ sitioWeb: "http://spam.example", nombre: "x" }, {}, "203.0.113.8"),
      AHORA,
    );
    expect(bot2.cuerpo).toEqual({ ok: true, codigo: "ok" });
    expect(envios).toHaveLength(0);
  });

  it("envío instantáneo: no finge éxito, responde 'verificacion' para que la persona reintente", async () => {
    const r = await procesarCotizacion(peticion({ ...datosValidos, transcurridoMs: 300 }), AHORA);
    expect(r.estado).toBe(400);
    expect(r.cuerpo).toEqual({ ok: false, codigo: "verificacion" });
    expect(envios).toHaveLength(0);
  });

  it("no depende del reloj del navegador: una pestaña abierta desde ayer se envía", async () => {
    const r = await procesarCotizacion(
      peticion({ ...datosValidos, transcurridoMs: 25 * 60 * 60 * 1000 }),
      AHORA,
    );
    expect(r.cuerpo).toEqual({ ok: true, codigo: "ok" });
    expect(envios).toHaveLength(1);
  });

  it("sin duración de llenado: 'verificacion' sin revelar el campo", async () => {
    const { transcurridoMs, ...sinTiempo } = datosValidos;
    expect(transcurridoMs).toBeGreaterThan(0);
    const r = await procesarCotizacion(peticion(sinTiempo), AHORA);
    expect(r.estado).toBe(400);
    expect(r.cuerpo).toEqual({ ok: false, codigo: "verificacion" });
  });

  it("corta la lectura al pasar de 16 KB aunque no se declare Content-Length (chunked)", async () => {
    const trozo = new TextEncoder().encode("x".repeat(4096));
    let entregados = 0;
    const cuerpo = new ReadableStream<Uint8Array>({
      pull(control) {
        // Un emisor "infinito": si el servidor no cortara, la prueba no terminaría.
        entregados += 1;
        control.enqueue(trozo);
      },
    });
    const sinLongitud = new Request(`${ORIGEN}/api/cotizacion`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGEN,
        host: "www.maviproyectos.com",
        "x-forwarded-proto": "https",
        "x-forwarded-for": "203.0.113.9",
      },
      body: cuerpo,
      duplex: "half",
    } as RequestInit);
    expect(sinLongitud.headers.get("content-length")).toBeNull();
    const r = await procesarCotizacion(sinLongitud, AHORA);
    expect(r.estado).toBe(413);
    expect(r.cuerpo.codigo).toBe("tamano");
    expect(entregados * trozo.byteLength).toBeLessThan(TAMANO_MAXIMO_BYTES * 2);
    expect(envios).toHaveLength(0);
  });

  it("rechaza un Content-Length que no es un número", async () => {
    const r = await procesarCotizacion(peticion(datosValidos, { "content-length": "abc" }), AHORA);
    expect(r.estado).toBe(413);
  });

  it("limita a 5 solicitudes por IP cada 10 minutos", async () => {
    for (let i = 0; i < 5; i++)
      expect(
        (await procesarCotizacion(peticion(datosValidos, {}, "198.51.100.1"), AHORA)).estado,
      ).toBe(200);
    const sexta = await procesarCotizacion(peticion(datosValidos, {}, "198.51.100.1"), AHORA);
    expect(sexta.estado).toBe(429);
    expect(Number(sexta.cabeceras?.["Retry-After"])).toBeGreaterThan(0);
    // Otra IP no se ve afectada.
    expect(
      (await procesarCotizacion(peticion(datosValidos, {}, "198.51.100.2"), AHORA)).estado,
    ).toBe(200);
  });

  it("sin proveedor de correo configurado responde 503 genérico", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const r = await procesarCotizacion(peticion(datosValidos), AHORA);
    expect(r.estado).toBe(503);
    expect(r.cuerpo).toEqual({ ok: false, codigo: "no_configurado" });
  });

  it("Turnstile con solo una de las dos claves: avisa en el registro y no bloquea el formulario", async () => {
    reiniciarAvisoTurnstile();
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "0x4AAAA-publica");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const r = await procesarCotizacion(peticion(datosValidos), AHORA);
    expect(r.cuerpo).toEqual({ ok: true, codigo: "ok" });
    expect(error.mock.calls.some(([l]) => String(l).includes("turnstile_config_incompleta"))).toBe(
      true,
    );
  });

  it("si el proveedor falla responde 502 sin filtrar el error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    const r = await procesarCotizacion(peticion(datosValidos), AHORA);
    expect(r.estado).toBe(502);
    expect(r.cuerpo).toEqual({ ok: false, codigo: "envio" });
  });
});
