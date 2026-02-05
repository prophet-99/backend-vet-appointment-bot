import { DateTime } from 'luxon';

import {
  type BookingState,
  type BookingStore,
} from '@domain/models/booking-store.model';
import {
  APP_TIMEZONE,
  BOOKING_STORE_TTL_HOURS,
} from '@shared/symbols/business.constants';
import { nowInLima } from '@shared/utils/date.util';
import type { BookingStoreRepository } from '@infraestructure/db/repositories/booking-store.repository';

export class InMemoryBookingStoreService implements BookingStore {
  private mapStates = new Map<string, BookingState>();

  async get(conversationId: string): Promise<BookingState | null> {
    const state = this.mapStates.get(conversationId);
    if (!state) return null;

    if (nowInLima() > state.expiresAt!) {
      this.mapStates.delete(conversationId);
      return null;
    }
    return state;
  }

  async upsert(state: BookingState): Promise<void> {
    if (!state.expiresAt) {
      const expiresAt = DateTime.now()
        .setZone(APP_TIMEZONE)
        .plus({ hours: BOOKING_STORE_TTL_HOURS })
        .toJSDate();
      state.expiresAt = expiresAt;
    }

    this.mapStates.set(state.conversationId, state);
  }

  async clear(conversationId: string): Promise<void> {
    this.mapStates.delete(conversationId);
  }
}

export class InDBBookingStoreService implements BookingStore {
  constructor(private bookingRepository: BookingStoreRepository) {}

  async get(conversationId: string): Promise<BookingState | null> {
    const state =
      await this.bookingRepository.findByConversationId(conversationId);
    if (!state) return null;

    if (nowInLima() > state.expiresAt!) {
      await this.bookingRepository.delete(conversationId);
      return null;
    }

    return state;
  }

  async upsert(state: BookingState): Promise<void> {
    const dateTimeNow = DateTime.now()
      .setZone(APP_TIMEZONE)
      .plus({ hours: BOOKING_STORE_TTL_HOURS })
      .toJSDate();
    const stateWithExpiry = {
      ...state,
      expiresAt: state.expiresAt ?? dateTimeNow,
      mode: state.mode ?? 'BOOKING',
    };

    await this.bookingRepository.upsert(stateWithExpiry);
  }

  async clear(conversationId: string): Promise<void> {
    await this.bookingRepository.deleteMany(conversationId);
  }
}
