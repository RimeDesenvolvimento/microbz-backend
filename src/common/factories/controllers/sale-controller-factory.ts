import { CompanyBranchRepository } from '../../../modules/company-branch/repository/company-branch-repository';
import { CustomerRepository } from '../../../modules/customer/repository/customer-repository';
import { GoalRepository } from '../../../modules/goal/repository/goal-repository';
import { SaleController } from '../../../modules/sale/controller/sale-controller';
import { SaleRepository } from '../../../modules/sale/repository/sale-repository';
import { SaleService } from '../../../modules/sale/service/sale-service';

export const makeSaleController = () => {
  const saleService = new SaleService(
    new SaleRepository(),
    new CustomerRepository(),
    new CompanyBranchRepository(),
    new GoalRepository()
  );
  return new SaleController(saleService);
};
