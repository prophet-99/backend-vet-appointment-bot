import { Scheduler } from './scheduler.model';
import type { BookingState, FlowMode } from './booking-store.model';

export interface AIProvider {
  generateResponse(params: AIPromptRequest): Promise<AIResponse>;
  detectPromptIntent(params: AIPromptIntentRequest): Promise<PromptIntent>;
}

export type PromptIntent = FlowMode;

export interface AIPromptRequest {
  user: {
    prompt: string;
    phoneNumber: string;
    intent: PromptIntent;
  };
  bookingState: BookingState;
  schedulerService: Scheduler;
}

export interface AIPromptIntentRequest {
  userPrompt: string;
}

export interface AIResponse {
  text: string;
  requestId?: string;
  statePatch?: Partial<BookingState>;
}
