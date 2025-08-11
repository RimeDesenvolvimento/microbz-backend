import { NextFunction, Request, Response } from 'express';
import { GoalService } from '../service/goal-service';

export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  async createGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = req.body;

      await this.goalService.createGoal(data);
    } catch (error) {
      console.error('Error creating goal:', error);
      next(error);
    }
  }

  async getGoals(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { selectedBranchId, selectedYear, selectedMonth } = req.params;

      if (!selectedBranchId || !selectedYear || !selectedMonth) {
        res.status(400).json({ error: 'Missing parameters' });
        return;
      }

      const goals = await this.goalService.getGoals(
        Number(selectedBranchId),
        Number(selectedYear),
        Number(selectedMonth)
      );
      res.status(200).json(goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      next(error);
    }
  }
}
