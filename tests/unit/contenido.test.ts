import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lineasDeServicio } from "@/content/servicios";
import { serviciosFormulario } from "@/content/formulario";
import { contacto } from "@/content/contacto";
import { fotosGaleria } from "@/content/galeria";
import generadas from "@/content/galeria.generated.json";

const RAIZ = path.resolve(__dirname, "../..");

function archivos(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) return archivos(p, ext);
    return ext.test(n) ? [p] : [];
  });
}

const fuentesDelSitio = [
  ...archivos(path.join(RAIZ, "content"), /\.(ts|json|md)$/),
  ...archivos(path.join(RAIZ, "components"), /\.tsx?$/),
  ...archivos(path.join(RAIZ, "app"), /\.(tsx?|css)$/),
].map((p) => ({ p, texto: readFileSync(p, "utf8") }));

describe("contenido", () => {
  it("las líneas del formulario coinciden con las del brochure", () => {
    expect([...serviciosFormulario]).toEqual(lineasDeServicio.map((l) => l.nombre));
  });

  it("conserva los datos de contacto reales del brochure", () => {
    expect(contacto.telefono.visible).toBe("322 559 9325");
    expect(contacto.correos.map((c) => `${c.usuario}@${c.dominio}`)).toEqual([
      "maviproyectoseinversiones@gmail.com",
      "jorgemariovillamejia@gmail.com",
    ]);
    expect(contacto.direccion.linea).toBe("Cr 25 # 41B Sur 37");
    expect(contacto.instagram.usuario).toBe("maviproyectos");
  });

  it("no contiene datos de relleno del mockup ni la errata del brochure", () => {
    const prohibidos = [
      /300 123 4567/,
      /info@mavi\.com\.co/i,
      /topogr[aá]fic/i,
      /formaltr[ií]a/i,
      /lorem ipsum/i,
    ];
    for (const { p, texto } of fuentesDelSitio) {
      for (const re of prohibidos)
        expect(re.test(texto), `${path.relative(RAIZ, p)} contiene ${re}`).toBe(false);
    }
  });

  it("no menciona en ninguna parte el nombre de la otra empresa que aparece en algunas fotos", () => {
    // Codificado para no escribir ese nombre en el repositorio (decisión del dueño, 2026-10-12).
    const palabras = ["QW5kYW1pb3M=", "QW3DqXJpY2E=", "QW1lcmljYQ=="].map((b) =>
      Buffer.from(b, "base64").toString("utf8"),
    );
    const patron = new RegExp(`${palabras[0]}\\s+(${palabras[1]}|${palabras[2]})`, "i");
    for (const { p, texto } of fuentesDelSitio)
      expect(patron.test(texto), path.relative(RAIZ, p)).toBe(false);
  });

  it("toda foto publicable tiene texto alternativo descriptivo y fue procesada", () => {
    for (const f of fotosGaleria.filter((x) => x.publicar)) {
      expect(f.alt.length, f.id).toBeGreaterThan(30);
      expect(
        generadas.some((g) => g.id === f.id),
        `${f.id} sin procesar: ejecute pnpm images`,
      ).toBe(true);
    }
  });

  it("la Formaletería está bien escrita en la línea 04", () => {
    expect(lineasDeServicio.find((l) => l.codigo === "04")?.nombre).toBe(
      "Encofrados y formaletería",
    );
  });
});
