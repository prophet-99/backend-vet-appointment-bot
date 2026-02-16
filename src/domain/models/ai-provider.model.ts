import type { Scheduler } from './scheduler.model';
import type { BookingState } from './booking-store.model';

export interface AIProvider {
  generateResponse(params: AIRequest): Promise<AIResponse>;
}

export interface AIRequest {
  userName: string;
  userPhoneNumber: string;
  bookingState: BookingState;
  schedulerService: Scheduler;
}

export interface AIResponse {
  requestId: string;
  text: string;
  statePatch: Partial<BookingState>;
  statusCode: number;
  errorCode?: string;
  errorReason?: string;
}
