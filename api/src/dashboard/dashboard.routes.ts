import { Router } from 'express'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import { getDashboardSummary } from './dashboard.service'

export const dashboardRouter = Router()

dashboardRouter.use(requireAuth)

dashboardRouter.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    res.json(await getDashboardSummary())
  }),
)

