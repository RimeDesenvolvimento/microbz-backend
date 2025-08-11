import { CompanyBranchRepository } from '../../../modules/company-branch/repository/company-branch-repository';
import { GoalController } from '../../../modules/goal/controller/goal-controller';
import { GoalRepository } from '../../../modules/goal/repository/goal-repository';
import { GoalService } from '../../../modules/goal/service/goal-service';

export const makeGoalsController = () => {
  const goalService = new GoalService(
    new GoalRepository(),
    new CompanyBranchRepository()
  );
  return new GoalController(goalService);
};
