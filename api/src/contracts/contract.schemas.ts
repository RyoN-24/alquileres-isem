import { z } from 'zod'

export const createContractSchema = z.object({
  supplierId: z.string().uuid(),
  siteId: z.string(),
  contractNumber: z.string().min(2),
  projectName: z.string().trim().max(160).optional(),
  costCenter: z.string().trim().max(120).optional(),
  equipmentIds: z.array(z.string().uuid()).min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  billingMode: z.enum(['HORA', 'DIA']),
  rate: z.number().positive(),
  currency: z.enum(['PEN', 'USD']),
  invoiceDueDays: z.number().int().positive().default(30),
  notes: z.string().optional(),
  status: z.enum(['BORRADOR', 'ACTIVO']).default('ACTIVO'),
})

export const updateContractSchema = createContractSchema
  .partial()
  .omit({ supplierId: true, equipmentIds: true })
  .extend({
    equipmentIds: z.array(z.string().uuid()).min(1).optional(),
  })

export const listContractsQuerySchema = z.object({
  q: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  siteId: z.string().optional(),
  status: z.enum(['BORRADOR', 'ACTIVO', 'POR_VENCER', 'FINALIZADO', 'CANCELADO']).optional(),
  currency: z.enum(['PEN', 'USD']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})
