import { Router } from 'express';
import { makeCustomerController } from '../../../common/factories/controllers/customer-controller-factory';

const customerController = makeCustomerController();

export default (router: Router): void => {
  router.get('/customers/metrics', (req, res, next) =>
    customerController.getCustomersMetrics(req, res, next)
  );

  router.get('/customers/:companyId', (req, res, next) =>
    customerController.getCustomers(req, res, next)
  );
};
