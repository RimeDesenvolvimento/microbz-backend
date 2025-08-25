import { z } from 'zod';

export const createSaleSchema = z.array(
  z.object({
    saleDate: z.coerce.date(),
    code: z.string().min(1, 'Code is required'),
    branch: z.string().min(1, 'Branch is required'),
    description: z.string().min(1, 'Description is required'),
    quantity: z.coerce.number().int().positive('Quantity must be positive'),
    unitValue: z.coerce.number().positive('Unit value must be positive'),
    totalValue: z.coerce.number().positive('Total value must be positive'),
    customer: z.string().min(1, 'Customer is required'),
    taxId: z.string().min(1, 'Tax ID is required'),
    type: z.enum(['PRODUCT', 'SERVICE']),
    status: z.enum(['COMPLETED', 'CANCELLED']),
    companyId: z.coerce.number().int().positive('Company ID is required'),
    fileName: z.string().min(1, 'File name is required'),
  })
);

export const updateSaleSchema = z.object({
  saleDate: z.coerce.date().optional(),
  code: z.string().min(1, 'Code is required').optional(),
  branch: z.string().min(1, 'Branch is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  quantity: z.coerce
    .number()
    .int()
    .positive('Quantity must be positive')
    .optional(),
  unitValue: z.coerce
    .number()
    .positive('Unit value must be positive')
    .optional(),
  totalValue: z.coerce
    .number()
    .positive('Total value must be positive')
    .optional(),
  customer: z.string().min(1, 'Customer is required').optional(),
  taxId: z.string().min(1, 'Tax ID is required').optional(),
  type: z.enum(['PRODUCT', 'SERVICE']).optional(),
  status: z.enum(['CANCELLED', 'COMPLETED']).optional(),
  companyId: z.coerce
    .number()
    .int()
    .positive('Company ID is required')
    .optional(),
  fileName: z.string().min(1, 'File name is required').optional(),
});
