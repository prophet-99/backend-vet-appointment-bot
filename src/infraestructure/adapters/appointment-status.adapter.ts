import { AppointmentStatus as PrismaAppointmentStatus } from '@prisma/client';
import { AppointmentStatus as DomainAppointmentStatus } from '@domain/enums/appointment-status.enum';

export class AppointmentStatusAdapter {
  private static readonly toDomainMap: Record<
    PrismaAppointmentStatus,
    DomainAppointmentStatus
  > = {
    [PrismaAppointmentStatus.PENDING]: DomainAppointmentStatus.PENDING,
    [PrismaAppointmentStatus.CONFIRMED]: DomainAppointmentStatus.CONFIRMED,
    [PrismaAppointmentStatus.REJECTED]: DomainAppointmentStatus.REJECTED,
    [PrismaAppointmentStatus.CANCELLED]: DomainAppointmentStatus.CANCELLED,
  };

  private static readonly toPrismaMap: Record<
    DomainAppointmentStatus,
    PrismaAppointmentStatus
  > = {
    [DomainAppointmentStatus.PENDING]: PrismaAppointmentStatus.PENDING,
    [DomainAppointmentStatus.CONFIRMED]: PrismaAppointmentStatus.CONFIRMED,
    [DomainAppointmentStatus.REJECTED]: PrismaAppointmentStatus.REJECTED,
    [DomainAppointmentStatus.CANCELLED]: PrismaAppointmentStatus.CANCELLED,
  };

  static toDomain(prisma: PrismaAppointmentStatus): DomainAppointmentStatus {
    const mapped = this.toDomainMap[prisma];
    if (!mapped) {
      throw new Error(`Unknown Prisma AppointmentStatus: ${prisma}`);
    }

    return mapped;
  }

  static toPrisma(domain: DomainAppointmentStatus): PrismaAppointmentStatus {
    const mapped = this.toPrismaMap[domain];
    if (!mapped) {
      throw new Error(`Unknown Domain AppointmentStatus: ${domain}`);
    }

    return mapped;
  }
}
