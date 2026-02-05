import { DateTime } from 'luxon';

import type {
  BookingState,
  BookingStore,
} from '@domain/models/booking-store.model';
import type { ChatTurnResponse } from '@domain/models/chat.model';
import type { AIProvider } from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
import { wantsHuman } from '@shared/utils/text-analysis.util';
import { nowInLima, nowInLimaISO } from '@shared/utils/date.util';
import { patchBookingState } from '@shared/utils/state.util';
import {
  APP_TIMEZONE,
  BOOKING_STORE_TTL_HOURS,
  HUMAN_ESCALATION_MESSAGE,
} from '@shared/symbols/business.constants';

export class ConversationService {
  constructor(
    private aiProvider: AIProvider,
    private bookingStoreService: BookingStore,
    private schedulerService: Scheduler
  ) {}

  private calculateBookingExpiration(): Date {
    return DateTime.fromJSDate(nowInLima(), { zone: APP_TIMEZONE })
      .plus({ hours: BOOKING_STORE_TTL_HOURS })
      .toJSDate();
  }

  private newState(conversationId: string): BookingState {
    const expiresAt = this.calculateBookingExpiration();

    return {
      conversationId,
      mode: 'BOOKING',
      expiresAt,
    };
  }

  private getUserPrompt(params: {
    bookingState: BookingState;
    userInput: string;
  }) {
    const { userInput, bookingState } = params;
    const stateSummary = `
      mode=${bookingState.mode}
      lastUserText=${bookingState.lastUserText ?? '-'}
      lastBotText=${bookingState.lastBotText ?? '-'}
      preferredDate=${bookingState.preferredDate ?? '-'}
      preferredTime=${bookingState.preferredTime ?? '-'}
      appointmentDate=${bookingState.appointmentDate ?? '-'}
      appointmentStartTime=${bookingState.appointmentStartTime ?? '-'}
      appointmentEndTime=${bookingState.appointmentEndTime ?? '-'}
      ownerName=${bookingState.ownerName ?? '-'}
      petName=${bookingState.petName ?? '-'}
      petSize=${bookingState.petSize ?? '-'}
      breedText=${bookingState.breedText ?? '-'}
      notes=${bookingState.notes ?? '-'}
      servicesName=${bookingState.servicesName?.join(',') ?? '-'}
    `.trim();

    return `
      [FECHA ACTUAL - PERU]
      ${nowInLimaISO()}

      [ESTADO ACTUAL]
      ${stateSummary}

      [MENSAJE DEL CLIENTE]
      ${userInput}

      [INSTRUCCION]
      Responde siguiendo las reglas.
    `.trim();
  }

  async handleChatTurn(params: {
    conversationId: string;
    userPhoneNumber: string;
    userMessage: string;
  }): Promise<ChatTurnResponse> {
    const prevState = await this.bookingStoreService.get(params.conversationId);
    const state = prevState ?? this.newState(params.conversationId);

    // TODO: Interprtar la intecnion con IA para pasar a modo HUMANO
    // if (wantsHuman(params.userMessage)) {
    if (false) {
      state.mode = 'HUMAN';
      state.lastUserText = params.userMessage;
      state.lastBotText = HUMAN_ESCALATION_MESSAGE;

      await this.bookingStoreService.upsert(state);

      return {
        reply: state.lastBotText,
        mode: state.mode,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        conversationId: state.conversationId,
      };
    }

    if (state.mode === 'HUMAN') {
      return {
        reply: '-',
        ignored: true,
        reason: 'Its in HUMAN mode',
        conversationId: state.conversationId,
      };
    }

    const userPrompt = this.getUserPrompt({
      bookingState: state,
      userInput: params.userMessage,
    });
    const aiResponse = await this.aiProvider.generateResponse({
      userPrompt,
      userPhoneNumber: params.userPhoneNumber,
      bookingState: state,
      schedulerService: this.schedulerService,
    });
    const botReply = aiResponse.text.trim();

    const mergedState = patchBookingState(state, aiResponse.statePatch);
    mergedState.lastUserText = params.userMessage;
    mergedState.lastBotText = botReply;
    mergedState.expiresAt = this.calculateBookingExpiration();
    await this.bookingStoreService.upsert(mergedState);

    return {
      reply: botReply,
      conversationId: state.conversationId,
      mode: state.mode,
      stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
      requestId: aiResponse.requestId || '',
    };
  }
}
