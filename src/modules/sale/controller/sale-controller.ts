import { NextFunction, Request, Response } from 'express';
import { Sale } from '@prisma/client';
import { SaleService } from '../service/sale-service';

export class SaleController {
  constructor(private readonly saleService: SaleService) {
    this.saleService = saleService;
  }

  async createSales(req: Request, res: Response, next: NextFunction) {
    try {
      const salesData = req.body;

      const createdSales = await this.saleService.createSales(salesData);

      res.status(201).json({
        message: 'Vendas criadas com sucesso!',
        sales: createdSales,
        count: createdSales.length,
      });
    } catch (error) {
      console.log('Erro ao criar vendas: ', error);
      next(error);
    }
  }

  async getSales(
    req: Request,
    res: Response<{ sales: Sale[]; total: number }>,
    next: NextFunction
  ) {
    try {
      const {
        page,
        limit,
        customerId,
        status,
        type,
        startDate,
        endDate,
        description,
        customer,
      } = req.query;

      console.log({
        page,
        limit,
        customerId,
        status,
        type,
        startDate,
        endDate,
        description,
        customer,
      });

      const result = await this.saleService.getSales({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        customerId: customerId ? parseInt(customerId as string) : undefined,
        status: status as any,
        type: type as any,
      });

      res.status(200).json(result);
    } catch (error) {
      console.log('Erro ao buscar vendas: ', error);
      next(error);
    }
  }

  async getSalesMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const monthAndYear = new Date(req.query.monthAndYear as string);

      const metrics = await this.saleService.getSalesMetrics(monthAndYear);
      res.status(200).json(metrics);
    } catch (error) {
      console.log('Erro ao buscar métricas de vendas: ', error);
      next(error);
    }
  }
}
