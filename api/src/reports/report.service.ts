import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma'

export type DueInvoicesReportParams = {
  from?: string
  to?: string
  supplierId?: string
  siteId?: string
  status?: 'PENDIENTE' | 'OBSERVADA' | 'VENCIDA' | 'VENCIDA_CON_PRORROGA' | 'PAGADA'
}

export type CostSummaryReportParams = {
  from?: string
  to?: string
  supplierId?: string
  siteId?: string
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function buildWhere(params: DueInvoicesReportParams): Prisma.InvoiceWhereInput {
  return {
    supplierId: params.supplierId,
    status: params.status
      ? params.status
      : { in: ['PENDIENTE', 'OBSERVADA', 'VENCIDA', 'VENCIDA_CON_PRORROGA'] },
    dueDate: {
      gte: params.from ? parseDate(params.from) : undefined,
      lte: params.to ? parseDate(params.to) : undefined,
    },
    contract: params.siteId ? { siteId: params.siteId } : undefined,
  }
}

function totalsByCurrency(items: Array<{ currency: 'PEN' | 'USD'; totalAmount: unknown }>) {
  return items.reduce(
    (totals, item) => {
      totals[item.currency] += Number(item.totalAmount)
      return totals
    },
    { PEN: 0, USD: 0 },
  )
}

function addCurrencyTotal(
  totals: { PEN: number; USD: number },
  currency: 'PEN' | 'USD',
  amount: number,
) {
  totals[currency] += amount
}

function buildCostWhere(params: CostSummaryReportParams): Prisma.InvoiceWhereInput {
  return {
    supplierId: params.supplierId,
    status: { not: 'ANULADA' },
    issueDate: {
      gte: params.from ? parseDate(params.from) : undefined,
      lte: params.to ? parseDate(params.to) : undefined,
    },
    contract: params.siteId ? { siteId: params.siteId } : undefined,
  }
}

export async function getDueInvoicesReport(params: DueInvoicesReportParams) {
  const invoices = await prisma.invoice.findMany({
    where: buildWhere(params),
    include: {
      supplier: { select: { businessName: true, ruc: true } },
      contract: { select: { contractNumber: true, site: { select: { name: true } } } },
      valuation: {
        select: {
          valuationNumber: true,
          equipment: { select: { description: true, plateOrInternalCode: true } },
        },
      },
    },
    orderBy: [{ dueDate: 'asc' }, { supplier: { businessName: 'asc' } }],
  })

  return {
    filters: params,
    totals: totalsByCurrency(invoices),
    rows: invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      supplier: invoice.supplier.businessName,
      supplierRuc: invoice.supplier.ruc,
      contractNumber: invoice.contract.contractNumber,
      site: invoice.contract.site.name,
      valuationNumber: invoice.valuation.valuationNumber,
      equipment:
        invoice.valuation.equipment.plateOrInternalCode ?? invoice.valuation.equipment.description,
      issueDate: invoice.issueDate.toISOString().slice(0, 10),
      dueDate: invoice.dueDate.toISOString().slice(0, 10),
      currency: invoice.currency,
      totalAmount: Number(invoice.totalAmount),
      status: invoice.status,
      paymentExtensionDate: invoice.paymentExtensionDate?.toISOString().slice(0, 10) ?? null,
    })),
  }
}

export async function buildDueInvoicesXlsx(params: DueInvoicesReportParams) {
  const report = await getDueInvoicesReport(params)
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Facturas por vencer')

  sheet.columns = [
    { header: 'Factura', key: 'invoiceNumber', width: 18 },
    { header: 'Proveedor', key: 'supplier', width: 28 },
    { header: 'RUC', key: 'supplierRuc', width: 15 },
    { header: 'Contrato', key: 'contractNumber', width: 20 },
    { header: 'Sede', key: 'site', width: 18 },
    { header: 'Valorizacion', key: 'valuationNumber', width: 18 },
    { header: 'Equipo', key: 'equipment', width: 22 },
    { header: 'Emision', key: 'issueDate', width: 14 },
    { header: 'Vencimiento', key: 'dueDate', width: 14 },
    { header: 'Moneda', key: 'currency', width: 10 },
    { header: 'Monto', key: 'totalAmount', width: 14 },
    { header: 'Estado', key: 'status', width: 20 },
    { header: 'Prorroga', key: 'paymentExtensionDate', width: 14 },
  ]

  sheet.getRow(1).font = { bold: true }
  sheet.addRows(report.rows)
  sheet.addRow({})
  sheet.addRow({ currency: 'TOTAL PEN', totalAmount: report.totals.PEN })
  sheet.addRow({ currency: 'TOTAL USD', totalAmount: report.totals.USD })

  return workbook.xlsx.writeBuffer()
}

