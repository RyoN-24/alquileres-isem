import fs from 'node:fs/promises'
import path from 'node:path'
import { Prisma } from '@prisma/client'
import PDFDocument from 'pdfkit'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { HttpError } from '../http/errors'
import { getContractTemplate } from '../settings/settings.service'
import { localVisibleStorage } from '../storage/local-storage.service'
import { normalizeFolderName } from '../storage/path-utils'
import { createContractSchema, updateContractSchema } from './contract.schemas'

type CreateContractInput = z.infer<typeof createContractSchema>
type UpdateContractInput = z.infer<typeof updateContractSchema>

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function formatCurrency(value: unknown) {
  return Number(value).toFixed(2)
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return values[key] ?? ''
  })
}

async function buildPdfBuffer(title: string, body: string) {
  const doc = new PDFDocument({ margin: 48, size: 'A4' })
  const chunks: Buffer[] = []

  doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
  doc.fontSize(15).text(title, { align: 'center' })
  doc.moveDown()
  doc.fontSize(10).text(body, {
    align: 'justify',
    lineGap: 4,
  })
  doc.end()

  await new Promise<void>((resolve) => {
    doc.on('end', resolve)
  })

  return Buffer.concat(chunks)
}

async function validateContractReferences(input: {
  supplierId: string
  siteId: string
  equipmentIds: string[]
  startDate: string
  endDate: string
}) {
  if (parseDate(input.startDate) > parseDate(input.endDate)) {
    throw new HttpError(422, 'INVALID_DATE_RANGE', 'La fecha de inicio no puede ser mayor a la fecha de fin')
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } })
  if (!supplier) {
    throw new HttpError(404, 'SUPPLIER_NOT_FOUND', 'Proveedor no encontrado')
  }

  const site = await prisma.site.findUnique({ where: { id: input.siteId } })
  if (!site) {
    throw new HttpError(404, 'SITE_NOT_FOUND', 'Sede no encontrada')
  }

  const equipment = await prisma.equipment.findMany({
    where: { id: { in: input.equipmentIds } },
  })

  if (equipment.length !== input.equipmentIds.length) {
    throw new HttpError(404, 'EQUIPMENT_NOT_FOUND', 'Uno o mas equipos no existen')
  }

  const foreignEquipment = equipment.find((item) => item.supplierId !== input.supplierId)
  if (foreignEquipment) {
    throw new HttpError(
      422,
      'EQUIPMENT_SUPPLIER_MISMATCH',
      'Todos los equipos del contrato deben pertenecer al proveedor seleccionado',
    )
  }

  return { supplier, site, equipment }
}

