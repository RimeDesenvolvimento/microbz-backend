import { CompanyBranch } from '@prisma/client';
import prisma from '../../../../prisma/db';
export class CompanyBranchRepository {
  async getByName(name: string): Promise<CompanyBranch | null> {
    return prisma.companyBranch.findFirst({
      where: { name },
    });
  }

  async getAllByCompanyId(companyId: number): Promise<CompanyBranch[]> {
    return prisma.companyBranch.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async getByNameAndCompanyId(
    name: string,
    companyId: number
  ): Promise<CompanyBranch | null> {
    return prisma.companyBranch.findFirst({
      where: { name, companyId },
    });
  }

  async create(data: {
    name: string;
    code: string;
    companyId: number;
  }): Promise<CompanyBranch> {
    return prisma.companyBranch.create({
      data,
    });
  }
}
