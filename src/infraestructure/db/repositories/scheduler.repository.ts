import { AppointmentStatus, PetSize, RuleType } from '@prisma/client';

import { prismaClient } from '@infraestructure/db/prisma';
import { AppointmentStatusAdapter } from '@infraestructure/adapters/appointment-status.adapter';
import { ClosureStatusDto } from '@domain/dtos/scheduler.dto';
import { ErrorCodes } from '@shared/symbols/error-codes.constants';
import { nowInLima } from '@shared/utils/date.util';
import { generateAppointmentId } from '@shared/utils/appointment-id.util';

export class SchedulerRepository {
  async isClosed(day: Date): Promise<ClosureStatusDto> {
    const closure = await prismaClient.closure.findUnique({
      where: { date: day },
      select: { reason: true },
    });

    return ClosureStatusDto.fromClosure(closure);
  }

  async getShift(dayOfWeek: number) {
    return prismaClient.workShift.findUnique({
      where: { dayOfWeek },
      select: { startTime: true, endTime: true, enabled: true },
    });
  }

  async getServiceIdsByNames(names: string[]) {
    const rows = await prismaClient.service.findMany({
      where: { name: { in: names }, enabled: true },
      select: { id: true, name: true },
    });

    return rows;
  }

  async getDurations(servicesIds: string[], petSize: PetSize) {
    const rules = await prismaClient.durationRule.findMany({
      where: { serviceId: { in: servicesIds }, petSize, enabled: true },
      select: { serviceId: true, minutes: true },
    });

    return rules;
  }

  async getBusyIntervals(appointmentDay: Date, now: Date) {
    // CONFIRMED & NOT EXPIRED PENDING => BLOCK
    const appointments = await prismaClient.appointment.findMany({
      where: {
        date: appointmentDay,
        OR: [
          { status: AppointmentStatus.CONFIRMED },
          { status: AppointmentStatus.PENDING, expiresAt: { gt: now } },
        ],
      },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    return appointments;
  }

  async checkBusinessRules(
    day: Date,
    serviceIds: string[],
    petSize: PetSize,
    now: Date
  ) {
    const rules = await prismaClient.businessRule.findMany({
      where: {
        enabled: true,
        OR: [
          {
            ruleType: RuleType.DAILY_SERVICE_LIMIT,
            serviceId: { in: serviceIds },
          },
          { ruleType: RuleType.DAILY_SIZE_LIMIT, petSize },
        ],
      },
      select: {
        ruleType: true,
        serviceId: true,
        petSize: true,
        maxPerDay: true,
      },
    });

    if (rules.length === 0) return { allowed: true };

    // Reuse getBusyIntervals but need full appointments with items for business rules
    const appointments = await prismaClient.appointment.findMany({
      where: {
        date: day,
        OR: [
          { status: AppointmentStatus.CONFIRMED },
          { status: AppointmentStatus.PENDING, expiresAt: { gt: now } },
        ],
      },
      select: {
        petSize: true,
        items: { select: { serviceId: true } },
      },
    });

    for (const rule of rules) {
      if (rule.ruleType === RuleType.DAILY_SERVICE_LIMIT && rule.serviceId) {
        const count = appointments.filter((apt) =>
          apt.items.some((item) => item.serviceId === rule.serviceId)
        ).length;

        if (count >= rule.maxPerDay) {
          return {
            allowed: false,
            reason: RuleType.DAILY_SERVICE_LIMIT,
            serviceId: rule.serviceId,
            maxPerDay: rule.maxPerDay,
          };
        }
      }

      if (rule.ruleType === RuleType.DAILY_SIZE_LIMIT && rule.petSize) {
        const count = appointments.filter(
          (apt) => apt.petSize === rule.petSize
        ).length;

        if (count >= rule.maxPerDay) {
          return {
            allowed: false,
            reason: RuleType.DAILY_SIZE_LIMIT,
            petSize: rule.petSize,
            maxPerDay: rule.maxPerDay,
          };
        }
      }
    }

    return { allowed: true };
  }

  async createPendingAppointment(input: {
    day: Date;
    startTime: string;
    endTime: string;
    ownerName: string;
    ownerPhone: string;
    petName: string;
    petSize: PetSize;
    petBreed?: string;
    notes?: string;
    serviceIds: string[];
    expiresAt: Date;
  }) {
    const y = input.day.getUTCFullYear();
    const m = String(input.day.getUTCMonth() + 1).padStart(2, '0');
    const d = String(input.day.getUTCDate()).padStart(2, '0');
    const key = Number(`${y}${m}${d}`);

    return prismaClient.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key});`);

      // REVALIDATE OVERLAP ON THAT DAY
      const now = nowInLima();
      const overlapping = await tx.appointment.findFirst({
        where: {
          date: input.day,
          OR: [
            { status: AppointmentStatus.CONFIRMED },
            { status: AppointmentStatus.PENDING, expiresAt: { gt: now } },
          ],
          AND: [
            { startTime: { lt: input.endTime } },
            { endTime: { gt: input.startTime } },
          ],
        },
        select: { id: true },
      });

      if (overlapping) {
        const errorDef = ErrorCodes.APPOINTMENT_SLOT_CONFLICT;
        const error = new Error(errorDef.message);
        (error as any).code = errorDef.code;
        (error as any).statusCode = errorDef.statusCode;

        throw error;
      }

      const appointmentId = generateAppointmentId();

      const appointment = await tx.appointment.create({
        data: {
          id: appointmentId,
          date: input.day,
          startTime: input.startTime,
          endTime: input.endTime,
          status: AppointmentStatus.PENDING,
          expiresAt: input.expiresAt,

          ownerName: input.ownerName,
          ownerPhone: input.ownerPhone,
          petName: input.petName,
          petSize: input.petSize,
          petBreed: input.petBreed ?? '',
          notes: input.notes ?? '',

          items: {
            create: input.serviceIds.map((serviceId) => ({ serviceId })),
          },
        },
        include: {
          items: {
            include: {
              service: {
                select: { name: true },
              },
            },
          },
        },
      });

      return {
        ...appointment,
        status: AppointmentStatusAdapter.toDomain(appointment.status),
      };
    });
  }

  async findAppointmentById(appointmentId: string) {
    return prismaClient.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        items: {
          include: {
            service: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  async updateAppointmentStatus(input: {
    appointmentId: string;
    status: AppointmentStatus;
    reason: string;
  }) {
    const { appointmentId, status, reason } = input;

    return prismaClient.appointment.update({
      where: { id: appointmentId },
      data: { status, cancelledReason: reason },
    });
  }
}
