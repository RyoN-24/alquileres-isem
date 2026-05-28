import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../db/prisma'
import { HttpError } from '../http/errors'
import { verifyAuthToken } from './jwt'

export type AuthenticatedUser = {
  id: string
  role: 'ADMIN' | 'OPERATIVO'
  email: string
  name: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

  if (!token) {
    return next(new HttpError(401, 'UNAUTHENTICATED', 'Debe iniciar sesion'))
  }

  try {
    const payload = verifyAuthToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, email: true, name: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return next(new HttpError(401, 'UNAUTHENTICATED', 'Sesion invalida'))
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    }
    return next()
  } catch {
    return next(new HttpError(401, 'UNAUTHENTICATED', 'Sesion invalida'))
  }
}

export function requireRole(...roles: Array<'ADMIN' | 'OPERATIVO'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'FORBIDDEN', 'No tiene permisos para esta accion'))
    }

    return next()
  }
}

