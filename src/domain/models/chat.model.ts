import type { FlowMode, FlowStatusMode } from './booking-store.model';

export interface ChatTurnResponse {
  reply: string;
  mode: FlowMode;
  statusMode: FlowStatusMode;
  stateExpiresInHours: number;
  conversationId: string;
  ignored: boolean;
  reason?: string;
}
