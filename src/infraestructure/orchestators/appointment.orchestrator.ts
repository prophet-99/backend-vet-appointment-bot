import { SchedulerService } from '@domain/services/scheduler.service';
import { SchedulerRepository } from '@infraestructure/db/repositories/scheduler.repository';

export class AppointmentOrchestrator {
  private schedulerService: SchedulerService;

  constructor() {
    this.schedulerService = new SchedulerService(new SchedulerRepository());
  }

  listAppointmentsByDate(date: Date) {
    return this.schedulerService.getAppointmentsByDate(date);
  }
}
