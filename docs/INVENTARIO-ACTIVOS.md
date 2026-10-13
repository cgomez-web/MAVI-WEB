# Inventario de activos — MAVI Proyectos e Inversiones

Fecha de revisión: 2026-10-12. Originales en `E:\PAGINA WEB\` (no se modifican). Todo lo procesado vive en `mavi-web/`.

## 1. Brochure (fuente de verdad)

| Archivo                                      | Estado                                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Brochure MAVI proyectos e inversiones.pdf`  | 8 págs. A4, 1 imagen raster por página, **0 caracteres de texto extraíble**. Leído visualmente a 110 dpi. |
| `Brochure MAVI proyectos ev inversiones.pdf` | **Idéntico** (MD5 `de64acde…`). Ignorado.                                                                 |

Contenido verificado contra el prompt — coincide en todo. Detalles adicionales leídos en las páginas que el prompt no transcribía (se usan tal cual en `content/`):

- **P1**: párrafo "En MAVI Proyectos Inversiones nos preocupamos por el avance de cada proyecto. Por eso, ofrecemos soluciones integrales, poniendo a su disposición maquinaria, equipos, transporte y servicios especializados para responder a las diferentes necesidades que surgen en cada obra."
- **P2**: "Somos una empresa comprometida con el desarrollo de grandes y pequeños proyectos, ofreciendo soluciones confiables, eficientes y a la medida de cada necesidad." La misión termina en "…para el éxito de sus proyectos."
- **P3**: subtítulo "Equipos de alto rendimiento para trabajos exigentes y de gran escala." + descripción por equipo (excavadoras: movimiento de tierras, excavaciones y obras civiles; retro: versátiles, potentes y eficientes en múltiples tareas; mini retro: espacios reducidos y trabajos de precisión; mini cargadores: cargue, movimiento de materiales y superficies compactas).
- **P4**: subtítulo "Soluciones confiables para movilizar, cargar y elevar sus proyectos." Volquetas: transporte seguro y eficiente de materiales. Grúas: izaje y montaje de estructuras, equipos y materiales. Planchones: transporte de maquinaria y equipos especiales. Camabajas: transporte de maquinaria pesada y equipos de gran formato.
- **P5**: subtítulo "Sistemas seguros y eficientes para la construcción de losas." Correas: soportan el peso de la losa. Portacorreas: distribuyen la carga de manera uniforme. Sopandas: diferentes alturas y capacidades. Puntales/tacos: estabilidad y seguridad en la estructura. Tableros: superficies resistentes y de alta durabilidad.
- **P6**: subtítulo "Sistemas versátiles y de alta calidad para todo tipo de estructuras." Errata "FORMALTRÍA" → **corregida a "Formaletería"** en todo el sitio.
- **P7**: subtítulo "Todo lo que necesita para complementar su proyecto." Generadores: de diferentes capacidades. Compresores: para herramientas neumáticas. Vibradores: para concreto.
- **P8**: "Andamiaje — Seguridad y soporte en cada nivel." Frases "¡Contáctenos!" y "Estamos listos para atenderle."

> Las fotos del brochure son ilustraciones genéricas (aparentan ser generadas/stock). **No se reutilizan** en el sitio: no tienen licencia documentada.

## 2. Datos complementarios

