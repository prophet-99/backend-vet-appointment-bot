import { PetSize } from '@domain/enums/pet-size.enum';

export type FlowMode =
  | 'WELCOME'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'INFO'
  | 'HUMAN';

export type FlowStatusMode = 'INITIAL' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';

export interface BookingState {
  conversationId: string;
  mode: FlowMode;
  statusMode: FlowStatusMode;
  toolCall;
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
}

export interface BookingStore {
  get(conversationId: string): Promise<BookingState | null>;
  upsert(state: BookingState): Promise<void>;
  clear(conversationId: string): Promise<void>;
}
