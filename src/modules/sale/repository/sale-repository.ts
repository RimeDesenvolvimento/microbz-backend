import {
  Sale,
  SaleType,
  SaleStatus,
  ImportedSpreadsheet,
} from '@prisma/client';
import prisma from '../../../../prisma/db';

export type CreateSaleData = {
  saleDate: Date;
  code: string;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  customerId: number;
  type: SaleType;
  status: SaleStatus;
  companyBranchId: number;
};

interface FindSalesParams {
  customerId?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  customer?: string;
  offset: number;
  limit: number;
}

export type CountSalesParams = {
  customerId?: number;
  status?: SaleStatus;
  type?: SaleType;
};

export class SaleRepository {
  async create(
    data: CreateSaleData,
    importedSpreadsheetId: number
  ): Promise<Sale> {
    const sale = await prisma.sale.create({
      data: {
        ...data,
        importedSpreadsheetId,
      },
    });
    return sale;
  }

  async getExistingCodes(codes: string[]): Promise<string[]> {
    const existingSales = await prisma.sale.findMany({
      where: {
        code: {
          in: codes,
        },
      },
      select: {
        code: true,
      },
    });

    return existingSales.map(sale => sale.code);
  }

  async findMany(params: FindSalesParams): Promise<Sale[]> {
    const {
      customerId,
      status,
      type,
      startDate,
      endDate,
      description,
      customer,
      offset,
      limit,
    } = params;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.registrationDate = {};
      if (startDate) {
        where.registrationDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.registrationDate.lte = new Date(endDate);
      }
    }

    if (description) {
      where.description = {
        contains: description,
        mode: 'insensitive',
      };
    }

    if (customer) {
      where.customer = {
        name: {
          contains: customer,
          mode: 'insensitive',
        },
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: {
        registrationDate: 'desc',
      },
      skip: offset,
      take: limit,
    });

    return sales;
  }

  async count(params: CountSalesParams): Promise<number> {
    const { customerId, status, type } = params;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const count = await prisma.sale.count({
      where,
    });

    return count;
  }

  async getById(id: number): Promise<Sale | null> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });
    return sale;
  }

  async getByCode(code: string): Promise<Sale | null> {
    const sale = await prisma.sale.findUnique({
      where: { code },
      include: {
        customer: true,
      },
    });
    return sale;
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    companyBranchId: number
  ): Promise<Sale[]> {
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        companyBranchId,
      },
      include: {
        customer: true,
      },
      orderBy: {
        saleDate: 'desc',
      },
    });

    return sales;
  }

  async createSpreadsheet(fileName: string): Promise<ImportedSpreadsheet> {
    const spreadsheet = await prisma.importedSpreadsheet.create({
      data: {
        fileName,
      },
    });

    return spreadsheet;
  }
  async deleteImportedSpreadsheet(id: number): Promise<void> {
    await prisma.$transaction(async tx => {
      await tx.sale.deleteMany({
        where: {
          OR: [
            { importedSpreadsheetId: id },
            { customer: { importedSpreadsheetId: id } },
          ],
        },
      });

      await tx.customer.deleteMany({
        where: { importedSpreadsheetId: id },
      });

      await tx.companyBranch.deleteMany({
        where: { importedSpreadsheetId: id },
      });

      await tx.importedSpreadsheet.delete({
        where: { id },
      });
    });
  }
}
