import { NextFunction, Request, Response } from 'express';
import { MarketingMetricsService } from '../service/marketing-metrics-service';

export class MarketingMetricsController {
  constructor(
    private readonly marketingMetricsService: MarketingMetricsService
  ) {
    this.marketingMetricsService = marketingMetricsService;
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyBranchId } = req.params;
      const metricsData = req.body;

      const createdMetrics = await this.marketingMetricsService.create(
        Number(companyBranchId),
        metricsData
      );

      res.status(201).json({
        message: `${createdMetrics.length} métricas de marketing criadas com sucesso!`,
        data: createdMetrics,
      });
    } catch (error) {
      console.log('Erro ao criar métricas de marketing: ', error);
      next(error);
    }
  }

  async getAverageMarketingMetrics(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { companyBranchId } = req.params;
      const dateString = req.query.monthAndYear as string;

      if (!companyBranchId || !dateString) {
        res.status(400).json({ message: 'Parâmetros inválidos' });
        return;
      }

      const [year, month] = dateString.split('-').map(Number);
      const monthAndYear = new Date(year, month - 1, 1);

      const metrics = await this.marketingMetricsService.getAverageMetrics(
        monthAndYear,
        Number(companyBranchId)
      );

      res.status(200).json(metrics);
    } catch (error) {
      console.log('Erro ao buscar métricas de marketing: ', error);
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyBranchId, id } = req.params;

      const metric = await this.marketingMetricsService.getById(
        Number(companyBranchId),
        Number(id)
      );

      res.status(200).json({ data: metric });
    } catch (error) {
      console.log('Erro ao buscar métrica de marketing: ', error);
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyBranchId, id } = req.params;
      const updateData = req.body;

      const updatedMetric = await this.marketingMetricsService.update(
        Number(companyBranchId),
        Number(id),
        updateData
      );

      res.status(200).json({
        message: 'Métrica de marketing atualizada com sucesso!',
        data: updatedMetric,
      });
    } catch (error) {
      console.log('Erro ao atualizar métrica de marketing: ', error);
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyBranchId, id } = req.params;

      await this.marketingMetricsService.delete(
        Number(companyBranchId),
        Number(id)
      );

      res.status(200).json({
        message: 'Métrica de marketing deletada com sucesso!',
      });
    } catch (error) {
      console.log('Erro ao deletar métrica de marketing: ', error);
      next(error);
    }
  }

  async deleteMany(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyBranchId } = req.params;
      const { ids } = req.body;

      const deletedCount = await this.marketingMetricsService.deleteMany(
        Number(companyBranchId),
        ids
      );

      res.status(200).json({
        message: `${deletedCount} métricas de marketing deletadas com sucesso!`,
      });
    } catch (error) {
      console.log('Erro ao deletar métricas de marketing: ', error);
      next(error);
    }
  }
}
