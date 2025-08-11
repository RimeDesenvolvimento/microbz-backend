import { NextFunction, Request, Response } from 'express';
import { CompanyBranchService } from '../service/company-branch-service';

export class CompanyBranchController {
  constructor(private readonly companyBranchService: CompanyBranchService) {}

  async getAllByCompanyId(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = Number(req.params.companyId);
      const companyBranches = await this.companyBranchService.getAllByCompanyId(
        companyId
      );

      res.status(200).json(companyBranches);
    } catch (error) {
      console.error('Error fetching company branches:', error);
      next(error);
    }
  }
}
