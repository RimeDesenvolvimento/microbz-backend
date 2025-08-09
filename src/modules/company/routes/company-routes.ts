import { Router } from 'express';
import { makeCompanyController } from '../../../common/factories/controllers/company-controller-factory';

const companyController = makeCompanyController();

export default (router: Router): void => {
  router.post('/companies', (req, res, next) =>
    companyController.createCompany(req, res, next)
  );
  router.get('/companies', (req, res, next) =>
    companyController.getCompanies(req, res, next)
  );
};