export async function listContracts(params: {
  q?: string
  supplierId?: string
  siteId?: string
  status?: 'BORRADOR' | 'ACTIVO' | 'POR_VENCER' | 'FINALIZADO' | 'CANCELADO'
  currency?: 'PEN' | 'USD'
  page: number
  pageSize: number
}) {
  const where: Prisma.ContractWhereInput = {
    supplierId: params.supplierId,
    siteId: params.siteId,
    status: params.status,
    currency: params.currency,
    OR: params.q
      ? [
          { contractNumber: { contains: params.q } },
          { supplier: { businessName: { contains: params.q } } },
        ]
      : undefined,
  }

  const [data, totalItems] = await prisma.$transaction([
    prisma.contract.findMany({
      where,
      include: {
        supplier: { select: { id: true, businessName: true, ruc: true } },
        site: { select: { id: true, name: true } },
        contractEquipment: {
          include: {
            equipment: { select: { id: true, description: true, plateOrInternalCode: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.contract.count({ where }),
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

export async function getContract(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      supplier: true,
      site: true,
      contractEquipment: { include: { equipment: true } },
      valuations: true,
      invoices: true,
    },
  })

  if (!contract) {
    throw new HttpError(404, 'CONTRACT_NOT_FOUND', 'Contrato no encontrado')
  }

  return contract
}

export async function createContract(input: CreateContractInput, userId?: string) {
  const { supplier } = await validateContractReferences(input)

  const existing = await prisma.contract.findUnique({
    where: { contractNumber: input.contractNumber },
  })
  if (existing) {
    throw new HttpError(409, 'CONTRACT_NUMBER_EXISTS', 'Ya existe un contrato con ese numero')
  }

  const folderPath = await localVisibleStorage.ensureContractFolders({
    ruc: supplier.ruc,
    businessName: supplier.businessName,
    contractNumber: input.contractNumber,
  })

  const contract = await prisma.contract.create({
    data: {
      supplierId: input.supplierId,
      siteId: input.siteId,
      contractNumber: input.contractNumber,
      startDate: parseDate(input.startDate),
      endDate: parseDate(input.endDate),
      billingMode: input.billingMode,
      rate: input.rate,
      currency: input.currency,
      invoiceDueDays: input.invoiceDueDays,
      notes: input.notes,
      status: input.status,
      folderPath,
      contractEquipment: {
        create: input.equipmentIds.map((equipmentId) => ({ equipmentId })),
      },
    },
    include: {
      supplier: { select: { id: true, businessName: true, ruc: true } },
      site: { select: { id: true, name: true } },
      contractEquipment: {
        include: {
          equipment: { select: { id: true, description: true, plateOrInternalCode: true } },
        },
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'CONTRACT',
      entityId: contract.id,
      action: 'CREATE',
      metadata: { contractNumber: contract.contractNumber, folderPath },
    },
  })

  return contract
}

export async function updateContract(id: string, input: UpdateContractInput, userId?: string) {
  const current = await getContract(id)
  const equipmentIds =
    input.equipmentIds ?? current.contractEquipment.map((item) => item.equipmentId)
  const supplierId = current.supplierId
  const siteId = input.siteId ?? current.siteId
  const startDate = input.startDate ?? current.startDate.toISOString().slice(0, 10)
  const endDate = input.endDate ?? current.endDate.toISOString().slice(0, 10)

  await validateContractReferences({ supplierId, siteId, equipmentIds, startDate, endDate })

  if (input.contractNumber && input.contractNumber !== current.contractNumber) {
    const existing = await prisma.contract.findUnique({
      where: { contractNumber: input.contractNumber },
    })
    if (existing) {
      throw new HttpError(409, 'CONTRACT_NUMBER_EXISTS', 'Ya existe un contrato con ese numero')
    }
  }

  const contract = await prisma.$transaction(async (tx) => {
    if (input.equipmentIds) {
      await tx.contractEquipment.deleteMany({ where: { contractId: id } })
      await tx.contractEquipment.createMany({
        data: input.equipmentIds.map((equipmentId) => ({ contractId: id, equipmentId })),
      })
    }

    return tx.contract.update({
      where: { id },
      data: {
        siteId: input.siteId,
        contractNumber: input.contractNumber,
        startDate: input.startDate ? parseDate(input.startDate) : undefined,
        endDate: input.endDate ? parseDate(input.endDate) : undefined,
        billingMode: input.billingMode,
        rate: input.rate,
        currency: input.currency,
        invoiceDueDays: input.invoiceDueDays,
        notes: input.notes,
        status: input.status,
      },
      include: {
        supplier: { select: { id: true, businessName: true, ruc: true } },
        site: { select: { id: true, name: true } },
        contractEquipment: {
          include: {
            equipment: { select: { id: true, description: true, plateOrInternalCode: true } },
          },
        },
      },
    })
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'CONTRACT',
      entityId: contract.id,
      action: 'UPDATE',
      metadata: input,
    },
  })

  return contract
}

export async function generateContractPdf(id: string, userId?: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      supplier: true,
      site: true,
      contractEquipment: {
        include: {
          equipment: {
            include: {
              equipmentType: true,
            },
          },
        },
      },
    },
  })

  if (!contract) {
    throw new HttpError(404, 'CONTRACT_NOT_FOUND', 'Contrato no encontrado')
  }

  if (!contract.folderPath) {
    throw new HttpError(404, 'CONTRACT_FOLDER_NOT_FOUND', 'No se encontro la carpeta del contrato')
  }

  const { template } = await getContractTemplate()
  const equipmentList =
    contract.contractEquipment
      .map((item, index) => {
        const equipment = item.equipment
        const code = equipment.plateOrInternalCode ? ` - ${equipment.plateOrInternalCode}` : ''
        const brand = equipment.brand ? ` - ${equipment.brand}` : ''
        const model = equipment.model ? ` ${equipment.model}` : ''
        return `${index + 1}. ${equipment.equipmentType.name}: ${equipment.description}${code}${brand}${model}`
      })
      .join('\n') || 'Sin equipos registrados'

  const rendered = renderTemplate(template, {
    contractNumber: contract.contractNumber,
    companyName: 'INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL',
    companyRuc: '20220199968',
    supplierName: contract.supplier.businessName,
    supplierRuc: contract.supplier.ruc,
    siteName: contract.site.name,
    startDate: formatDate(contract.startDate),
    endDate: formatDate(contract.endDate),
    billingMode: contract.billingMode === 'HORA' ? 'hora' : 'dia',
    rate: formatCurrency(contract.rate),
    currency: contract.currency,
    invoiceDueDays: String(contract.invoiceDueDays),
    equipmentList,
    notes: contract.notes?.trim() || 'Sin observaciones registradas.',
  })

  const pdf = await buildPdfBuffer(`Contrato ${contract.contractNumber}`, rendered)
  const destinationFolder = path.join(contract.folderPath, 'contrato')
  await fs.mkdir(destinationFolder, { recursive: true })
  const generatedAt = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${normalizeFolderName(`contrato-generado-${contract.contractNumber}`)}-${generatedAt}.pdf`
  const storagePath = path.join(destinationFolder, fileName)
  await fs.writeFile(storagePath, pdf)

  const attachment = await prisma.attachment.create({
    data: {
      entityType: 'CONTRACT',
      entityId: contract.id,
      supplierId: contract.supplierId,
      fileName,
      fileType: 'application/pdf',
      fileSizeBytes: pdf.byteLength,
      storagePath,
      category: 'CONTRATO_GENERADO',
      uploadedById: userId,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'CONTRACT',
      entityId: contract.id,
      action: 'GENERATE_CONTRACT_PDF',
      metadata: { fileName, storagePath },
    },
  })

  return attachment
}
