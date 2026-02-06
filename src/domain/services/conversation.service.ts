import { DateTime } from 'luxon';

import type {
  BookingState,
  BookingStore,
} from '@domain/models/booking-store.model';
import type { ChatTurnResponse } from '@domain/models/chat.model';
import type {
  AIProvider,
  PromptIntent,
} from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
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
      mode: 'WELCOME',
      expiresAt,
    };
  }

  private buildStateSummary(bookingState: BookingState): string {
    return `
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
  }

  private getUserPrompt(params: {
    bookingState: BookingState;
    userInput: string;
  }) {
    const { userInput, bookingState } = params;

    return `
      [FECHA ACTUAL - PERU]
      ${nowInLimaISO()}

      [ESTADO ACTUAL]
      ${this.buildStateSummary(bookingState)}

      [MENSAJE DEL CLIENTE]
      ${userInput}

      [INSTRUCCION]
      Responde siguiendo las reglas.
    `.trim();
  }

  private getIntentPrompt(params: {
    bookingState: BookingState;
    userInput: string;
  }) {
    const { userInput, bookingState } = params;

    return `
      [ESTADO ACTUAL]
      ${this.buildStateSummary(bookingState)}

      [MENSAJE DEL CLIENTE]
      ${userInput}

      [INSTRUCCION]
      Clasifica la intencion del cliente.
    `.trim();
  }

  async handleChatTurn(params: {
    conversationId: string;
    userPhoneNumber: string;
    userMessage: string;
  }): Promise<ChatTurnResponse> {
    const prevState = await this.bookingStoreService.get(params.conversationId);
    const state = prevState ?? this.newState(params.conversationId);

    if (state.mode === 'HUMAN') {
      return {
        reply: '-',
        ignored: true,
        reason: 'Its in HUMAN mode',
        conversationId: state.conversationId,
      };
    }

    let userIntent: PromptIntent = 'WELCOME';
    if (prevState) {
      const intentPrompt = this.getIntentPrompt({
        bookingState: state,
        userInput: params.userMessage,
      });
      const aiDetectedIntent = await this.aiProvider.detectPromptIntent({
        userPrompt: intentPrompt,
      });
      userIntent = aiDetectedIntent;
    }

    if (userIntent === 'HUMAN') {
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

    const userPrompt = this.getUserPrompt({
      bookingState: state,
      userInput: params.userMessage,
    });
    const aiResponse = await this.aiProvider.generateResponse({
      user: {
        prompt: userPrompt,
        phoneNumber: params.userPhoneNumber,
        intent: userIntent,
      },
      bookingState: state,
      schedulerService: this.schedulerService,
    });
    const botReply = aiResponse.text.trim();

    const mergedState = patchBookingState(state, aiResponse.statePatch);
    mergedState.mode = userIntent;
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
