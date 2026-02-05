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
      'Crea una cita PENDING bloqueando el slot sugerido. La veterinaria confirmará luego.',
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
] as const;
