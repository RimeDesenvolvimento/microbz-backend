import { MarketingMetrics, MarketingSource } from '@prisma/client';
import prisma from '../../../../prisma/db';
import {
  CreateMarketingMetricsParams,
  UpdateMarketingMetricsParams,
  GetMarketingMetricsFilters,
} from '../service/marketing-metrics-service';

export class MarketingMetricsRepository {
  async createMany(
    companyBranchId: number,
    metricsData: CreateMarketingMetricsParams
  ): Promise<MarketingMetrics[]> {
    const dataToCreate = metricsData.map(metric => ({
      ...metric,
      date: new Date(metric.date),
      companyBranchId,
    }));

    // Usar createManyAndReturn para retornar os dados criados
    const createdMetrics = await prisma.marketingMetrics.createManyAndReturn({
      data: dataToCreate,
    });

    return createdMetrics;
  }

  async getByDateRange(
    startDate: Date,
    endDate: Date,
    companyBranchId: number
  ): Promise<MarketingMetrics[]> {
    const metrics = await prisma.marketingMetrics.findMany({
      where: {
        companyBranchId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return metrics;
  }

  async getAll(
    companyBranchId: number,
    monthAndYear?: Date,
    page?: number,
    limit?: number,
    source?: MarketingSource
  ): Promise<MarketingMetrics[]> {
    const where: any = { companyBranchId };

    if (source) {
      where.source = source;
    }

    if (monthAndYear) {
      where.date = {
        gte: new Date(monthAndYear.getFullYear(), monthAndYear.getMonth(), 1),
        lte: new Date(
          monthAndYear.getFullYear(),
          monthAndYear.getMonth() + 1,
          1
        ),
      };
    }

    const metrics = await prisma.marketingMetrics.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      skip: page && limit ? (page - 1) * limit : undefined,
      take: limit,
    });

    return metrics;
  }

  async countAll(
    companyBranchId: number,
    monthAndYear?: Date,
    source?: MarketingSource
  ): Promise<number> {
    const where: any = { companyBranchId };

    if (source) {
      where.source = source;
    }

    if (monthAndYear) {
      where.date = {
        gte: new Date(monthAndYear.getFullYear(), monthAndYear.getMonth(), 1),
        lte: new Date(
          monthAndYear.getFullYear(),
          monthAndYear.getMonth() + 1,
          1
        ),
      };
    }

    const count = await prisma.marketingMetrics.count({
      where,
    });

    return count;
  }

  async getById(
    companyBranchId: number,
    id: number
  ): Promise<MarketingMetrics | null> {
    const metric = await prisma.marketingMetrics.findFirst({
      where: {
        id,
        companyBranchId,
      },
    });

    return metric;
  }

  async getByDateAndSource(
    companyBranchId: number,
    date: Date,
    source: MarketingSource
  ): Promise<MarketingMetrics | null> {
    const metric = await prisma.marketingMetrics.findFirst({
      where: {
        companyBranchId,
        date,
        source,
      },
    });

    return metric;
  }

  async update(
    id: number,
    updateData: UpdateMarketingMetricsParams
  ): Promise<MarketingMetrics> {
    const dataToUpdate = { ...updateData };

    if (updateData.date) {
      dataToUpdate.date = new Date(updateData.date) as any;
    }

    const updatedMetric = await prisma.marketingMetrics.update({
      where: { id },
      data: dataToUpdate,
    });

    return updatedMetric;
  }

  async delete(id: number): Promise<void> {
    await prisma.marketingMetrics.delete({
      where: { id },
    });
  }

  async deleteMany(companyBranchId: number, ids: number[]): Promise<number> {
    const result = await prisma.marketingMetrics.deleteMany({
      where: {
        id: { in: ids },
        companyBranchId,
      },
    });

    return result.count;
  }
}
