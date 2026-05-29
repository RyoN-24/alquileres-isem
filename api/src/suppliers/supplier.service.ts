import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma'
import { HttpError } from '../http/errors'
import { localVisibleStorage } from '../storage/local-storage.service'
import type { createSupplierSchema, updateSupplierSchema } from './supplier.schemas'
import type { z } from 'zod'

type CreateSupplierInput = z.infer<typeof createSupplierSchema>
type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>

export async function listSuppliers(params: {
  q?: string
  status?: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'
  page: number
  pageSize: number
}) {
  const where: Prisma.SupplierWhereInput = {
    status: params.status,
    OR: params.q
      ? [
          { businessName: { contains: params.q } },
          { tradeName: { contains: params.q } },
          { ruc: { contains: params.q } },
        ]
      : undefined,
  }

  const [data, totalItems] = await prisma.$transaction([
    prisma.supplier.findMany({
      where,
      orderBy: { businessName: 'asc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.supplier.count({ where }),
  ])

  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / params.pageSize),
    },
  }
}

export async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      equipment: true,
      contracts: true,
      invoices: {
        orderBy: { dueDate: 'asc' },
      },
    },
  })

  if (!supplier) {
    throw new HttpError(404, 'SUPPLIER_NOT_FOUND', 'Proveedor no encontrado')
  }

  return supplier
}

export async function createSupplier(input: CreateSupplierInput, userId?: string) {
  const existing = await prisma.supplier.findUnique({ where: { ruc: input.ruc } })
  if (existing) {
    throw new HttpError(409, 'SUPPLIER_RUC_EXISTS', 'Ya existe un proveedor con ese RUC')
  }

  const folderPath = await localVisibleStorage.ensureSupplierFolders({
    ruc: input.ruc,
    businessName: input.businessName,
  })

  return prisma.supplier.create({
    data: {
      ...input,
      email: input.email || null,
      folderPath,
      auditLogs: undefined,
    },
  }).then(async (supplier) => {
    await prisma.auditLog.create({
      data: {
        userId,
        entityType: 'SUPPLIER',
        entityId: supplier.id,
        action: 'CREATE',
        metadata: { ruc: supplier.ruc, folderPath },
      },
    })

    return supplier
  })
}

export async function updateSupplier(id: string, input: UpdateSupplierInput, userId?: string) {
  await getSupplier(id)

  if (input.ruc) {
    const existing = await prisma.supplier.findFirst({
      where: { ruc: input.ruc, NOT: { id } },
    })
    if (existing) {
      throw new HttpError(409, 'SUPPLIER_RUC_EXISTS', 'Ya existe un proveedor con ese RUC')
    }
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...input,
      email: input.email === '' ? null : input.email,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      action: 'UPDATE',
      metadata: input,
    },
  })

  return supplier
}

export async function deleteSupplier(id: string, userId?: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      equipment: { select: { id: true } },
      contracts: { select: { id: true } },
      invoices: { select: { id: true } },
    },
  })

  if (!supplier) {
    throw new HttpError(404, 'SUPPLIER_NOT_FOUND', 'Proveedor no encontrado')
  }

  if (supplier.equipment.length > 0 || supplier.contracts.length > 0 || supplier.invoices.length > 0) {
    throw new HttpError(
      400,
      'SUPPLIER_HAS_RELATIONS',
      'No se puede eliminar el proveedor porque tiene equipos, contratos o facturas asociadas'
    )
  }

  await prisma.supplier.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'SUPPLIER',
      entityId: id,
      action: 'DELETE',
      metadata: { businessName: supplier.businessName, ruc: supplier.ruc },
    },
  })
}
