import prisma from '../../../../prisma/db';
export class CompanyRepository {
  async createCompany(companyData: any): Promise<any> {
    return prisma.company.create({
      data: companyData,
    });
  }

  async getCompanies(): Promise<any[]> {
    return prisma.company.findMany();
  }
}
