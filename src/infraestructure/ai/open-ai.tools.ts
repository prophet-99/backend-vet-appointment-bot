export enum ToolName {
  GET_AVAILABILITY = 'getAvailability',
  CREATE_APPOINTMENT = 'createAppointment',
  CANCEL_APPOINTMENT = 'cancelAppointment',
}

export const OPEN_AI_TOOLS = [
  {
    type: 'function',
    name: ToolName.GET_AVAILABILITY,
    description:
      'Busca el próximo hueco disponible para una fecha y devuelve el posible día de la cita con su hora de inicio y fin.',
    parameters: {
      type: 'object',
      properties: {
        preferredDate: { type: 'string', description: 'YYYY-MM-DD (Perú)' },
        preferredTime: {
          type: 'string',
          description: 'HH:MM (ej: 16:00) [OPCIONAL]',
        },
        petName: { type: 'string', description: 'Nombre de la mascota' },
        petSize: {
          type: 'string',
          enum: ['SMALL', 'MEDIUM', 'LARGE'],
          description: 'Tamaño de la mascota',
        },
        petBreed: { type: 'string', description: 'Raza de la mascota' },
        notes: {
          type: 'string',
          description:
            'Notas adicionales para la atención (ej: "mi perro es alérgico al shampo común", "sin notas adicionales")',
        },
        servicesName: {
          type: 'array',
          items: { type: 'string' },
          description: "Ej: ['bano_simple','bano_corte']",
        },
      },
      required: [
        'preferredDate',
        'petName',
        'petSize',
        'petBreed',
        'notes',
        'servicesName',
      ],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: ToolName.CREATE_APPOINTMENT,
    description:
      'Crea una cita PENDING bloqueando el slot sugerido. Retorna appointmentId y TODOS los detalles (fecha, hora, servicios, mascota).',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: ToolName.CANCEL_APPOINTMENT,
    description:
      'Cancela una cita existente. Una vez cancelada, el usuario puede agendar una nueva. El estado cambia a CANCELLED.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: {
          type: 'string',
          description: 'ID único de la cita a cancelar (formato: apt_xxxxx)',
        },
        cancelledReason: {
          type: 'string',
          description: 'Motivo de la cancelación (opcional)',
        },
      },
      required: ['appointmentId'],
      additionalProperties: false,
    },
  },
] as const;
