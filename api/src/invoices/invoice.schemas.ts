import { z } from 'zod'

export const createInvoiceSchema = z.object({
  valuationId: z.string().uuid(),
  invoiceNumber: z.string().min(2),
  issueDate: z.string().date(),
  dueDate: z.string().date().optional(),
  currency: z.enum(['PEN', 'USD']).optional(),
  totalAmount: z.number().positive().optional(),
  amountMismatchAccepted: z.boolean().default(false),
  notes: z.string().optional(),
  status: z.enum(['PENDIENTE', 'OBSERVADA']).default('PENDIENTE'),
})

export const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(2).optional(),
  issueDate: z.string().date().optional(),
  dueDate: z.string().date().optional(),
  currency: z.enum(['PEN', 'USD']).optional(),
  totalAmount: z.number().positive().optional(),
  amountMismatchAccepted: z.boolean().optional(),
  paymentExtensionDate: z.string().date().optional(),
  paymentExtensionReason: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDIENTE', 'OBSERVADA', 'VENCIDA', 'VENCIDA_CON_PRORROGA', 'ANULADA']).optional(),
})

export const markInvoicePaidSchema = z.object({
  paidAt: z.string().date(),
  notes: z.string().optional(),
})

export const listInvoicesQuerySchema = z.object({
  q: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  valuationId: z.string().uuid().optional(),
  status: z
    .enum(['REGISTRADA', 'PENDIENTE', 'OBSERVADA', 'VENCIDA', 'VENCIDA_CON_PRORROGA', 'PAGADA', 'ANULADA'])
    .optional(),
  currency: z.enum(['PEN', 'USD']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

