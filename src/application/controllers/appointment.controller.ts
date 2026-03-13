import type { Request, Response } from 'express';

import { AppointmentOrchestrator } from '@infraestructure/orchestators/appointment.orchestrator';
import { adaptWebClientToAppointmentListInput } from '@infraestructure/adapters/web-client.adapter';

export class AppointmentController {
  private appointmentOrch: AppointmentOrchestrator;

  constructor() {
    this.appointmentOrch = new AppointmentOrchestrator();
  }

  async getAppointmentsByDate(req: Request, res: Response) {
    try {
      const { date } = adaptWebClientToAppointmentListInput(req.params);

      const appointmentsResponse =
        await this.appointmentOrch.listAppointmentsByDate(date);

      return res.json(appointmentsResponse);
    } catch (err) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        errorCode: 'INTERNAL_SERVER_ERROR',
        reason: (err as Error).message || 'Error del servidor',
      });
    }
  }
}
