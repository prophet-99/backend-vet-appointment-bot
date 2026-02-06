import { PetSize } from '@domain/enums/pet-size.enum';

export type FlowMode =
  | 'WELCOME'
  | 'INFO'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'GET'
  | 'HUMAN';

export interface BookingState {
  conversationId: string;
  mode: FlowMode;
  lastUserText?: string;
  lastBotText?: string;
  preferredDate?: string; // ISO string: "YYYY-MM-DD"
  preferredTime?: string; // "HH:MM"
  appointmentDate?: string; // ISO string: "YYYY-MM-DD"
  appointmentStartTime?: string; // "HH:MM"
  appointmentEndTime?: string; // "HH:MM"
  ownerName?: string;
  petName?: string;
  petSize?: PetSize;
  breedText?: string;
  notes?: string;
  servicesName?: string[];
  expiresAt?: Date;
}

export interface BookingStore {
  get(conversationId: string): Promise<BookingState | null>;
  upsert(state: BookingState): Promise<void>;
  clear(conversationId: string): Promise<void>;
}
