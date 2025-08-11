import { NextFunction, Request, Response } from 'express';
import { CustomerService } from '../service/customer-service';

export class CustomerController {
  constructor(private readonly customerService: CustomerService) {
    this.customerService = customerService;
  }

  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await this.customerService.getAll();

      res.status(200).json(customers);
    } catch (error) {
      console.log('Erro ao buscar clientes: ', error);
      next(error);
    }
  }

  async getCustomersMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const dateString = req.query.monthAndYear as string;
      const [year, month] = dateString.split('-').map(Number);
      const monthAndYear = new Date(year, month - 1, 1);
      const companyBranchId = parseInt(req.query.companyBranchId as string);

      const metrics = await this.customerService.getCustomerMetrics(
        monthAndYear,
        companyBranchId
      );
      res.status(200).json(metrics);
    } catch (error) {
      console.log('Erro ao buscar métricas de clientes: ', error);
      next(error);
    }
  }
}
