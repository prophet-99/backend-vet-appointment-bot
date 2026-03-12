import {
  type BookingStore,
  FlowAIStatus,
  FlowMode,
  FlowModeStatus,
} from '@domain/models/booking-store.model';
import type { AIProvider } from '@domain/models/ai-provider.model';
import type { Scheduler } from '@domain/models/scheduler.model';
import {
  AppointmentStatus,
  getAppointmentStatusDisplayName,
} from '@domain/enums/appointment-status.enum';
import { PetSize, getPetSizeDisplayName } from '@domain/enums/pet-size.enum';

import {
  BOOKING_SUMMARY_MESSAGE,
  CREATE_BOOKING_MESSAGE,
  MENU_SELECTION_REQUIRED_MESSAGE,
} from '@shared/symbols/conversation.contants';
import {
  calculateBookingExpiration,
  patchBookingState,
} from '@shared/utils/state.util';
import {
  type ChatTurnRequest,
  type ChatTurnResponse,
  ChatTurnStrategy,
} from './chat-turn.strategy';

export class CreateStrategy extends ChatTurnStrategy {
  constructor(
    private bookingStoreService: BookingStore,
    private aiProvider: AIProvider,
    private schedulerService: Scheduler
  ) {
    super();
  }

  async process(chatTurnReq: ChatTurnRequest): Promise<ChatTurnResponse> {
    const { bookingState, user } = chatTurnReq;

    let stateToPatch = { ...bookingState };
    let responseStatus = 200;

    stateToPatch.lastUserText = user.message;

    if (bookingState.modeStatus === FlowModeStatus.INITIAL) {
      stateToPatch.mode = FlowMode.CREATE;
      stateToPatch.modeStatus = FlowModeStatus.IN_PROGRESS;
      stateToPatch.lastBotText = CREATE_BOOKING_MESSAGE;
    }

    if (bookingState.modeStatus === FlowModeStatus.IN_PROGRESS) {
      const {
        aiResponse,
        statePatch: aiStatePatch,
        errorReason,
        statusCode,
      } = await this.aiProvider.generateResponse({
        userName: user.name,
        userPhoneNumber: user.phoneNumber,
        bookingState: { ...stateToPatch },
        schedulerService: this.schedulerService,
      });
      stateToPatch = patchBookingState(stateToPatch, aiStatePatch);
      stateToPatch.lastBotText = aiResponse?.botReply ?? '';
      stateToPatch.expiresAt = calculateBookingExpiration();

      if (errorReason && statusCode) {
        stateToPatch.lastBotText = errorReason;
        responseStatus = statusCode;
      }

      if (aiResponse?.aiStatus === FlowAIStatus.DONE) {
        stateToPatch.modeStatus = FlowModeStatus.COMPLETED;
        stateToPatch.lastBotText = BOOKING_SUMMARY_MESSAGE`${{
          appointmentId: aiResponse.appointmentId!,
          appointmentDate: aiResponse.appointmentDate!,
          appointmentStartTime: aiResponse.appointmentStartTime!,
          ownerName: aiResponse.ownerName!,
          ownerPhone: aiResponse.ownerPhone!,
          petName: aiResponse.petName!,
          petSize: getPetSizeDisplayName(aiResponse.petSize! as PetSize),
          petBreed: aiResponse.petBreed!,
          servicesName: aiResponse.servicesName!,
          notes: aiResponse.notes!,
          status: getAppointmentStatusDisplayName(
            aiResponse.status! as AppointmentStatus
          ),
        }}`;
      }
    }

    if (bookingState.modeStatus === FlowModeStatus.COMPLETED) {
      stateToPatch.lastBotText = MENU_SELECTION_REQUIRED_MESSAGE;
    }

    await this.bookingStoreService.upsert(stateToPatch);

    return {
      statusCode: responseStatus,
      conversationId: stateToPatch.conversationId,
      botReply: stateToPatch.lastBotText,
      mode: stateToPatch.mode,
      modeStatus: stateToPatch.modeStatus,
      ignored: false,
    };
  }
}
