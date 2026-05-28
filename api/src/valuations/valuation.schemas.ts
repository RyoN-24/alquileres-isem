import { z } from 'zod'

export const createValuationSchema = z.object({
  contractId: z.string().uuid(),
  equipmentId: z.string().uuid(),
  valuationNumber: z.string().min(2),
  periodStart: z.string().date().optional(),
  periodEnd: z.string().date().optional(),
  cutoffDate: z.string().date(),
  quantity: z.number().positive(),
  currency: z.enum(['PEN', 'USD']).optional(),
  notes: z.string().optional(),
  status: z.enum(['BORRADOR', 'PENDIENTE_FACTURA']).default('PENDIENTE_FACTURA'),
})

export const updateValuationSchema = createValuationSchema
  .partial()
  .omit({ contractId: true, equipmentId: true })

export const listValuationsQuerySchema = z.object({
  q: z.string().optional(),
  contractId: z.string().uuid().optional(),
  equipmentId: z.string().uuid().optional(),
  status: z
    .enum(['BORRADOR', 'PENDIENTE_FACTURA', 'FACTURADA', 'OBSERVADA', 'PAGADA', 'ANULADA'])
    .optional(),
  currency: z.enum(['PEN', 'USD']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

