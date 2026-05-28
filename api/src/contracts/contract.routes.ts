import { Router } from 'express'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import {
  createContract,
  generateContractPdf,
  getContract,
  listContracts,
  updateContract,
} from './contract.service'
import {
  createContractSchema,
  listContractsQuerySchema,
  updateContractSchema,
} from './contract.schemas'

export const contractRouter = Router()

contractRouter.use(requireAuth)

contractRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listContractsQuerySchema.parse(req.query)
    res.json(await listContracts(query))
  }),
)

contractRouter.post(
  '/',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = createContractSchema.parse(req.body)
    res.status(201).json(await createContract(input, req.user?.id))
  }),
)

contractRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getContract(String(req.params.id)))
  }),
)

contractRouter.patch(
  '/:id',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    const input = updateContractSchema.parse(req.body)
    res.json(await updateContract(String(req.params.id), input, req.user?.id))
  }),
)

contractRouter.post(
  '/:id/generate-pdf',
  requireRole('ADMIN', 'OPERATIVO'),
  asyncHandler(async (req, res) => {
    res.status(201).json(await generateContractPdf(String(req.params.id), req.user?.id))
  }),
)
