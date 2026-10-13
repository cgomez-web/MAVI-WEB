import { describe, expect, it } from "vitest";
import { FASES, enFase, tramo } from "@/components/three/fases";
import { CAPAS_POSTER, kCapa, solEn } from "@/components/three/posterCapas";

describe("fases del storyboard (PLAN.md §3)", () => {
  it("cubren el progreso de 0 a 1 sin huecos ni solapes", () => {
    expect(FASES[0]?.desde).toBe(0);
    expect(FASES[FASES.length - 1]?.hasta).toBe(1);
    for (let i = 1; i < FASES.length; i++) expect(FASES[i]?.desde).toBe(FASES[i - 1]?.hasta);
  });

  it("tramo es un smoothstep acotado a [0, 1]", () => {
    expect(tramo(-1, 0, 1)).toBe(0);
    expect(tramo(0.5, 0, 1)).toBe(0.5);
    expect(tramo(2, 0, 1)).toBe(1);
  });

  it("el progreso local de una fase va de 0 a 1 dentro de ella", () => {
    const v = enFase(0.35, "transporte-y-elevacion", 0, 1);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
    expect(enFase(0.2, "transporte-y-elevacion")).toBe(0);
    expect(enFase(0.5, "transporte-y-elevacion")).toBe(1);
  });
});

describe("póster 2D por capas (cuenta las mismas fases que el 3D)", () => {
  it("la grúa no está en el hero: entra en Transporte y elevación", () => {
    expect(kCapa("grua", 0)).toBe(0);
    expect(kCapa("grua", 0.42)).toBe(1);
  });

  it("el minicargador nivela en Maquinaria pesada y se va al llegar el transporte", () => {
    expect(kCapa("minicargador", 0.2)).toBeGreaterThan(0);
    expect(kCapa("minicargador", 0.42)).toBe(0);
  });

  it("el engranaje MAVI abre y cierra la historia", () => {
    expect(kCapa("engranaje-inicio", 0)).toBe(1);
    expect(kCapa("engranaje-inicio", 0.5)).toBe(0);
    expect(kCapa("engranaje-cierre", 0)).toBe(0);
    expect(kCapa("engranaje-cierre", 1)).toBe(1);
  });

  it("los puntales llegan con su fase, no antes", () => {
    expect(kCapa("puntales-a", 0.3)).toBe(0);
    expect(kCapa("puntales-a", 0.56)).toBe(1);
  });

  it("todas las capas dan un avance entre 0 y 1 en todo el recorrido", () => {
    for (const id of Object.keys(CAPAS_POSTER) as (keyof typeof CAPAS_POSTER)[])
      for (let p = 0; p <= 1; p += 0.05) {
        const k = kCapa(id, p);
        expect(k, `${id} @ ${p.toFixed(2)}`).toBeGreaterThanOrEqual(0);
        expect(k, `${id} @ ${p.toFixed(2)}`).toBeLessThanOrEqual(1);
      }
  });

  it("el sol sale a la izquierda y se pone a la derecha", () => {
    const [xInicio] = solEn(0);
    const [xFin] = solEn(1);
    expect(xInicio).toBeLessThan(xFin);
    expect(solEn(0.5)[1]).toBeLessThan(solEn(0)[1]); // a mediodía está más alto (y menor)
  });
});
