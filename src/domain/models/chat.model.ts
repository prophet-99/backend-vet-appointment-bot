import type { FlowMode } from './booking-store.model';

export type ChatTurnResponse =
  | ChatTurnSuccessResponse
  | ChatTurnHumanEscalationResponse
  | ChatTurnIgnoredResponse;

export interface ChatTurnSuccessResponse {
  conversationId: string;
  reply: string;
  mode: Exclude<FlowMode, 'HUMAN'>;
  stateExpiresInHours: number;
  requestId: string;
}

export interface ChatTurnHumanEscalationResponse {
  conversationId: string;
  reply: string;
  mode: 'HUMAN';
  stateExpiresInHours: number;
}

export interface ChatTurnIgnoredResponse {
  conversationId: string;
  reply: string;
  ignored: true;
  reason: string;
}
