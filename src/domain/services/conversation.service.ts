import {
  BookingState,
  BookingStore,
  FlowMode,
  FlowAIStatus,
  FlowModeStatus,
} from '@domain/models/booking-store.model';
import type { AIProvider } from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
import { InteractionOption } from '@domain/enums/interaction-option.enum';
import { calculateBookingExpiration } from '@shared/utils/state.util';
import {
  type ChatTurnResponse,
  ChatTurnStrategy,
} from './chat-turn-strategies/chat-turn.strategy';

export class ConversationService {
  constructor(
    private aiProvider: AIProvider,
    private bookingStoreService: BookingStore,
    private schedulerService: Scheduler
  ) {}

  private newState(conversationId: string): BookingState {
    const expiresAt = calculateBookingExpiration();

    return {
      conversationId,
      mode: FlowMode.WELCOME,
      modeStatus: FlowModeStatus.INITIAL,
      aiStatus: FlowAIStatus.COLLECTING,
      showGreeting: true,
      expiresAt,
      lastUserText: '',
      lastBotText: '',
    };
  }

  private resolveUserIntentAndState(params: {
    currentState: BookingState;
    previousState?: BookingState;
    userSelectionId?: InteractionOption;
  }): { userIntent: FlowMode; nextState: BookingState } {
    const { currentState, previousState, userSelectionId } = params;
    const nextState = { ...currentState };
    const selectionToIntent: Record<InteractionOption, FlowMode> = {
      [InteractionOption.MENU_SHOW_OPTIONS]: FlowMode.WELCOME,
      [InteractionOption.MENU_CREATE]: FlowMode.CREATE,
      [InteractionOption.MENU_CANCEL]: FlowMode.DELETE,
      [InteractionOption.MENU_INFO]: FlowMode.INFO,
      [InteractionOption.MENU_HUMAN]: FlowMode.HUMAN,
    };

    let userIntent: FlowMode = FlowMode.WELCOME;
    if (userSelectionId) {
      userIntent = selectionToIntent[userSelectionId];
      nextState.modeStatus = FlowModeStatus.INITIAL;
      nextState.aiStatus = FlowAIStatus.COLLECTING;
    } else if (previousState) {
      userIntent = previousState.mode;
    }

    return { userIntent, nextState };
  }

  async handleChatTurn(params: {
    conversationId: string;
    userName: string;
    userPhoneNumber: string;
    userMessage: string;
    userSelectionId?: InteractionOption;
  }): Promise<ChatTurnResponse> {
    const prevState = await this.bookingStoreService.get(params.conversationId);
    const state = prevState
      ? { ...prevState }
      : this.newState(params.conversationId);

    const { userIntent, nextState } = this.resolveUserIntentAndState({
      currentState: state,
      previousState: prevState ?? undefined,
      userSelectionId: params.userSelectionId,
    });

    const chatStrategy = ChatTurnStrategy.handleFlowMode(userIntent, {
      bookingStoreService: this.bookingStoreService,
      aiProvider: this.aiProvider,
      schedulerService: this.schedulerService,
    });
    return chatStrategy.process({
      bookingState: nextState,
      user: {
        name: params.userName,
        phoneNumber: params.userPhoneNumber,
        message: params.userMessage,
      },
    });
  }
}
