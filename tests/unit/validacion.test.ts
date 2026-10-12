import { describe, expect, it } from "vitest";
import {
  esquemaCotizacion,
  normalizarTelefono,
  tiempoDeLlenadoValido,
  TIEMPO_MINIMO_MS,
} from "@/lib/validacion";

const valido = {
  nombre: "María José Pérez",
  empresa: "Constructora Ejemplo",
  telefono: "322 559 9325",
  correo: "maria@ejemplo.co",
  ciudad: "Envigado",
  servicio: "Andamiaje",
  duracion: "1 a 4 semanas",
  mensaje: "Necesito 40 cuerpos de andamio para fachada durante un mes.",
  consentimiento: true,
  sitioWeb: "",
  iniciado: 1_700_000_000_000,
};

describe("esquemaCotizacion", () => {
  it("acepta una solicitud completa y normaliza el teléfono", () => {
    const r = esquemaCotizacion.safeParse(valido);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.telefono).toBe("3225599325");
  });

  it("acepta campos opcionales vacíos", () => {
    const r = esquemaCotizacion.safeParse({ ...valido, empresa: "", correo: "", duracion: "" });
    expect(r.success).toBe(true);
  });

  it.each([
    ["+57 322 559 9325", true],
    ["(604) 444 5566", true],
    ["3225599325", true],
    ["12345", false],
    ["2225599325", false],
    ["322-559-9325-99", false],
  ])("teléfono %s → %s", (telefono, esperado) => {
    expect(esquemaCotizacion.safeParse({ ...valido, telefono }).success).toBe(esperado);
  });

  it("rechaza nombres con dígitos o símbolos", () => {
    expect(esquemaCotizacion.safeParse({ ...valido, nombre: "Bot 3000" }).success).toBe(false);
    expect(esquemaCotizacion.safeParse({ ...valido, nombre: "<script>" }).success).toBe(false);
  });

  it("rechaza servicios y ciudades fuera de las listas cerradas", () => {
    expect(
      esquemaCotizacion.safeParse({ ...valido, servicio: "Levantamientos topográficos" }).success,
    ).toBe(false);
    expect(esquemaCotizacion.safeParse({ ...valido, ciudad: "Springfield" }).success).toBe(false);
  });

  it("exige el consentimiento de tratamiento de datos (Ley 1581)", () => {
    const r = esquemaCotizacion.safeParse({ ...valido, consentimiento: false });
    expect(r.success).toBe(false);
  });

  it("rechaza saltos de línea en campos de una línea (inyección de cabeceras)", () => {
    expect(esquemaCotizacion.safeParse({ ...valido, empresa: "ACME\r\nBcc: x@y.co" }).success).toBe(
      false,
    );
    expect(esquemaCotizacion.safeParse({ ...valido, correo: "a@b.co\nBcc: c@d.co" }).success).toBe(
      false,
    );
  });

  it("permite saltos de línea en el mensaje pero no otros caracteres de control", () => {
    expect(
      esquemaCotizacion.safeParse({ ...valido, mensaje: "Línea uno\nLínea dos del pedido" })
        .success,
    ).toBe(true);
    expect(
      esquemaCotizacion.safeParse({ ...valido, mensaje: "Texto con \u0007 campana" }).success,
    ).toBe(false);
  });

  it("aplica longitudes máximas", () => {
    expect(esquemaCotizacion.safeParse({ ...valido, mensaje: "x".repeat(1501) }).success).toBe(
      false,
    );
    expect(esquemaCotizacion.safeParse({ ...valido, nombre: "a".repeat(81) }).success).toBe(false);
  });

  it("el honeypot debe venir vacío", () => {
    expect(
      esquemaCotizacion.safeParse({ ...valido, sitioWeb: "http://spam.example" }).success,
    ).toBe(false);
  });
});

describe("utilidades", () => {
  it("normalizarTelefono quita espacios, guiones y paréntesis", () => {
    expect(normalizarTelefono("(322) 559-9325")).toBe("3225599325");
  });

  it("tiempoDeLlenadoValido descarta envíos instantáneos y formularios viejos", () => {
    const ahora = 2_000_000_000_000;
    expect(tiempoDeLlenadoValido(ahora - 500, ahora)).toBe(false);
    expect(tiempoDeLlenadoValido(ahora - TIEMPO_MINIMO_MS, ahora)).toBe(true);
    expect(tiempoDeLlenadoValido(ahora - 2 * 24 * 60 * 60 * 1000, ahora)).toBe(false);
  });
});
