import { Router } from 'express';
import { validate } from '../../../common/middlewares/validation-middleware';
import { makeMarketingMetricsController } from '../../../common/factories/controllers/make-marketing-metrics-controller';
import {
  CreateMarketingMetricsSchema,
  UpdateMarketingMetricsSchema,
} from '../validations/schemas';

const marketingMetricsController = makeMarketingMetricsController();

export default (router: Router): void => {
  router.post(
    '/companies/:companyBranchId/marketing-metrics',
    validate(CreateMarketingMetricsSchema),
    (req, res, next) => marketingMetricsController.create(req, res, next)
  );

  router.get(
    '/companies/:companyBranchId/marketing-metrics',
    (req, res, next) =>
      marketingMetricsController.getAverageMarketingMetrics(req, res, next)
  );

  router.get(
    '/companies/:companyBranchId/marketing-metrics/:id',
    (req, res, next) => marketingMetricsController.getById(req, res, next)
  );

  router.put(
    '/companies/:companyBranchId/marketing-metrics/:id',
    validate(UpdateMarketingMetricsSchema),
    (req, res, next) => marketingMetricsController.update(req, res, next)
  );

  router.delete(
    '/companies/:companyBranchId/marketing-metrics/:id',
    (req, res, next) => marketingMetricsController.delete(req, res, next)
  );

  router.delete(
    '/companies/:companyBranchId/marketing-metrics',
    (req, res, next) => marketingMetricsController.deleteMany(req, res, next)
  );
};
