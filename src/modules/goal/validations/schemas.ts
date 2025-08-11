import { z } from 'zod';

export const createGoalSchema = z.object({
  companyBranchId: z.number().int().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1900),
  productRevenue: z.number().default(0),
  serviceRevenue: z.number().default(0),
  ticketAverage: z.number().default(0),
  customers: z.number().int().min(0).default(0),
  newCustomers: z.number().int().min(0).default(0),
  productsPerClient: z.number().min(0).default(0),
  servicesPerClient: z.number().min(0).default(0),
  marketing: z.number().default(0),
  leadsGenerated: z.number().int().min(0).default(0),
  leadsMeetings: z.number().int().min(0).default(0),
  marketingSales: z.number().int().min(0).default(0),
  cpl: z.number().min(0).default(0),
  leadToMeetingRate: z.number().min(0).max(100).default(0),
  meetingToSaleRate: z.number().min(0).max(100).default(0),
  roas: z.number().min(0).default(0),
});
