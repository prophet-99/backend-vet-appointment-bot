import { PetSize } from '@domain/enums/pet-size.enum';

export enum FlowMode {
  WELCOME = 'WELCOME',
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  INFO = 'INFO',
  HUMAN = 'HUMAN',
}

export enum FlowModeStatus {
  INITIAL = 'INITIAL',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum FlowAIStatus {
  COLLECTING = 'COLLECTING',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
}

export interface BookingState {
  conversationId: string;
  mode: FlowMode;
  modeStatus: FlowModeStatus;
  aiStatus: FlowAIStatus;
  showGreeting: boolean;
  expiresAt: Date;
  lastUserText: string;
  lastBotText: string;

  preferredDate?: string; // ISO string: "YYYY-MM-DD"
  preferredTime?: string; // "HH:MM"
  petName?: string;
  petSize?: PetSize;
  petBreed?: string;
  notes?: string;
  servicesName?: string[];

  appointmentId?: string;
  cancelledReason?: string;
}

export interface BookingStore {
  get(conversationId: string): Promise<BookingState | null>;
  upsert(state: BookingState): Promise<void>;
  clear(conversationId: string): Promise<void>;
}
