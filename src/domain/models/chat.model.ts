import type { FlowMode, FlowModeStatus } from './booking-store.model';

export interface ChatTurnResponse {
  statusCode: number;
  conversationId: string;
  botReply: string;
  mode: FlowMode;
  modeStatus: FlowModeStatus;
  stateExpiresInHours: number;
  ignored: boolean;
  reason?: string;
}
