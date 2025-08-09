import {
  Sale,
  Customer,
  SaleType,
  SaleStatus,
  CustomerStatus,
  CompanyBranch,
} from '@prisma/client';
import { BadRequestError } from '../../../common/errors/http-errors';
import { SaleRepository } from '../repository/sale-repository';
import { CustomerRepository } from '../../customer/repository/customer-repository';
import { CompanyBranchRepository } from '../../company-branch/repository/company-branch-repository';

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
    private readonly companyBranchRepository: CompanyBranchRepository
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
