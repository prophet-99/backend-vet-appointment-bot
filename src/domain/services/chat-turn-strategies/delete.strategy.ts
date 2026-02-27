import {
  type BookingStore,
  FlowAIStatus,
  FlowMode,
  FlowModeStatus,
} from '@domain/models/booking-store.model';
import type { AIProvider } from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
import {
  DELETE_BOOKING_MESSAGE,
  MENU_SELECTION_REQUIRED_MESSAGE,
} from '@shared/symbols/conversation.contants';
import {
  calculateBookingExpiration,
  patchBookingState,
} from '@shared/utils/state.util';
import {
  type ChatTurnRequest,
  type ChatTurnResponse,
  ChatTurnStrategy,
} from './chat-turn.strategy';

export class DeleteStrategy extends ChatTurnStrategy {
  constructor(
    private bookingStoreService: BookingStore,
    private aiProvider: AIProvider,
    private schedulerService: Scheduler
  ) {
    super();
  }

  async process(chatTurnReq: ChatTurnRequest): Promise<ChatTurnResponse> {
    const { bookingState, user } = chatTurnReq;

    let stateToPatch = { ...bookingState };
    let responseStatus = 200;

    stateToPatch.lastUserText = user.message;

    if (bookingState.modeStatus === FlowModeStatus.INITIAL) {
      stateToPatch.mode = FlowMode.DELETE;
      stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
      stateToPatch.lastBotText = DELETE_BOOKING_MESSAGE;
    }

    if (bookingState.modeStatus === FlowModeStatus.IN_PROGRESS) {
      const {
        aiResponse,
        statePatch: aiStatePatch,
        errorReason,
        statusCode,
      } = await this.aiProvider.generateResponse({
        userName: user.name,
        userPhoneNumber: user.phoneNumber,
        bookingState: { ...stateToPatch },
        schedulerService: this.schedulerService,
      });

      stateToPatch = patchBookingState(stateToPatch, aiStatePatch);
      stateToPatch.lastBotText = aiResponse?.botReply ?? '';
      stateToPatch.expiresAt = calculateBookingExpiration();

      if (errorReason && statusCode) {
        stateToPatch.lastBotText = errorReason;
        responseStatus = statusCode;
      }

      if (aiResponse?.aiStatus === FlowAIStatus.DONE) {
        stateToPatch.modeStatus = FlowModeStatus.COMPLETED;
      }
    }

    if (bookingState.modeStatus === FlowModeStatus.COMPLETED) {
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
      ignored: false,
    };
  }
}
