import { CompanyRepository } from '../repository/company-repository';

export class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async createCompany(companyData: any): Promise<any> {
    return this.companyRepository.createCompany(companyData);
  }

  async getCompanies(): Promise<any[]> {
    return this.companyRepository.getCompanies();
  }
}
