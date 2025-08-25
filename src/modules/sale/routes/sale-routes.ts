import { Router } from 'express';
import { makeSaleController } from '../../../common/factories/controllers/sale-controller-factory';
import { validate } from '../../../common/middlewares/validation-middleware';
import { createSaleSchema, updateSaleSchema } from '../validations/schemas';

const saleController = makeSaleController();

export default (router: Router): void => {
  router.post('/sales', validate(createSaleSchema), (req, res, next) =>
    saleController.createSales(req, res, next)
  );
  router.get('/sales/metrics', (req, res, next) =>
    saleController.getSalesMetrics(req, res, next)
  );
  router.get('/sales/:companyId', (req, res, next) =>
    saleController.getSales(req, res, next)
  );

  router.delete('/sales/:id', (req, res, next) =>
    saleController.deleteSales(req, res, next)
  );

  router.put('/sales/:id', validate(updateSaleSchema), (req, res, next) =>
    saleController.updateSales(req, res, next)
  );

  router.delete('/imported-spreadsheets/:id', (req, res, next) =>
    saleController.deleteImportedSpreadsheet(req, res, next)
  );

  router.get('/imported-spreadsheets/:companyId', (req, res, next) =>
    saleController.getImportedSpreadsheetsByCompanyId(req, res, next)
  );
};

// {
//     "totalRevenue": 5620,
//     "productRevenue": 4550,
//     "serviceRevenue": 1070,
//     "averageTicket": 562
// }
