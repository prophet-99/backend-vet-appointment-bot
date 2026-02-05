export const OPEN_AI_TOOLS = [
  {
    type: 'function',
    name: 'getAvailability',
    description:
      'Busca el próximo hueco disponible para una fecha y devuelve suggestedStart/suggestedEnd y el día encontrado.',
    parameters: {
      type: 'object',
      properties: {
        preferredDate: { type: 'string', description: 'YYYY-MM-DD (Perú)' },
        preferredTime: {
          type: 'string',
          description: 'HH:MM (opcional, ej: 16:00)',
        },
        servicesName: {
          type: 'array',
          items: { type: 'string' },
          description: "Ej: ['bano_simple','bano_corte']",
        },
        petSize: {
          type: 'string',
          enum: ['SMALL', 'MEDIUM', 'LARGE'],
          description: 'Tamaño de la mascota',
        },
        petName: { type: 'string', description: 'Nombre de la mascota' },
      },
      required: ['preferredDate', 'servicesName', 'petSize', 'petName'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'createAppointment',
    description:
      'Crea una cita PENDING bloqueando el slot sugerido. Retorna appointmentId y TODOS los detalles (fecha, hora, servicios, mascota). La veterinaria confirmará después. El sistema automáticamente valida que esté guardado en BD.',
    parameters: {
      type: 'object',
      properties: {
        ownerName: { type: 'string', description: 'Nombre del dueño' },
        petName: { type: 'string', description: 'Nombre de la mascota' },
        petSize: {
          type: 'string',
          enum: ['SMALL', 'MEDIUM', 'LARGE'],
          description: 'Tamaño de la mascota',
        },
        breedText: { type: 'string', description: 'Raza de la mascota' },
        notes: {
          type: 'string',
          description: 'Notas adicionales para la atención',
        },
      },
      required: ['ownerName', 'petName', 'petSize', 'breedText', 'notes'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getAppointment',
    description:
      'Obtiene los detalles de una cita guardada usando su ID o consulta por ownerPhone. Devuelve toda la información de la cita (fecha, hora, servicios, mascota, estado).',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: {
          type: 'string',
          description:
            'ID único de la cita (si lo tienen de un agendamiento anterior)',
        },
      },
      required: ['appointmentId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'cancelAppointment',
    description:
      'Cancela una cita existente. Una vez cancelada, el usuario puede agendar una nueva. El estado cambia a CANCELLED.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: {
          type: 'string',
          description: 'ID único de la cita a cancelar (formato: apt_xxxxx)',
        },
        reason: {
          type: 'string',
          description: 'Motivo de la cancelación (opcional)',
        },
      },
      required: ['appointmentId'],
      additionalProperties: false,
    },
  },
] as const;
