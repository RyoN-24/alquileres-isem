import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { asyncHandler } from '../http/async-handler'
import { HttpError } from '../http/errors'
import { signAuthToken } from './jwt'
import { requireAuth } from './middleware'
import { verifyPassword } from './password'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authRouter = Router()

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body)
    const email = input.email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.isActive) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Correo o contrasena incorrectos')
    }

    const passwordOk = await verifyPassword(input.password, user.passwordHash)
    if (!passwordOk) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Correo o contrasena incorrectos')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    res.json({
      token: signAuthToken({ sub: user.id, role: user.role }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user })
  }),
)
