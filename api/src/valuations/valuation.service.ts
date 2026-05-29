import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { HttpError } from '../http/errors'
import { localVisibleStorage } from '../storage/local-storage.service'
import { createValuationSchema, updateValuationSchema } from './valuation.schemas'

type CreateValuationInput = z.infer<typeof createValuationSchema>
type UpdateValuationInput = z.infer<typeof updateValuationSchema>

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function optionalDate(value?: string) {
  return value ? parseDate(value) : undefined
}

async function getContractForValuation(contractId: string, equipmentId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      supplier: true,
      contractEquipment: true,
    },
  })

  if (!contract) {
    throw new HttpError(404, 'CONTRACT_NOT_FOUND', 'Contrato no encontrado')
  }

  const equipmentBelongsToContract = contract.contractEquipment.some(
    (item) => item.equipmentId === equipmentId,
  )

  if (!equipmentBelongsToContract) {
    throw new HttpError(
      422,
      'EQUIPMENT_NOT_IN_CONTRACT',
      'El equipo seleccionado no pertenece al contrato',
    )
  }

  return contract
}

export async function listValuations(params: {
  q?: string
  contractId?: string
  equipmentId?: string
  status?: 'BORRADOR' | 'PENDIENTE_FACTURA' | 'FACTURADA' | 'OBSERVADA' | 'PAGADA' | 'ANULADA'
  currency?: 'PEN' | 'USD'
  page: number
  pageSize: number
}) {
  const where: Prisma.ValuationWhereInput = {
    contractId: params.contractId,
    equipmentId: params.equipmentId,
    status: params.status,
    currency: params.currency,
    OR: params.q
      ? [
          { valuationNumber: { contains: params.q } },
          { contract: { contractNumber: { contains: params.q } } },
          { equipment: { description: { contains: params.q } } },
          { equipment: { plateOrInternalCode: { contains: params.q } } },
        ]
      : undefined,
  }

  const [data, totalItems] = await prisma.$transaction([
    prisma.valuation.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            billingMode: true,
            rate: true,
            supplier: { select: { id: true, businessName: true, ruc: true } },
          },
        },
        equipment: {
          select: { id: true, description: true, plateOrInternalCode: true },
        },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.valuation.count({ where }),
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

export async function getValuation(id: string) {
  const valuation = await prisma.valuation.findUnique({
    where: { id },
    include: {
      contract: { include: { supplier: true } },
      equipment: true,
      invoice: true,
    },
  })

  if (!valuation) {
    throw new HttpError(404, 'VALUATION_NOT_FOUND', 'Valorizacion no encontrada')
  }

  return valuation
}

export async function createValuation(input: CreateValuationInput, userId?: string) {
  if (input.periodStart && input.periodEnd && parseDate(input.periodStart) > parseDate(input.periodEnd)) {
    throw new HttpError(422, 'INVALID_PERIOD_RANGE', 'El periodo inicial no puede ser mayor al periodo final')
  }

  const contract = await getContractForValuation(input.contractId, input.equipmentId)

  const existing = await prisma.valuation.findFirst({
    where: {
      contractId: input.contractId,
      valuationNumber: input.valuationNumber,
    },
  })
  if (existing) {
    throw new HttpError(409, 'VALUATION_NUMBER_EXISTS', 'Ya existe esa valorizacion en el contrato')
  }

  const unitRate = Number(contract.rate)
  const calculatedAmount = input.quantity * unitRate
  const currency = input.currency ?? contract.currency

  const folderPath = await localVisibleStorage.ensureValuationFolders({
    ruc: contract.supplier.ruc,
    businessName: contract.supplier.businessName,
    contractNumber: contract.contractNumber,
    valuationNumber: input.valuationNumber,
  })

  const valuation = await prisma.valuation.create({
    data: {
      contractId: input.contractId,
      equipmentId: input.equipmentId,
      valuationNumber: input.valuationNumber,
      periodStart: optionalDate(input.periodStart),
      periodEnd: optionalDate(input.periodEnd),
      cutoffDate: parseDate(input.cutoffDate),
      quantity: input.quantity,
      unitRate,
      calculatedAmount,
      currency,
      status: input.status,
      notes: input.notes,
      folderPath,
    },
    include: {
      contract: {
        select: {
          id: true,
          contractNumber: true,
          billingMode: true,
          rate: true,
          supplier: { select: { id: true, businessName: true, ruc: true } },
        },
      },
      equipment: { select: { id: true, description: true, plateOrInternalCode: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'VALUATION',
      entityId: valuation.id,
      action: 'CREATE',
      metadata: {
        valuationNumber: valuation.valuationNumber,
        quantity: input.quantity,
        unitRate,
        calculatedAmount,
        currency,
        folderPath,
      },
    },
  })

  return valuation
}

export async function updateValuation(id: string, input: UpdateValuationInput, userId?: string) {
  const current = await getValuation(id)

  if (current.invoice) {
    throw new HttpError(
      422,
      'VALUATION_ALREADY_INVOICED',
      'No se puede editar una valorizacion que ya tiene factura',
    )
  }

  if (input.periodStart && input.periodEnd && parseDate(input.periodStart) > parseDate(input.periodEnd)) {
    throw new HttpError(422, 'INVALID_PERIOD_RANGE', 'El periodo inicial no puede ser mayor al periodo final')
  }

  const quantity = input.quantity ?? Number(current.quantity)
  const unitRate = Number(current.unitRate)
  const calculatedAmount = input.quantity ? quantity * unitRate : undefined

  const valuation = await prisma.valuation.update({
    where: { id },
    data: {
      valuationNumber: input.valuationNumber,
      periodStart: optionalDate(input.periodStart),
      periodEnd: optionalDate(input.periodEnd),
      cutoffDate: input.cutoffDate ? parseDate(input.cutoffDate) : undefined,
      quantity: input.quantity,
      calculatedAmount,
      currency: input.currency,
      status: input.status,
      notes: input.notes,
    },
    include: {
      contract: {
        select: {
          id: true,
          contractNumber: true,
          billingMode: true,
          rate: true,
          supplier: { select: { id: true, businessName: true, ruc: true } },
        },
      },
      equipment: { select: { id: true, description: true, plateOrInternalCode: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'VALUATION',
      entityId: valuation.id,
      action: 'UPDATE',
      metadata: input,
    },
  })

  return valuation
}

export async function deleteValuation(id: string, userId?: string) {
  const valuation = await getValuation(id)

  if (valuation.invoice) {
    throw new HttpError(
      422,
      'VALUATION_ALREADY_INVOICED',
      'No se puede eliminar una valorizacion que ya tiene factura asociada',
    )
  }

  await prisma.$transaction(async (tx) => {
    // Delete associated attachments
    await tx.attachment.deleteMany({ where: { entityType: 'VALUATION', entityId: id } })
    // Delete valuation
    await tx.valuation.delete({ where: { id } })
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'VALUATION',
      entityId: id,
      action: 'DELETE',
      metadata: { valuationNumber: valuation.valuationNumber },
    },
  })

  return { success: true }
}

