import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import ExcelJS from 'exceljs'
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

const SERVICE_ORDER_TEMPLATE_PATH = path.resolve(process.cwd(), 'src/templates/orden-servicio-template.xlsx')
const execFileAsync = promisify(execFile)

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

function formatShortDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function serviceOrderDays(startDate: Date, endDate: Date) {
  const msPerDay = 24 * 60 * 60 * 1000
  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
  const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())
  return Math.max(1, Math.floor((end - start) / msPerDay))
}

function supplierShortName(value: string) {
  return normalizeFolderName(value)
    .split('-')
    .filter((part) => !['SAC', 'S.A.C.', 'EIRL', 'E.I.R.L.', 'SRL', 'S.R.L.'].includes(part))
    .slice(0, 2)
    .join('-') || normalizeFolderName(value)
}

const units = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function numberBelowHundredToWords(value: number): string {
  if (value < 10) return units[value]
  if (value < 20) return teens[value - 10]
  if (value === 20) return 'VEINTE'
  if (value < 30) return `VEINTI${units[value - 20].toLowerCase()}`.toUpperCase()
  const ten = Math.floor(value / 10)
  const unit = value % 10
  return unit === 0 ? tens[ten] : `${tens[ten]} Y ${units[unit]}`
}

function numberBelowThousandToWords(value: number): string {
  if (value === 0) return ''
  if (value === 100) return 'CIEN'
  if (value < 100) return numberBelowHundredToWords(value)
  const hundred = Math.floor(value / 100)
  const rest = value % 100
  return rest === 0 ? hundreds[hundred] : `${hundreds[hundred]} ${numberBelowHundredToWords(rest)}`
}

function integerToSpanishWords(value: number): string {
  if (value === 0) return 'CERO'
  if (value < 1000) return numberBelowThousandToWords(value)
  if (value < 1000000) {
    const thousands = Math.floor(value / 1000)
    const rest = value % 1000
    const prefix = thousands === 1 ? 'MIL' : `${numberBelowThousandToWords(thousands)} MIL`
    return rest === 0 ? prefix : `${prefix} ${numberBelowThousandToWords(rest)}`
  }
  const millions = Math.floor(value / 1000000)
  const rest = value % 1000000
  const prefix = millions === 1 ? 'UN MILLÓN' : `${numberBelowThousandToWords(millions)} MILLONES`
  return rest === 0 ? prefix : `${prefix} ${integerToSpanishWords(rest)}`
}

