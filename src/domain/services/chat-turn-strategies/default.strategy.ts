import { ErrorCodes } from '@shared/symbols/error-codes.constants';
import {
  type ChatTurnRequest,
  type ChatTurnResponse,
  ChatTurnStrategy,
} from './chat-turn.strategy';

export class DefaultStrategy extends ChatTurnStrategy {
  async process(chatTurnReq: ChatTurnRequest): Promise<ChatTurnResponse> {
    const { bookingState } = chatTurnReq;

    return {
      statusCode: ErrorCodes.USER_INTENT_NOT_IDENTIFIED.statusCode,
      conversationId: bookingState.conversationId,
      botReply: '',
      mode: bookingState.mode,
      modeStatus: bookingState.modeStatus,
      ignored: true,
      reason: ErrorCodes.USER_INTENT_NOT_IDENTIFIED.message,
    };
  }
}