export async function buildDueInvoicesPdf(params: DueInvoicesReportParams) {
  const report = await getDueInvoicesReport(params)
  const doc = new PDFDocument({ margin: 36, size: 'A4' })
  const chunks: Buffer[] = []

  doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))

  doc.fontSize(14).text('Reporte de facturas por vencer y vencidas', { align: 'center' })
  doc.moveDown()
  doc.fontSize(10).text(`Total PEN: ${report.totals.PEN.toFixed(2)}`)
  doc.text(`Total USD: ${report.totals.USD.toFixed(2)}`)
  doc.moveDown()

  for (const row of report.rows) {
    doc
      .fontSize(9)
      .text(`${row.dueDate} | ${row.status} | ${row.currency} ${row.totalAmount.toFixed(2)}`)
    doc.text(`${row.invoiceNumber} - ${row.supplier} - ${row.contractNumber}`)
    doc.text(`Equipo: ${row.equipment} | Sede: ${row.site}`)
    if (row.paymentExtensionDate) {
      doc.text(`Prorroga: ${row.paymentExtensionDate}`)
    }
    doc.moveDown(0.5)
  }

  doc.end()

  await new Promise<void>((resolve) => {
    doc.on('end', resolve)
  })

  return Buffer.concat(chunks)
}

export async function getCostSummaryReport(params: CostSummaryReportParams) {
  const invoices = await prisma.invoice.findMany({
    where: buildCostWhere(params),
    include: {
      supplier: { select: { id: true, businessName: true, ruc: true } },
      contract: { select: { contractNumber: true, site: { select: { name: true } } } },
      valuation: {
        select: {
          valuationNumber: true,
          quantity: true,
          calculatedAmount: true,
          currency: true,
          status: true,
          cutoffDate: true,
          equipment: {
            select: {
              id: true,
              description: true,
              plateOrInternalCode: true,
            },
          },
        },
      },
    },
    orderBy: [{ supplier: { businessName: 'asc' } }, { issueDate: 'asc' }],
  })

  const supplierMap = new Map<
    string,
    { supplier: string; supplierRuc: string; invoices: number; PEN: number; USD: number }
  >()
  const equipmentMap = new Map<
    string,
    { equipment: string; supplier: string; invoices: number; PEN: number; USD: number }
  >()

  const valuationRows = invoices.map((invoice) => {
    const amount = Number(invoice.totalAmount)
    const supplierKey = invoice.supplier.id
    const supplierRow =
      supplierMap.get(supplierKey) ??
      {
        supplier: invoice.supplier.businessName,
        supplierRuc: invoice.supplier.ruc,
        invoices: 0,
        PEN: 0,
        USD: 0,
      }
    supplierRow.invoices += 1
    addCurrencyTotal(supplierRow, invoice.currency, amount)
    supplierMap.set(supplierKey, supplierRow)

    const equipmentLabel =
      invoice.valuation.equipment.plateOrInternalCode ?? invoice.valuation.equipment.description
    const equipmentRow =
      equipmentMap.get(invoice.valuation.equipment.id) ??
      {
        equipment: equipmentLabel,
        supplier: invoice.supplier.businessName,
        invoices: 0,
        PEN: 0,
        USD: 0,
      }
    equipmentRow.invoices += 1
    addCurrencyTotal(equipmentRow, invoice.currency, amount)
    equipmentMap.set(invoice.valuation.equipment.id, equipmentRow)

    return {
      invoiceNumber: invoice.invoiceNumber,
      supplier: invoice.supplier.businessName,
      contractNumber: invoice.contract.contractNumber,
      site: invoice.contract.site.name,
      valuationNumber: invoice.valuation.valuationNumber,
      cutoffDate: invoice.valuation.cutoffDate.toISOString().slice(0, 10),
      equipment: equipmentLabel,
      quantity: Number(invoice.valuation.quantity),
      valuationAmount: Number(invoice.valuation.calculatedAmount),
      valuationCurrency: invoice.valuation.currency,
      invoiceAmount: amount,
      invoiceCurrency: invoice.currency,
      invoiceStatus: invoice.status,
    }
  })

  return {
    filters: params,
    totals: totalsByCurrency(invoices),
    suppliers: Array.from(supplierMap.values()).sort((a, b) => a.supplier.localeCompare(b.supplier)),
    equipment: Array.from(equipmentMap.values()).sort((a, b) => a.equipment.localeCompare(b.equipment)),
    valuations: valuationRows,
  }
}

