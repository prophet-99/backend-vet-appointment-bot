import type {
  HandleChatTurnRequest,
  HandleChatTurnResponse,
  ManageAppointmentRequest,
  ManageAppointmentResponse,
} from '@domain/models/conversation.model';
import { ConversationService } from '@domain/services/conversation.service';
import { InDBBookingStoreService } from '@domain/services/booking-store.service';
import { SchedulerService } from '@domain/services/scheduler.service';
import { BookingStoreRepository } from '@infraestructure/db/repositories/booking-store.repository';
import { SchedulerRepository } from '@infraestructure/db/repositories/scheduler.repository';
import { OpenAIProviderOrchestrator } from './ai-provider.orchestrator';

export class ConversationOrchestrator {
  private conversationService: ConversationService;

  constructor() {
    const aiProvider = new OpenAIProviderOrchestrator();
    const bookingStoreService = new InDBBookingStoreService(
      new BookingStoreRepository()
    );
    const schedulerService = new SchedulerService(new SchedulerRepository());

    this.conversationService = new ConversationService(
      aiProvider,
      bookingStoreService,
      schedulerService
    );
  }

  async handleChatTurn(
    params: HandleChatTurnRequest
  ): Promise<HandleChatTurnResponse> {
    const {
      conversationId,
      userName,
      userMessage,
      userPhoneNumber,
      userSelectionId,
    } = params;

    return this.conversationService.handleChatTurn({
      conversationId,
      userName,
      userMessage,
      userPhoneNumber,
      userSelectionId,
    });
  }

  async rejectOrAcceptAppointment(
    params: ManageAppointmentRequest
  ): Promise<ManageAppointmentResponse> {
    const { appointmentId, doctorChoice } = params;

    return this.conversationService.rejectOrAcceptAppointment({
      appointmentId,
      doctorChoice,
    });
  }
}
