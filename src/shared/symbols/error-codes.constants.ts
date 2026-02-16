export const ErrorCodes = {
  APPOINTMENT_SLOT_CONFLICT: {
    code: 'APPOINTMENT_SLOT_CONFLICT',
    statusCode: 409,
    message:
      'El horario solicitado ya no está disponible. Ha sido reservado por otro usuario. Por favor, consulta los horarios disponibles nuevamente.',
  },
  SERVICE_INTERPRETATION_FAILED: {
    code: 'SERVICE_INTERPRETATION_FAILED',
    statusCode: 422,
    message:
      'Ocurrió un intentar interpretar los servicios, por favor podría proporcionar nuevamente los servicios requeridos, lamentamos el inconveniente.',
  },
  SERVICE_NOT_FOUND: {
    code: 'SERVICE_NOT_FOUND',
    statusCode: 404,
    message: 'Servicio no reconocido o deshabilitado.',
  },
  SERVICE_NOT_AVAILABLE_FOR_SIZE: {
    code: 'SERVICE_NOT_AVAILABLE_FOR_SIZE',
    statusCode: 422,
    message:
      'El servicio no está disponible para el tamaño de mascota seleccionado. Si aún lo requiere, espere en línea para evaluar la posibilidad de agendar su cita.',
  },
  DURATION_RULES_MISSING: {
    code: 'DURATION_RULES_MISSING',
    statusCode: 422,
    message: 'Faltan reglas de duración para ese tamaño de mascota o servicio.',
  },
  NO_AVAILABILITY: {
    code: 'NO_AVAILABILITY',
    statusCode: 404,
    message:
      'No se encontraron cupos disponibles en los próximos días. Por favor, espere en línea para evaluar la posibilidad de agendar su cita.',
  },
  PARSED_DATE_INVALID: {
    code: 'PARSED_DATE_INVALID',
    statusCode: 422,
    message:
      'La fecha y hora preferida no pudieron ser interpretadas. Por favor, ingrese una fecha y hora válidas.',
  },
  GREATHER_THAN_NOW: {
    code: 'GREATHER_THAN_NOW',
    statusCode: 422,
    message:
      'La fecha y hora preferida deben ser futuras. Por favor, ingrese una fecha y hora válidas.',
  },
  MISSING_REQUIRED_PARAMETERS: {
    code: 'MISSING_REQUIRED_PARAMETERS',
    statusCode: 422,
    message: 'Faltan algunos parámetros requeridos para procesar la solicitud',
  },
  APPOINTMENT_NOT_FOUND: {
    code: 'APPOINTMENT_NOT_FOUND',
    statusCode: 404,
    message: 'No se encontró la cita solicitada.',
  },
  CREATE_APPOINTMENT_FAILED: {
    code: 'CREATE_APPOINTMENT_FAILED',
    statusCode: 500,
    message:
      'No se pudo crear la cita, por favor intenta nuevamente, o si el problema persiste contacta a la doctora.',
  },
  APPOINTMENT_ALREADY_CANCELLED: {
    code: 'APPOINTMENT_ALREADY_CANCELLED',
    statusCode: 400,
    message: 'Esta cita ya estaba cancelada',
  },
  GET_APPOINTMENT_FAILED: {
    code: 'GET_APPOINTMENT_FAILED',
    statusCode: 500,
    message:
      'No se pudo obtener la información de la cita, por favor intenta nuevamente, o si el problema persiste contacta a la doctora.',
  },
  CANCEL_APPOINTMENT_FAILED: {
    code: 'CANCEL_APPOINTMENT_FAILED',
    statusCode: 500,
    message:
      'No se pudo cancelar la cita, por favor intenta nuevamente, o si el problema persiste contacta a la doctora.',
  },
  AI_GENERATE_RESPONSE_FAILED: {
    code: 'AI_GENERATE_RESPONSE_FAILED',
    statusCode: 500,
    message:
      'Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.',
  },
  AI_RESPONSE_PARSING_FAILED: {
    code: 'AI_RESPONSE_PARSING_FAILED',
    statusCode: 500,
    message:
      'Disculpa, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo? Si el problema persiste, puedo ayudarte a agendar tu cita paso a paso.',
  },
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
