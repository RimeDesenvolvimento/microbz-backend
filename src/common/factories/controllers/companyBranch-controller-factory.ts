import { CompanyBranchController } from '../../../modules/company-branch/controller/company-branch-controller';
import { CompanyBranchRepository } from '../../../modules/company-branch/repository/company-branch-repository';
import { CompanyBranchService } from '../../../modules/company-branch/service/company-branch-service';

export const makeCompanyBranchController = () => {
  const companyBranchService = new CompanyBranchService(
    new CompanyBranchRepository()
  );
  return new CompanyBranchController(companyBranchService);
};
