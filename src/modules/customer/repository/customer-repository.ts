import { Customer, CustomerStatus } from '@prisma/client';
import prisma from '../../../../prisma/db';

export type CreateCustomerData = {
  name: string;
  taxId: string | null;
  status: CustomerStatus;
  companyBranchId: number;
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

  async getAll(): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return customers;
  }
}
