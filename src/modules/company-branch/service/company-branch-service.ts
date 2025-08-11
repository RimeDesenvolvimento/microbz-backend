import { CompanyBranchRepository } from '../repository/company-branch-repository';

export class CompanyBranchService {
  constructor(
    private readonly companyBranchRepository: CompanyBranchRepository
  ) {}

  async getAllByCompanyId(companyId: number) {
    return this.companyBranchRepository.getAllByCompanyId(companyId);
  }
}
