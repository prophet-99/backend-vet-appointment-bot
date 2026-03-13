import type {
  AddClosureDayOutput,
  BusinessRules,
  RemoveClosureDayOutput,
} from '@domain/models/business-rules.model';
import { BusinessRulesRepository } from '@infraestructure/db/repositories/business-rules.repository';
import { ErrorCodes } from '@shared/symbols/error-codes.constants';
import { SuccessMessages } from '@shared/symbols/success.constants';
import {
  getUtcDayRange,
  normalizeDateInLimaISO,
  normalizeDayInLima,
} from '@shared/utils/date.util';

export class BusinessRulesService implements BusinessRules {
  constructor(private businessRulesRepository: BusinessRulesRepository) {}

  async addClosureDay(
    date: string,
    reason: string
  ): Promise<AddClosureDayOutput> {
    const closureDay = normalizeDayInLima(date);

    if (Number.isNaN(closureDay.getTime())) {
      return {
        success: false,
        statusCode: ErrorCodes.CLOSURE_DAY_DATE_INVALID.statusCode,
        errorCode: ErrorCodes.CLOSURE_DAY_DATE_INVALID.code,
        errorReason: ErrorCodes.CLOSURE_DAY_DATE_INVALID.message,
      };
    }

    try {
      const closureAdded = await this.businessRulesRepository.addClosureDay(
        closureDay,
        reason
      );

      return {
        success: true,
        statusCode: 200,
        body: {
          id: closureAdded.id,
          date: normalizeDateInLimaISO(closureAdded.date),
          reason: closureAdded.reason,
          message: SuccessMessages.ADD_CLOSURE_DAY,
        },
      };
    } catch {
      return {
        success: false,
        statusCode: ErrorCodes.ADD_CLOSURE_DAY_FAILED.statusCode,
        errorCode: ErrorCodes.ADD_CLOSURE_DAY_FAILED.code,
        errorReason: ErrorCodes.ADD_CLOSURE_DAY_FAILED.message,
      };
    }
  }

  async removeClosureDay(date: string): Promise<RemoveClosureDayOutput> {
    const closureDay = normalizeDayInLima(date);

    if (Number.isNaN(closureDay.getTime())) {
      return {
        success: false,
        statusCode: ErrorCodes.CLOSURE_DAY_DATE_INVALID.statusCode,
        errorCode: ErrorCodes.CLOSURE_DAY_DATE_INVALID.code,
        errorReason: ErrorCodes.CLOSURE_DAY_DATE_INVALID.message,
      };
    }

    try {
      const { dayStartUtc, nextDayStartUtc } = getUtcDayRange(closureDay);
      const { deleted } = await this.businessRulesRepository.removeClosureDay(
        dayStartUtc,
        nextDayStartUtc
      );

      if (!deleted) {
        return {
          success: false,
          statusCode: ErrorCodes.CLOSURE_DAY_NOT_FOUND.statusCode,
          errorCode: ErrorCodes.CLOSURE_DAY_NOT_FOUND.code,
          errorReason: ErrorCodes.CLOSURE_DAY_NOT_FOUND.message,
        };
      }

      return {
        success: true,
        statusCode: 200,
        body: {
          message: SuccessMessages.REMOVE_CLOSURE_DAY,
        },
      };
    } catch {
      return {
        success: false,
        statusCode: ErrorCodes.REMOVE_CLOSURE_DAY_FAILED.statusCode,
        errorCode: ErrorCodes.REMOVE_CLOSURE_DAY_FAILED.code,
        errorReason: ErrorCodes.REMOVE_CLOSURE_DAY_FAILED.message,
      };
    }
  }
}