function amountToWords(amount: number, currency: string) {
  const rounded = Math.round(amount * 100) / 100
  const integer = Math.floor(rounded)
  const cents = Math.round((rounded - integer) * 100)
  const currencyLabel = currency === 'USD' ? 'DÓLARES AMERICANOS' : 'SOLES'
  return `SON: ${integerToSpanishWords(integer)} CON ${String(cents).padStart(2, '0')}/100 ${currencyLabel}`
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
  projectName: string
  costCenter: string
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
    { label: 'Localidad', value: context.siteName },
    { label: 'Obra / proyecto', value: context.projectName },
    { label: 'Centro de costos', value: context.costCenter },
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

type ServiceOrderContext = {
  orderNumber: string
  supplierName: string
  supplierRuc: string
  supplierAddress: string
  supplierPhone: string
  supplierEmail: string
  supplierContact: string
  contractNumber: string
  siteName: string
  projectName: string
  costCenter: string
  quoteNumber: string
  quoteDate: string
  issueDate: string
  serviceTitle: string
  periodLine: string
  locationLine: string
  equipmentCode: string
  equipmentBrandModel: string
  quantity: number
  unit: string
  unitPrice: number
  subtotal: number
  igv: number
  total: number
  currency: 'PEN' | 'USD'
  paymentTerms: string
  bankName: string
  bankAccountNumber: string
  totalInWords: string
}

function buildServiceOrderContext(contract: Awaited<ReturnType<typeof getContract>>) {
  const firstEquipment = contract.contractEquipment[0]?.equipment
  const quantity = contract.billingMode === 'DIA'
    ? serviceOrderDays(contract.startDate, contract.endDate)
    : 1
  const unit = contract.billingMode === 'DIA' ? 'día' : 'servicio'
  const unitPrice = Number(contract.rate)
  const subtotal = Math.round(quantity * unitPrice * 100) / 100
  const igv = Math.round(subtotal * 18) / 100
  const total = Math.round((subtotal + igv) * 100) / 100
  const supplierCode = supplierShortName(contract.supplier.businessName)

  return {
    orderNumber: `OS ${contract.contractNumber}/${supplierCode}`,
    supplierName: contract.supplier.businessName,
    supplierRuc: contract.supplier.ruc,
    supplierAddress: contract.supplier.address ?? '',
    supplierPhone: contract.supplier.phone ?? '',
    supplierEmail: contract.supplier.email ?? '',
    supplierContact: contract.supplier.contactName ?? '',
    contractNumber: contract.contractNumber,
    siteName: contract.site.name,
    projectName: contract.projectName?.trim() || 'No especificada',
    costCenter: contract.costCenter?.trim() || 'No especificado',
    quoteNumber: contract.contractNumber,
    quoteDate: formatShortDate(contract.startDate),
    issueDate: formatShortDate(new Date()),
    serviceTitle: `SERVICIO DE ALQUILER DE ${firstEquipment?.description ?? 'EQUIPO'}`,
    periodLine: `PERÍODO: ${formatShortDate(contract.startDate)} AL ${formatShortDate(contract.endDate)}`,
    locationLine: `LOCALIDAD: ${contract.site.name} | OBRA/PROYECTO: ${contract.projectName?.trim() || 'No especificada'}`,
    equipmentCode: firstEquipment?.plateOrInternalCode ?? '-',
    equipmentBrandModel: [firstEquipment?.brand, firstEquipment?.model, firstEquipment?.year ? String(firstEquipment.year) : '']
      .filter(Boolean)
      .join(' ') || '-',
    quantity,
    unit,
    unitPrice,
    subtotal,
    igv,
    total,
    currency: contract.currency,
    paymentTerms: `A ${contract.invoiceDueDays} DÍAS`,
    bankName: contract.supplier.bankName?.trim() || '-',
    bankAccountNumber: contract.supplier.bankAccountNumber?.trim() || '-',
    totalInWords: amountToWords(total, contract.currency),
  }
}

async function buildServiceOrderExcelBuffer(context: ServiceOrderContext) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(SERVICE_ORDER_TEMPLATE_PATH)
  const worksheet = workbook.getWorksheet('OC 26.07') ?? workbook.worksheets[0]

  worksheet.pageSetup = {
    ...worksheet.pageSetup,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
  }
  worksheet.getRow(18).height = 24
  worksheet.getRow(19).height = 20
  worksheet.getRow(20).height = 20
  worksheet.getRow(22).height = 18
  worksheet.getRow(23).height = 18
  ;['G18', 'G19', 'G20', 'G22', 'G23', 'M14', 'C46', 'L49', 'L50', 'G52'].forEach((address) => {
    const cell = worksheet.getCell(address)
    cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'middle' }
  })

  worksheet.getCell('E10').value = 'x'
  worksheet.getCell('E11').value = context.supplierName
  worksheet.getCell('K11').value = context.supplierRuc
  worksheet.getCell('M11').value = context.orderNumber
  worksheet.getCell('E12').value = context.supplierAddress
  worksheet.getCell('M12').value = context.quoteNumber
  worksheet.getCell('E13').value = context.supplierPhone
  worksheet.getCell('K13').value = context.supplierEmail
  worksheet.getCell('M13').value = context.quoteDate
  worksheet.getCell('E14').value = context.supplierContact
  worksheet.getCell('M14').value = context.costCenter
  worksheet.getCell('D18').value = context.quantity
  worksheet.getCell('F18').value = context.unit
  worksheet.getCell('G18').value = context.serviceTitle
  worksheet.getCell('G19').value = context.periodLine
  worksheet.getCell('G20').value = context.locationLine
  worksheet.getCell('L18').value = context.unitPrice
  worksheet.getCell('M18').value = { formula: 'L18*D18', result: context.subtotal }
  worksheet.getCell('G22').value = `PLACA/CÓDIGO: ${context.equipmentCode}`
  worksheet.getCell('G23').value = `MARCA/MODELO: ${context.equipmentBrandModel}`
  worksheet.getCell('C46').value = context.totalInWords
  worksheet.getCell('M46').value = { formula: 'M18', result: context.subtotal }
  worksheet.getCell('M47').value = { formula: 'M46*0.18', result: context.igv }
  worksheet.getCell('M48').value = { formula: 'M46+M47', result: context.total }
  worksheet.getCell('G49').value = context.paymentTerms
  worksheet.getCell('L49').value = context.bankName
  worksheet.getCell('L50').value = context.bankAccountNumber
  worksheet.getCell('G52').value = `${context.siteName} - ${context.projectName}`
  worksheet.getCell('G55').value = context.currency === 'USD' ? 'Moneda dólares' : 'Moneda soles'

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

