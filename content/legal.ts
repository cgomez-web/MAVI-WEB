/**
 * Política de tratamiento de datos personales — Ley 1581 de 2012 y Decreto 1377 de 2013
 * (compilado en el Decreto Único 1074 de 2015, art. 2.2.2.25.3.1: contenido mínimo de la política).
 *
 * TODO(owner): antes de publicar en el dominio definitivo:
 * - Escribir el NIT y, si la tiene, la razón social completa (p. ej. con "S.A.S."). Mientras `nit`
 *   esté vacío, la fila NIT no se muestra en la página.
 * - Confirmar la fecha de entrada en vigencia (`vigenteDesde`): debe ser la fecha real de publicación.
 * - Si quiere nombrar un área o persona encargada de atender consultas y reclamos, escribirla en
 *   `responsable.atencion`. Mientras esté vacío, la política indica que las atiende la propia empresa.
 * - Revisar el texto con un asesor legal.
 */
import { contacto, direccionCompleta } from "./contacto";
import { analiticaSinCookies, sitio } from "./sitio";

const correo = `${contacto.correos[0].usuario}@${contacto.correos[0].dominio}`;
const telefono = contacto.telefono.visible;

/**
 * La política menciona la analítica sin cookies solo si el layout la carga de verdad: misma
 * comprobación que app/layout.tsx (las dos variables y un host https).
 */
const conAnalitica = analiticaSinCookies() !== null;

export interface SeccionPolitica {
  titulo: string;
  parrafos: string[];
  /** Lista opcional que se muestra después de los párrafos. */
  lista?: string[];
  /** Párrafos que van después de la lista. */
  cierre?: string[];
}

const fecha = "12 de octubre de 2026";

const responsable = {
  nombre: sitio.nombre,
  /** Vacío = la fila NIT no se muestra (nunca se publica un texto provisional). */
  nit: "",
  domicilio: `${contacto.direccion.ciudad}, ${contacto.direccion.departamento}, ${contacto.direccion.pais}`,
  direccion: direccionCompleta(),
  correo,
  telefono,
  /** Área o persona que atiende consultas y reclamos. Vacío = la atiende la propia empresa. */
  atencion: "",
};

const quienAtiende = responsable.atencion
  ? `${responsable.atencion} de ${sitio.nombre}`
  : `${sitio.nombre}, como responsable del tratamiento,`;

