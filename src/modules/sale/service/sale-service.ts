import {
  Sale,
  Customer,
  SaleType,
  SaleStatus,
  CustomerStatus,
  CompanyBranch,
  Goal,
} from '@prisma/client';
import { BadRequestError } from '../../../common/errors/http-errors';
import { SaleRepository } from '../repository/sale-repository';
import { CustomerRepository } from '../../customer/repository/customer-repository';
import { CompanyBranchRepository } from '../../company-branch/repository/company-branch-repository';
import { GoalRepository } from '../../goal/repository/goal-repository';
import { getWeeksInMonth } from '../../../utils/date';

export type CreateSaleParams = {
  saleDate: Date;
  code: string;
  branch: string;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  type: SaleType;
  status: SaleStatus;
  customer: string;
  taxId?: string;
  companyId: number;
};

export type GetSalesParams = {
  page?: number;
  limit?: number;
  customerId?: number;
  status?: SaleStatus;
  type?: SaleType;
};

export class SaleService {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly companyBranchRepository: CompanyBranchRepository,
    private readonly goalRepository: GoalRepository
  ) {}

  async createSales(salesData: CreateSaleParams[]): Promise<Sale[]> {
    if (!Array.isArray(salesData) || salesData.length === 0) {
      throw new BadRequestError('É necessário informar pelo menos uma venda');
    }

    const uniqueBranches = new Map<
      string,
      { name: string; companyId: number }
    >();
    const uniqueCustomersByTaxId = new Map<
      string,
      { name: string; taxId: string }
    >();
    const uniqueCustomersByName = new Map<
      string,
      { name: string; companyId: number }
    >();

    salesData.forEach(sale => {
      const branchKey = `${sale.branch}|${sale.companyId}`;
      if (!uniqueBranches.has(branchKey)) {
        uniqueBranches.set(branchKey, {
          name: sale.branch,
          companyId: sale.companyId,
        });
      }

      if (sale.taxId) {
        if (!uniqueCustomersByTaxId.has(sale.taxId)) {
          uniqueCustomersByTaxId.set(sale.taxId, {
            name: sale.customer,
            taxId: sale.taxId,
          });
        }
      } else {
        const customerKey = `${sale.customer}|${sale.companyId}`;
        if (!uniqueCustomersByName.has(customerKey)) {
          uniqueCustomersByName.set(customerKey, {
            name: sale.customer,
            companyId: sale.companyId,
          });
        }
      }
    });

    const branchSearchPromises = Array.from(uniqueBranches.entries()).map(
      async ([key, branchData]) => {
        const existing =
          await this.companyBranchRepository.getByNameAndCompanyId(
            branchData.name,
            branchData.companyId
          );
        return { key, branchData, existing };
      }
    );

    const branchSearchResults = await Promise.all(branchSearchPromises);

    const branchCache = new Map<string, CompanyBranch>();

    for (const { key, branchData, existing } of branchSearchResults) {
      if (existing) {
        branchCache.set(key, existing);
      } else {
        const newBranch = await this.companyBranchRepository.create({
          name: branchData.name,
          code: branchData.name, // TODO: ver sobre código depois
          companyId: branchData.companyId,
        });
        branchCache.set(key, newBranch);
      }
    }

    const customerSearchPromises = [
      ...Array.from(uniqueCustomersByTaxId.keys()).map(async taxId => {
        const customer = await this.customerRepository.getByTaxId(taxId);
        return { type: 'taxId', key: taxId, customer };
      }),

      ...Array.from(uniqueCustomersByName.entries()).map(
        async ([key, customerData]) => {
          const customer = await this.customerRepository.getByName(
            customerData.name
          );
          return { type: 'name', key, customer };
        }
      ),
    ];

    const customerSearchResults = await Promise.all(customerSearchPromises);

    const customerCacheByTaxId = new Map<string, Customer>();
    const customerCacheByName = new Map<string, Customer>();

    customerSearchResults.forEach(result => {
      if (result.customer) {
        if (result.type === 'taxId') {
          customerCacheByTaxId.set(result.key, result.customer);
        } else {
          customerCacheByName.set(result.key, result.customer);
        }
      }
    });

    const salesWithCustomers = [];

    for (const saleData of salesData) {
      const { customer, taxId, branch, companyId } = saleData;

      const branchKey = `${branch}|${companyId}`;
      const companyBranch = branchCache.get(branchKey);

      if (!companyBranch) {
        throw new Error(
          `Filial não encontrada: ${branch} para empresa ${companyId}`
        );
      }

      let existingCustomer: Customer | null = null;

      if (taxId && customerCacheByTaxId.has(taxId)) {
        existingCustomer = customerCacheByTaxId.get(taxId)!;
      } else if (!taxId) {
        const customerKey = `${customer}|${companyId}`;
        if (customerCacheByName.has(customerKey)) {
          existingCustomer = customerCacheByName.get(customerKey)!;
        }
      }

      if (!existingCustomer) {
        existingCustomer = await this.customerRepository.create({
          name: customer,
          taxId: taxId || null,
          status: CustomerStatus.ACTIVE,
          companyBranchId: companyBranch.id,
        });

        if (taxId) {
          customerCacheByTaxId.set(taxId, existingCustomer);
        } else {
          const customerKey = `${customer}|${companyId}`;
          customerCacheByName.set(customerKey, existingCustomer);
        }
      }

      salesWithCustomers.push({
        saleData,
        customerId: existingCustomer.id,
        companyBranchId: companyBranch.id,
      });
    }

    const salesToCreate = salesWithCustomers.map(
      ({ saleData, customerId, companyBranchId }) => {
        const {
          customer,
          companyId,
          taxId,
          branch,
          ...saleDataWithoutCustomer
        } = saleData;
        return {
          ...saleDataWithoutCustomer,
          customerId,
          companyBranchId,
          unitValue: Number(saleDataWithoutCustomer.unitValue),
          totalValue: Number(saleDataWithoutCustomer.totalValue),
        };
      }
    );

    const createdSalesPromises = salesToCreate.map(saleData =>
      this.saleRepository.create(saleData)
    );

    const createdSales = await Promise.all(createdSalesPromises);

    return createdSales;
  }

  async getSales(
    params: GetSalesParams
  ): Promise<{ sales: Sale[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestError('Parâmetros de paginação inválidos');
    }

    const offset = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      this.saleRepository.findMany({
        ...params,
        offset,
        limit,
      }),
      this.saleRepository.count(params),
    ]);

    return {
      sales,
      total,
    };
  }

  async getSalesMetrics(
    monthAndYear: Date,
    companyBranchId: number
  ): Promise<{
    totalRevenue: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    productRevenue: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    serviceRevenue: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    averageTicket: {
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

    const [currentSales, previousSales, goals] = await Promise.all([
      this.saleRepository.findByDateRange(startDate, endDate, companyBranchId),
      this.saleRepository.findByDateRange(
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

    const currentMetrics = this.calculateSalesMetrics(currentSales);
    const previousMetrics = this.calculateSalesMetrics(previousSales);

    const currentWeeklyMetrics = this.calculateWeeklySalesMetrics(
      currentSales,
      startDate,
      endDate
    );
    const previousWeeklyMetrics = this.calculateWeeklySalesMetrics(
      previousSales,
      previousStartDate,
      previousEndDate
    );

    const weeklyGoals = this.calculateWeeklyGoals(goals);

    return {
      totalRevenue: {
        selectedPeriod: currentMetrics.totalRevenue,
        previousMonth: previousMetrics.totalRevenue,
        selectedPeriodGoal: goals
          ? Number(goals.productRevenue) + Number(goals.serviceRevenue)
          : 0,
        weeklyData: {
          current: currentWeeklyMetrics.totalRevenue,
          previous: previousWeeklyMetrics.totalRevenue,
          goal: weeklyGoals.totalRevenue,
        },
      },
      productRevenue: {
        selectedPeriod: currentMetrics.productRevenue,
        previousMonth: previousMetrics.productRevenue,
        selectedPeriodGoal: goals ? Number(goals.productRevenue) : 0,
        weeklyData: {
          current: currentWeeklyMetrics.productRevenue,
          previous: previousWeeklyMetrics.productRevenue,
          goal: weeklyGoals.productRevenue,
        },
      },
      serviceRevenue: {
        selectedPeriod: currentMetrics.serviceRevenue,
        previousMonth: previousMetrics.serviceRevenue,
        selectedPeriodGoal: goals ? Number(goals.serviceRevenue) : 0,
        weeklyData: {
          current: currentWeeklyMetrics.serviceRevenue,
          previous: previousWeeklyMetrics.serviceRevenue,
          goal: weeklyGoals.serviceRevenue,
        },
      },
      averageTicket: {
        selectedPeriod: currentMetrics.averageTicket,
        previousMonth: previousMetrics.averageTicket,
        selectedPeriodGoal: goals ? Number(goals.ticketAverage) : 0,
        weeklyData: {
          current: currentWeeklyMetrics.averageTicket,
          previous: previousWeeklyMetrics.averageTicket,
          goal: weeklyGoals.averageTicket,
        },
      },
    };
  }

  private calculateWeeklySalesMetrics(
    sales: Sale[],
    startDate: Date,
    endDate: Date
  ): {
    totalRevenue: Array<{ week: string; value: number }>;
    productRevenue: Array<{ week: string; value: number }>;
    serviceRevenue: Array<{ week: string; value: number }>;
    averageTicket: Array<{ week: string; value: number }>;
  } {
    const weeks = getWeeksInMonth(startDate, endDate);

    const weeklyMetrics = weeks.map((week, index) => {
      const weeklySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= week.start && saleDate <= week.end;
      });

      const weekMetrics = this.calculateSalesMetrics(weeklySales);

      return {
        week: `Sem ${index + 1}`,
        totalRevenue: weekMetrics.totalRevenue,
        productRevenue: weekMetrics.productRevenue,
        serviceRevenue: weekMetrics.serviceRevenue,
        averageTicket: weekMetrics.averageTicket,
      };
    });

    return {
      totalRevenue: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.totalRevenue,
      })),
      productRevenue: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.productRevenue,
      })),
      serviceRevenue: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.serviceRevenue,
      })),
      averageTicket: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.averageTicket,
      })),
    };
  }

  private calculateWeeklyGoals(goals: any): {
    totalRevenue: Array<{ week: string; value: number }>;
    productRevenue: Array<{ week: string; value: number }>;
    serviceRevenue: Array<{ week: string; value: number }>;
    averageTicket: Array<{ week: string; value: number }>;
  } {
    if (!goals) {
      return {
        totalRevenue: [1, 2, 3, 4].map(i => ({ week: `Sem ${i}`, value: 0 })),
        productRevenue: [1, 2, 3, 4].map(i => ({ week: `Sem ${i}`, value: 0 })),
        serviceRevenue: [1, 2, 3, 4].map(i => ({ week: `Sem ${i}`, value: 0 })),
        averageTicket: [1, 2, 3, 4].map(i => ({ week: `Sem ${i}`, value: 0 })),
      };
    }

    const totalGoal =
      Number(goals.productRevenue) + Number(goals.serviceRevenue);
    const productGoal = Number(goals.productRevenue);
    const serviceGoal = Number(goals.serviceRevenue);
    const ticketGoal = Number(goals.ticketAverage);

    const weeklyTotalGoal = Math.round(totalGoal / 4);
    const weeklyProductGoal = Math.round(productGoal / 4);
    const weeklyServiceGoal = Math.round(serviceGoal / 4);

    return {
      totalRevenue: [
        { week: 'Sem 1', value: weeklyTotalGoal },
        { week: 'Sem 2', value: weeklyTotalGoal },
        { week: 'Sem 3', value: weeklyTotalGoal },
        { week: 'Sem 4', value: weeklyTotalGoal },
      ],
      productRevenue: [
        { week: 'Sem 1', value: weeklyProductGoal },
        { week: 'Sem 2', value: weeklyProductGoal },
        { week: 'Sem 3', value: weeklyProductGoal },
        { week: 'Sem 4', value: weeklyProductGoal },
      ],
      serviceRevenue: [
        { week: 'Sem 1', value: weeklyServiceGoal },
        { week: 'Sem 2', value: weeklyServiceGoal },
        { week: 'Sem 3', value: weeklyServiceGoal },
        { week: 'Sem 4', value: weeklyServiceGoal },
      ],
      averageTicket: [
        { week: 'Sem 1', value: ticketGoal },
        { week: 'Sem 2', value: ticketGoal },
        { week: 'Sem 3', value: ticketGoal },
        { week: 'Sem 4', value: ticketGoal },
      ],
    };
  }

  private calculateSalesMetrics(sales: Sale[]): {
    totalRevenue: number;
    productRevenue: number;
    serviceRevenue: number;
    averageTicket: number;
  } {
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.totalValue),
      0
    );

    const productRevenue = sales
      .filter(sale => sale.type === SaleType.PRODUCT)
      .reduce((sum, sale) => sum + Number(sale.totalValue), 0);

    const serviceRevenue = sales
      .filter(sale => sale.type === SaleType.SERVICE)
      .reduce((sum, sale) => sum + Number(sale.totalValue), 0);

    const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

    return {
      totalRevenue,
      productRevenue,
      serviceRevenue,
      averageTicket,
    };
  }
}
