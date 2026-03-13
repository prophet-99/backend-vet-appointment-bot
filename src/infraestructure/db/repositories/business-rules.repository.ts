import { ClosureStatusDto } from '@domain/dtos/scheduler.dto';
import { prismaClient } from '@infraestructure/db/prisma';

export class BusinessRulesRepository {
  async isClosed(closureDay: Date): Promise<ClosureStatusDto> {
    const closure = await prismaClient.closure.findUnique({
      where: { date: closureDay },
      select: {
        id: true,
        date: true,
        reason: true,
      },
    });

    return ClosureStatusDto.fromClosure(closure);
  }

  async addClosureDay(closureDay: Date, reason?: string) {
    return prismaClient.closure.upsert({
      where: { date: closureDay },
      update: { reason: reason ?? null },
      create: {
        date: closureDay,
        reason: reason ?? null,
      },
      select: {
        id: true,
        date: true,
        reason: true,
      },
    });
  }

  async removeClosureDay(dayStartUtc: Date, nextDayStartUtc: Date) {
    const { count } = await prismaClient.closure.deleteMany({
      where: {
        date: {
          gte: dayStartUtc,
          lt: nextDayStartUtc,
        },
      },
    });

    return { deleted: count > 0 };
  }
}
