import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { HttpError } from '../http/errors'
import { localVisibleStorage } from '../storage/local-storage.service'
import { createEquipmentSchema, updateEquipmentSchema } from './equipment.schemas'
import {
  createEquipmentTypeSchema,
  createSiteSchema,
  updateEquipmentTypeSchema,
  updateSiteSchema,
} from './equipment.schemas'

type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>
type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>
type CreateEquipmentTypeInput = z.infer<typeof createEquipmentTypeSchema>
type UpdateEquipmentTypeInput = z.infer<typeof updateEquipmentTypeSchema>
type CreateSiteInput = z.infer<typeof createSiteSchema>
type UpdateSiteInput = z.infer<typeof updateSiteSchema>

export async function listEquipment(params: {
  q?: string
  supplierId?: string
  siteId?: string
  status?: 'DISPONIBLE' | 'EN_OBRA' | 'EN_MANTENIMIENTO' | 'RETIRADO' | 'FINALIZADO'
  page: number
  pageSize: number
}) {
  const where: Prisma.EquipmentWhereInput = {
    supplierId: params.supplierId,
    currentSiteId: params.siteId,
    status: params.status,
    OR: params.q
      ? [
          { description: { contains: params.q } },
          { brand: { contains: params.q } },
          { model: { contains: params.q } },
          { plateOrInternalCode: { contains: params.q } },
        ]
      : undefined,
  }

  const [data, totalItems] = await prisma.$transaction([
    prisma.equipment.findMany({
      where,
      include: {
        supplier: { select: { id: true, businessName: true, ruc: true } },
        equipmentType: { select: { id: true, name: true } },
        currentSite: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.equipment.count({ where }),
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

export async function listEquipmentTypes() {
  return prisma.equipmentType.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function listSites() {
  return prisma.site.findMany({
    orderBy: { name: 'asc' },
  })
}

async function getDefaultCompanyId() {
  const company = await prisma.company.findFirst({ select: { id: true } })
  if (!company) {
    throw new HttpError(500, 'COMPANY_NOT_CONFIGURED', 'No se encontro la empresa configurada')
  }
  return company.id
}

export async function createEquipmentType(input: CreateEquipmentTypeInput, userId?: string) {
  const existing = await prisma.equipmentType.findUnique({ where: { name: input.name } })
  if (existing) {
    if (existing.isActive) {
      throw new HttpError(409, 'EQUIPMENT_TYPE_EXISTS', 'Ya existe un tipo de equipo con ese nombre')
    }
    const reactivated = await prisma.equipmentType.update({
      where: { id: existing.id },
      data: { isActive: true },
    })
    await prisma.auditLog.create({
      data: {
        userId,
        entityType: 'EQUIPMENT_TYPE',
        entityId: reactivated.id,
        action: 'REACTIVATE',
        metadata: input,
      },
    })
    return reactivated
  }

  const equipmentType = await prisma.equipmentType.create({ data: input })
  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'EQUIPMENT_TYPE',
      entityId: equipmentType.id,
      action: 'CREATE',
      metadata: input,
    },
  })
  return equipmentType
}

export async function updateEquipmentType(id: string, input: UpdateEquipmentTypeInput, userId?: string) {
  const current = await prisma.equipmentType.findUnique({ where: { id } })
  if (!current) {
    throw new HttpError(404, 'EQUIPMENT_TYPE_NOT_FOUND', 'Tipo de equipo no encontrado')
  }

  if (input.name) {
    const existing = await prisma.equipmentType.findFirst({
      where: { name: input.name, NOT: { id } },
    })
    if (existing) {
      throw new HttpError(409, 'EQUIPMENT_TYPE_EXISTS', 'Ya existe un tipo de equipo con ese nombre')
    }
  }

  const equipmentType = await prisma.equipmentType.update({
    where: { id },
    data: input,
  })
  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'EQUIPMENT_TYPE',
      entityId: equipmentType.id,
      action: 'UPDATE',
      metadata: input,
    },
  })
  return equipmentType
}

export async function createSite(input: CreateSiteInput, userId?: string) {
  const companyId = await getDefaultCompanyId()
  const existing = await prisma.site.findFirst({
    where: { companyId, name: input.name },
  })
  if (existing) {
    if (existing.isActive) {
      throw new HttpError(409, 'SITE_EXISTS', 'Ya existe una sede con ese nombre')
    }
    const reactivated = await prisma.site.update({
      where: { id: existing.id },
      data: { isActive: true, address: input.address ?? existing.address },
    })
    await prisma.auditLog.create({
      data: {
        userId,
        entityType: 'SITE',
        entityId: reactivated.id,
        action: 'REACTIVATE',
        metadata: input,
      },
    })
    return reactivated
  }

  const site = await prisma.site.create({
    data: {
      companyId,
      name: input.name,
      address: input.address,
    },
  })
  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'SITE',
      entityId: site.id,
      action: 'CREATE',
      metadata: input,
    },
  })
  return site
}

