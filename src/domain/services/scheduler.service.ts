import { DateTime } from 'luxon';

import { SchedulerRepository } from '@infraestructure/db/repositories/scheduler.repository';
import {
  type Scheduler,
  type CreateAppointmentInput,
  type CreateAppointmentOutput,
  type GetAvailabilityInput,
  type GetAvailabilityOutput,
} from '@domain/models/scheduler.model';
import {
  APPOINTMENT_CONFIG,
  APP_TIMEZONE,
  LOOK_AHEAD_DAYS,
  MIN_BLOCK_SIZE,
} from '@shared/symbols/business.constants';
import { ErrorCodes } from '@shared/symbols/error-codes.constants';
import {
  ceilToBlock,
  hhmmToMinutes,
  minutesToHhmm,
  setTimeInLima,
} from '@shared/utils/time.util';
import {
  addDays,
  dayOfWeekMonToSat,
  nowInLima,
  startOfDay,
} from '@shared/utils/date.util';
import { findFirstSlot, mergeIntervals } from '@shared/utils/interval.util';

export class SchedulerService implements Scheduler {
  constructor(private schedulerRepository: SchedulerRepository) {}

  private parseInputDateTime(day: string, preferredTime?: string) {
    const parsedDate = DateTime.fromFormat(day, 'yyyy-MM-dd', {
      zone: APP_TIMEZONE,
    });

    if (!parsedDate.isValid) {
      return {
        success: false,
        error: 'Formato de fecha inválido. Use YYYY-MM-DD',
      };
    }

    let preferredStartMinutes: number | undefined;
    if (preferredTime) {
      const timeMatch = preferredTime.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
          preferredStartMinutes = hours * 60 + minutes;
        }
      }
    }

    return {
      success: true,
      date: parsedDate.toJSDate(),
      preferredStartMinutes,
    };
  }

  async getAvailibility(
    params: GetAvailabilityInput
  ): Promise<GetAvailabilityOutput> {
    const blockMinutes = params.blockMinutes ?? MIN_BLOCK_SIZE;
    const lookAheadDays = params.lookAheadDays ?? LOOK_AHEAD_DAYS;

    //? 0) Parse and validate input date/time
    const parseResult = this.parseInputDateTime(
      params.day,
      params.preferredTime
    );
    if (!parseResult.success) {
      return {
        success: false,
        statusCode: 400,
        reason: parseResult.error,
      };
    }
    const { date: appointmentDay, preferredStartMinutes } = parseResult;

    //? 1) Get service IDs from names
    const services = await this.schedulerRepository.getServiceIdsByNames(
      params.servicesName
    );
    const serviceIds = services.map((s) => s.id); // [1,2]

    if (services.length !== params.servicesName.length) {
      return {
        success: false,
        statusCode: ErrorCodes.SERVICE_NOT_FOUND.statusCode,
        reason: ErrorCodes.SERVICE_NOT_FOUND.message,
      };
    }

    //? 2) Total duration = sum of rules (and rounded to a block of 15) and check availability for pet size
    const rules = await this.schedulerRepository.getDurations(
      serviceIds,
      params.petSize
    );

    if (rules.length !== serviceIds.length) {
      return {
        success: false,
        statusCode: ErrorCodes.DURATION_RULES_MISSING.statusCode,
        reason: ErrorCodes.DURATION_RULES_MISSING.message,
      };
    }

    const servicesNotAvailable = rules.filter((r) => r.minutes === 0);

    if (servicesNotAvailable.length > 0) {
      const servicesName = servicesNotAvailable
        .map(({ serviceId }) => {
          const svc = services.find(({ id }) => id === serviceId);
          return svc ? svc.name : 'unknown';
        })
        .join(', ');

      return {
        success: false,
        statusCode: ErrorCodes.SERVICE_NOT_AVAILABLE_FOR_SIZE.statusCode,
        reason: `${ErrorCodes.SERVICE_NOT_AVAILABLE_FOR_SIZE.message} [${servicesName}]`,
      };
    }

    const totalMinutes = rules.reduce((sum, r) => sum + r.minutes, 0);
    const requiredMinutes = ceilToBlock(totalMinutes, blockMinutes);

    //? 3) Look for an opening on the current or following day (skipping Sundays/closures/business rules)
    let currentDay = appointmentDay!;
    const now = nowInLima();
    let isFirstIteration = true;

    for (let i = 0; i <= lookAheadDays; i++) {
      const dayOfWeek = dayOfWeekMonToSat(currentDay);
      if (dayOfWeek === 0) {
        currentDay = addDays(currentDay, 1);
        continue;
      }

      const { closed } = await this.schedulerRepository.isClosed(currentDay);
      if (closed) {
        currentDay = addDays(currentDay, 1);
        continue;
      }

      const workShift = await this.schedulerRepository.getShift(dayOfWeek);
      if (!workShift || !workShift.enabled) {
        currentDay = addDays(currentDay, 1);
        continue;
      }

      const businessCheck = await this.schedulerRepository.checkBusinessRules(
        currentDay,
        serviceIds,
        params.petSize,
        now
      );
      if (!businessCheck.allowed) {
        currentDay = addDays(currentDay, 1);
        continue;
      }

      const workShiftStart = hhmmToMinutes(workShift.startTime);
      const workShiftEnd = hhmmToMinutes(workShift.endTime);
      const dbBusyIntervals = await this.schedulerRepository.getBusyIntervals(
        currentDay,
        now
      );
      const busyIntervals = mergeIntervals(
        dbBusyIntervals.map((dbBusyInt) => ({
          start: hhmmToMinutes(dbBusyInt.startTime),
          end: hhmmToMinutes(dbBusyInt.endTime),
        }))
      );

      // Búsqueda del slot:
      // - Primer día CON hora preferida: busca desde preferredTime en adelante
      // - Primer día SIN hora preferida: busca desde inicio del turno
      // - Días siguientes: siempre desde inicio del turno
      const effectiveStartTime =
        isFirstIteration && preferredStartMinutes !== undefined
          ? Math.max(workShiftStart, preferredStartMinutes) // Math.max asegura que no busquemos antes del horario laboral
          : workShiftStart;

      const slot = findFirstSlot({
        workShiftStart: effectiveStartTime,
        workShiftEnd,
        busyIntervals,
        blockMinutes,
        requiredMinutes,
      });

      if (slot) {
        return {
          success: true,
          statusCode: 200,
          appointment: {
            appointmentDay: currentDay,
            suggestedStart: minutesToHhmm(slot.start),
            suggestedEnd: minutesToHhmm(slot.end),
            requiredMinutes,
            services,
          },
        };
      }

      currentDay = addDays(currentDay, 1);
      isFirstIteration = false;
    }

    return {
      success: false,
      statusCode: ErrorCodes.NO_AVAILABILITY.statusCode,
      reason: ErrorCodes.NO_AVAILABILITY.message,
    };
  }

  private computeExpiresAt(now: Date): Date {
    const dt = DateTime.fromJSDate(now, { zone: APP_TIMEZONE });
    const dayOfWeek = dt.weekday % 7; // Luxon: 1=Mon...7=Sun → 0=Sun...6=Sat

    // If it's weekend (Saturday=6 or Sunday=0), expires on Monday at 11:00 AM
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      const daysToAdd = dayOfWeek === 6 ? 2 : 1;
      const monday = addDays(startOfDay(now), daysToAdd);
      return setTimeInLima(monday, APPOINTMENT_CONFIG.WEEKEND_EXPIRY_DAY_TIME);
    }

    // If it's a weekday, expires 24 hours later
    const expiry = dt.plus({ hours: APPOINTMENT_CONFIG.WEEKDAY_EXPIRY_HOURS });
    return expiry.toJSDate();
  }

  async createAppointment(
    params: CreateAppointmentInput
  ): Promise<CreateAppointmentOutput> {
    try {
      const appointment =
        await this.schedulerRepository.createPendingAppointment({
          day: params.day,
          startTime: params.startTime,
          endTime: params.endTime,
          ownerName: params.ownerName,
          ownerPhone: params.ownerPhone,
          petName: params.petName,
          size: params.size,
          breedText: params.breedText,
          notes: params.notes,
          serviceIds: params.serviceIds,
          expiresAt: this.computeExpiresAt(nowInLima()),
        });

      return {
        success: true,
        statusCode: 201,
        appointment,
      };
    } catch (error: any) {
      if (error?.code === ErrorCodes.APPOINTMENT_SLOT_CONFLICT.code) {
        return {
          success: false,
          statusCode: ErrorCodes.APPOINTMENT_SLOT_CONFLICT.statusCode,
          reason: ErrorCodes.APPOINTMENT_SLOT_CONFLICT.message,
        };
      }

      throw error;
    }
  }

  async getServicesIdByNames(names: string[]): Promise<string[]> {
    const services = await this.schedulerRepository.getServiceIdsByNames(names);

    return services.map((s) => s.id);
  }
}
