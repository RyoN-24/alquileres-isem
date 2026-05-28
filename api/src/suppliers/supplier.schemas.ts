import { z } from 'zod'

export const createSupplierSchema = z.object({
  businessName: z.string().min(2),
  tradeName: z.string().optional(),
  ruc: z.string().regex(/^\d{11}$/, 'El RUC debe tener 11 digitos'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  defaultPaymentTermDays: z.number().int().positive().default(30),
})

export const updateSupplierSchema = createSupplierSchema.partial()

export const listSuppliersQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

