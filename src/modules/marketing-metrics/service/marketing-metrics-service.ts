import { Goal, MarketingMetrics, MarketingSource } from '@prisma/client';
import {
  BadRequestError,
  NotFoundError,
} from '../../../common/errors/http-errors';
import { MarketingMetricsRepository } from '../repository/marketing-metrics-repository';
import { getWeeksInMonth } from '../../../utils/date';
import { GoalRepository } from '../../goal/repository/goal-repository';
import { SaleRepository } from '../../sale/repository/sale-repository';
import { a } from 'vitest/dist/chunks/suite.d.FvehnV49';

export type CreateMarketingMetricsParams = {
  date: string;
  source: MarketingSource;
  investment: number;
  leadsGenerated: number;
  sales: number;
  cpl: number;
  meetingToSaleRate: number;
  roas: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
}[];

export type UpdateMarketingMetricsParams = {
  date?: string;
  source?: MarketingSource;
  investment?: number;
  leadsGenerated?: number;
  sales?: number;
  cpl?: number;
  meetingToSaleRate?: number;
  roas?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
};

export type GetMarketingMetricsFilters = {
  month?: string;
  year?: string;
  limit?: string;
};

export class MarketingMetricsService {
  constructor(
    private readonly marketingMetricsRepository: MarketingMetricsRepository,
    private readonly goalRepository: GoalRepository,
    private readonly saleRepository: SaleRepository
  ) {}

  async create(
    companyBranchId: number,
    metricsData: CreateMarketingMetricsParams
  ): Promise<MarketingMetrics[]> {
    if (!Array.isArray(metricsData) || metricsData.length === 0) {
      throw new BadRequestError('É necessário fornecer um array de métricas');
    }

    // const existingMetricsPromises = metricsData.map(metric =>
    //   this.marketingMetricsRepository.getByDateAndSource(
    //     companyBranchId,
    //     new Date(metric.date),
    //     metric.source
    //   )
    // );

    // const batchSize = 10;
    // const existingMetrics: (MarketingMetrics | null)[] = [];

    // for (let i = 0; i < existingMetricsPromises.length; i += batchSize) {
    //   const batch = existingMetricsPromises.slice(i, i + batchSize);
    //   const batchResults = await Promise.all(batch);
    //   existingMetrics.push(...batchResults);
    // }

    // for (let i = 0; i < existingMetrics.length; i++) {
    //   if (existingMetrics[i]) {
    //     throw new BadRequestError(
    //       `Já existe uma métrica para a data ${metricsData[i].date} e source ${metricsData[i].source}`
    //     );
    //   }
    // }

    const createdMetrics = await this.marketingMetricsRepository.createMany(
      companyBranchId,
      metricsData
    );

    return createdMetrics;
  }

  async getAll({
    companyBranchId,
    monthAndYear,
    page,
    limit,
    source,
  }: {
    companyBranchId: number;
    monthAndYear: Date;
    page: number;
    limit: number;
    source: MarketingSource;
  }): Promise<{ metrics: MarketingMetrics[]; count: number }> {
    const [metrics, count] = await Promise.all([
      this.marketingMetricsRepository.getAll(
        companyBranchId,
        monthAndYear,
        page,
        limit,
        source
      ),
      this.marketingMetricsRepository.countAll(
        companyBranchId,
        monthAndYear,
        source
      ),
    ]);

    return { metrics, count };
  }

