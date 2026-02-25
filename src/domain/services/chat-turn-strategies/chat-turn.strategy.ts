import { type BookingState, type BookingStore, FlowMode, FlowModeStatus } from "@domain/models/booking-store.model";
import { WelcomeStrategy } from "./welcome.strategy";
import { InfoStrategy } from "./info.strategy";

export abstract class ChatTurnStrategy {
	abstract process(chatTurnReq: ChatTurnRequest): Promise<ChatTurnResponse>;

	static handleFlowMode(flowMode: FlowMode, bookingStoreService: BookingStore): ChatTurnStrategy {
		return {
			[FlowMode.WELCOME]: new WelcomeStrategy(bookingStoreService),
			[FlowMode.INFO]: new InfoStrategy(bookingStoreService),
			
			[FlowMode.CREATE]: new WelcomeStrategy(bookingStoreService),
			[FlowMode.EDIT]: new WelcomeStrategy(bookingStoreService),
			[FlowMode.DELETE]: new WelcomeStrategy(bookingStoreService),
			[FlowMode.HUMAN]: new WelcomeStrategy(bookingStoreService),
		}[flowMode];
	}
}

export interface ChatTurnRequest {
	bookingState: BookingState;
	user: {
		message: string;
		name?: string;
		phoneNumber?: string;
	};
}

export interface ChatTurnResponse {
	statusCode: number,
	conversationId: string,
	botReply: string,
	mode: FlowMode,
	modeStatus: FlowModeStatus,
	ignored: boolean,
	reason?:string
}