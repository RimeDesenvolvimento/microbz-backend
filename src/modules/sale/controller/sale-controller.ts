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
        export: exportAll,
      } = req.query;

      const companyId = Number(req.params.companyId);

      const result = await this.saleService.getSales({
        page: exportAll
          ? undefined
          : page
          ? parseInt(page as string)
          : undefined,
        limit: exportAll
          ? undefined
          : limit
          ? parseInt(limit as string)
          : undefined,
        customerId: customerId ? parseInt(customerId as string) : undefined,
        status: status as any,
        type: type as any,
        startDate: startDate as string,
        endDate: endDate as string,
        description: description as string,
        customer: customer as string,
        exportAll: exportAll === 'true',
        companyId,
      });

      res.status(200).json(result);
    } catch (error) {
      console.log('Erro ao buscar vendas: ', error);
      next(error);
    }
  }

  async getSalesMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const dateString = req.query.monthAndYear as string;
      const [year, month] = dateString.split('-').map(Number);
      const monthAndYear = new Date(year, month - 1, 1);
      const companyBranchId = parseInt(req.query.companyBranchId as string);

      const metrics = await this.saleService.getSalesMetrics(
        monthAndYear,
        companyBranchId
      );
      res.status(200).json(metrics);
    } catch (error) {
      console.log('Erro ao buscar métricas de vendas: ', error);
      next(error);
    }
  }

  async deleteImportedSpreadsheet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number(req.params.id);

      await this.saleService.deleteImportedSpreadsheet(id);

      res.status(204).send();
    } catch (error) {
      console.log('Erro ao deletar planilha importada: ', error);
      next(error);
    }
  }

  async getImportedSpreadsheetsByCompanyId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = Number(req.params.companyId);

      const spreadsheets =
        await this.saleService.getImportedSpreadsheetsByCompanyId(companyId);

      res.status(200).json(spreadsheets);
    } catch (error) {
      console.log('Erro ao buscar planilhas importadas: ', error);
      next(error);
    }
  }
}