  async getAverageMetrics(
    monthAndYear: Date,
    companyBranchId: number
  ): Promise<{
    totalInvestment: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    totalLeads: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    totalSales: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    averageCpl: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    averageMeetingToSaleRate: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    averageRoas: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
  }> {
    const year = monthAndYear.getFullYear();
    const month = monthAndYear.getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const previousMonth = month === 0 ? 11 : month - 1;
    const previousYear = month === 0 ? year - 1 : year;
    const previousStartDate = new Date(previousYear, previousMonth, 1);
    const previousEndDate = new Date(previousYear, previousMonth + 1, 0);

    const [currentMetrics, previousMetrics, goals] = await Promise.all([
      this.marketingMetricsRepository.getByDateRange(
        startDate,
        endDate,
        companyBranchId
      ),
      this.marketingMetricsRepository.getByDateRange(
        previousStartDate,
        previousEndDate,
        companyBranchId
      ),
      this.goalRepository.getByBranchAndPeriod(
        companyBranchId,
        year,
        month + 1
      ),
    ]);

    const [currentPeriodSales, previousPeriodSales] = await Promise.all([
      this.saleRepository.findByDateRange(startDate, endDate, companyBranchId),
      this.saleRepository.findByDateRange(
        previousStartDate,
        previousEndDate,
        companyBranchId
      ),
    ]);

    const currentSalesTotalRevenue = currentPeriodSales.reduce(
      (sum, sale) => sum + Number(sale.totalValue),
      0
    );

    const previousSalesTotalRevenue = previousPeriodSales.reduce(
      (sum, sale) => sum + Number(sale.totalValue),
      0
    );

    const currentCalculatedMetrics = this.calculateMarketingMetrics(
      currentMetrics.map(item => ({
        ...item,
        totalRevenue: currentSalesTotalRevenue,
      }))
    );
    const previousCalculatedMetrics = this.calculateMarketingMetrics(
      previousMetrics.map(item => ({
        ...item,
        totalRevenue: previousSalesTotalRevenue,
      }))
    );

    const currentWeeklyMetrics = await this.calculateWeeklyMarketingMetrics(
      currentMetrics,
      startDate,
      endDate,
      companyBranchId
    );
    const previousWeeklyMetrics = await this.calculateWeeklyMarketingMetrics(
      previousMetrics,
      previousStartDate,
      previousEndDate,
      companyBranchId
    );

    const weeklyGoals = this.calculateWeeklyMarketingGoals(goals);

    return {
      totalInvestment: {
        selectedPeriod: currentCalculatedMetrics.totalInvestment,
        previousMonth: previousCalculatedMetrics.totalInvestment,
        selectedPeriodGoal: goals ? Number(goals.marketing) : 0,
        weeklyData: {
          current: currentWeeklyMetrics.totalInvestment,
          previous: previousWeeklyMetrics.totalInvestment,
          goal: weeklyGoals.totalInvestment,
        },
      },
      totalLeads: {
        selectedPeriod: currentCalculatedMetrics.totalLeads,
        previousMonth: previousCalculatedMetrics.totalLeads,
        selectedPeriodGoal: goals ? Number(goals.leadsGenerated) : 0,
        weeklyData: {
          current: currentWeeklyMetrics.totalLeads,
          previous: previousWeeklyMetrics.totalLeads,
          goal: weeklyGoals.totalLeads,
        },
      },
      totalSales: {
        selectedPeriod: currentCalculatedMetrics.totalSales,
        previousMonth: previousCalculatedMetrics.totalSales,
        selectedPeriodGoal: goals ? Number(goals.marketingSales) : 0,
        weeklyData: {
          current: currentWeeklyMetrics.totalSales,
          previous: previousWeeklyMetrics.totalSales,
          goal: weeklyGoals.totalSales,
        },
      },
      averageCpl: {
        selectedPeriod: currentCalculatedMetrics.averageCpl,
        previousMonth: previousCalculatedMetrics.averageCpl,
        selectedPeriodGoal: goals ? Number(goals.cpl) : 0,
        weeklyData: {
          current: currentWeeklyMetrics.averageCpl,
          previous: previousWeeklyMetrics.averageCpl,
          goal: weeklyGoals.averageCpl,
        },
      },
      averageMeetingToSaleRate: {
        selectedPeriod: currentCalculatedMetrics.averageMeetingToSaleRate,
        previousMonth: previousCalculatedMetrics.averageMeetingToSaleRate,
        selectedPeriodGoal: goals ? Number(goals.meetingToSaleRate) : 0,
        weeklyData: {
          current: currentWeeklyMetrics.averageMeetingToSaleRate,
          previous: previousWeeklyMetrics.averageMeetingToSaleRate,
          goal: weeklyGoals.averageMeetingToSaleRate,
        },
      },
      averageRoas: {
        selectedPeriod: currentCalculatedMetrics.averageRoas,
        previousMonth: previousCalculatedMetrics.averageRoas,
        selectedPeriodGoal: goals ? Number(goals.roas) : 0,
        weeklyData: {
          current: currentWeeklyMetrics.averageRoas,
          previous: previousWeeklyMetrics.averageRoas,
          goal: weeklyGoals.averageRoas,
        },
      },
    };
  }