export async function buildCostSummaryXlsx(params: CostSummaryReportParams) {
  const report = await getCostSummaryReport(params)
  const workbook = new ExcelJS.Workbook()

  const suppliersSheet = workbook.addWorksheet('Costo por proveedor')
  suppliersSheet.columns = [
    { header: 'Proveedor', key: 'supplier', width: 32 },
    { header: 'RUC', key: 'supplierRuc', width: 15 },
    { header: 'Facturas', key: 'invoices', width: 10 },
    { header: 'Total PEN', key: 'PEN', width: 14 },
    { header: 'Total USD', key: 'USD', width: 14 },
  ]
  suppliersSheet.getRow(1).font = { bold: true }
  suppliersSheet.addRows(report.suppliers)

  const equipmentSheet = workbook.addWorksheet('Costo por equipo')
  equipmentSheet.columns = [
    { header: 'Equipo', key: 'equipment', width: 28 },
    { header: 'Proveedor', key: 'supplier', width: 32 },
    { header: 'Facturas', key: 'invoices', width: 10 },
    { header: 'Total PEN', key: 'PEN', width: 14 },
    { header: 'Total USD', key: 'USD', width: 14 },
  ]
  equipmentSheet.getRow(1).font = { bold: true }
  equipmentSheet.addRows(report.equipment)

  const valuationsSheet = workbook.addWorksheet('Valorizaciones')
  valuationsSheet.columns = [
    { header: 'Valorizacion', key: 'valuationNumber', width: 18 },
    { header: 'Factura', key: 'invoiceNumber', width: 18 },
    { header: 'Proveedor', key: 'supplier', width: 32 },
    { header: 'Contrato', key: 'contractNumber', width: 20 },
    { header: 'Sede', key: 'site', width: 18 },
    { header: 'Equipo', key: 'equipment', width: 22 },
    { header: 'Corte', key: 'cutoffDate', width: 14 },
    { header: 'Cantidad', key: 'quantity', width: 12 },
    { header: 'Monto valorizacion', key: 'valuationAmount', width: 18 },
    { header: 'Moneda valorizacion', key: 'valuationCurrency', width: 18 },
    { header: 'Monto factura', key: 'invoiceAmount', width: 14 },
    { header: 'Moneda factura', key: 'invoiceCurrency', width: 14 },
    { header: 'Estado factura', key: 'invoiceStatus', width: 18 },
  ]
  valuationsSheet.getRow(1).font = { bold: true }
  valuationsSheet.addRows(report.valuations)

  return workbook.xlsx.writeBuffer()
}

export async function buildCostSummaryPdf(params: CostSummaryReportParams) {
  const report = await getCostSummaryReport(params)
  const doc = new PDFDocument({ margin: 36, size: 'A4' })
  const chunks: Buffer[] = []

  doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))

  doc.fontSize(14).text('Reporte consolidado de costos', { align: 'center' })
  doc.moveDown()
  doc.fontSize(10).text(`Total PEN: ${report.totals.PEN.toFixed(2)}`)
  doc.text(`Total USD: ${report.totals.USD.toFixed(2)}`)
  doc.moveDown()

  doc.fontSize(12).text('Costo por proveedor')
  for (const row of report.suppliers) {
    doc.fontSize(9).text(`${row.supplier} | PEN ${row.PEN.toFixed(2)} | USD ${row.USD.toFixed(2)}`)
  }
  doc.moveDown()

  doc.fontSize(12).text('Costo por equipo')
  for (const row of report.equipment) {
    doc.fontSize(9).text(`${row.equipment} - ${row.supplier} | PEN ${row.PEN.toFixed(2)} | USD ${row.USD.toFixed(2)}`)
  }
  doc.moveDown()

  doc.fontSize(12).text('Valorizaciones')
  for (const row of report.valuations) {
    doc
      .fontSize(9)
      .text(`${row.valuationNumber} | ${row.invoiceNumber} | ${row.invoiceCurrency} ${row.invoiceAmount.toFixed(2)}`)
    doc.text(`${row.supplier} - ${row.equipment} - ${row.site}`)
    doc.moveDown(0.4)
  }

  doc.end()

  await new Promise<void>((resolve) => {
    doc.on('end', resolve)
  })

  return Buffer.concat(chunks)
}
