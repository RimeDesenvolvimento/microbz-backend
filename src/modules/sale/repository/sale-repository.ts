import {
  Sale,
  SaleType,
  SaleStatus,
  ImportedSpreadsheet,
} from '@prisma/client';
import prisma from '../../../../prisma/db';
import { parseYMDToLocalDate } from '../../../utils/date';

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
  companyId?: string;
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
      companyId,
    } = params;

    const where: any = {
      companyBranch: {
        companyId,
      },
    };

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
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = parseYMDToLocalDate(String(startDate), false);
      }
      if (endDate) {
        where.saleDate.lte = parseYMDToLocalDate(String(endDate), true);
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

    return prisma.sale.findMany({
      where,
      include: {
        customer: true,
        companyBranch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        saleDate: 'desc',
      },
      skip: offset,
      take: limit,
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.sale.delete({
      where: { id },
    });
  }

  async update(id: number, data: Partial<Sale>): Promise<void> {
    await prisma.sale.update({
      where: { id },
      data,
    });
  }

  async count(params: FindSalesParams): Promise<number> {
    const where: any = {
      companyBranch: {
        companyId: Number(params.companyId),
      },
    };

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.startDate || params.endDate) {
      where.saleDate = {};
      if (params.startDate) {
        where.saleDate.gte = parseYMDToLocalDate(
          String(params.startDate),
          false
        );
      }
      if (params.endDate) {
        where.saleDate.lte = parseYMDToLocalDate(String(params.endDate), true);
      }
    }

    if (params.description) {
      where.description = {
        contains: params.description,
        mode: 'insensitive',
      };
    }

    if (params.customer) {
      where.customer = {
        name: {
          contains: params.customer,
          mode: 'insensitive',
        },
      };
    }

    return prisma.sale.count({ where });
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

  async createSpreadsheet(data: {
    fileName: string;
    companyId: number;
  }): Promise<ImportedSpreadsheet> {
    const spreadsheet = await prisma.importedSpreadsheet.create({
      data,
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

  async getImportedSpreadsheetsByCompanyId(
    companyId: number
  ): Promise<ImportedSpreadsheet[]> {
    return prisma.importedSpreadsheet.findMany({
      where: { companyId },
    });
  }
}
