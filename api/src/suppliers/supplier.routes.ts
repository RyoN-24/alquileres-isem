import { Router } from 'express'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import {
  createSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
} from './supplier.service'
import {
  createSupplierSchema,
  listSuppliersQuerySchema,
  updateSupplierSchema,
} from './supplier.schemas'

export const supplierRouter = Router()

supplierRouter.use(requireAuth)

supplierRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listSuppliersQuerySchema.parse(req.query)
    res.json(await listSuppliers(query))
  }),
)

supplierRouter.post(
  '/',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = createSupplierSchema.parse(req.body)
    const supplier = await createSupplier(input, req.user?.id)
    res.status(201).json(supplier)
  }),
)

supplierRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getSupplier(String(req.params.id)))
  }),
)

supplierRouter.patch(
  '/:id',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = updateSupplierSchema.parse(req.body)
    res.json(await updateSupplier(String(req.params.id), input, req.user?.id))
  }),
)
