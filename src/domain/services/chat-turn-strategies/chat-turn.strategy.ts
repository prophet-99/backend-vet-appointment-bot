import {
  type BookingState,
  FlowMode,
  FlowModeStatus,
} from '@domain/models/booking-store.model';

export abstract class ChatTurnStrategy {
  abstract process(chatTurnReq: ChatTurnRequest): Promise<ChatTurnResponse>;
}

export interface ChatTurnRequest {
  bookingState: BookingState;
  user: {
    message: string;
    name: string;
    phoneNumber: string;
  };
}

export interface ChatTurnResponse {
  statusCode: number;
  conversationId: string;
  botReply: string;
  mode: FlowMode;
  modeStatus: FlowModeStatus;
  ignored: boolean;
  reason?: string;
}
