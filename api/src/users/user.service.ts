import { z } from 'zod'
import { prisma } from '../db/prisma'
import { HttpError } from '../http/errors'
import { hashPassword } from '../auth/password'
import { createUserSchema, updateUserSchema } from './user.schemas'

type CreateUserInput = z.infer<typeof createUserSchema>
type UpdateUserInput = z.infer<typeof updateUserSchema>

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
}

async function getDefaultCompanyId() {
  const company = await prisma.company.findFirst({ select: { id: true } })
  if (!company) {
    throw new HttpError(500, 'COMPANY_NOT_CONFIGURED', 'No se encontro la empresa configurada')
  }
  return company.id
}

export async function listUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })
}

export async function createUser(input: CreateUserInput, currentUserId?: string) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new HttpError(409, 'USER_EMAIL_EXISTS', 'Ya existe un usuario con ese correo')
  }

  const user = await prisma.user.create({
    data: {
      companyId: await getDefaultCompanyId(),
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
    select: userSelect,
  })

  await prisma.auditLog.create({
    data: {
      userId: currentUserId,
      entityType: 'USER',
      entityId: user.id,
      action: 'CREATE',
      metadata: { email: user.email, role: user.role },
    },
  })

  return user
}

export async function updateUser(id: string, input: UpdateUserInput, currentUserId?: string) {
  const current = await prisma.user.findUnique({ where: { id } })
  if (!current) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'Usuario no encontrado')
  }

  if (id === currentUserId && input.isActive === false) {
    throw new HttpError(422, 'CANNOT_DEACTIVATE_SELF', 'No puedes desactivar tu propio usuario')
  }

  if (input.email) {
    const existing = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id } },
    })
    if (existing) {
      throw new HttpError(409, 'USER_EMAIL_EXISTS', 'Ya existe un usuario con ese correo')
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      isActive: input.isActive,
      passwordHash: input.password ? await hashPassword(input.password) : undefined,
    },
    select: userSelect,
  })

  await prisma.auditLog.create({
    data: {
      userId: currentUserId,
      entityType: 'USER',
      entityId: user.id,
      action: 'UPDATE',
      metadata: {
        name: input.name,
        email: input.email,
        role: input.role,
        isActive: input.isActive,
        passwordChanged: Boolean(input.password),
      },
    },
  })

  return user
}
