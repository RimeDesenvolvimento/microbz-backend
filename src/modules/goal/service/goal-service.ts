import { Goal } from '@prisma/client';
import { GoalRepository } from '../repository/goal-repository';
import { CompanyBranchRepository } from '../../company-branch/repository/company-branch-repository';

export class GoalService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly companyBranchRepository: CompanyBranchRepository
  ) {}

  async createGoal(data: Goal): Promise<void> {
    const companyBranch = await this.companyBranchRepository.getById(
      data.companyBranchId
    );

    if (!companyBranch) {
      throw new Error('Company branch not found');
    }

    await this.goalRepository.create(data);
  }

  async getGoals(
    selectedBranchId: number,
    selectedYear: number,
    selectedMonth: number
  ): Promise<Goal | null> {
    return this.goalRepository.getByBranchAndPeriod(
      selectedBranchId,
      selectedYear,
      selectedMonth
    );
  }
}
