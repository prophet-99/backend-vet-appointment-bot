import { Router } from 'express';

import { AppointmentController } from '@application/controllers/appointment.controller';

const router = Router();
const appointmentController = new AppointmentController();

router.get(
  '/date/:date',
  appointmentController.getAppointmentsByDate.bind(appointmentController)
);

export default router;
