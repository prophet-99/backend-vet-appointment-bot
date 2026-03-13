// ========== ADD CLOSURE DAY ==========
export interface AddClosureDayOutput {
  success: boolean;
  statusCode: number;
  errorCode?: string;
  errorReason?: string;
  body?: {
    id: string;
    date: string;
    reason: string | null;
    message: string;
  };
}

// ========== REMOVE CLOSURE DAY ==========
export interface RemoveClosureDayOutput {
  success: boolean;
  statusCode: number;
  errorCode?: string;
  errorReason?: string;
  body?: {
    message: string;
  };
}

export interface BusinessRules {
  addClosureDay(date: string, reason: string): Promise<AddClosureDayOutput>;

  removeClosureDay(date: string): Promise<RemoveClosureDayOutput>;
}
