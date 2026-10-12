"""
Genera public/brochure-mavi-proyectos-e-inversiones.pdf a partir del brochure original.

El original (8 páginas, solo imágenes, 3,5 MB) se re-rasteriza a 130 ppp y se recomprime en JPEG
progresivo (calidad 72), sin metadatos de creador. El original nunca se modifica.

Uso (requiere Python 3 + PyMuPDF + Pillow):
    python scripts/comprimir-brochure.py "../Brochure MAVI proyectos e inversiones.pdf"
"""
import io
import os
import sys

import fitz  # PyMuPDF
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, "public", "brochure-mavi-proyectos-e-inversiones.pdf")


def main(origen: str) -> None:
    fuente = fitz.open(origen)
    salida = fitz.open()
    for pagina in fuente:
        pix = pagina.get_pixmap(dpi=130)
        imagen = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        bufer = io.BytesIO()
        imagen.save(bufer, "JPEG", quality=72, optimize=True, progressive=True)
        nueva = salida.new_page(width=pagina.rect.width, height=pagina.rect.height)
        nueva.insert_image(nueva.rect, stream=bufer.getvalue())
    salida.set_metadata(
        {"title": "Brochure MAVI Proyectos e Inversiones", "author": "MAVI Proyectos e Inversiones", "producer": "", "creator": ""}
    )
    salida.save(DESTINO, garbage=4, deflate=True)
    print(f"{os.path.getsize(origen):,} → {os.path.getsize(DESTINO):,} bytes")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, "..", "Brochure MAVI proyectos e inversiones.pdf"))
