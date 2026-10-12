/**
 * Política de tratamiento de datos personales — Ley 1581 de 2012 y Decreto 1377 de 2013
 * (compilado en el Decreto Único 1074 de 2015).
 * TODO(owner): completar NIT y revisar con asesor legal antes de publicar.
 */
import { contacto } from "./contacto";
import { sitio } from "./sitio";

const correo = `${contacto.correos[0].usuario}@${contacto.correos[0].dominio}`;

export const politicaPrivacidad = {
  titulo: "Política de tratamiento de datos personales",
  actualizada: "12 de octubre de 2026",
  responsable: {
    nombre: sitio.nombre,
    nit: "TODO(owner): NIT",
    direccion: `${contacto.direccion.linea}, ${contacto.direccion.ciudad}, ${contacto.direccion.departamento}`,
    correo,
    telefono: contacto.telefono.visible,
  },
  secciones: [
    {
      titulo: "1. Alcance",
      parrafos: [
        "Esta política aplica a los datos personales que usted nos entrega a través de este sitio web (formulario de cotización), por WhatsApp, por teléfono o por correo electrónico.",
      ],
    },
    {
      titulo: "2. Datos que recolectamos",
      parrafos: [
        "Nombre, empresa (opcional), número de celular, correo electrónico, municipio de la obra y la descripción de los equipos que necesita.",
        "No solicitamos datos sensibles ni datos de niños, niñas o adolescentes.",
      ],
    },
    {
      titulo: "3. Finalidades",
      parrafos: [
        "Responder su solicitud de cotización y contactarle sobre ella.",
        "Gestionar la relación comercial derivada (reserva, entrega, transporte y soporte de los equipos).",
        "Atender peticiones, quejas y reclamos.",
        "Cumplir obligaciones legales y contables.",
      ],
    },
    {
      titulo: "4. Derechos del titular",
      parrafos: [
        "Usted puede conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización otorgada; ser informado sobre el uso que les damos; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización o solicitar la supresión de sus datos cuando no exista un deber legal o contractual de conservarlos; y acceder gratuitamente a ellos.",
      ],
    },
    {
      titulo: "5. Cómo ejercer sus derechos",
      parrafos: [
        `Escríbanos a ${correo} indicando su nombre, su solicitud y un medio de respuesta.`,
        "Las consultas se atienden en un máximo de diez (10) días hábiles y los reclamos en un máximo de quince (15) días hábiles, prorrogables en los términos de los artículos 14 y 15 de la Ley 1581 de 2012.",
      ],
    },
    {
      titulo: "6. Encargados y transferencias",
      parrafos: [
        "Para operar este sitio usamos proveedores que pueden tratar sus datos por cuenta nuestra: alojamiento web, envío de correo electrónico y verificación anti-spam. Algunos de ellos procesan información fuera de Colombia; exigimos que apliquen medidas de seguridad adecuadas.",
      ],
    },
    {
      titulo: "7. Seguridad y conservación",
      parrafos: [
        "Aplicamos medidas técnicas y administrativas razonables para proteger sus datos (conexión cifrada, controles de acceso y registros sin datos personales completos). Conservamos la información mientras sea necesaria para las finalidades descritas o por el tiempo que exija la ley.",
      ],
    },
    {
      titulo: "8. Cookies",
      parrafos: [
        "Este sitio no usa cookies de analítica ni de publicidad. Solo puede guardar en su navegador preferencias de visualización (por ejemplo, si desactiva las animaciones), que no salen de su dispositivo.",
      ],
    },
    {
      titulo: "9. Vigencia",
      parrafos: [
        "Esta política rige desde su publicación. Cualquier cambio sustancial se publicará en esta misma página.",
      ],
    },
  ],
} as const;
