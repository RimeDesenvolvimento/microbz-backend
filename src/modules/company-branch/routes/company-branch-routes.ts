import { Router } from 'express';
import { makeCompanyBranchController } from '../../../common/factories/controllers/companyBranch-controller-factory';

const companyBranchController = makeCompanyBranchController();

export default (router: Router): void => {
  router.get('/company-branches/:companyId', (req, res, next) =>
    companyBranchController.getAllByCompanyId(req, res, next)
  );
};
