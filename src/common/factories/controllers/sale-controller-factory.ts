import { CustomerRepository } from '../../../modules/customer/repository/customer-repository';
import { SaleController } from '../../../modules/sale/controller/sale-controller';
import { SaleRepository } from '../../../modules/sale/repository/sale-repository';
import { SaleService } from '../../../modules/sale/service/sale-service';

export const makeSaleController = () => {
  const saleService = new SaleService(
    new SaleRepository(),
    new CustomerRepository()
  );
  return new SaleController(saleService);
};
