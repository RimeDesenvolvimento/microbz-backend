import { Goal } from '@prisma/client';
import prisma from '../../../../prisma/db';
export class GoalRepository {
  async create(data: Goal) {
    await prisma.goal.create({
      data,
    });
  }

  async update(id: number, data: Partial<Goal>) {
    await prisma.goal.update({
      where: { id },
      data,
    });
  }

  async getById(id: number): Promise<Goal | null> {
    return prisma.goal.findUnique({
      where: { id },
    });
  }

  async getByBranchAndPeriod(
    companyBranchId: number,
    year: number,
    month: number
  ): Promise<Goal | null> {
    return prisma.goal.findUnique({
      where: {
        companyBranchId_month_year: {
          companyBranchId,
          month,
          year,
        },
      },
    });
  }
}
