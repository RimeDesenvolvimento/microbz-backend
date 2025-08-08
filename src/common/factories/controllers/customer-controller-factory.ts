import { CustomerController } from '../../../modules/customer/controller/customer-controller';
import { CustomerRepository } from '../../../modules/customer/repository/customer-repository';
import { CustomerService } from '../../../modules/customer/service/customer-service';

export const makeCustomerController = () => {
  const customerService = new CustomerService(new CustomerRepository());
  return new CustomerController(customerService);
};
