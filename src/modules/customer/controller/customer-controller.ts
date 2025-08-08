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
}
