import { AppointmentStatus } from '@domain/enums/appointment-status.enum';

export const adaptWebClientToUpdateStatusInput = (body: unknown) => {
  const { appointmentId, doctorChoice } = body as {
    appointmentId: string;
    doctorChoice: AppointmentStatus;
  };

  if (!appointmentId || !doctorChoice) {
    throw new Error(
      'Error al procesar la solicitud: falta appointmentId o doctorChoice.'
    );
  }

  return {
    appointmentId,
    doctorChoice,
  };
};

export const adaptWebClientToAppointmentListInput = (query: unknown) => {
  const { date } = query as { date: string };

  if (!date) {
    throw new Error(
      "Error al procesar la solicitud: falta el parámetro 'date'."
    );
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(
      "Error al procesar la solicitud: el parámetro 'date' no es una fecha válida."
    );
  }

  return {
    date: parsedDate,
  };
};

export const adaptWebClientToAddClosureDayInput = (query: unknown) => {
  const { date, reason } = query as { date: string; reason: string };

  if (!date || !reason) {
    throw new Error(
      "Error al procesar la solicitud: falta el parámetro 'date' o 'reason'."
    );
  }

  if (isNaN(new Date(date).getTime())) {
    throw new Error(
      "Error al procesar la solicitud: el parámetro 'date' no es una fecha válida."
    );
  }

  return {
    date,
    reason,
  };
};

export const adaptWebClientToRemoveClosureDayInput = (query: unknown) => {
  const { date } = query as { date: string };

  if (!date) {
    throw new Error(
      "Error al procesar la solicitud: falta el parámetro 'date'."
    );
  }

  if (isNaN(new Date(date).getTime())) {
    throw new Error(
      "Error al procesar la solicitud: el parámetro 'date' no es una fecha válida."
    );
  }

  return {
    date,
  };
};
