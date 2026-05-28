import { Router } from 'express'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import {
  createValuation,
  getValuation,
  listValuations,
  updateValuation,
} from './valuation.service'
import {
  createValuationSchema,
  listValuationsQuerySchema,
  updateValuationSchema,
} from './valuation.schemas'

export const valuationRouter = Router()

valuationRouter.use(requireAuth)

valuationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listValuationsQuerySchema.parse(req.query)
    res.json(await listValuations(query))
  }),
)

valuationRouter.post(
  '/',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = createValuationSchema.parse(req.body)
    res.status(201).json(await createValuation(input, req.user?.id))
  }),
)

valuationRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getValuation(String(req.params.id)))
  }),
)

valuationRouter.patch(
  '/:id',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = updateValuationSchema.parse(req.body)
    res.json(await updateValuation(String(req.params.id), input, req.user?.id))
  }),
)

