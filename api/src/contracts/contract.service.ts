import path from 'node:path'
import { Prisma } from '@prisma/client'
import PDFDocument from 'pdfkit'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { HttpError } from '../http/errors'
import { getContractTemplate } from '../settings/settings.service'
import { documentStorage } from '../storage/document-storage.service'
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

function formatMoney(value: unknown, currency: string) {
  const amount = Number(value).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currency === 'PEN' ? `S/ ${amount}` : `USD ${amount}`
}

function billingModeLabel(value: string) {
  return value === 'HORA' ? 'hora' : 'día'
}

function spanishDisplayLabel(value: string) {
  return value.replace(/\bVehiculo\b/g, 'Vehículo')
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return values[key] ?? ''
  })
}

type ContractPdfEquipment = {
  type: string
  description: string
  code: string
  brandModel: string
}

type ContractPdfContext = {
  title: string
  contractNumber: string
  issueDate: string
  companyName: string
  companyRuc: string
  supplierName: string
  supplierRuc: string
  siteName: string
  startDate: string
  endDate: string
  billingMode: string
  rate: string
  currency: string
  invoiceDueDays: string
  equipment: ContractPdfEquipment[]
}

function ensurePdfSpace(doc: PDFKit.PDFDocument, requiredHeight: number) {
  if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage()
  }
  doc.x = doc.page.margins.left
}

function resetPdfCursor(doc: PDFKit.PDFDocument, y = doc.y) {
  doc.x = doc.page.margins.left
  doc.y = y
}

function pdfContentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensurePdfSpace(doc, 32)
  resetPdfCursor(doc)
  doc.moveDown(0.6)
  resetPdfCursor(doc)
  const titleY = doc.y
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#0f2742')
    .text(title.toUpperCase(), doc.page.margins.left, titleY, {
      characterSpacing: 0.2,
      width: pdfContentWidth(doc),
    })
  doc
    .moveTo(doc.page.margins.left, doc.y + 4)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
    .strokeColor('#d9e2ea')
    .lineWidth(1)
    .stroke()
  doc.moveDown(0.8)
  resetPdfCursor(doc)
}

function drawKeyValueGrid(doc: PDFKit.PDFDocument, items: Array<{ label: string; value: string }>, columns = 2) {
  const startX = doc.page.margins.left
  const pageWidth = pdfContentWidth(doc)
  const gap = 10
  const width = (pageWidth - gap * (columns - 1)) / columns
  const rowHeight = 44

  for (let index = 0; index < items.length; index += columns) {
    ensurePdfSpace(doc, rowHeight + 8)
    const rowY = doc.y

    items.slice(index, index + columns).forEach((item, columnIndex) => {
      const x = startX + columnIndex * (width + gap)
      doc.roundedRect(x, rowY, width, rowHeight, 6).fillAndStroke('#f7fafc', '#d9e2ea')
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#53667a')
        .text(item.label.toUpperCase(), x + 10, rowY + 9, { width: width - 20 })
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#142033')
        .text(item.value || '-', x + 10, rowY + 23, { width: width - 20 })
    })

    doc.y = rowY + rowHeight + 8
    resetPdfCursor(doc)
  }
}

function drawEquipmentTable(doc: PDFKit.PDFDocument, equipment: ContractPdfEquipment[]) {
  const startX = doc.page.margins.left
  const pageWidth = pdfContentWidth(doc)
  const widths = [28, 112, 190, 78, pageWidth - 408]
  const headers = ['#', 'Tipo', 'Descripción', 'Placa/Código', 'Marca/Modelo']
  const rowHeight = 25

  ensurePdfSpace(doc, rowHeight * 2)
  const headerY = doc.y
  doc.rect(startX, headerY, pageWidth, rowHeight).fill('#0f2742')
  let x = startX
  headers.forEach((header, index) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff').text(header, x + 6, headerY + 8, {
      width: widths[index] - 10,
    })
    x += widths[index]
  })
  doc.y = headerY + rowHeight

  const rows = equipment.length > 0 ? equipment : [{ type: '-', description: 'Sin equipos registrados', code: '-', brandModel: '-' }]
  rows.forEach((item, index) => {
    ensurePdfSpace(doc, rowHeight + 6)
    const y = doc.y
    const fill = index % 2 === 0 ? '#ffffff' : '#f7fafc'
    doc.rect(startX, y, pageWidth, rowHeight).fillAndStroke(fill, '#e5edf3')
    x = startX
    const cells = [String(index + 1), item.type, item.description, item.code, item.brandModel]
    cells.forEach((cell, cellIndex) => {
      doc.font('Helvetica').fontSize(8).fillColor('#24364a').text(cell || '-', x + 6, y + 7, {
        width: widths[cellIndex] - 10,
        height: rowHeight - 8,
        ellipsis: true,
      })
      x += widths[cellIndex]
    })
    doc.y = y + rowHeight
    resetPdfCursor(doc)
  })
  doc.moveDown(0.6)
  resetPdfCursor(doc)
}