async function convertServiceOrderExcelToPdfBuffer(excelBuffer: Buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'isem-os-'))
  const inputPath = path.join(tempDir, 'orden-servicio.xlsx')
  const outputPath = path.join(tempDir, 'orden-servicio.pdf')
  await fs.writeFile(inputPath, excelBuffer)

  const commands = ['soffice', 'libreoffice']
  let lastError: unknown
  for (const command of commands) {
    try {
      await execFileAsync(command, ['--headless', '--convert-to', 'pdf', '--outdir', tempDir, inputPath], {
        timeout: 60000,
      })
      const pdf = await fs.readFile(outputPath)
      await fs.rm(tempDir, { recursive: true, force: true })
      return pdf
    } catch (error) {
      lastError = error
    }
  }

  await fs.rm(tempDir, { recursive: true, force: true })
  throw new HttpError(
    500,
    'SERVICE_ORDER_PDF_CONVERTER_NOT_AVAILABLE',
    'No se pudo exportar la orden de servicio a PDF porque el servidor no tiene LibreOffice/soffice instalado.',
    { cause: lastError },
  )
}

async function buildServiceOrderSummaryPdfBuffer(context: ServiceOrderContext) {
  const doc = new PDFDocument({ margin: 44, size: 'A4' })
  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))

  doc.rect(0, 0, doc.page.width, 86).fill('#0f2742')
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff').text('ORDEN DE SERVICIO', 44, 30)
  doc.font('Helvetica').fontSize(8).fillColor('#dce8f3').text('INDUSTRIAS Y SERVICIOS ELECTRO-MECÁNICOS S.R.L. | RUC 20220199968', 44, 50)
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text(context.orderNumber, 380, 34, { width: 160, align: 'right' })

  doc.y = 110
  drawSectionTitle(doc, 'Proveedor')
  drawKeyValueGrid(doc, [
    { label: 'Razón social', value: context.supplierName },
    { label: 'RUC', value: context.supplierRuc },
    { label: 'Contacto', value: context.supplierContact || '-' },
    { label: 'Correo / teléfono', value: [context.supplierEmail, context.supplierPhone].filter(Boolean).join(' / ') || '-' },
  ], 2)

  drawSectionTitle(doc, 'Servicio')
  drawKeyValueGrid(doc, [
    { label: 'Contrato', value: context.contractNumber },
    { label: 'Localidad', value: context.siteName },
    { label: 'Obra / proyecto', value: context.projectName },
    { label: 'Centro de costos', value: context.costCenter },
    { label: 'Fecha de emisión', value: context.issueDate },
  ], 2)

  drawSectionTitle(doc, 'Detalle económico')
  const startX = doc.page.margins.left
  const width = pdfContentWidth(doc)
  const rowHeight = 28
  const rows = [
    ['Cantidad', String(context.quantity)],
    ['Unidad', context.unit],
    ['Descripción', [context.serviceTitle, context.periodLine, context.locationLine].join(' | ')],
    ['Precio unitario', formatMoney(context.unitPrice, context.currency)],
    ['Subtotal', formatMoney(context.subtotal, context.currency)],
    ['IGV 18%', formatMoney(context.igv, context.currency)],
    ['Total', formatMoney(context.total, context.currency)],
  ]
  rows.forEach(([label, value], index) => {
    const y = doc.y
    doc.rect(startX, y, width, rowHeight).fillAndStroke(index % 2 === 0 ? '#ffffff' : '#f7fafc', '#d9e2ea')
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#53667a').text(label, startX + 8, y + 9, { width: 120 })
    doc.font('Helvetica').fontSize(8).fillColor('#142033').text(value, startX + 140, y + 9, { width: width - 150 })
    doc.y = y + rowHeight
  })

  doc.moveDown()
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#142033').text(context.totalInWords)
  doc.moveDown()
  doc.font('Helvetica').fontSize(8).fillColor('#26384c').text(`Forma de pago: ${context.paymentTerms}`)
  doc.text(`Banco: ${context.bankName}`)
  doc.text(`Cuenta: ${context.bankAccountNumber}`)

  doc.end()
  await new Promise<void>((resolve) => doc.on('end', resolve))
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
          { costCenter: { contains: params.q } },
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
      projectName: input.projectName,
      costCenter: input.costCenter,
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
        projectName: input.projectName,
        costCenter: input.costCenter,
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
  const projectName = contract.projectName?.trim() || 'No especificada'
  const costCenter = contract.costCenter?.trim() || 'No especificado'

  const rendered = renderTemplate(template, {
    contractNumber: contract.contractNumber,
    companyName: 'INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL',
    companyRuc: '20220199968',
    supplierName: contract.supplier.businessName,
    supplierRuc: contract.supplier.ruc,
    siteName: contract.site.name,
    projectName,
    costCenter,
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
      projectName,
      costCenter,
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

  const previousGeneratedContracts = await prisma.attachment.findMany({
    where: {
      entityType: 'CONTRACT',
      entityId: contract.id,
      category: 'CONTRATO_GENERADO',
    },
  })
  await Promise.all(
    previousGeneratedContracts.map((attachment) => documentStorage.deleteFile(attachment.storagePath)),
  )
  await prisma.attachment.deleteMany({
    where: {
      entityType: 'CONTRACT',
      entityId: contract.id,
      category: 'CONTRATO_GENERADO',
    },
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
      version: 1,
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

export async function generateServiceOrder(
  id: string,
  userId?: string,
  options: { includePdf?: boolean } = {},
) {
  const contract = await getContract(id)

  if (!contract.folderPath) {
    throw new HttpError(404, 'CONTRACT_FOLDER_NOT_FOUND', 'No se encontro la carpeta del contrato')
  }

  const context = buildServiceOrderContext(contract)
  const excelBuffer = await buildServiceOrderExcelBuffer(context)
  const destinationFolder = path.join(contract.folderPath, 'orden-servicio')
  const generatedAt = new Date().toISOString().replace(/[:.]/g, '-')
  const baseName = normalizeFolderName(`orden-servicio-${contract.contractNumber}`)

  const previousGeneratedOrders = await prisma.attachment.findMany({
    where: {
      entityType: 'CONTRACT',
      entityId: contract.id,
      category: { in: ['ORDEN_SERVICIO_GENERADA', 'ORDEN_SERVICIO_GENERADA_PDF'] },
    },
  })
  await Promise.all(
    previousGeneratedOrders.map((attachment) => documentStorage.deleteFile(attachment.storagePath)),
  )
  await prisma.attachment.deleteMany({
    where: {
      entityType: 'CONTRACT',
      entityId: contract.id,
      category: { in: ['ORDEN_SERVICIO_GENERADA', 'ORDEN_SERVICIO_GENERADA_PDF'] },
    },
  })

  const excelFileName = `${baseName}-${generatedAt}.xlsx`
  const excelStoragePath = await documentStorage.saveBuffer({
    buffer: excelBuffer,
    destinationFolder,
    fileName: excelFileName,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const excelAttachment = await prisma.attachment.create({
    data: {
      entityType: 'CONTRACT',
      entityId: contract.id,
      supplierId: contract.supplierId,
      fileName: excelFileName,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSizeBytes: excelBuffer.byteLength,
      storagePath: excelStoragePath,
      category: 'ORDEN_SERVICIO_GENERADA',
      version: 1,
      uploadedById: userId,
    },
  })

  let pdfAttachment = null
  let warning: { code: string; message: string } | undefined

  if (options.includePdf === false) {
    await prisma.auditLog.create({
      data: {
        userId,
        entityType: 'CONTRACT',
        entityId: contract.id,
        action: 'GENERATE_SERVICE_ORDER',
        metadata: {
          orderNumber: context.orderNumber,
          excelFileName,
          excelStoragePath,
          format: 'excel',
        },
      },
    })

    return { data: [excelAttachment] }
  }

  try {
    const pdfBuffer = await convertServiceOrderExcelToPdfBuffer(excelBuffer)
    const pdfFileName = `${baseName}-${generatedAt}.pdf`
    const pdfStoragePath = await documentStorage.saveBuffer({
      buffer: pdfBuffer,
      destinationFolder,
      fileName: pdfFileName,
      mimeType: 'application/pdf',
    })

    pdfAttachment = await prisma.attachment.create({
      data: {
        entityType: 'CONTRACT',
        entityId: contract.id,
        supplierId: contract.supplierId,
        fileName: pdfFileName,
        fileType: 'application/pdf',
        fileSizeBytes: pdfBuffer.byteLength,
        storagePath: pdfStoragePath,
        category: 'ORDEN_SERVICIO_GENERADA_PDF',
        version: 1,
        uploadedById: userId,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        entityType: 'CONTRACT',
        entityId: contract.id,
        action: 'GENERATE_SERVICE_ORDER',
        metadata: {
          orderNumber: context.orderNumber,
          excelFileName,
          pdfFileName,
          excelStoragePath,
          pdfStoragePath,
        },
      },
    })
  } catch (error) {
    if (!(error instanceof HttpError) || error.code !== 'SERVICE_ORDER_PDF_CONVERTER_NOT_AVAILABLE') {
      throw error
    }

    warning = {
      code: error.code,
      message: 'Se genero el Excel de la orden de servicio, pero no se pudo exportar a PDF porque el servidor no tiene LibreOffice/soffice instalado.',
    }

    await prisma.auditLog.create({
      data: {
        userId,
        entityType: 'CONTRACT',
        entityId: contract.id,
        action: 'GENERATE_SERVICE_ORDER',
        metadata: {
          orderNumber: context.orderNumber,
          excelFileName,
          excelStoragePath,
          warning,
        },
      },
    })
  }

  return { data: [excelAttachment, ...(pdfAttachment ? [pdfAttachment] : [])], warning }
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
