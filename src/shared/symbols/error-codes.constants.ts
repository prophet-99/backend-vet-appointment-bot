import { getServiceDisplayNames } from '@domain/enums/service-name.enum';

export const ErrorCodes = {
  // 200 SERIES (Ok response)
  USER_INTENT_NOT_IDENTIFIED: {
    code: 'USER_INTENT_NOT_IDENTIFIED',
    statusCode: 200,
    message:
      'Se ignora el mensaje porque no se pudo identificar la intención del usuario.',
  },
  HUMAN_ESCALATION_IGNORED: {
    code: 'HUMAN_ESCALATION_IGNORED',
    statusCode: 200,
    message:
      'Se ignora el mensaje porque el cliente ha solicitado hablar con un humano.',
  },

  // 400 SERIES (Client error)
  APPOINTMENT_ALREADY_CANCELLED: {
    code: 'APPOINTMENT_ALREADY_CANCELLED',
    statusCode: 400,
    message: '✅ Esta cita ya se encuentra cancelada, gracias por avisarnos.',
  },
  APPOINTMENT_SLOT_CONFLICT: {
    code: 'APPOINTMENT_SLOT_CONFLICT',
    statusCode: 409,
    message:
      '⏰ El horario ya no está disponible. Consulta nuevamente escribiendo: "Disponibilidad para dd/mm a las hh:mm am/pm"',
  },
  SERVICE_NOT_FOUND: {
    code: 'SERVICE_NOT_FOUND',
    statusCode: 404,
    message: `🔍 No pude correlacionar el servicio con los que ofrezco. Por favor, elige entre: ${getServiceDisplayNames().join(', ')}.`,
  },
  NO_AVAILABILITY: {
    code: 'NO_AVAILABILITY',
    statusCode: 404,
    message:
      '😔 Sin cupos disponibles en los próximos días. Por favor, espera en línea para que la doctora te ayude a agendar tu cita.',
  },
  PARSED_DATE_INVALID: {
    code: 'PARSED_DATE_INVALID',
    statusCode: 422,
    message:
      '📅 Formato de fecha no válido. Usa: "dd/mm a las hh:mm am/pm" o "mañana a las 2 PM"',
  },
  GREATHER_THAN_NOW: {
    code: 'GREATHER_THAN_NOW',
    statusCode: 422,
    message:
      '⏰ ¡Recuerda! No puedes agendar una cita en el pasado. Por favor, proporciona una nueva fecha y hora en el formato: "dd/mm a las hh:mm am/pm"',
  },
  MISSING_REQUIRED_PARAMETERS: {
    code: 'MISSING_REQUIRED_PARAMETERS',
    statusCode: 422,
    message:
      '📝 Necesito algunos datos más para procesar tu solicitud. Por favor, coméntame los siguientes:',
  },
  APPOINTMENT_NOT_FOUND: {
    code: 'APPOINTMENT_NOT_FOUND',
    statusCode: 404,
    message:
      '🔍 No encontré la cita solicitada, por favor verifica el ID de la cita y vuelve a intentarlo. Recuerda que es en formato: "apt_xxx"',
  },
  APPOINTMENTS_BY_DATE_NOT_FOUND: {
    code: 'APPOINTMENTS_BY_DATE_NOT_FOUND',
    statusCode: 404,
    message:
      '🔍 No encontré citas para la fecha solicitada, por favor verifica vuelve a intentarlo.',
  },

  SERVICE_INTERPRETATION_FAILED: {
    code: 'SERVICE_INTERPRETATION_FAILED',
    statusCode: 422,
    message:
      '🤔 No pude interpretar el servicio. Pero no te preocupes, confírmame el servicio que deseas y si el problema persiste la doctora se comunicará contigo para agendar tu cita.',
  },
  SERVICE_NOT_AVAILABLE_FOR_SIZE: {
    code: 'SERVICE_NOT_AVAILABLE_FOR_SIZE',
    statusCode: 422,
    message: `Este servicio normalmente no está disponible para el tamaño de tu mascota 🙁. Sin embargo, la doctora podría hacer una excepción. Por favor, espera en línea para que ella evalúe tu caso, o elige otro servicio disponible.`,
  },

  // 500 SERIES (Server error)
  DURATION_RULES_MISSING: {
    code: 'DURATION_RULES_MISSING',
    statusCode: 500,
    message:
      '⏰ No hay horas disponibles para esta combinación. Por favor, espera en línea para que la doctora te ayude a agendar tu cita.',
  },
  CREATE_APPOINTMENT_FAILED: {
    code: 'CREATE_APPOINTMENT_FAILED',
    statusCode: 500,
    message:
      '😔 Disculpa, no pude agendar la cita, si quieres reintentarlo escribe: "Reintenta crear la cita" ó espera en línea para que la doctora te ayude a agendar tu cita.',
  },
  GET_APPOINTMENT_FAILED: {
    code: 'GET_APPOINTMENT_FAILED',
    statusCode: 500,
    message:
      '⚠️ No se pudo obtener la información de la cita, por favor intenta nuevamente, o si el problema persiste contacta a la doctora.',
  },
  GET_APPOINTMENTS_FAILED: {
    code: 'GET_APPOINTMENTS_FAILED',
    statusCode: 500,
    message:
      '⚠️ No se pudo obtener la información de las citas, por favor intenta nuevamente.',
  },
  CANCEL_APPOINTMENT_FAILED: {
    code: 'CANCEL_APPOINTMENT_FAILED',
    statusCode: 500,
    message:
      '😔 Disculpa, no pude cancelar la cita, si quieres reintentarlo escribe: "Reintenta cancelar la cita", ó espera en línea para que la doctora te ayude a cancelar y reagendar tu cita.',
  },
  AI_GENERATE_RESPONSE_FAILED: {
    code: 'AI_GENERATE_RESPONSE_FAILED',
    statusCode: 500,
    message:
      '😔 Lo siento, he tenido un error al procesar tu mensaje, si quieres reintentarlo escribe: "Reintentar", ó espera en línea para que la doctora te ayude con tu petición.',
  },
  AI_RESPONSE_PARSING_FAILED: {
    code: 'AI_RESPONSE_PARSING_FAILED',
    statusCode: 500,
    message:
      '😔 Disculpa, tuve un error al generar mi respuesta. ¿Podrías repetir tu solicitud? Si persiste, espera en línea para hablar con la doctora.',
  },
  UPDATE_APPOINTMENT_STATUS_FAILED: {
    code: 'UPDATE_APPOINTMENT_STATUS_FAILED',
    statusCode: 500,
    message:
      '⚠️ Error al actualizar el estado de la cita. Inténtalo nuevamente.',
  },
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
