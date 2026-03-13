import type { Request, Response } from 'express';

import { BusinessRulesOrchestrator } from '@infraestructure/orchestators/business-rules.orchestrator';
import {
  adaptWebClientToAddClosureDayInput,
  adaptWebClientToRemoveClosureDayInput,
} from '@infraestructure/adapters/web-client.adapter';

export class BusinessRulesController {
  private businessRulesOrch: BusinessRulesOrchestrator;

  constructor() {
    this.businessRulesOrch = new BusinessRulesOrchestrator();
  }

  async addClosureDay(req: Request, res: Response) {
    try {
      const { date, reason } = adaptWebClientToAddClosureDayInput(req.body);

      const closureResponse = await this.businessRulesOrch.newClosureDay(
        date,
        reason
      );

      return res.json(closureResponse);
    } catch (err) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        errorCode: 'INTERNAL_SERVER_ERROR',
        reason: (err as Error).message || 'Error del servidor',
      });
    }
  }

  async removeClosureDay(req: Request, res: Response) {
    try {
      const { date } = adaptWebClientToRemoveClosureDayInput(req.body);

      const closureResponse =
        await this.businessRulesOrch.deleteClosureDay(date);

      return res.json(closureResponse);
    } catch (err) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        errorCode: 'INTERNAL_SERVER_ERROR',
        reason: (err as Error).message || 'Error del servidor',
      });
    }
  }
}
