import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import {
  buildCostSummaryPdf,
  buildCostSummaryXlsx,
  buildDueInvoicesPdf,
  buildDueInvoicesXlsx,
  getCostSummaryReport,
  getDueInvoicesReport,
} from './report.service'

const dueInvoicesQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  supplierId: z.string().uuid().optional(),
  siteId: z.string().optional(),
  status: z.enum(['PENDIENTE', 'OBSERVADA', 'VENCIDA', 'VENCIDA_CON_PRORROGA', 'PAGADA']).optional(),
  format: z.enum(['json', 'xlsx', 'pdf']).default('json'),
})

const costSummaryQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  supplierId: z.string().uuid().optional(),
  siteId: z.string().optional(),
  format: z.enum(['json', 'xlsx', 'pdf']).default('json'),
})

export const reportRouter = Router()

reportRouter.use(requireAuth)

reportRouter.get(
  '/due-invoices',
  asyncHandler(async (req, res) => {
    const query = dueInvoicesQuerySchema.parse(req.query)

    if (query.format === 'xlsx') {
      const buffer = await buildDueInvoicesXlsx(query)
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      res.setHeader('Content-Disposition', 'attachment; filename="facturas-vencimientos.xlsx"')
      res.send(Buffer.from(buffer))
      return
    }

    if (query.format === 'pdf') {
      const buffer = await buildDueInvoicesPdf(query)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="facturas-vencimientos.pdf"')
      res.send(buffer)
      return
    }

    res.json(await getDueInvoicesReport(query))
  }),
)

reportRouter.get(
  '/cost-summary',
  asyncHandler(async (req, res) => {
    const query = costSummaryQuerySchema.parse(req.query)

    if (query.format === 'xlsx') {
      const buffer = await buildCostSummaryXlsx(query)
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-costos.xlsx"')
      res.send(Buffer.from(buffer))
      return
    }

    if (query.format === 'pdf') {
      const buffer = await buildCostSummaryPdf(query)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-costos.pdf"')
      res.send(buffer)
      return
    }

    res.json(await getCostSummaryReport(query))
  }),
)
