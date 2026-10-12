# Licencias de activos

Ningún activo de terceros con licencia desconocida. Sin fotos de stock, sin modelos 3D externos, sin iconos de librerías en las secciones principales.

## Tipografías (self-hosted, `app/fonts/`)

| Familia                                | Uso             | Licencia                                                       | Fuente                                                                                                                      | Archivo                                                                     |
| -------------------------------------- | --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Archivo (variable `wght`, `wdth`)      | Display         | SIL Open Font License 1.1 — © 2020 The Archivo Project Authors | [Omnibus-Type/Archivo](https://github.com/Omnibus-Type/Archivo) vía `@fontsource-variable/archivo` 5.3.0                    | `archivo-var.woff2` (+ instancias estáticas para la imagen OG en `app/og/`) |
| Hanken Grotesk (variable `wght`)       | Texto           | OFL 1.1 — © 2021 The Hanken Grotesk Project Authors            | [marcologous/hanken-grotesk](https://github.com/marcologous/hanken-grotesk) vía `@fontsource-variable/hanken-grotesk` 5.3.0 | `hanken-grotesk-var.woff2`                                                  |
| Martian Mono (variable `wght`, `wdth`) | Datos técnicos  | OFL 1.1 — © 2020 The Martian Mono Project Authors              | [evilmartians/mono](https://github.com/evilmartians/mono) vía `@fontsource-variable/martian-mono` 5.3.0                     | `martian-mono-var.woff2`                                                    |
| Saira Stencil One                      | Sellos (4 usos) | OFL 1.1 — © 2019 The Saira Stencil Project Authors             | [Omnibus-Type/Saira](https://github.com/Omnibus-Type/Saira) vía `@fontsource/saira-stencil-one` 5.3.0                       | `saira-stencil-one.woff2`                                                   |

Los archivos se subconjuntaron (latín + signos usados en español) con `fontTools`; la OFL permite modificar y redistribuir conservando la licencia. Textos completos en `app/fonts/licencias/`. Las fuentes no se venden por separado.

## Fotografías

| Activo                                           | Titular                      | Licencia / permiso                                                                                                                                                                                 |
| ------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 22 fotos de bodega y obra (`public/img/bodega/`) | MAVI Proyectos e Inversiones | Suministradas por el dueño para su sitio. Procesadas: recortes, parches que eliminan rótulos de otra empresa, una placa de vehículo y un folleto; EXIF eliminado. Ver `docs/INVENTARIO-ACTIVOS.md` |
| Brochure PDF (`public/brochure-…pdf`)            | MAVI Proyectos e Inversiones | Documento del dueño, recomprimido                                                                                                                                                                  |

TODO(owner): confirmar la autorización de uso de imagen de los trabajadores que aparecen (lejanos, no identificables) en las 2 fotos de obra.

## Marca

| Activo                                                                    | Origen                                                                       |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Logo MAVI (SVG: engranaje, wordmark, banda, lema), favicon `app/icon.svg` | Redibujo vectorial propio a partir del logo del brochure (propiedad de MAVI) |

## Gráficos e ilustración

| Activo                                                                | Origen                                                                 | Licencia                      |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| Set de 15 iconos (`components/icons/Icono.tsx`)                       | Diseño propio en código                                                | Propiedad del proyecto (MAVI) |
| Escena 3D (máquinas, obra, cielo, polvo, engranaje)                   | 100 % procedural en código (`components/three/`): 0 archivos de modelo | Propiedad del proyecto        |
| Póster 2D de la escena (`PosterObra.tsx`), grano SVG, franjas, reglas | SVG/CSS propios                                                        | Propiedad del proyecto        |
| Imagen Open Graph (`app/opengraph-image.tsx`)                         | Generada en build con las fuentes de arriba                            | Propiedad del proyecto        |

## Software

Dependencias npm con sus licencias (MIT/Apache-2.0/ISC/BSD). Destacadas: Next.js (MIT), React (MIT), three.js (MIT), @react-three/fiber y drei (MIT), GSAP 3.15 (licencia estándar "no-charge" de GreenSock/Webflow, uso comercial permitido), Lenis (MIT), Zod (MIT), React Hook Form (MIT), Tailwind CSS (MIT), sharp (Apache-2.0).
