import { DateTime } from 'luxon';

import {
  BookingState,
  BookingStore,
  FlowMode,
  FlowAIStatus,
  FlowModeStatus,
} from '@domain/models/booking-store.model';
import type { ChatTurnResponse } from '@domain/models/chat.model';
import type { AIProvider } from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
import { InteractionOption } from '@domain/enums/interaction-option.enum';
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
import { ErrorCodes } from '@shared/symbols/error-codes.constants';

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
      mode: FlowMode.WELCOME,
      modeStatus: FlowModeStatus.INITIAL,
      aiStatus: FlowAIStatus.COLLECTING,
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

    let userIntent: FlowMode = FlowMode.WELCOME;
    if (params.userSelectionId) {
      userIntent = {
        [InteractionOption.MENU_SHOW_OPTIONS]: FlowMode.WELCOME,
        [InteractionOption.MENU_CREATE]: FlowMode.CREATE,
        [InteractionOption.MENU_EDIT]: FlowMode.EDIT,
        [InteractionOption.MENU_CANCEL]: FlowMode.DELETE,
        [InteractionOption.MENU_INFO]: FlowMode.INFO,
        [InteractionOption.MENU_HUMAN]: FlowMode.HUMAN,
      }[params.userSelectionId] as FlowMode;

      state.modeStatus = FlowModeStatus.INITIAL;
      state.aiStatus = FlowAIStatus.COLLECTING;
    }
    if (prevState && !params.userSelectionId) {
      userIntent = prevState.mode;
    }

    if (userIntent === FlowMode.WELCOME) {
      const stateToPatch = { ...state };

      stateToPatch.lastUserText = params.userMessage;

      if (state.modeStatus === FlowModeStatus.INITIAL) {
        stateToPatch.mode = FlowMode.WELCOME;
        stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
        stateToPatch.lastBotText = state.showGreeting ? WELCOME_MESSAGE : '';
        stateToPatch.showGreeting = false;
        // TODO: DELETE THIS COMMENT:
        /**
         * 1) Se envía a n8n -> el mode: 'WELCOME'
         * 2) n8n responde con el "reply" al WhatsApp al cliente (concatenar + salto de línea)
         * 3) n8n manda la Interactive List de WhatsApp al cliente
         * */
      }

      if (state.modeStatus === FlowModeStatus.IN_PROGRESS) {
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
        statusCode: 200,
        conversationId: stateToPatch.conversationId,
        botReply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        modeStatus: stateToPatch.modeStatus,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        ignored: false,
      };
    }

    if (userIntent === FlowMode.INFO) {
      const stateToPatch = { ...state };

      stateToPatch.lastUserText = params.userMessage;

      if (state.modeStatus === FlowModeStatus.INITIAL) {
        stateToPatch.mode = FlowMode.INFO;
        stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
        stateToPatch.lastBotText = VET_DETAILS_MESSAGE;
      }

      if (state.modeStatus === FlowModeStatus.IN_PROGRESS) {
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
        statusCode: 200,
        conversationId: stateToPatch.conversationId,
        botReply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        modeStatus: stateToPatch.modeStatus,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        ignored: false,
      };
    }

    if (userIntent === FlowMode.HUMAN) {
      const stateToPatch = { ...state };

      stateToPatch.lastUserText = params.userMessage;

      if (state.modeStatus === FlowModeStatus.INITIAL) {
        stateToPatch.mode = FlowMode.HUMAN;
        stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
        stateToPatch.lastBotText = HUMAN_ESCALATION_MESSAGE;
      }

      if (state.modeStatus === FlowModeStatus.IN_PROGRESS) {
        return {
          statusCode: ErrorCodes.HUMAN_ESCALATION_IGNORED.statusCode,
          conversationId: stateToPatch.conversationId,
          botReply: '',
          mode: stateToPatch.mode,
          modeStatus: stateToPatch.modeStatus,
          stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
          ignored: true,
          reason: ErrorCodes.HUMAN_ESCALATION_IGNORED.message,
        };
      }

      await this.bookingStoreService.upsert(stateToPatch);

      return {
        statusCode: 200,
        conversationId: stateToPatch.conversationId,
        botReply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        modeStatus: stateToPatch.modeStatus,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        ignored: false,
      };
    }

    if (userIntent === FlowMode.CREATE) {
      let stateToPatch = { ...state };
      let responseStatus = 200;

      stateToPatch.lastUserText = params.userMessage;

      if (state.modeStatus === FlowModeStatus.INITIAL) {
        stateToPatch.mode = FlowMode.CREATE;
        stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
        stateToPatch.lastBotText = CREATE_BOOKING_MESSAGE;
      }

      if (state.modeStatus === FlowModeStatus.IN_PROGRESS) {
        const {
          aiResponse,
          statePatch: aiStatePatch,
          errorReason,
          statusCode,
        } = await this.aiProvider.generateResponse({
          userName: params.userName,
          userPhoneNumber: params.userPhoneNumber,
          bookingState: { ...stateToPatch },
          schedulerService: this.schedulerService,
        });
        stateToPatch = patchBookingState(stateToPatch, aiStatePatch);
        stateToPatch.lastBotText = aiResponse?.botReply ?? '';
        stateToPatch.expiresAt = this.calculateBookingExpiration();

        if (errorReason && statusCode) {
          stateToPatch.lastBotText = errorReason;
          responseStatus = statusCode;
        }

        if (aiResponse?.aiStatus === FlowAIStatus.DONE) {
          stateToPatch.modeStatus = FlowModeStatus.COMPLETED;
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
      }

      if (state.modeStatus === FlowModeStatus.COMPLETED) {
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
        statusCode: responseStatus,
        conversationId: stateToPatch.conversationId,
        botReply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        modeStatus: stateToPatch.modeStatus,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        ignored: false,
      };
    }

    if (userIntent === FlowMode.DELETE) {
      let stateToPatch = { ...state };
      let responseStatus = 200;

      stateToPatch.lastUserText = params.userMessage;

      if (state.modeStatus === FlowModeStatus.INITIAL) {
        stateToPatch.mode = FlowMode.DELETE;
        stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
        stateToPatch.lastBotText = DELETE_BOOKING_MESSAGE;
      }

      if (state.modeStatus === FlowModeStatus.IN_PROGRESS) {
        const {
          aiResponse,
          statePatch: aiStatePatch,
          errorReason,
          statusCode,
        } = await this.aiProvider.generateResponse({
          userName: params.userName,
          userPhoneNumber: params.userPhoneNumber,
          bookingState: { ...stateToPatch },
          schedulerService: this.schedulerService,
        });
        stateToPatch = patchBookingState(stateToPatch, aiStatePatch);
        stateToPatch.lastBotText = aiResponse?.botReply ?? '';
        stateToPatch.expiresAt = this.calculateBookingExpiration();

        if (errorReason && statusCode) {
          stateToPatch.lastBotText = errorReason;
          responseStatus = statusCode;
        }

        if (aiResponse?.aiStatus === FlowAIStatus.DONE) {
          stateToPatch.modeStatus = FlowModeStatus.COMPLETED;
        }
      }

      if (state.modeStatus === FlowModeStatus.COMPLETED) {
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
        statusCode: responseStatus,
        conversationId: stateToPatch.conversationId,
        botReply: stateToPatch.lastBotText,
        mode: stateToPatch.mode,
        modeStatus: stateToPatch.modeStatus,
        stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
        ignored: false,
      };
    }

    return {
      statusCode: ErrorCodes.USER_INTENT_NOT_IDENTIFIED.statusCode,
      conversationId: state.conversationId,
      botReply: '',
      mode: state.mode,
      modeStatus: state.modeStatus,
      stateExpiresInHours: BOOKING_STORE_TTL_HOURS,
      ignored: true,
      reason: ErrorCodes.USER_INTENT_NOT_IDENTIFIED.message,
    };
  }
}
