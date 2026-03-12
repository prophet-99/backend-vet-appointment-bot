export class AppointmentController {
	constructor(private appointmentService: AppointmentService) {}

	// LISTADO DE APPOINTMENTS
	async getAppointments(req: Request, res: Response) {
		try {
			const appointments = await this.appointmentService.getAppointments();
		}
	}

}
