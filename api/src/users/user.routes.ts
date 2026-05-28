import { Router } from 'express'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import { createUserSchema, updateUserSchema } from './user.schemas'
import { createUser, listUsers, updateUser } from './user.service'

export const userRouter = Router()

userRouter.use(requireAuth)
userRouter.use(requireRole('ADMIN'))

userRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ data: await listUsers() })
  }),
)

userRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createUserSchema.parse(req.body)
    res.status(201).json(await createUser(input, req.user?.id))
  }),
)

userRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = updateUserSchema.parse(req.body)
    res.json(await updateUser(String(req.params.id), input, req.user?.id))
  }),
)
