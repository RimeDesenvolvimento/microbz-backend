import { Router } from 'express';
import { makeSaleController } from '../../../common/factories/controllers/sale-controller-factory';

const saleController = makeSaleController();

export default (router: Router): void => {
  router.post('/sales', (req, res, next) =>
    saleController.createSales(req, res, next)
  );
  router.get('/sales/metrics', (req, res, next) =>
    saleController.getSalesMetrics(req, res, next)
  );
  router.get('/sales', (req, res, next) =>
    saleController.getSales(req, res, next)
  );
};

// {
//     "totalRevenue": 5620,
//     "productRevenue": 4550,
//     "serviceRevenue": 1070,
//     "averageTicket": 562
// }
