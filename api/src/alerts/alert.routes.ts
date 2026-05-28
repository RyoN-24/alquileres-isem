import { Router } from 'express'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import { listActiveAlerts, runAlertEvaluation } from './alert.service'

export const alertRouter = Router()

alertRouter.use(requireAuth)

alertRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ data: await listActiveAlerts() })
  }),
)

alertRouter.post(
  '/run',
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    res.json(await runAlertEvaluation())
  }),
)

