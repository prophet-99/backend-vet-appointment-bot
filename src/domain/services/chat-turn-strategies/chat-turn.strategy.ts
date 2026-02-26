import {
  type BookingState,
  type BookingStore,
  FlowMode,
  FlowModeStatus,
} from '@domain/models/booking-store.model';
import type { AIProvider } from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
import { WelcomeStrategy } from './welcome.strategy';
import { InfoStrategy } from './info.strategy';
import { HumanStrategy } from './human.strategy';
import { CreateStrategy } from './create.strategy';
import { DeleteStrategy } from './delete.strategy';
import { DefaultStrategy } from './default.strategy';

export abstract class ChatTurnStrategy {
  abstract process(chatTurnReq: ChatTurnRequest): Promise<ChatTurnResponse>;

  static handleFlowMode(
    flowMode: FlowMode,
    dependencies: {
      bookingStoreService: BookingStore;
      aiProvider: AIProvider;
      schedulerService: Scheduler;
    }
  ): ChatTurnStrategy {
    const { bookingStoreService, aiProvider, schedulerService } = dependencies;

    return (
      {
        [FlowMode.WELCOME]: new WelcomeStrategy(bookingStoreService),
        [FlowMode.INFO]: new InfoStrategy(bookingStoreService),
        [FlowMode.HUMAN]: new HumanStrategy(bookingStoreService),
        [FlowMode.CREATE]: new CreateStrategy(
          bookingStoreService,
          aiProvider,
          schedulerService
        ),
        [FlowMode.DELETE]: new DeleteStrategy(
          bookingStoreService,
          aiProvider,
          schedulerService
        ),
      }[flowMode] ?? new DefaultStrategy()
    );
  }
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
