import { CompanyController } from '../../../modules/company/controller/company-controller';
import { CompanyRepository } from '../../../modules/company/repository/company-repository';
import { CompanyService } from '../../../modules/company/service/company-service';

export const makeCompanyController = () => {
  const companyRepository = new CompanyRepository();
  const companyService = new CompanyService(companyRepository);
  return new CompanyController(companyService);
};