function getClauseBlocks(body: string) {
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const blocks: Array<{ title: string; text: string[] }> = []
  let current: { title: string; text: string[] } | null = null

  for (const line of lines) {
    if (/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA|D[ÉE]CIMA\s+PRIMERA):/i.test(line)) {
      current = { title: line, text: [] }
      blocks.push(current)
      continue
    }

    if (!current) continue
    if (/^(CONTRATO DE|EL CONTRATANTE:|EL PROVEEDOR:|CONTRATO:)/i.test(line)) continue
    current.text.push(line)
  }

  return blocks
}

function drawClauses(doc: PDFKit.PDFDocument, body: string) {
  const clauses = getClauseBlocks(body)
  for (const clause of clauses) {
    ensurePdfSpace(doc, 70)
    resetPdfCursor(doc)
    doc
      .font('Helvetica-Bold')
      .fontSize(9.2)
      .fillColor('#0f2742')
      .text(clause.title, doc.page.margins.left, doc.y, { width: pdfContentWidth(doc) })
    doc.moveDown(0.25)
    resetPdfCursor(doc)
    doc
      .font('Helvetica')
      .fontSize(8.8)
      .fillColor('#26384c')
      .text(clause.text.join('\n'), doc.page.margins.left, doc.y, {
        width: pdfContentWidth(doc),
        align: 'justify',
        lineGap: 3,
      })
    doc.moveDown(0.7)
    resetPdfCursor(doc)
  }
}

function drawSignatures(doc: PDFKit.PDFDocument, context: ContractPdfContext) {
  ensurePdfSpace(doc, 110)
  doc.moveDown(1)
  const startX = doc.page.margins.left
  const pageWidth = pdfContentWidth(doc)
  const boxWidth = (pageWidth - 28) / 2
  const y = doc.y + 24

  ;[
    { title: 'EL CONTRATANTE', name: context.companyName, ruc: `RUC ${context.companyRuc}` },
    { title: 'EL PROVEEDOR', name: context.supplierName, ruc: `RUC ${context.supplierRuc}` },
  ].forEach((party, index) => {
    const x = startX + index * (boxWidth + 28)
    doc.moveTo(x, y).lineTo(x + boxWidth, y).strokeColor('#66788a').lineWidth(1).stroke()
    doc.font('Helvetica-Bold').fontSize(8.2).fillColor('#142033').text(party.title, x, y + 12, {
      width: boxWidth,
      align: 'center',
    })
    doc.font('Helvetica').fontSize(7.8).fillColor('#53667a').text(party.name, x, y + 26, {
      width: boxWidth,
      align: 'center',
    })
    doc.text(party.ruc, x, y + 39, { width: boxWidth, align: 'center' })
  })

  doc.y = y + 62
  resetPdfCursor(doc)
}

