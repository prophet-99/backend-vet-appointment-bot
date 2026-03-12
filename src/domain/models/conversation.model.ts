import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import { InteractionOption } from '@domain/enums/interaction-option.enum';
import type { ChatTurnResponse } from '@domain/services/chat-turn-strategies/chat-turn.strategy';

export interface HandleChatTurnRequest {
  conversationId: string;
  userName: string;
  userMessage: string;
  userPhoneNumber: string;
  userSelectionId?: InteractionOption;
}

export interface HandleChatTurnResponse extends ChatTurnResponse {}

export interface ManageAppointmentRequest {
  appointmentId: string;
  doctorChoice: AppointmentStatus;
}

export interface ManageAppointmentResponse {
  statusCode: number;
  botReply: string;
  reason?: string;
}
