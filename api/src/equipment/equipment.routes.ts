import { Router } from 'express'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import {
  createEquipment,
  createEquipmentType,
  createSite,
  getEquipment,
  listEquipment,
  listEquipmentTypes,
  listSites,
  updateEquipment,
  updateEquipmentType,
  updateSite,
  deleteEquipment,
} from './equipment.service'
import {
  createEquipmentSchema,
  createEquipmentTypeSchema,
  createSiteSchema,
  listEquipmentQuerySchema,
  updateEquipmentSchema,
  updateEquipmentTypeSchema,
  updateSiteSchema,
} from './equipment.schemas'

export const equipmentRouter = Router()

equipmentRouter.use(requireAuth)

equipmentRouter.get(
  '/types',
  asyncHandler(async (_req, res) => {
    res.json({ data: await listEquipmentTypes() })
  }),
)

equipmentRouter.post(
  '/types',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const input = createEquipmentTypeSchema.parse(req.body)
    res.status(201).json(await createEquipmentType(input, req.user?.id))
  }),
)

equipmentRouter.patch(
  '/types/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const input = updateEquipmentTypeSchema.parse(req.body)
    res.json(await updateEquipmentType(String(req.params.id), input, req.user?.id))
  }),
)

equipmentRouter.get(
  '/sites',
  asyncHandler(async (_req, res) => {
    res.json({ data: await listSites() })
  }),
)

equipmentRouter.post(
  '/sites',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const input = createSiteSchema.parse(req.body)
    res.status(201).json(await createSite(input, req.user?.id))
  }),
)

equipmentRouter.patch(
  '/sites/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const input = updateSiteSchema.parse(req.body)
    res.json(await updateSite(String(req.params.id), input, req.user?.id))
  }),
)

equipmentRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listEquipmentQuerySchema.parse(req.query)
    res.json(await listEquipment(query))
  }),
)

equipmentRouter.post(
  '/',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = createEquipmentSchema.parse(req.body)
    res.status(201).json(await createEquipment(input, req.user?.id))
  }),
)

equipmentRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getEquipment(String(req.params.id)))
  }),
)

equipmentRouter.patch(
  '/:id',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = updateEquipmentSchema.parse(req.body)
    res.json(await updateEquipment(String(req.params.id), input, req.user?.id))
  }),
)

equipmentRouter.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await deleteEquipment(String(req.params.id), req.user?.id)
    res.status(204).end()
  }),
)
