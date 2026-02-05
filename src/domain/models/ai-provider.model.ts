import { Scheduler } from './scheduler.model';
import type { BookingState } from './booking-store.model';

export interface AIProvider {
  generateResponse(params: AIPromptRequest): Promise<AIResponse>;
}

export interface AIPromptRequest {
  userPrompt: string;
  userPhoneNumber: string;
  bookingState: BookingState;
  schedulerService: Scheduler;
}

export interface AIResponse {
  text: string;
  requestId?: string;
  statePatch?: Partial<BookingState>;
}
