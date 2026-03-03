import { AppointmentStatus } from "@domain/enums/appointment-status.enum";

export const adaptWebClientToUpdateStatusInput = (body: unknown) => {
	const { appointmentId, doctorChoice } = body as {
		appointmentId: string;
		doctorChoice: AppointmentStatus;
	};

	if (!appointmentId || !doctorChoice) {
		throw new Error("Error al procesar la solicitud: falta appointmentId o doctorChoice.");
	}

	return {
		appointmentId,
		doctorChoice,
	};
};
