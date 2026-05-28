import { z } from 'zod'

export const createEquipmentSchema = z.object({
  supplierId: z.string().uuid(),
  equipmentTypeId: z.string().uuid(),
  currentSiteId: z.string().optional(),
  description: z.string().min(2),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  plateOrInternalCode: z.string().min(1).optional(),
  status: z
    .enum(['DISPONIBLE', 'EN_OBRA', 'EN_MANTENIMIENTO', 'RETIRADO', 'FINALIZADO'])
    .default('DISPONIBLE'),
})

export const updateEquipmentSchema = createEquipmentSchema.partial()

export const listEquipmentQuerySchema = z.object({
  q: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  siteId: z.string().optional(),
  status: z
    .enum(['DISPONIBLE', 'EN_OBRA', 'EN_MANTENIMIENTO', 'RETIRADO', 'FINALIZADO'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const createEquipmentTypeSchema = z.object({
  name: z.string().min(2),
})

export const updateEquipmentTypeSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
})

export const createSiteSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
})

export const updateSiteSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
})
