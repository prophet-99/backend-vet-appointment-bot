import type { AIProvider } from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
import type {
  HandleChatTurnRequest,
  HandleChatTurnResponse,
  ManageAppointmentRequest,
  ManageAppointmentResponse,
} from '@domain/models/conversation.model';
import {
  BookingState,
  BookingStore,
  FlowMode,
  FlowAIStatus,
  FlowModeStatus,
} from '@domain/models/booking-store.model';
import { InteractionOption } from '@domain/enums/interaction-option.enum';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import { calculateBookingExpiration } from '@shared/utils/state.util';
import {
  ACCEPTED_APPOINTMENT_MESSAGE,
  REJECTED_APPOINTMENT_MESSAGE,
} from '@shared/symbols/conversation.contants';
import { createChatTurnStrategy } from './chat-turn-strategies/chat-turn.factory';

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

  async handleChatTurn(
    params: HandleChatTurnRequest
  ): Promise<HandleChatTurnResponse> {
    const prevState = await this.bookingStoreService.get(params.conversationId);
    const state = prevState
      ? { ...prevState }
      : this.newState(params.conversationId);

    const { userIntent, nextState } = this.resolveUserIntentAndState({
      currentState: state,
      previousState: prevState ?? undefined,
      userSelectionId: params.userSelectionId,
    });

    const chatStrategy = createChatTurnStrategy(userIntent, {
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

  async rejectOrAcceptAppointment(
    params: ManageAppointmentRequest
  ): Promise<ManageAppointmentResponse> {
    const { appointmentId, doctorChoice } = params;

    const appointmentStatus =
      await this.schedulerService.updateAppointmentStatus(
        appointmentId,
        doctorChoice
      );

    if (appointmentStatus.success) {
      const botReplyByStatus: Partial<Record<AppointmentStatus, string>> = {
        [AppointmentStatus.CONFIRMED]: ACCEPTED_APPOINTMENT_MESSAGE,
        [AppointmentStatus.REJECTED]: REJECTED_APPOINTMENT_MESSAGE,
      };

      return {
        statusCode: 200,
        botReply: botReplyByStatus[doctorChoice] ?? '',
      };
    }
    return {
      botReply: '',
      statusCode: appointmentStatus.statusCode,
      reason: appointmentStatus.errorReason,
    };
  }
}
