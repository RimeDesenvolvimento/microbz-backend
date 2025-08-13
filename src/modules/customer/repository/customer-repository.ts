import {
  Customer,
  CustomerStatus,
  Sale,
  SaleStatus,
  SaleType,
} from '@prisma/client';
import prisma from '../../../../prisma/db';
import { GetAllCustomersParams } from '../service/customer-service';

export type CreateCustomerData = {
  name: string;
  taxId: string | null;
  status: CustomerStatus;
  companyBranchId: number;
  importedSpreadsheetId: number;
};

export class CustomerRepository {
  async getByTaxId(taxId: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { taxId },
    });
    return customer;
  }

  async getByName(name: string): Promise<Customer | null> {
    const customer = await prisma.customer.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
    return customer;
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const customer = await prisma.customer.create({
      data,
    });
    return customer;
  }

  async getById(id: number): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });
    return customer;
  }

  async findMany(): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return customers;
  }

  async getAll({
    companyId,
    name,
    taxId,
    page,
    perPage,
  }: GetAllCustomersParams) {
    const where: any = {
      companyBranch: {
        companyId,
      },
    };

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (taxId) {
      where.taxId = {
        contains: taxId.replace(/\D/g, ''),
      };
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      total,
    };
  }

  async findByDateRangeAndBranch(
    startDate: Date,
    endDate: Date,
    companyBranchId: number
  ): Promise<Customer[]> {
    return await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        companyBranchId: companyBranchId,
        status: CustomerStatus.ACTIVE,
      },
    });
  }

  async findProductSalesByPeriodAndBranch(
    startDate: Date,
    endDate: Date,
    companyBranchId: number
  ): Promise<Sale[]> {
    return await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        companyBranchId: companyBranchId,
        type: SaleType.PRODUCT,
        status: SaleStatus.COMPLETED,
      },
      include: {
        customer: true,
      },
    });
  }

  async findServiceSalesByPeriodAndBranch(
    startDate: Date,
    endDate: Date,
    companyBranchId: number
  ): Promise<Sale[]> {
    return await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        companyBranchId: companyBranchId,
        type: SaleType.SERVICE,
        status: SaleStatus.COMPLETED,
      },
      include: {
        customer: true,
      },
    });
  }

  async findUniqueCustomersByPeriodAndBranch(
    startDate: Date,
    endDate: Date,
    companyBranchId: number
  ) {
    const [uniqueCustomers, productCustomers, serviceCustomers] =
      await Promise.all([
        prisma.sale.findMany({
          where: {
            saleDate: {
              gte: startDate,
              lte: endDate,
            },
            companyBranchId: companyBranchId,
            status: SaleStatus.COMPLETED,
          },
          select: {
            customerId: true,
          },
          distinct: ['customerId'],
        }),

        prisma.sale.findMany({
          where: {
            saleDate: {
              gte: startDate,
              lte: endDate,
            },
            companyBranchId: companyBranchId,
            type: SaleType.PRODUCT,
            status: SaleStatus.COMPLETED,
          },
          select: {
            customerId: true,
          },
          distinct: ['customerId'],
        }),

        prisma.sale.findMany({
          where: {
            saleDate: {
              gte: startDate,
              lte: endDate,
            },
            companyBranchId: companyBranchId,
            type: SaleType.SERVICE,
            status: SaleStatus.COMPLETED,
          },
          select: {
            customerId: true,
          },
          distinct: ['customerId'],
        }),
      ]);

    return {
      customersLength: uniqueCustomers.length,
      productCustomersLength: productCustomers.length,
      serviceCustomersLength: serviceCustomers.length,
    };
  }
}
