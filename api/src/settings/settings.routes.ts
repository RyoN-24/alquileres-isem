import { Router } from 'express'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import { updateAlertSettingsSchema, updateContractTemplateSchema } from './settings.schemas'
import {
  getAlertSettings,
  getContractTemplate,
  updateAlertSettings,
  updateContractTemplate,
} from './settings.service'

export const settingsRouter = Router()

settingsRouter.use(requireAuth)

settingsRouter.get(
  '/alerts',
  asyncHandler(async (_req, res) => {
    res.json(await getAlertSettings())
  }),
)

settingsRouter.patch(
  '/alerts',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const input = updateAlertSettingsSchema.parse(req.body)
    res.json(await updateAlertSettings(input, req.user?.id))
  }),
)

settingsRouter.get(
  '/contract-template',
  asyncHandler(async (_req, res) => {
    res.json(await getContractTemplate())
  }),
)

settingsRouter.patch(
  '/contract-template',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const input = updateContractTemplateSchema.parse(req.body)
    res.json(await updateContractTemplate(input, req.user?.id))
  }),
)
