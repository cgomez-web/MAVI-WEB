import { NextResponse } from "next/server";
import { procesarCotizacion } from "@/lib/cotizacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const r = await procesarCotizacion(request);
  return NextResponse.json(r.cuerpo, {
    status: r.estado,
    headers: { "Cache-Control": "no-store", ...(r.cabeceras ?? {}) },
  });
}
