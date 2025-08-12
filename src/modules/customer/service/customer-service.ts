import { Customer } from '@prisma/client';
import { CustomerRepository } from '../repository/customer-repository';
import { GoalRepository } from '../../goal/repository/goal-repository';

type CustomerMetrics = {
  customersServed: {
    selectedPeriod: number;
    previousMonth: number;
    selectedPeriodGoal: number;
  };
  newCustomers: {
    selectedPeriod: number;
    previousMonth: number;
    selectedPeriodGoal: number;
  };
  productsPerCustomer: {
    selectedPeriod: number;
    previousMonth: number;
    selectedPeriodGoal: number;
  };
  servicesPerCustomer: {
    selectedPeriod: number;
    previousMonth: number;
    selectedPeriodGoal: number;
  };
};

export class CustomerService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly goalRepository: GoalRepository
  ) {}

  async getAll(): Promise<Customer[]> {
    return await this.customerRepository.getAll();
  }

  async getCustomerMetrics(
    monthAndYear: Date,
    companyBranchId: number
  ): Promise<{
    customersServed: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    newCustomers: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    productsPerCustomer: {
      selectedPeriod: number;
      previousMonth: number;
      selectedPeriodGoal: number;
      weeklyData: {
        current: Array<{ week: string; value: number }>;
        previous: Array<{ week: string; value: number }>;
        goal: Array<{ week: string; value: number }>;
      };
    };
    servicesPerCustomer: {
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

    const [
      currentPeriodData,
      previousPeriodData,
      goals,
      currentCustomers,
      previousCustomers,
    ] = await Promise.all([
      this.calculatePeriodMetrics(startDate, endDate, companyBranchId),
      this.calculatePeriodMetrics(
        previousStartDate,
        previousEndDate,
        companyBranchId
      ),
      this.goalRepository.getByBranchAndPeriod(
        companyBranchId,
        year,
        month + 1
      ),
      this.customerRepository.findByDateRangeAndBranch(
        startDate,
        endDate,
        companyBranchId
      ),
      this.customerRepository.findByDateRangeAndBranch(
        previousStartDate,
        previousEndDate,
        companyBranchId
      ),
    ]);

    const currentWeeklyMetrics = await this.calculateWeeklyCustomerMetrics(
      currentCustomers,
      startDate,
      endDate,
      companyBranchId
    );
    const previousWeeklyMetrics = await this.calculateWeeklyCustomerMetrics(
      previousCustomers,
      previousStartDate,
      previousEndDate,
      companyBranchId
    );
    const weeklyGoals = this.calculateWeeklyGoals(goals);

    return {
      customersServed: {
        selectedPeriod: currentPeriodData.customersServed,
        previousMonth: previousPeriodData.customersServed,
        selectedPeriodGoal: goals?.customers || 0,
        weeklyData: {
          current: currentWeeklyMetrics.customersServed,
          previous: previousWeeklyMetrics.customersServed,
          goal: weeklyGoals.customersServed,
        },
      },
      newCustomers: {
        selectedPeriod: currentPeriodData.newCustomers,
        previousMonth: previousPeriodData.newCustomers,
        selectedPeriodGoal: goals?.newCustomers || 0,
        weeklyData: {
          current: currentWeeklyMetrics.newCustomers,
          previous: previousWeeklyMetrics.newCustomers,
          goal: weeklyGoals.newCustomers,
        },
      },
      productsPerCustomer: {
        selectedPeriod: currentPeriodData.productsPerCustomer,
        previousMonth: previousPeriodData.productsPerCustomer,
        selectedPeriodGoal: Number(goals?.productsPerClient) || 0,
        weeklyData: {
          current: currentWeeklyMetrics.productsPerCustomer,
          previous: previousWeeklyMetrics.productsPerCustomer,
          goal: weeklyGoals.productsPerCustomer,
        },
      },
      servicesPerCustomer: {
        selectedPeriod: currentPeriodData.servicesPerCustomer,
        previousMonth: previousPeriodData.servicesPerCustomer,
        selectedPeriodGoal: Number(goals?.servicesPerClient) || 0,
        weeklyData: {
          current: currentWeeklyMetrics.servicesPerCustomer,
          previous: previousWeeklyMetrics.servicesPerCustomer,
          goal: weeklyGoals.servicesPerCustomer,
        },
      },
    };
  }

  private async calculatePeriodMetrics(
    startDate: Date,
    endDate: Date,
    companyBranchId: number
  ): Promise<{
    customersServed: number;
    newCustomers: number;
    productsPerCustomer: number;
    servicesPerCustomer: number;
  }> {
    const [
      newCustomers,
      productSales,
      serviceSales,
      {
        customersLength: uniqueCustomersLength,
        productCustomersLength,
        serviceCustomersLength,
      },
    ] = await Promise.all([
      this.customerRepository.findByDateRangeAndBranch(
        startDate,
        endDate,
        companyBranchId
      ),
      this.customerRepository.findProductSalesByPeriodAndBranch(
        startDate,
        endDate,
        companyBranchId
      ),
      this.customerRepository.findServiceSalesByPeriodAndBranch(
        startDate,
        endDate,
        companyBranchId
      ),
      this.customerRepository.findUniqueCustomersByPeriodAndBranch(
        startDate,
        endDate,
        companyBranchId
      ),
    ]);

    const totalProductQuantity = productSales.reduce(
      (sum, sale) => sum + sale.quantity,
      0
    );

    const productsPerCustomer =
      productCustomersLength > 0
        ? totalProductQuantity / productCustomersLength
        : 0;

    const totalServiceQuantity = serviceSales.reduce(
      (sum, sale) => sum + sale.quantity,
      0
    );
    const servicesPerCustomer =
      serviceCustomersLength > 0
        ? totalServiceQuantity / serviceCustomersLength
        : 0;

    return {
      customersServed: uniqueCustomersLength,
      newCustomers: newCustomers.length,
      productsPerCustomer: Math.round(productsPerCustomer * 100) / 100,
      servicesPerCustomer: Math.round(servicesPerCustomer * 100) / 100,
    };
  }

  private async calculateWeeklyCustomerMetrics(
    customers: any[],
    startDate: Date,
    endDate: Date,
    companyBranchId: number
  ): Promise<{
    customersServed: Array<{ week: string; value: number }>;
    newCustomers: Array<{ week: string; value: number }>;
    productsPerCustomer: Array<{ week: string; value: number }>;
    servicesPerCustomer: Array<{ week: string; value: number }>;
  }> {
    const weeks = this.getWeeksInMonth(startDate, endDate);

    const weeklyMetrics = await Promise.all(
      weeks.map(async (week, index) => {
        const weeklyCustomers = customers.filter(customer => {
          const customerDate = new Date(
            customer.createdAt || customer.saleDate
          );
          return customerDate >= week.start && customerDate <= week.end;
        });

        const [productSales, serviceSales, uniqueCustomers] = await Promise.all(
          [
            this.customerRepository.findProductSalesByPeriodAndBranch(
              week.start,
              week.end,
              companyBranchId
            ),
            this.customerRepository.findServiceSalesByPeriodAndBranch(
              week.start,
              week.end,
              companyBranchId
            ),
            this.customerRepository.findUniqueCustomersByPeriodAndBranch(
              week.start,
              week.end,
              companyBranchId
            ),
          ]
        );

        const totalProductQuantity = productSales.reduce(
          (sum, sale) => sum + sale.quantity,
          0
        );

        const productsPerCustomer =
          uniqueCustomers.productCustomersLength > 0
            ? totalProductQuantity / uniqueCustomers.productCustomersLength
            : 0;

        const totalServiceQuantity = serviceSales.reduce(
          (sum, sale) => sum + sale.quantity,
          0
        );

        const servicesPerCustomer =
          uniqueCustomers.serviceCustomersLength > 0
            ? totalServiceQuantity / uniqueCustomers.serviceCustomersLength
            : 0;

        return {
          week: `Sem ${index + 1}`,
          customersServed: uniqueCustomers.customersLength,
          newCustomers: weeklyCustomers.length,
          productsPerCustomer: Math.round(productsPerCustomer * 100) / 100,
          servicesPerCustomer: Math.round(servicesPerCustomer * 100) / 100,
        };
      })
    );

    return {
      customersServed: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.customersServed,
      })),
      newCustomers: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.newCustomers,
      })),
      productsPerCustomer: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.productsPerCustomer,
      })),
      servicesPerCustomer: weeklyMetrics.map(w => ({
        week: w.week,
        value: w.servicesPerCustomer,
      })),
    };
  }

  private getWeeksInMonth(
    startDate: Date,
    endDate: Date
  ): Array<{ start: Date; end: Date }> {
    const weeks: Array<{ start: Date; end: Date }> = [];
    const totalDays = endDate.getDate();
    const daysPerWeek = Math.ceil(totalDays / 4);

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(1 + i * daysPerWeek);

      const weekEnd = new Date(startDate);
      weekEnd.setDate(Math.min(totalDays, (i + 1) * daysPerWeek));

      if (i === 3) {
        weekEnd.setDate(totalDays);
      }

      weeks.push({ start: weekStart, end: weekEnd });
    }

    return weeks;
  }

  private calculateWeeklyGoals(goals: any): {
    customersServed: Array<{ week: string; value: number }>;
    newCustomers: Array<{ week: string; value: number }>;
    productsPerCustomer: Array<{ week: string; value: number }>;
    servicesPerCustomer: Array<{ week: string; value: number }>;
  } {
    if (!goals) {
      return {
        customersServed: [1, 2, 3, 4].map(i => ({
          week: `Sem ${i}`,
          value: 0,
        })),
        newCustomers: [1, 2, 3, 4].map(i => ({ week: `Sem ${i}`, value: 0 })),
        productsPerCustomer: [1, 2, 3, 4].map(i => ({
          week: `Sem ${i}`,
          value: 0,
        })),
        servicesPerCustomer: [1, 2, 3, 4].map(i => ({
          week: `Sem ${i}`,
          value: 0,
        })),
      };
    }

    const customersGoal = Number(goals.customers) || 0;
    const newCustomersGoal = Number(goals.newCustomers) || 0;
    const productsPerCustomerGoal = Number(goals.productsPerClient) || 0;
    const servicesPerCustomerGoal = Number(goals.servicesPerClient) || 0;

    const weeklyCustomersGoal = Math.round(customersGoal / 4);
    const weeklyNewCustomersGoal = Math.round(newCustomersGoal / 4);

    return {
      customersServed: [
        { week: 'Sem 1', value: weeklyCustomersGoal },
        { week: 'Sem 2', value: weeklyCustomersGoal },
        { week: 'Sem 3', value: weeklyCustomersGoal },
        { week: 'Sem 4', value: weeklyCustomersGoal },
      ],
      newCustomers: [
        { week: 'Sem 1', value: weeklyNewCustomersGoal },
        { week: 'Sem 2', value: weeklyNewCustomersGoal },
        { week: 'Sem 3', value: weeklyNewCustomersGoal },
        { week: 'Sem 4', value: weeklyNewCustomersGoal },
      ],
      productsPerCustomer: [
        { week: 'Sem 1', value: productsPerCustomerGoal },
        { week: 'Sem 2', value: productsPerCustomerGoal },
        { week: 'Sem 3', value: productsPerCustomerGoal },
        { week: 'Sem 4', value: productsPerCustomerGoal },
      ],
      servicesPerCustomer: [
        { week: 'Sem 1', value: servicesPerCustomerGoal },
        { week: 'Sem 2', value: servicesPerCustomerGoal },
        { week: 'Sem 3', value: servicesPerCustomerGoal },
        { week: 'Sem 4', value: servicesPerCustomerGoal },
      ],
    };
  }
}
