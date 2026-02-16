import { DateTime } from 'luxon';

import type {
  BookingState,
  BookingStore,
  FlowMode,
} from '@domain/models/booking-store.model';
import type { ChatTurnResponse } from '@domain/models/chat.model';
import type { AIProvider } from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
import { InteractionOption } from '@domain/enums/interaction-option.enum';
import { AIStatus } from '@domain/models/ai-schema.model';
import { nowInLima } from '@shared/utils/date.util';
import { patchBookingState } from '@shared/utils/state.util';
import {
  APP_TIMEZONE,
  BOOKING_STORE_TTL_HOURS,
} from '@shared/symbols/business.constants';
import {
  WELCOME_MESSAGE,
  HUMAN_ESCALATION_MESSAGE,
  MENU_SELECTION_REQUIRED_MESSAGE,
  VET_DETAILS_MESSAGE,
  CREATE_BOOKING_MESSAGE,
  DELETE_BOOKING_MESSAGE,
  BOOKING_SUMMARY_MESSAGE,
} from '@shared/symbols/conversation.contants';

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
      statusMode: 'INITIAL',
      showGreeting: true,
      expiresAt,
      lastUserText: '',
      lastBotText: '',
    };
  }

  async handleChatTurn(params: {
    conversationId: string;
    userName: string;
    userPhoneNumber: string;
    userMessage: string;
    userSelectionId?: InteractionOption;
  }): Promise<ChatTurnResponse> {
    const prevState = await this.bookingStoreService.get(params.conversationId);
    const state = prevState
      ? { ...prevState }
      : this.newState(params.conversationId);

    let userIntent: FlowMode = 'WELCOME';
    if (params.userSelectionId) {
      userIntent = {
        [InteractionOption.MENU_SHOW_OPTIONS]: 'WELCOME',
        [InteractionOption.MENU_CREATE]: 'CREATE',
        [InteractionOption.MENU_EDIT]: 'EDIT',
        [InteractionOption.MENU_CANCEL]: 'DELETE',
        [InteractionOption.MENU_INFO]: 'INFO',
        [InteractionOption.MENU_HUMAN]: 'HUMAN',
      }[params.userSelectionId] as FlowMode;

      state.statusMode = 'INITIAL';
    }
    if (prevState && !params.userSelectionId) {
      userIntent = prevState.mode;
    }

    if (userIntent === 'WELCOME') {
      const stateToPatch = { ...state };

      stateToPatch.lastUserText = params.userMessage;

      if (state.statusMode === 'INITIAL') {
        stateToPatch.mode = 'WELCOME';
        stateToPatch.statusMode = 'IN_PROGRESS';
        stateToPatch.lastBotText = state.showGreeting ? WELCOME_MESSAGE : '';
        stateToPatch.showGreeting = false;
        // TODO: DELETE THIS COMMENT:
        /**
         * 1) Se envía a n8n -> el mode: 'WELCOME'
         * 2) n8n responde con el "reply" al WhatsApp al cliente (concatenar + salto de línea)
         * 3) n8n manda la Interactive List de WhatsApp al cliente
         * */
      }

      if (state.statusMode === 'IN_PROGRESS') {
        stateToPatch.lastBotText = MENU_SELECTION_REQUIRED_MESSAGE;
        // TODO: DELETE THIS COMMENT:
        /**
         *! FLUJO DE ERROR - USUARIO NO SELECCIONA UNA OPCIÓN VÁLIDA DEL MENÚ
         * 1) Se envía a n8n -> el mode: 'WELCOME' y lastBotText: ''
         * 2) n8n responde con el "reply" al WhatsApp al cliente (concatenar + salto de línea)
         * */
      }

      await this.bookingStoreService.upsert(stateToPatch);

      return {
        reply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        statusMode: stateToPatch.statusMode,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        conversationId: stateToPatch.conversationId,
        ignored: false,
      };
    }

    if (userIntent === 'INFO') {
      const stateToPatch = { ...state };

      stateToPatch.lastUserText = params.userMessage;

      if (state.statusMode === 'INITIAL') {
        stateToPatch.mode = 'INFO';
        stateToPatch.statusMode = 'IN_PROGRESS';
        stateToPatch.lastBotText = VET_DETAILS_MESSAGE;
      }

      if (state.statusMode === 'IN_PROGRESS') {
        stateToPatch.lastBotText = MENU_SELECTION_REQUIRED_MESSAGE;
        // TODO: DELETE THIS COMMENT:
        /**
         *! FLUJO DE ERROR - USUARIO NO SELECCIONA UNA OPCIÓN VÁLIDA DEL MENÚ
         * 1) Se envía a n8n -> el mode: 'INFO' y statusMode: 'IN_PROGRESS'
         * 2) n8n responde con el "reply" al WhatsApp al cliente
         * */
      }

      await this.bookingStoreService.upsert(stateToPatch);

      // TODO: DELETE THIS COMMENT
      /**
       * 1) n8n -> RECIBE el mode: 'INFO'
       * 2) n8n -> RESPONDE con el "reply" al WhatsApp al cliente
       * 3) n8n -> RESPONDE con un menu de dos botones: "Menú principal" ó "Hablar con la Dra."
       * 4) n8n -> Si el cliente elige "Menú principal" -> RESPONDE con el mode: 'MENU_SHOW_OPTIONS' y vuelve al paso 1
       * 5) n8n -> Si el cliente elige "Hablar con la Dra." -> RESPONDE con el mode: 'HUMAN' y vuelve al paso 1
       * */
      return {
        reply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        statusMode: stateToPatch.statusMode,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        conversationId: stateToPatch.conversationId,
        ignored: false,
      };
    }

    if (userIntent === 'HUMAN') {
      const stateToPatch = { ...state };

      stateToPatch.lastUserText = params.userMessage;

      if (state.statusMode === 'INITIAL') {
        stateToPatch.mode = 'HUMAN';
        stateToPatch.statusMode = 'IN_PROGRESS';
        stateToPatch.lastBotText = HUMAN_ESCALATION_MESSAGE;
      }

      if (state.statusMode === 'IN_PROGRESS') {
        return {
          reply: '',
          mode: stateToPatch.mode,
          statusMode: stateToPatch.statusMode,
          stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
          conversationId: stateToPatch.conversationId,
          ignored: true,
          reason:
            'Se ignora el mensaje porque el cliente ha solicitado hablar con un humano.',
        };
      }

      await this.bookingStoreService.upsert(stateToPatch);

      return {
        reply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        statusMode: stateToPatch.statusMode,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        conversationId: stateToPatch.conversationId,
        ignored: false,
      };
    }

    if (userIntent === 'CREATE') {
      let stateToPatch = { ...state };

      stateToPatch.lastUserText = params.userMessage;

      if (state.statusMode === 'INITIAL') {
        stateToPatch.mode = 'CREATE';
        stateToPatch.statusMode = 'IN_PROGRESS';
        stateToPatch.lastBotText = CREATE_BOOKING_MESSAGE;
      }

      if (state.statusMode === 'IN_PROGRESS') {
        const { aiResponse, statePatch: aiStatePatch } =
          await this.aiProvider.generateResponse({
            userName: params.userName,
            userPhoneNumber: params.userPhoneNumber,
            bookingState: { ...stateToPatch },
            schedulerService: this.schedulerService,
          });
        stateToPatch.lastBotText = aiResponse?.botReply ?? '';

        if (aiResponse?.flowStatus === AIStatus.CREATE_APPOINTMENT) {
          stateToPatch.statusMode = 'COMPLETED';
          stateToPatch.lastBotText = BOOKING_SUMMARY_MESSAGE`${{
            appointmentId: aiResponse.appointmentId!,
            appointmentDate: aiResponse.appointmentDate!,
            appointmentStartTime: aiResponse.appointmentStartTime!,
            ownerName: aiResponse.ownerName!,
            ownerPhone: aiResponse.ownerPhone!,
            petName: aiResponse.petName!,
            petSize: aiResponse.petSize!,
            petBreed: aiResponse.petBreed!,
            servicesName: aiResponse.servicesName!,
            notes: aiResponse.notes!,
            status: aiResponse.status!,
          }}`;
        }

        stateToPatch.expiresAt = this.calculateBookingExpiration();
        stateToPatch = patchBookingState(stateToPatch, aiStatePatch);
      }

      if (state.statusMode === 'COMPLETED') {
        stateToPatch.lastBotText = MENU_SELECTION_REQUIRED_MESSAGE;
        // TODO: DELETE THIS COMMENT:
        /**
         *! FLUJO DE ERROR - USUARIO NO SELECCIONA UNA OPCIÓN VÁLIDA DEL MENÚ
         * 1) Se envía a n8n -> el mode: 'CREATE' y statusMode: 'COMPLETED'
         * 2) n8n responde con el "reply" al WhatsApp al cliente
         * */
      }

      await this.bookingStoreService.upsert(stateToPatch);

      return {
        reply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        statusMode: stateToPatch.statusMode,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        conversationId: stateToPatch.conversationId,
        ignored: false,
      };
    }

    if (userIntent === 'DELETE') {
      let stateToPatch = { ...state };

      stateToPatch.lastUserText = params.userMessage;

      if (state.statusMode === 'INITIAL') {
        stateToPatch.mode = 'DELETE';
        stateToPatch.statusMode = 'IN_PROGRESS';
        stateToPatch.lastBotText = DELETE_BOOKING_MESSAGE;
      }

      if (state.statusMode === 'IN_PROGRESS') {
        const { aiResponse, statePatch: aiStatePatch } =
          await this.aiProvider.generateResponse({
            userName: params.userName,
            userPhoneNumber: params.userPhoneNumber,
            bookingState: { ...stateToPatch },
            schedulerService: this.schedulerService,
          });
        stateToPatch.lastBotText = aiResponse?.botReply ?? '';

        if (aiResponse?.flowStatus === AIStatus.CANCEL_APPOINTMENT) {
          stateToPatch.statusMode = 'COMPLETED';
        }

        stateToPatch.expiresAt = this.calculateBookingExpiration();
        stateToPatch = patchBookingState(stateToPatch, aiStatePatch);
      }

      if (state.statusMode === 'COMPLETED') {
        stateToPatch.lastBotText = MENU_SELECTION_REQUIRED_MESSAGE;
        // TODO: DELETE THIS COMMENT:
        /**
         *! FLUJO DE ERROR - USUARIO NO SELECCIONA UNA OPCIÓN VÁLIDA DEL MENÚ
         * 1) Se envía a n8n -> el mode: 'DELETE' y statusMode: 'COMPLETED'
         * 2) n8n responde con el "reply" al WhatsApp al cliente
         * */
      }

      await this.bookingStoreService.upsert(stateToPatch);

      return {
        reply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        statusMode: stateToPatch.statusMode,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        conversationId: stateToPatch.conversationId,
        ignored: false,
      };
    }

    return {
      reply: '',
      conversationId: state.conversationId,
      mode: state.mode,
      stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
      statusMode: state.statusMode,
      ignored: true,
      reason:
        'Se ignora el mensaje porque no se pudo identificar la intención del usuario.',
    };
  }
}
