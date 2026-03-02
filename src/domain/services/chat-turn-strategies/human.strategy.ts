import {
  type BookingStore,
  FlowMode,
  FlowModeStatus,
} from '@domain/models/booking-store.model';
import { HUMAN_ESCALATION_MESSAGE } from '@shared/symbols/conversation.contants';
import { ErrorCodes } from '@shared/symbols/error-codes.constants';
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
      stateToPatch.mode = FlowMode.HUMAN;
      stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
      stateToPatch.lastBotText = HUMAN_ESCALATION_MESSAGE;
    }

    if (bookingState.modeStatus === FlowModeStatus.IN_PROGRESS) {
      return {
        statusCode: ErrorCodes.HUMAN_ESCALATION_IGNORED.statusCode,
        conversationId: stateToPatch.conversationId,
        botReply: '',
        mode: stateToPatch.mode,
        modeStatus: stateToPatch.modeStatus,
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
      ignored: false,
    };
  }
}
