import {
  type BookingStore,
  FlowMode,
} from '@domain/models/booking-store.model';
import type { AIProvider } from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
import { CreateStrategy } from './create.strategy';
import { HumanStrategy } from './human.strategy';
import { InfoStrategy } from './info.strategy';
import { WelcomeStrategy } from './welcome.strategy';
import { DeleteStrategy } from './delete.strategy';
import { DefaultStrategy } from './default.strategy';
import type { ChatTurnStrategy } from './chat-turn.strategy';

export const createChatTurnStrategy = (
  flowMode: FlowMode,
  dependencies: {
    bookingStoreService: BookingStore;
    aiProvider: AIProvider;
    schedulerService: Scheduler;
  }
): ChatTurnStrategy => {
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
};
