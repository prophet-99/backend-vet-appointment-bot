import { BusinessRulesService } from '@domain/services/business-rules.service';
import { BusinessRulesRepository } from '@infraestructure/db/repositories/business-rules.repository';

export class BusinessRulesOrchestrator {
  private businessRulesService: BusinessRulesService;

  constructor() {
    this.businessRulesService = new BusinessRulesService(
      new BusinessRulesRepository()
    );
  }

  newClosureDay(date: string, reason: string) {
    return this.businessRulesService.addClosureDay(date, reason);
  }

  deleteClosureDay(date: string) {
    return this.businessRulesService.removeClosureDay(date);
  }
}
