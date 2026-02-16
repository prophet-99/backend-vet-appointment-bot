import { PetSize } from '@domain/enums/pet-size.enum';

// ========== GET AVAILABILITY ==========
export interface GetAvailabilityInput {
  day: string; // YYYY-MM-DD
  preferredTime?: string; // HH:MM (opcional)
  servicesName: string[];
  petSize: PetSize;
  blockMinutes?: number;
  lookAheadDays?: number;
}

export interface GetAvailabilityOutput {
  success: boolean;
  statusCode: number;
  errorCode?: string;
  errorReason?: string;
  appointment?: {
    appointmentDay: Date;
    suggestedStart: string;
    suggestedEnd: string;
    requiredMinutes: number;
    services: Array<{ id: string; name: string }>;
  };
}

// ========== GET SERVICES ID BY NAME ==========
export interface GetServicesIdByNameOutput {
  success: boolean;
  statusCode: number;
  errorCode?: string;
  errorReason?: string;
  serviceIds?: string[];
}

// ========== CREATE APPOINTMENT ==========
export interface CreateAppointmentInput {
  day: Date;
  startTime: string;
  endTime: string;
  ownerName: string;
  ownerPhone: string;
  petName: string;
  petSize: PetSize;
  petBreed?: string;
  notes?: string;
  serviceIds: string[];
  pendingTtlMinutes?: number;
}

export interface CreateAppointmentOutput {
  success: boolean;
  statusCode: number;
  errorCode?: string;
  errorReason?: string;
  appointment?: {
    appointmentId: string;
    appointmentDate: string; // YYYY-MM-DD
    appointmentStartTime: string; // HH:MM
    appointmentEndTime: string; // HH:MM
    ownerName: string;
    ownerPhone: string;
    petName: string;
    petSize: string;
    petBreed: string;
    servicesName: string[];
    notes: string;
    status: string;
  };
}

// ========== GET APPOINTMENT ==========
export interface GetAppointmentOutput {
  success: boolean;
  statusCode: number;
  errorCode?: string;
  errorReason?: string;
  appointment?: {
    appointmentId: string;
    appointmentDate: string; // YYYY-MM-DD
    appointmentStartTime: string; // HH:MM
    appointmentEndTime: string; // HH:MM
    ownerName: string;
    ownerPhone: string;
    petName: string;
    petSize: string;
    petBreed: string;
    servicesName: string[];
    notes: string;
    status: string;
  };
}

// ========== CANCEL APPOINTMENT ==========
export interface CancelAppointmentOutput {
  success: boolean;
  statusCode: number;
  errorCode?: string;
  errorReason?: string;
}

export interface Scheduler {
  getAvailibility(params: GetAvailabilityInput): Promise<GetAvailabilityOutput>;

  createAppointment(
    params: CreateAppointmentInput
  ): Promise<CreateAppointmentOutput>;

  getServicesIdByNames(names: string[]): Promise<GetServicesIdByNameOutput>;

  getAppointment(appointmentId: string): Promise<GetAppointmentOutput>;

  cancelAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<CancelAppointmentOutput>;
}
