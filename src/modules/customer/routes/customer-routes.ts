import { Router } from 'express';
import { makeCustomerController } from '../../../common/factories/controllers/customer-controller-factory';

const customerController = makeCustomerController();

export default (router: Router): void => {
  router.get('/customers', (req, res, next) =>
    customerController.getCustomers(req, res, next)
  );
};
