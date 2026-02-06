import { prismaClient } from '@infraestructure/db/prisma';
import type {
  BookingState,
  FlowMode,
} from '@domain/models/booking-store.model';
import type { PetSize } from '@domain/enums/pet-size.enum';
import { nowInLima } from '@shared/utils/date.util';

export class BookingStoreRepository {
  async findByConversationId(
    conversationId: string
  ): Promise<BookingState | null> {
    const row = await prismaClient.bookingState.findUnique({
      where: { conversationId },
    });

    if (!row) return null;
    if (row.expiresAt && row.expiresAt <= nowInLima()) return null;

    return {
      conversationId: row.conversationId,
      mode: row.mode as FlowMode,
      expiresAt: row.expiresAt,
      lastUserText: row.lastUserText || '',
      lastBotText: row.lastBotText || '',
      preferredDate: row.preferredDate || '',
      preferredTime: row.preferredTime || '',
      appointmentDate: row.appointmentDate || '',
      appointmentStartTime: row.appointmentStartTime || '',
      appointmentEndTime: row.appointmentEndTime || '',
      ownerName: row.ownerName || '',
      petName: row.petName || '',
      petSize: row.petSize as PetSize,
      breedText: row.breedText || '',
      notes: row.notes || '',
      servicesName: row.servicesName,
    };
  }

  async upsert(state: BookingState): Promise<void> {
    await prismaClient.bookingState.upsert({
      where: { conversationId: state.conversationId },
      update: {
        mode: state.mode,
        expiresAt: state.expiresAt!,
        lastUserText: state.lastUserText,
        lastBotText: state.lastBotText,
        preferredDate: state.preferredDate,
        preferredTime: state.preferredTime,
        appointmentDate: state.appointmentDate,
        appointmentStartTime: state.appointmentStartTime,
        appointmentEndTime: state.appointmentEndTime,
        petSize: state.petSize,
        ownerName: state.ownerName,
        petName: state.petName,
        breedText: state.breedText,
        notes: state.notes,
        servicesName: state.servicesName,
      },
      create: {
        conversationId: state.conversationId,
        mode: state.mode,
        expiresAt: state.expiresAt!,
        lastUserText: state.lastUserText,
        lastBotText: state.lastBotText,
        preferredDate: state.preferredDate,
        preferredTime: state.preferredTime,
        appointmentDate: state.appointmentDate,
        appointmentStartTime: state.appointmentStartTime,
        appointmentEndTime: state.appointmentEndTime,
        petSize: state.petSize,
        ownerName: state.ownerName,
        petName: state.petName,
        breedText: state.breedText,
        notes: state.notes,
        servicesName: state.servicesName,
      },
    });
  }

  async delete(conversationId: string): Promise<void> {
    await prismaClient.bookingState.delete({
      where: { conversationId },
    });
  }

  async deleteMany(conversationId: string): Promise<void> {
    await prismaClient.bookingState.deleteMany({
      where: { conversationId },
    });
  }
}