  private async calculateWeeklyMarketingMetrics(
    metrics: MarketingMetrics[],
    startDate: Date,
    endDate: Date,
    companyBranchId: number
  ): Promise<{
    totalInvestment: Array<{ week: string; value: number }>;
    totalLeads: Array<{ week: string; value: number }>;
    totalSales: Array<{ week: string; value: number }>;
    averageCpl: Array<{ week: string; value: number }>;
    averageMeetingToSaleRate: Array<{ week: string; value: number }>;
    averageRoas: Array<{ week: string; value: number }>;
  }> {
    const weeks = getWeeksInMonth(startDate, endDate);

    const weeklyMetrics = await Promise.all(
      weeks.map(async (week, index) => {
        const weeklyData = metrics.filter(metric => {
          const metricDate = new Date(metric.date);
          return metricDate >= week.start && metricDate <= week.end;
        });

        const sales = await this.saleRepository.findByDateRange(
          week.start,
          week.end,
          companyBranchId
        );

        const totalRevenue = sales.reduce(
          (sum, sale) => sum + Number(sale.totalValue),
          0
        );

        const weekMetrics = this.calculateMarketingMetrics(
          weeklyData.map(item => ({ ...item, totalRevenue }))
        );

        return {
          week: `Sem ${index + 1}`,
          totalInvestment: weekMetrics.totalInvestment,
          totalLeads: weekMetrics.totalLeads,
          totalSales: weekMetrics.totalSales,
          averageCpl: weekMetrics.averageCpl,
          averageMeetingToSaleRate: weekMetrics.averageMeetingToSaleRate,
          averageRoas: weekMetrics.averageRoas,
        };
      })
    );

    return {
      totalInvestment: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.totalInvestment,
      })),
      totalLeads: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.totalLeads,
      })),
      totalSales: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.totalSales,
      })),
      averageCpl: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.averageCpl,
      })),
      averageMeetingToSaleRate: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.averageMeetingToSaleRate,
      })),
      averageRoas: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.averageRoas,
      })),
    };
  }

  private calculateWeeklyMarketingGoals(goals: any): {
    totalInvestment: Array<{ week: string; value: number }>;
    totalLeads: Array<{ week: string; value: number }>;
    totalSales: Array<{ week: string; value: number }>;
    averageCpl: Array<{ week: string; value: number }>;
    averageMeetingToSaleRate: Array<{ week: string; value: number }>;
    averageRoas: Array<{ week: string; value: number }>;
  } {
    if (!goals) {
      return {
        totalInvestment: [1, 2, 3, 4].map(i => ({
          week: `Sem ${i}`,
          value: 0,
        })),
        totalLeads: [1, 2, 3, 4].map(i => ({ week: `Sem ${i}`, value: 0 })),
        totalSales: [1, 2, 3, 4].map(i => ({ week: `Sem ${i}`, value: 0 })),
        averageCpl: [1, 2, 3, 4].map(i => ({ week: `Sem ${i}`, value: 0 })),
        averageMeetingToSaleRate: [1, 2, 3, 4].map(i => ({
          week: `Sem ${i}`,
          value: 0,
        })),
        averageRoas: [1, 2, 3, 4].map(i => ({ week: `Sem ${i}`, value: 0 })),
      };
    }

    const weeklyInvestmentGoal = Math.round(Number(goals.marketing) / 4);
    const weeklyLeadsGoal = Math.round(Number(goals.leadsGenerated) / 4);
    const weeklySalesGoal = Math.round(Number(goals.marketingSales) / 4);
    const cplGoal = Number(goals.cpl);
    const meetingToSaleRateGoal = Number(goals.meetingToSaleRate);
    const roasGoal = Number(goals.roas);

    return {
      totalInvestment: [
        { week: 'Sem 1', value: weeklyInvestmentGoal },
        { week: 'Sem 2', value: weeklyInvestmentGoal },
        { week: 'Sem 3', value: weeklyInvestmentGoal },
        { week: 'Sem 4', value: weeklyInvestmentGoal },
      ],
      totalLeads: [
        { week: 'Sem 1', value: weeklyLeadsGoal },
        { week: 'Sem 2', value: weeklyLeadsGoal },
        { week: 'Sem 3', value: weeklyLeadsGoal },
        { week: 'Sem 4', value: weeklyLeadsGoal },
      ],
      totalSales: [
        { week: 'Sem 1', value: weeklySalesGoal },
        { week: 'Sem 2', value: weeklySalesGoal },
        { week: 'Sem 3', value: weeklySalesGoal },
        { week: 'Sem 4', value: weeklySalesGoal },
      ],
      averageCpl: [
        { week: 'Sem 1', value: cplGoal },
        { week: 'Sem 2', value: cplGoal },
        { week: 'Sem 3', value: cplGoal },
        { week: 'Sem 4', value: cplGoal },
      ],
      averageMeetingToSaleRate: [
        { week: 'Sem 1', value: meetingToSaleRateGoal },
        { week: 'Sem 2', value: meetingToSaleRateGoal },
        { week: 'Sem 3', value: meetingToSaleRateGoal },
        { week: 'Sem 4', value: meetingToSaleRateGoal },
      ],
      averageRoas: [
        { week: 'Sem 1', value: roasGoal },
        { week: 'Sem 2', value: roasGoal },
        { week: 'Sem 3', value: roasGoal },
        { week: 'Sem 4', value: roasGoal },
      ],
    };
  }

  private calculateMarketingMetrics(
    metrics: (MarketingMetrics & { totalRevenue: number })[]
  ): {
    totalInvestment: number;
    totalLeads: number;
    totalSales: number;
    averageCpl: number;
    averageMeetingToSaleRate: number;
    averageRoas: number;
  } {
    if (metrics.length === 0) {
      return {
        totalInvestment: 0,
        totalLeads: 0,
        totalSales: 0,
        averageCpl: 0,
        averageMeetingToSaleRate: 0,
        averageRoas: 0,
      };
    }

    const totalInvestment = metrics.reduce(
      (sum, m) => sum + Number(m.investment),
      0
    );
    const totalLeads = metrics.reduce(
      (sum, m) => sum + Number(m.leadsGenerated),
      0
    );
    const totalSales = metrics.reduce((sum, m) => sum + Number(m.sales), 0);

    const averageCpl =
      totalLeads > 0 ? Number((totalInvestment / totalLeads).toFixed(2)) : 0;

    const averageMeetingToSaleRate =
      totalLeads > 0 ? Number(((totalSales / totalLeads) * 100).toFixed(2)) : 0;

    const averageRoas =
      totalInvestment > 0
        ? Number((metrics[0].totalRevenue / totalInvestment).toFixed(2))
        : 0;

    return {
      totalInvestment,
      totalLeads,
      totalSales,
      averageCpl,
      averageMeetingToSaleRate,
      averageRoas,
    };
  }
  async getById(
    companyBranchId: number,
    id: number
  ): Promise<MarketingMetrics> {
    const metric = await this.marketingMetricsRepository.getById(
      companyBranchId,
      id
    );

    if (!metric) {
      throw new NotFoundError('Métrica de marketing não encontrada');
    }

    return metric;
  }

  async update(
    companyBranchId: number,
    id: number,
    updateData: UpdateMarketingMetricsParams
  ): Promise<MarketingMetrics> {
    const existingMetric = await this.marketingMetricsRepository.getById(
      companyBranchId,
      id
    );

    if (!existingMetric) {
      throw new NotFoundError('Métrica de marketing não encontrada');
    }

    if (updateData.date || updateData.source) {
      const dateToCheck = updateData.date
        ? new Date(updateData.date)
        : existingMetric.date;
      const sourceToCheck = updateData.source || existingMetric.source;

      const conflictingMetric =
        await this.marketingMetricsRepository.getByDateAndSource(
          companyBranchId,
          dateToCheck,
          sourceToCheck
        );

      if (conflictingMetric && conflictingMetric.id !== id) {
        throw new BadRequestError(
          `Já existe uma métrica para a data ${
            dateToCheck.toISOString().split('T')[0]
          } e source ${sourceToCheck}`
        );
      }
    }

    const updatedMetric = await this.marketingMetricsRepository.update(
      id,
      updateData
    );
    return updatedMetric;
  }

  async delete(companyBranchId: number, id: number): Promise<void> {
    const existingMetric = await this.marketingMetricsRepository.getById(
      companyBranchId,
      id
    );

    if (!existingMetric) {
      throw new NotFoundError('Métrica de marketing não encontrada');
    }

    await this.marketingMetricsRepository.delete(id);
  }

  async deleteMany(companyBranchId: number, ids: number[]): Promise<number> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('É necessário fornecer um array de IDs');
    }

    const deletedCount = await this.marketingMetricsRepository.deleteMany(
      companyBranchId,
      ids
    );

    return deletedCount;
  }
}
