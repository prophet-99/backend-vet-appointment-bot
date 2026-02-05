import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
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
  reason?: string;
  appointment?: {
    appointmentDay: Date;
    suggestedStart: string;
    suggestedEnd: string;
    requiredMinutes: number;
    services: Array<{ id: string; name: string }>;
  };
}

// ========== CREATE APPOINTMENT ==========
export interface CreateAppointmentInput {
  day: Date;
  startTime: string;
  endTime: string;
  ownerName: string;
  ownerPhone: string;
  petName: string;
  size: PetSize;
  breedText?: string;
  notes?: string;
  serviceIds: string[];
  pendingTtlMinutes?: number;
}

export interface CreateAppointmentOutput {
  success: boolean;
  statusCode: number;
  reason?: string;
  appointment?: {
    appointmentId: string;
    appointmentDate: string; // YYYY-MM-DD
    appointmentStartTime: string; // HH:MM
    appointmentEndTime: string; // HH:MM
    ownerName: string;
    ownerPhone: string;
    petName: string;
    petSize: string;
    breedText: string | null;
    servicesName: string[];
    notes: string | null;
    status: string;
  };
}

// ========== GET APPOINTMENT ==========
export interface GetAppointmentOutput {
  success: boolean;
  statusCode: number;
  appointment?: {
    appointmentId: string;
    appointmentDate: string; // YYYY-MM-DD
    appointmentStartTime: string; // HH:MM
    appointmentEndTime: string; // HH:MM
    ownerName: string;
    ownerPhone: string;
    petName: string;
    petSize: string;
    breedText: string | null;
    servicesName: string[];
    notes: string | null;
    status: string;
  };
  reason?: string;
}

// ========== CANCEL APPOINTMENT ==========
export interface CancelAppointmentOutput {
  success: boolean;
  statusCode: number;
  reason?: string;
}

export interface Scheduler {
  getAvailibility(params: GetAvailabilityInput): Promise<GetAvailabilityOutput>;

  createAppointment(
    params: CreateAppointmentInput
  ): Promise<CreateAppointmentOutput>;

  getServicesIdByNames(names: string[]): Promise<string[]>;

  getAppointment(appointmentId: string): Promise<GetAppointmentOutput>;

  cancelAppointment(appointmentId: string): Promise<CancelAppointmentOutput>;
}