export async function updateSite(id: string, input: UpdateSiteInput, userId?: string) {
  const current = await prisma.site.findUnique({ where: { id } })
  if (!current) {
    throw new HttpError(404, 'SITE_NOT_FOUND', 'Sede no encontrada')
  }

  if (input.name) {
    const existing = await prisma.site.findFirst({
      where: { companyId: current.companyId, name: input.name, NOT: { id } },
    })
    if (existing) {
      throw new HttpError(409, 'SITE_EXISTS', 'Ya existe una sede con ese nombre')
    }
  }

  const site = await prisma.site.update({
    where: { id },
    data: input,
  })
  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'SITE',
      entityId: site.id,
      action: 'UPDATE',
      metadata: input,
    },
  })
  return site
}

export async function getEquipment(id: string) {
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      supplier: true,
      equipmentType: true,
      currentSite: true,
      valuations: true,
      contractEquipment: { include: { contract: true } },
    },
  })

  if (!equipment) {
    throw new HttpError(404, 'EQUIPMENT_NOT_FOUND', 'Equipo no encontrado')
  }

  return equipment
}

export async function createEquipment(input: CreateEquipmentInput, userId?: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } })
  if (!supplier) {
    throw new HttpError(404, 'SUPPLIER_NOT_FOUND', 'Proveedor no encontrado')
  }

  const equipmentType = await prisma.equipmentType.findUnique({
    where: { id: input.equipmentTypeId },
  })
  if (!equipmentType) {
    throw new HttpError(404, 'EQUIPMENT_TYPE_NOT_FOUND', 'Tipo de equipo no encontrado')
  }

  if (input.currentSiteId) {
    const site = await prisma.site.findUnique({ where: { id: input.currentSiteId } })
    if (!site) {
      throw new HttpError(404, 'SITE_NOT_FOUND', 'Sede no encontrada')
    }
  }

  if (input.status === 'EN_OBRA' && !input.currentSiteId) {
    throw new HttpError(422, 'SITE_REQUIRED', 'La sede es obligatoria si el equipo esta en obra')
  }

  if (input.plateOrInternalCode) {
    const existing = await prisma.equipment.findUnique({
      where: { plateOrInternalCode: input.plateOrInternalCode },
    })
    if (existing) {
      throw new HttpError(409, 'EQUIPMENT_CODE_EXISTS', 'Ya existe un equipo con esa placa o codigo')
    }
  }

  const folderPath = await localVisibleStorage.ensureEquipmentFolders({
    ruc: supplier.ruc,
    businessName: supplier.businessName,
    code: input.plateOrInternalCode ?? input.description,
  })

  const equipment = await prisma.equipment.create({
    data: {
      ...input,
      folderPath,
    },
    include: {
      supplier: { select: { id: true, businessName: true, ruc: true } },
      equipmentType: { select: { id: true, name: true } },
      currentSite: { select: { id: true, name: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'EQUIPMENT',
      entityId: equipment.id,
      action: 'CREATE',
      metadata: { code: equipment.plateOrInternalCode, folderPath },
    },
  })

  return equipment
}

export async function updateEquipment(id: string, input: UpdateEquipmentInput, userId?: string) {
  await getEquipment(id)

  if (input.status === 'EN_OBRA' && !input.currentSiteId) {
    throw new HttpError(422, 'SITE_REQUIRED', 'La sede es obligatoria si el equipo esta en obra')
  }

  if (input.plateOrInternalCode) {
    const existing = await prisma.equipment.findFirst({
      where: { plateOrInternalCode: input.plateOrInternalCode, NOT: { id } },
    })
    if (existing) {
      throw new HttpError(409, 'EQUIPMENT_CODE_EXISTS', 'Ya existe un equipo con esa placa o codigo')
    }
  }

  const equipment = await prisma.equipment.update({
    where: { id },
    data: input,
    include: {
      supplier: { select: { id: true, businessName: true, ruc: true } },
      equipmentType: { select: { id: true, name: true } },
      currentSite: { select: { id: true, name: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'EQUIPMENT',
      entityId: equipment.id,
      action: 'UPDATE',
      metadata: input,
    },
  })

  return equipment
}
