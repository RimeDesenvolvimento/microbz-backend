import { CustomerController } from '../../../modules/customer/controller/customer-controller';
import { CustomerRepository } from '../../../modules/customer/repository/customer-repository';
import { CustomerService } from '../../../modules/customer/service/customer-service';
import { GoalRepository } from '../../../modules/goal/repository/goal-repository';

export const makeCustomerController = () => {
  const customerService = new CustomerService(
    new CustomerRepository(),
    new GoalRepository()
  );
  return new CustomerController(customerService);
};