const secciones: SeccionPolitica[] = [
  {
    titulo: "Alcance",
    parrafos: [
      "Esta política aplica a los datos personales que usted nos entrega a través de este sitio web (formulario de cotización), por WhatsApp, por teléfono o por correo electrónico.",
    ],
  },
  {
    titulo: "Datos que recolectamos",
    parrafos: [
      "Nombre, empresa (opcional), número de celular, correo electrónico, municipio de la obra y la descripción de los equipos que necesita.",
      "Para proteger el formulario contra el abuso, el servidor usa un resumen cifrado (hash) de la dirección IP de su conexión durante un máximo de 24 horas. La dirección IP no se guarda en claro.",
      "No solicitamos datos sensibles ni datos de niños, niñas o adolescentes.",
    ],
  },
  {
    titulo: "Tratamiento y finalidades",
    parrafos: [
      "Sus datos se recolectan, almacenan, consultan y usan para las siguientes finalidades, y solo se comparten con los encargados descritos en esta política cuando hace falta para cumplirlas:",
    ],
    lista: [
      "Responder su solicitud de cotización y contactarle sobre ella.",
      "Gestionar la relación comercial derivada (reserva, entrega, transporte y soporte de los equipos).",
      "Atender peticiones, quejas y reclamos.",
      "Cumplir obligaciones legales y contables.",
    ],
  },
  {
    titulo: "Autorización",
    parrafos: [
      "Usted nos autoriza a tratar sus datos al marcar la casilla de autorización del formulario de cotización o mediante conductas inequívocas, como escribirnos por WhatsApp, por teléfono o por correo para pedir una cotización (artículo 7 del Decreto 1377 de 2013).",
    ],
  },
  {
    titulo: "Derechos del titular",
    parrafos: [
      "Usted puede conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización otorgada; ser informado sobre el uso que les damos; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización o solicitar la supresión de sus datos cuando no exista un deber legal o contractual de conservarlos; y acceder gratuitamente a ellos.",
    ],
  },
  {
    titulo: "Quién atiende sus consultas y reclamos",
    parrafos: [
      `${quienAtiende} atiende directamente las consultas, los reclamos y las solicitudes de revocatoria o supresión, por correo electrónico a ${correo} o por WhatsApp y celular al ${telefono}.`,
    ],
  },
  {
    titulo: "Procedimiento para ejercer sus derechos",
    parrafos: [
      `Consultas: escríbanos a ${correo} indicando su nombre, qué información quiere conocer y un medio de respuesta. Respondemos en un máximo de diez (10) días hábiles. Si no es posible hacerlo en ese plazo, le informaremos el motivo y la fecha de respuesta, que no superará cinco (5) días hábiles adicionales (artículo 14 de la Ley 1581 de 2012).`,
      "Reclamos (corrección, actualización, supresión o incumplimiento de la ley): el reclamo debe incluir:",
    ],
    lista: [
      "Su identificación (nombre y documento).",
      "La descripción de los hechos que dan lugar al reclamo.",
      "Su dirección o el medio por el que quiere recibir la respuesta.",
      "Los documentos que quiera hacer valer.",
    ],
    cierre: [
      "Si el reclamo está incompleto, dentro de los cinco (5) días siguientes a su recibo le pediremos que lo complete; si pasan dos (2) meses desde ese requerimiento sin que lo haga, se entenderá que desistió del reclamo. Con el reclamo completo, respondemos en un máximo de quince (15) días hábiles. Si no es posible hacerlo en ese plazo, le informaremos el motivo y la fecha de respuesta, que no superará ocho (8) días hábiles adicionales (artículo 15 de la Ley 1581 de 2012).",
      `Revocatoria y supresión: puede pedir en cualquier momento que revoquemos la autorización o que suprimamos sus datos por el mismo canal (${correo}). La solicitud no procede cuando exista un deber legal o contractual de conservarlos.`,
      "Antes de acudir a la Superintendencia de Industria y Comercio, la ley pide agotar este trámite de consulta o reclamo ante el responsable (artículo 16 de la Ley 1581 de 2012).",
    ],
  },
  {
    titulo: "Encargados y transferencias",
    parrafos: [
      "Para operar este sitio usamos proveedores que pueden tratar sus datos por cuenta nuestra: alojamiento web, envío de correo electrónico y verificación anti-spam. Algunos de ellos procesan información fuera de Colombia; exigimos que apliquen medidas de seguridad adecuadas.",
    ],
  },
  {
    titulo: "Seguridad, conservación y vigencia de la base de datos",
    parrafos: [
      "Aplicamos medidas técnicas y administrativas razonables para proteger sus datos (conexión cifrada, controles de acceso y registros sin datos personales completos).",
      `La base de datos de clientes y solicitudes de cotización estará vigente mientras ${sitio.nombre} desarrolle su actividad. Sus datos se conservan mientras sean necesarios para las finalidades descritas o por el tiempo que exija la ley, y después se eliminan.`,
    ],
  },
  {
    titulo: "Cookies",
    parrafos: [
      "Este sitio no usa cookies de analítica ni de publicidad. Solo puede guardar en su navegador preferencias de visualización (por ejemplo, si desactiva las animaciones), que no salen de su dispositivo.",
      ...(conAnalitica
        ? [
            "Para saber cuántas personas visitan el sitio usamos una herramienta de estadísticas sin cookies que no identifica a los visitantes: solo produce cifras agregadas (páginas vistas, país, tipo de dispositivo).",
          ]
        : []),
    ],
  },
  {
    titulo: "Vigencia",
    parrafos: [
      `Esta política entra en vigencia el ${fecha}. Cualquier cambio sustancial se publicará en esta misma página, con su nueva fecha, antes de aplicarse.`,
    ],
  },
];

export const politicaPrivacidad = {
  titulo: "Política de tratamiento de datos personales",
  actualizada: fecha,
  vigenteDesde: fecha,
  rotulos: {
    actualizada: "Actualizada",
    vigente: "Vigente desde",
    responsable: "Responsable",
    nit: "NIT",
    domicilio: "Domicilio",
    direccion: "Dirección",
    correo: "Correo",
    telefono: "Teléfono",
  },
  responsable,
  secciones: secciones.map((s, i) => ({ ...s, titulo: `${i + 1}. ${s.titulo}` })),
};
