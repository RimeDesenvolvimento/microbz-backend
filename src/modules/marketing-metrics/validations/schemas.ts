import z from 'zod';

export const CreateMarketingMetricsSchema = z
  .array(
    z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
      source: z.enum(['GOOGLE', 'META'], {
        errorMap: () => ({
          message:
            'Source deve ser um dos valores válidos do enum MarketingSource',
        }),
      }),
      investment: z.coerce
        .number()
        .min(0, 'Investment deve ser maior ou igual a 0'),
      leadsGenerated: z.coerce
        .number()
        .int()
        .min(0, 'LeadsGenerated deve ser um número inteiro maior ou igual a 0'),
      sales: z.coerce
        .number()
        .int()
        .min(0, 'Sales deve ser um número inteiro maior ou igual a 0'),
    })
  )
  .min(1, 'É necessário fornecer pelo menos uma métrica');

export const UpdateMarketingMetricsSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
  source: z.enum(['GOOGLE', 'META']).optional(),
  investment: z.coerce.number().min(0).optional(),
  leadsGenerated: z.coerce.number().int().min(0).optional(),
  sales: z.coerce.number().int().min(0).optional(),
});