| Archivo                         | Uso                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `photo_2026-10-12_09-37-59.jpg` | Captura con dirección **"cr 25 n 41 b sur 37, Envigado"** → normalizada a `Cr 25 # 41B Sur 37, Envigado, Antioquia`. Solo dato.                                                                                                                                                                                                       |
| `photo_2026-10-12_09-37-54.jpg` | QR de Instagram **@maviproyectos**. Solo dato; no se publica.                                                                                                                                                                                                                                                                         |
| `photo_2026-10-08_10-19-58.jpg` | **Logo MAVI en raster** (1280×853, fondo blanco): engranaje, excavadora + volqueta, wordmark "MAVI", banda "PROYECTOS INVERSIONES", lema "Facilitamos su avance". Se usa **solo como referencia** para redibujar el logo en SVG y para muestrear el amarillo de marca (**#FCBF06**, moda de píxeles amarillos). No se publica el JPG. |

## 3. Mockup de referencia

`photo_2026-10-08_10-17-24.jpg` — página oscura con acentos amarillos.

**Se toma**: tono oscuro + amarillo, sensación industrial/premium; el orden lógico (hero → confianza → servicios → por qué → prueba → cotización → footer); el formulario con campos de ciudad/servicio; el botón de WhatsApp siempre visible.

**Se descarta**: hero con texto a la izquierda + foto de stock; rejilla simétrica de 8 tarjetas con foto + icono + botón; iconos genéricos de línea; botones redondeados; sección "Proyectos" (MAVI no ha suministrado proyectos reales); subida de archivos en el formulario (fuera de alcance v1 por seguridad). **Datos de relleno prohibidos**: `+57 300 123 4567`, `info@mavi.com.co`, "Copacabana", servicios de "levantamientos topográficos", "diseño de obras civiles", "construcción", "consultoría", "obras civiles y metálicas".

## 4. Fotografías de bodega y obra (30 archivos `photo_2026-10-08_10-18-xx / 10-19-xx`)

Hallazgos técnicos: todas JPEG sRGB, 576–1280 px de lado mayor (fotos de WhatsApp recomprimidas), **sin EXIF** (0 etiquetas) — igual se fuerza el borrado de metadatos en el pipeline. Duplicados detectados por MD5 (exactos) y por _dHash_ 64 bits (casi duplicados, distancia de Hamming ≤ 6); entre cada par se conserva la más nítida (varianza de bordes).

| #   | Original | Qué muestra                                                                                                                | Categoría                     | Nombre semántico              | Decisión                                                                           |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| 1   | 10-18-16 | Fila de ~15 plumas de cargue (malacates azules con tambor de cable) sobre bases rojas, contra muro de ladrillo             | Otros equipos · plumas        | `plumas-de-cargue-01`         | **Usar** (portada de la galería)                                                   |
| 2   | 10-18-19 | Andamio tubular multidireccional armado en obra; estructura de concreto, polisombra verde, trabajadores con casco al fondo | Andamiaje (en obra)           | `andamio-tubular-en-obra-01`  | **Usar**                                                                           |
| 3   | 10-18-29 | —                                                                                                                          | —                             | —                             | **Duplicado exacto de #2** → descartar                                             |
| 4   | 10-18-32 | Rotomartillo eléctrico sobre piso de baldosa; marca de agua "Galaxy A33 5G"                                                | Otros equipos · herramientas  | —                             | Casi duplicado temático de #5, menos nítido → descartar                            |
| 5   | 10-18-36 | Rotomartillo eléctrico (otra toma); se ve el pie del fotógrafo y marca de agua                                             | Otros equipos · herramientas  | `herramienta-rotomartillo-01` | **Usar recortada** (sin pie ni marca de agua)                                      |
| 6   | 10-18-39 | Andamio de marco rojo armado en fachada de una edificación en obra; un operario arriba                                     | Andamiaje (en obra)           | `andamio-de-fachada-01`       | **Usar**                                                                           |
| 7   | 10-18-42 | Compactador de placa con motor a gasolina; apisonador al fondo                                                             | Otros equipos · menores       | `compactador-de-placa-01`     | **Usar**                                                                           |
| 8   | 10-18-45 | Apisonador tipo "canguro" azul                                                                                             | Otros equipos · menores       | `apisonador-canguro-01`       | **Usar**                                                                           |
| 9   | 10-18-49 | Compresor remolcable Airman PDS185S; **rótulos pintados de otra empresa y de un distribuidor**                             | Otros equipos · compresores   | `compresor-remolcable-01`     | **Usar solo con los rótulos ajenos tapados por completo** (parche opaco, ilegible) |
| 10  | 10-18-53 | Lote de puntales metálicos telescópicos recostados contra el muro                                                          | Equipos para losas            | `puntales-metalicos-01`       | **Usar**                                                                           |
| 11  | 10-18-57 | Cuerpos de andamio de marco rojos apilados; formaletas de madera detrás                                                    | Andamiaje                     | `andamios-de-marco-01`        | **Usar** (rótulo ajeno al fondo → recortar/tapar)                                  |
| 12  | 10-19-00 | Mezcladora de concreto (trompo) roja con volante; puntales y tableros alrededor                                            | Otros equipos · menores       | `mezcladora-de-concreto-01`   | **Usar** (rótulo ajeno al fondo → recortar/tapar)                                  |
| 13  | 10-19-03 | Plumas de cargue almacenadas en estantería (toma vertical)                                                                 | Otros equipos · plumas        | `plumas-de-cargue-02`         | **Usar**                                                                           |
| 14  | 10-19-07 | Equipos de izaje rojos con motor y brazo, mangueras negras; **rótulo de otra empresa**                                     | Otros equipos                 | `equipos-de-izaje-01`         | **Usar solo con el rótulo ajeno tapado**; identificación exacta a confirmar        |
| 15  | 10-19-10 | Moldes metálicos partidos para cilindros de ensayo de concreto, con placa base y pernos (uso a confirmar)                  | Otros equipos                 | `moldes-cilindricos-01`       | **Usar**; confirmar uso y si se alquilan                                           |
| 16  | 10-19-12 | Carrete y caballetes hechos en varilla corrugada; mezcladora al costado (no son andamios)                                  | Otros equipos                 | `carretes-de-varilla-01`      | **Usar**; confirmar qué equipo es y si se alquila                                  |
| 17  | 10-19-15 | Panorámica de la estantería con decenas de plumas de cargue                                                                | Otros equipos · plumas        | `plumas-de-cargue-03`         | **Usar**                                                                           |
| 18  | 10-19-19 | —                                                                                                                          | —                             | —                             | **Duplicado exacto de #16** → descartar                                            |
| 19  | 10-19-21 | Esquineros metálicos de formaleta apilados en estantería; paneles perforados debajo                                        | Encofrados                    | `esquineros-de-formaleta-01`  | **Usar**                                                                           |
| 20  | 10-19-25 | Pilas de formaletas metálicas perforadas                                                                                   | Encofrados                    | —                             | Casi duplicado de #24 → descartar                                                  |
| 21  | 10-19-29 | Formaletas metálicas perforadas en estantería, vista frontal                                                               | Encofrados                    | `formaletas-metalicas-02`     | **Usar**                                                                           |
| 22  | 10-19-33 | Formaletas y esquineros en estantería con escalera al lado                                                                 | Encofrados                    | `formaletas-metalicas-03`     | **Usar**                                                                           |
| 23  | 10-19-36 | Tableros metálicos rojo/azul y tableros amarillos apilados                                                                 | Equipos para losas · tableros | `tableros-01`                 | **Usar**                                                                           |
| 24  | 10-19-40 | Pilas de formaletas metálicas perforadas (la más nítida del par)                                                           | Encofrados                    | `formaletas-metalicas-01`     | **Usar**                                                                           |
| 25  | 10-19-42 | Puntales telescópicos rojo/azul, vista cenital                                                                             | Equipos para losas            | —                             | Casi duplicado de #26 → descartar                                                  |
| 26  | 10-19-45 | Ídem, más nítida                                                                                                           | Equipos para losas            | `puntales-metalicos-02`       | **Usar**                                                                           |
| 27  | 10-19-48 | Allanadora de concreto mecánica ("helicóptero")                                                                            | Otros equipos · menores       | `allanadora-de-concreto-01`   | **Usar**                                                                           |
| 28  | 10-19-51 | —                                                                                                                          | —                             | —                             | Casi duplicado de #27 → descartar                                                  |
| 29  | 10-19-54 | —                                                                                                                          | —                             | —                             | Casi duplicado de #23 → descartar                                                  |
| 30  | 10-19-58 | Logo MAVI                                                                                                                  | Marca                         | —                             | Referencia para SVG; no se publica                                                 |

**Resultado**: 22 fotos publicables, 2 duplicados exactos + 5 casi duplicados descartados, 1 logo de referencia (22 + 2 + 5 + 1 = 30 archivos). Es lo que publica `content/galeria.ts`.

### Cobertura por línea de servicio

| Línea                      | Fotos reales                                                                                                                                | Estrategia visual                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Maquinaria pesada          | 0                                                                                                                                           | Ilustración 3D propia + iconos SVG propios |
| Transporte y elevación     | 0                                                                                                                                           | Ilustración 3D propia + iconos SVG propios |
| Equipos para losas         | 3 (puntales ×2, tableros)                                                                                                                   | Fotos reales                               |
| Encofrados y formaletería  | 4 (formaletas ×3, esquineros)                                                                                                               | Fotos reales                               |
| Andamiaje                  | 3 (2 en obra, 1 en bodega)                                                                                                                  | Fotos reales                               |
| Otros equipos y accesorios | 12 (plumas ×3, compresor, mezcladora, compactador, apisonador, allanadora, rotomartillo, izaje, moldes para cilindros, carretes de varilla) | Fotos reales                               |

### Observaciones para el dueño (también en `PENDIENTES.md`)

1. **Rótulos de otra empresa** (decisión del dueño, 2026-10-12): el compresor (#9), los equipos de izaje (#14) y fondos de #11/#12 llevan pintado el nombre y número de **otra empresa**. **Ese nombre no puede aparecer en el sitio ni en ningún asset publicado.** El pipeline (`scripts/process-images.ts`) los tapa con parches opacos o los recorta, y la verificación visual queda registrada en `docs/REPORTE-FINAL.md`. Por la misma razón, ese nombre no se escribe en ningún archivo del repositorio.
2. **Personas**: #2 y #6 muestran trabajadores lejanos, sin rostros identificables a la resolución publicada. Confirmar autorización de uso de imagen de la obra.
3. **Identificación**: confirmar #14 (equipos de izaje), #15 (moldes para cilindros de ensayo de concreto; hoy en "Otros equipos") y #16 (carrete y caballetes de varilla, antes rotulados como andamios) para afinar los textos alternativos y decidir si se publican.
