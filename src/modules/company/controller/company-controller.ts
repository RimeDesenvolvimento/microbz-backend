import { CompanyService } from '../service/company-service';

export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  async createCompany(req: any, res: any, next: any): Promise<void> {
    try {
      const companyData = req.body;
      const company = await this.companyService.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      next(error);
    }
  }

  async getCompanies(req: any, res: any, next: any): Promise<void> {
    try {
      const companies = await this.companyService.getCompanies();
      res.status(200).json(companies);
    } catch (error) {
      next(error);
    }
  }
}
