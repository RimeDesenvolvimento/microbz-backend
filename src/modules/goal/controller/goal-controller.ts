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

      res.status(201).json({ message: 'Goal created successfully' });
    } catch (error) {
      console.error('Error creating goal:', error);
      next(error);
    }
  }

  async updateGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      await this.goalService.updateGoal(Number(id), data);

      res.status(200).json({ message: 'Goal updated successfully' });
    } catch (error) {
      console.error('Error updating goal:', error);
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
