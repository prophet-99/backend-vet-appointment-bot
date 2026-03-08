import {
  type BookingStore,
  FlowMode,
  FlowModeStatus,
} from '@domain/models/booking-store.model';
import {
  MENU_SELECTION_REQUIRED_MESSAGE,
  WELCOME_MESSAGE,
} from '@shared/symbols/conversation.contants';
import {
  type ChatTurnRequest,
  type ChatTurnResponse,
  ChatTurnStrategy,
} from './chat-turn.strategy';

export class WelcomeStrategy extends ChatTurnStrategy {
  constructor(private bookingStoreService: BookingStore) {
    super();
  }

  async process(chatTurnReq: ChatTurnRequest): Promise<ChatTurnResponse> {
    const { bookingState, user } = chatTurnReq;

    const stateToPatch = { ...bookingState };
    stateToPatch.lastUserText = user.message;

    if (bookingState.modeStatus === FlowModeStatus.INITIAL) {
      stateToPatch.mode = FlowMode.WELCOME;
      stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
      stateToPatch.lastBotText = bookingState.showGreeting
        ? WELCOME_MESSAGE
        : '';
      stateToPatch.showGreeting = false;
    }

    if (bookingState.modeStatus === FlowModeStatus.IN_PROGRESS) {
      stateToPatch.lastBotText = MENU_SELECTION_REQUIRED_MESSAGE;
    }

    await this.bookingStoreService.upsert(stateToPatch);

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
