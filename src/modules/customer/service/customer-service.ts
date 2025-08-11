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
  ): Promise<CustomerMetrics> {
    const year = monthAndYear.getFullYear();
    const month = monthAndYear.getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const previousMonth = month === 0 ? 11 : month - 1;
    const previousYear = month === 0 ? year - 1 : year;
    const previousStartDate = new Date(previousYear, previousMonth, 1);
    const previousEndDate = new Date(previousYear, previousMonth + 1, 0);

    const [currentPeriodData, previousPeriodData, goals] = await Promise.all([
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
    ]);

    return {
      customersServed: {
        selectedPeriod: currentPeriodData.customersServed,
        previousMonth: previousPeriodData.customersServed,
        selectedPeriodGoal: goals?.customers || 0,
      },
      newCustomers: {
        selectedPeriod: currentPeriodData.newCustomers,
        previousMonth: previousPeriodData.newCustomers,
        selectedPeriodGoal: goals?.newCustomers || 0,
      },
      productsPerCustomer: {
        selectedPeriod: currentPeriodData.productsPerCustomer,
        previousMonth: previousPeriodData.productsPerCustomer,
        selectedPeriodGoal: Number(goals?.productsPerClient) || 0,
      },
      servicesPerCustomer: {
        selectedPeriod: currentPeriodData.servicesPerCustomer,
        previousMonth: previousPeriodData.servicesPerCustomer,
        selectedPeriodGoal: Number(goals?.servicesPerClient) || 0,
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
      customersServed,
      productSales,
      serviceSales,
      { customersLength, productCustomersLength, serviceCustomersLength },
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
      customersServed: customersLength,
      newCustomers: customersServed.length,
      productsPerCustomer: Math.round(productsPerCustomer * 100) / 100,
      servicesPerCustomer: Math.round(servicesPerCustomer * 100) / 100,
    };
  }
}
