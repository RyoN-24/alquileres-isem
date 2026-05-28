import { Router } from 'express'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import {
  createInvoice,
  getInvoice,
  listInvoices,
  markInvoicePaid,
  updateInvoice,
} from './invoice.service'
import {
  createInvoiceSchema,
  listInvoicesQuerySchema,
  markInvoicePaidSchema,
  updateInvoiceSchema,
} from './invoice.schemas'

export const invoiceRouter = Router()

invoiceRouter.use(requireAuth)

invoiceRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listInvoicesQuerySchema.parse(req.query)
    res.json(await listInvoices(query))
  }),
)

invoiceRouter.post(
  '/',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = createInvoiceSchema.parse(req.body)
    res.status(201).json(await createInvoice(input, req.user?.id))
  }),
)

invoiceRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getInvoice(String(req.params.id)))
  }),
)

invoiceRouter.patch(
  '/:id',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = updateInvoiceSchema.parse(req.body)
    res.json(await updateInvoice(String(req.params.id), input, req.user?.id))
  }),
)

invoiceRouter.post(
  '/:id/mark-paid',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const input = markInvoicePaidSchema.parse(req.body)
    res.json(await markInvoicePaid(String(req.params.id), input, req.user?.id))
  }),
)

