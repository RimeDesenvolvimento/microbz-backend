import {
  Sale,
  Customer,
  SaleType,
  SaleStatus,
  CustomerStatus,
} from '@prisma/client';
import { BadRequestError } from '../../../common/errors/http-errors';
import { SaleRepository } from '../repository/sale-repository';
import { CustomerRepository } from '../../customer/repository/customer-repository';

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
    private readonly customerRepository: CustomerRepository
  ) {
    this.saleRepository = saleRepository;
    this.customerRepository = customerRepository;
  }

  async createSales(salesData: CreateSaleParams[]): Promise<Sale[]> {
    if (!Array.isArray(salesData) || salesData.length === 0) {
      throw new BadRequestError('É necessário informar pelo menos uma venda');
    }

    const codes = salesData.map(sale => sale.code);
    const uniqueCodes = new Set(codes);
    if (codes.length !== uniqueCodes.size) {
      throw new BadRequestError('Códigos de venda duplicados no array');
    }

    const existingCodes = await this.saleRepository.getExistingCodes(codes);
    if (existingCodes.length > 0) {
      throw new BadRequestError(
        `Códigos de venda já existem: ${existingCodes.join(', ')}`
      );
    }

    const customerPromises = salesData.map(async saleData => {
      const { customer, taxId } = saleData;

      let existingCustomer: Customer | null = null;

      if (taxId) {
        existingCustomer = await this.customerRepository.getByTaxId(taxId);
      }

      if (!existingCustomer) {
        existingCustomer = await this.customerRepository.getByName(customer);
      }

      if (!existingCustomer) {
        existingCustomer = await this.customerRepository.create({
          name: customer,
          taxId: taxId || null,
          status: CustomerStatus.ACTIVE,
        });
      }

      return {
        saleData,
        customerId: existingCustomer.id,
      };
    });

    const salesWithCustomers = await Promise.all(customerPromises);

    const salesToCreate = salesWithCustomers.map(({ saleData, customerId }) => {
      const { customer, taxId, ...saleDataWithoutCustomer } = saleData;
      return {
        ...saleDataWithoutCustomer,
        customerId,
        unitValue: Number(saleDataWithoutCustomer.unitValue),
        totalValue: Number(saleDataWithoutCustomer.totalValue),
      };
    });

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
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    productRevenue: number;
    serviceRevenue: number;
    averageTicket: number;
  }> {
    const sales = await this.saleRepository.findByDateRange(startDate, endDate);

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
