import type { BookingState } from "@domain/models/booking-store.model";
import type { Scheduler } from "@domain/models/scheduler.model";

export abstract class TollCallHandler {
	abstract canHandle(name: string): boolean;
	abstract handle(call: any, context: ToolCallContext): Promise<ToolCallResult>;
}

export interface ToolCallContext {
	schedulerService: Scheduler;
  currentState: BookingState;
  userName: string;
  userPhoneNumber: string;
}

export interface ToolCallResult {
  nextState: BookingState;
  zodFormatResponse: any;
  toolOutput: any;
}
