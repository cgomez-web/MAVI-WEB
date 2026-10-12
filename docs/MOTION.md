# Sistema de movimiento — MAVI

Un solo lenguaje: **la carga que se deposita**. Las cosas arrancan lentas (inercia de algo pesado), avanzan con decisión y **asientan** con contundencia. Motor único: **GSAP 3.15** (ScrollTrigger + SplitText). El 3D toma su progreso del mismo ScrollTrigger.

## Tokens (`lib/motion.ts` + variables CSS)

| Token | Valor | Uso |
|---|---|---|
| `--dur-micro` | 120 ms | Hover, foco, estados de botón |
| `--dur-ui` | 480 ms | Paneles, lightbox, reveals de UI |
| `--dur-scene` | 1100 ms (rango 900–1400) | Preloader, hero, transiciones de sección |
| `--ease-out-weight` | `cubic-bezier(0.16, 1, 0.3, 1)` | Salidas y entradas: arranque decidido, frenado largo |
| `--ease-land` | `cubic-bezier(0.34, 1.36, 0.64, 1)` | Elementos que "aterrizan" (sobrepaso leve tipo resorte) |
| `--ease-lift` | `cubic-bezier(0.7, 0, 0.84, 0)` | Elementos que se levantan/salen (arranque pesado) |
| `--stagger-word` | 70 ms | Palabras del hero |
| `--stagger-row` | 45 ms | Filas de fichas técnicas |

Prohibido: `ease`, `ease-in-out` y 300 ms por defecto. Todo usa tokens.

## Inventario

| # | Animación | Qué comunica | Detalle | Reduced motion |
|---|---|---|---|---|
| 1 | **Preloader "nivelando"** | Precisión antes de empezar | Burbuja de nivel que oscila y se centra (≤ 900 ms, nunca bloquea: el HTML ya está pintado debajo y el preloader no aparece si la carga tarda < 200 ms o si es una navegación interna). Al centrarse dispara la cinta (#5) que revela el hero. | Omitido |
| 2 | **Titulares con peso** | Peso, carga depositada | SplitText por palabras; cada palabra baja 0.6em desde arriba con `--ease-land` y stagger 70 ms; al asentar la última, la línea base (filete de 2 px) vibra 2 px una vez. | Fundido 200 ms |
| 3 | **Tipografía viva** | Compactación, orden de obra | Encabezados sticky de cada línea de servicio: `font-variation-settings: "wdth" 125 → 62` y `"wght" 900 → 780` interpolados con el progreso de fijado (ScrollTrigger `scrub`). | Fijo en wdth 100 |
| 4 | **Odómetro** | Cifras reales, mecánicas | Rodillos verticales por dígito (`translateY` en %) con `--ease-out-weight`, 1400 ms, al entrar en viewport. Valores: +15 años, 330 HP, 100 T, 20 m³, 250 kg. Texto real accesible en `aria-label`. | Muestra el valor final |
| 5 | **Cinta (transición de sección)** | Avance, cambio de fase | Máscara diagonal amarilla (`clip-path` −6°) barre de izquierda a derecha y revela el contenido, con grano. Misma geometría en hover de botones (relleno diagonal) y en el botón de WhatsApp. | Sin barrido; corte directo |
| 6 | **Sello estarcido** | Certificación, verificado | Al entrar: escala 1.15 → 1, opacidad 0 → 1, rotación −8° → −4°, `--ease-land`, 480 ms. | Visible sin animación |
| 7 | **Ficha como plano** | Precisión técnica | Filetes de la tabla se dibujan (`scaleX 0→1`, origen izquierdo) fila a fila, stagger 45 ms; el texto aparece tras su filete. | Visible |
| 8 | **Marquee de equipos** | Disponibilidad, inventario en movimiento | Lista de equipos sobre la franja de peligro; velocidad base 40 px/s multiplicada por la velocidad de scroll (con inercia, decae en 600 ms). Se pausa con hover y foco. | **Oculto** (se muestra la lista estática) |
| 9 | **Galería arrastrable** | Inventario tangible | Arrastre con inercia (pointer events + rAF, fricción 0.92). Cursor: gancho de grúa sobre la galería, "+" sobre lo que abre lightbox. Teclado: flechas + botones visibles. | Sin inercia; scroll nativo |
| 10 | **Subrayado cinta métrica** | Medición, precisión | En enlaces: ticks (gradiente repetido) se trazan de izquierda a derecha con `background-size` 0 → 100 %, 480 ms. | Subrayado estático |
| 11 | **Cursor** | Feedback físico | Punto rojo puntal + anillo de 28 px que se expande a 56 px sobre interactivos (`--ease-out-weight`, 480 ms). Solo `pointer: fine`. | Cursor nativo |
| 12 | **Tilt de tarjetas de servicio** | Objeto físico, tangible | Rotación máx. 6° siguiendo el puntero + revelado de la ficha (HP/t/m³) al hover/foco/tap. | Sin tilt; ficha visible |
| 13 | **Escena 3D por scroll** | La obra avanza con el usuario | Ver storyboard en `PLAN.md` §3. La cabina de la excavadora sigue el cursor con lerp 0.08. | Póster estático |
| 14 | **Barra de progreso cinta métrica** | Cuánto falta de la obra | Barra superior de 4 px con ticks; `scaleX` = progreso de scroll. | Visible, sin suavizado |

## Reglas

1. Si una animación no comunica **peso, avance, precisión o disponibilidad**, se elimina.
2. Nada bloquea la lectura más de 300 ms: el contenido existe en el HTML desde el primer pintado; las animaciones parten de estados visibles en ausencia de JS (`.js` en `<html>` habilita los estados iniciales ocultos).
3. `prefers-reduced-motion: reduce` → todo se reduce a fundidos ≤ 200 ms o a estado final.
4. Sin scroll-jacking: Lenis es opcional, se apaga con reduced motion, en touch y desde el conmutador "Movimiento" del header.
5. Sin sonido.
