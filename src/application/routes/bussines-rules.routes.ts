import { Router } from 'express';

import { BusinessRulesController } from '@application/controllers/business-rules.controller';

const router = Router();
const businessRulesController = new BusinessRulesController();

router.post(
  '/closure-day',
  businessRulesController.addClosureDay.bind(businessRulesController)
);
router.delete(
  '/closure-day',
  businessRulesController.removeClosureDay.bind(businessRulesController)
);

export default router;
