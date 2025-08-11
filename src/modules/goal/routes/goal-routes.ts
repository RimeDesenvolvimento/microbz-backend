import { Router } from 'express';
import { validate } from '../../../common/middlewares/validation-middleware';
import { createGoalSchema } from '../validations/schemas';
import { makeGoalsController } from '../../../common/factories/controllers/goal-controller-factory';

const goalsController = makeGoalsController();

export default (router: Router): void => {
  router.post('/goals', validate(createGoalSchema), (req, res, next) =>
    goalsController.createGoal(req, res, next)
  );
  router.get(
    '/goals/:selectedBranchId/:selectedYear/:selectedMonth',
    (req, res, next) => goalsController.getGoals(req, res, next)
  );
};
