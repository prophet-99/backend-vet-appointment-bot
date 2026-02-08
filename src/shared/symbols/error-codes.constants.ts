export const ErrorCodes = {
  APPOINTMENT_SLOT_CONFLICT: {
    code: 'APPOINTMENT_SLOT_CONFLICT',
    statusCode: 409,
    message:
      'El horario solicitado ya no está disponible. Ha sido reservado por otro usuario. Por favor, consulta los horarios disponibles nuevamente.',
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
  GREATHER_THAN_NOW: {
    code: 'GREATHER_THAN_NOW',
    statusCode: 422,
    message:
      'La fecha y hora preferida deben ser futuras. Por favor, ingrese una fecha y hora válidas.',
  },
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