async function buildPdfBuffer(context: ContractPdfContext, body: string) {
  const doc = new PDFDocument({ margin: 44, size: 'A4', bufferPages: true })
  const chunks: Buffer[] = []

  doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))

  doc.rect(0, 0, doc.page.width, 96).fill('#0f2742')
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#9fd3ff')
    .text(context.companyName, 44, 30, { width: 330 })
  doc.font('Helvetica').fontSize(8).fillColor('#dce8f3').text(`RUC ${context.companyRuc}`, 44, 44)
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#ffffff')
    .text(context.title, 44, 60, { width: 420 })
  doc
    .roundedRect(doc.page.width - 176, 30, 132, 42, 6)
    .fillAndStroke('#ffffff', '#ffffff')
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#53667a')
    .text('NRO. CONTRATO', doc.page.width - 164, 40, { width: 108, align: 'center' })
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#0f2742')
    .text(context.contractNumber, doc.page.width - 164, 53, { width: 108, align: 'center' })

  doc.y = 122
  resetPdfCursor(doc, 122)
  drawSectionTitle(doc, 'Partes contratantes')
  drawKeyValueGrid(doc, [
    { label: 'Contratante', value: `${context.companyName} - RUC ${context.companyRuc}` },
    { label: 'Proveedor', value: `${context.supplierName} - RUC ${context.supplierRuc}` },
  ])

  drawSectionTitle(doc, 'Resumen operativo y económico')
  drawKeyValueGrid(doc, [
    { label: 'Sede u obra', value: context.siteName },
    { label: 'Vigencia', value: `${context.startDate} al ${context.endDate}` },
    { label: 'Modalidad', value: `Por ${context.billingMode}` },
    { label: 'Tarifa base', value: context.rate },
    { label: 'Moneda', value: context.currency },
    { label: 'Vencimiento de facturas', value: `${context.invoiceDueDays} días calendario` },
  ], 3)

  drawSectionTitle(doc, 'Equipos incluidos')
  drawEquipmentTable(doc, context.equipment)

  drawSectionTitle(doc, 'Cláusulas contractuales')
  drawClauses(doc, body)
  drawSignatures(doc, context)

  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i)
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#7a8a9a')
      .text(
        `Contrato ${context.contractNumber} | Generado el ${context.issueDate} | Página ${i + 1} de ${range.count}`,
        doc.page.margins.left,
        doc.page.height - 30,
        { align: 'center' },
      )
  }
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

  const folderPath = await documentStorage.ensureContractFolders({
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
  const equipmentRows = contract.contractEquipment.map((item) => {
    const equipment = item.equipment
    return {
      type: spanishDisplayLabel(equipment.equipmentType.name),
      description: equipment.description,
      code: equipment.plateOrInternalCode ?? '-',
      brandModel: [equipment.brand, equipment.model, equipment.year ? String(equipment.year) : ''].filter(Boolean).join(' '),
    }
  })
  const equipmentList =
    equipmentRows
      .map((equipment, index) => {
        const code = equipment.code && equipment.code !== '-' ? ` - ${equipment.code}` : ''
        const brandModel = equipment.brandModel ? ` - ${equipment.brandModel}` : ''
        return `${index + 1}. ${equipment.type}: ${equipment.description}${code}${brandModel}`
      })
      .join('\n') || 'Sin equipos registrados'

  const startDate = formatDate(contract.startDate)
  const endDate = formatDate(contract.endDate)
  const billingMode = billingModeLabel(contract.billingMode)
  const rate = formatMoney(contract.rate, contract.currency)

  const rendered = renderTemplate(template, {
    contractNumber: contract.contractNumber,
    companyName: 'INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL',
    companyRuc: '20220199968',
    supplierName: contract.supplier.businessName,
    supplierRuc: contract.supplier.ruc,
    siteName: contract.site.name,
    startDate,
    endDate,
    billingMode,
    rate,
    currency: contract.currency,
    invoiceDueDays: String(contract.invoiceDueDays),
    equipmentList,
    notes: contract.notes?.trim() || 'Sin observaciones registradas.',
  })

  const pdf = await buildPdfBuffer(
    {
      title: 'Contrato de servicio de alquiler',
      contractNumber: contract.contractNumber,
      issueDate: formatDate(new Date()),
      companyName: 'INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL',
      companyRuc: '20220199968',
      supplierName: contract.supplier.businessName,
      supplierRuc: contract.supplier.ruc,
      siteName: contract.site.name,
      startDate,
      endDate,
      billingMode,
      rate,
      currency: contract.currency,
      invoiceDueDays: String(contract.invoiceDueDays),
      equipment: equipmentRows,
    },
    rendered,
  )
  const destinationFolder = path.join(contract.folderPath, 'contrato')
  const generatedAt = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${normalizeFolderName(`contrato-generado-${contract.contractNumber}`)}-${generatedAt}.pdf`
  const storagePath = await documentStorage.saveBuffer({
    buffer: pdf,
    destinationFolder,
    fileName,
    mimeType: 'application/pdf',
  })

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

export async function deleteContract(id: string, userId?: string) {
  const contract = await getContract(id)

  await prisma.$transaction(async (tx) => {
    // Delete contract equipment first
    await tx.contractEquipment.deleteMany({ where: { contractId: id } })
    // Delete associated attachments
    await tx.attachment.deleteMany({ where: { entityType: 'CONTRACT', entityId: id } })
    // Delete the contract itself
    await tx.contract.delete({ where: { id } })
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'CONTRACT',
      entityId: id,
      action: 'DELETE',
      metadata: { contractNumber: contract.contractNumber },
    },
  })

  return { success: true }
}
