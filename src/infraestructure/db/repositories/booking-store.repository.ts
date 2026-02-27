import { prismaClient } from '@infraestructure/db/prisma';
import type {
  BookingState,
  FlowAIStatus,
  FlowMode,
  FlowModeStatus,
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
      modeStatus: row.modeStatus as FlowModeStatus,
      aiStatus: row.aiStatus as FlowAIStatus,
      showGreeting: row.showGreeting,
      expiresAt: row.expiresAt,
      lastUserText: row.lastUserText || '',
      lastBotText: row.lastBotText || '',
      preferredDate: row.preferredDate || '',
      preferredTime: row.preferredTime || '',
      petName: row.petName || '',
      petSize: row.petSize as PetSize,
      petBreed: row.petBreed || '',
      notes: row.notes || '',
      servicesName: row.servicesName,
      appointmentId: row.appointmentId || '',
      cancelledReason: row.cancelledReason || '',
    };
  }

  async upsert(state: BookingState): Promise<void> {
    await prismaClient.bookingState.upsert({
      where: { conversationId: state.conversationId },
      update: {
        conversationId: state.conversationId,
        mode: state.mode,
        modeStatus: state.modeStatus,
        aiStatus: state.aiStatus,
        showGreeting: state.showGreeting,
        expiresAt: state.expiresAt!,
        lastUserText: state.lastUserText,
        lastBotText: state.lastBotText,
        preferredDate: state.preferredDate,
        preferredTime: state.preferredTime,
        petName: state.petName,
        petSize: state.petSize,
        petBreed: state.petBreed,
        notes: state.notes,
        servicesName: state.servicesName,
        appointmentId: state.appointmentId,
        cancelledReason: state.cancelledReason,
      },
      create: {
        conversationId: state.conversationId,
        mode: state.mode,
        modeStatus: state.modeStatus,
        aiStatus: state.aiStatus,
        showGreeting: state.showGreeting,
        expiresAt: state.expiresAt!,
        lastUserText: state.lastUserText,
        lastBotText: state.lastBotText,
        preferredDate: state.preferredDate,
        preferredTime: state.preferredTime,
        petName: state.petName,
        petSize: state.petSize,
        petBreed: state.petBreed,
        notes: state.notes,
        servicesName: state.servicesName,
        appointmentId: state.appointmentId,
        cancelledReason: state.cancelledReason,
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
