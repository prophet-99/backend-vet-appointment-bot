import {
  type BookingStore,
  FlowMode,
  FlowModeStatus,
} from '@domain/models/booking-store.model';
import {
  MENU_SELECTION_REQUIRED_MESSAGE,
  VET_DETAILS_MESSAGE,
} from '@shared/symbols/conversation.contants';
import {
  type ChatTurnRequest,
  type ChatTurnResponse,
  ChatTurnStrategy,
} from './chat-turn.strategy';

export class HumanStrategy extends ChatTurnStrategy {
  constructor(private bookingStoreService: BookingStore) {
    super();
  }

  async process(chatTurnReq: ChatTurnRequest): Promise<ChatTurnResponse> {
    const { bookingState, user } = chatTurnReq;
    const stateToPatch = { ...bookingState };

    stateToPatch.lastUserText = user.message;

    if (bookingState.modeStatus === FlowModeStatus.INITIAL) {
      stateToPatch.mode = FlowMode.INFO;
      stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
      stateToPatch.lastBotText = VET_DETAILS_MESSAGE;
    }

    if (bookingState.modeStatus === FlowModeStatus.IN_PROGRESS) {
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
      ignored: false,
    };
  }
}
