import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { HttpError } from '../http/errors'
import {
  createInvoiceSchema,
  markInvoicePaidSchema,
  updateInvoiceSchema,
} from './invoice.schemas'

type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
type MarkInvoicePaidInput = z.infer<typeof markInvoicePaidSchema>

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function amountsDiffer(left: number, right: number) {
  return Math.abs(left - right) > 0.01
}

export async function listInvoices(params: {
  q?: string
  supplierId?: string
  contractId?: string
  valuationId?: string
  status?: 'REGISTRADA' | 'PENDIENTE' | 'OBSERVADA' | 'VENCIDA' | 'VENCIDA_CON_PRORROGA' | 'PAGADA' | 'ANULADA'
  currency?: 'PEN' | 'USD'
  page: number
  pageSize: number
}) {
  const where: Prisma.InvoiceWhereInput = {
    supplierId: params.supplierId,
    contractId: params.contractId,
    valuationId: params.valuationId,
    status: params.status,
    currency: params.currency,
    OR: params.q
      ? [
          { invoiceNumber: { contains: params.q } },
          { supplier: { businessName: { contains: params.q } } },
          { contract: { contractNumber: { contains: params.q } } },
          { valuation: { valuationNumber: { contains: params.q } } },
        ]
      : undefined,
  }

  const [data, totalItems] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      include: {
        supplier: { select: { id: true, businessName: true, ruc: true } },
        contract: { select: { id: true, contractNumber: true, invoiceDueDays: true } },
        valuation: {
          select: {
            id: true,
            valuationNumber: true,
            calculatedAmount: true,
            currency: true,
            equipment: { select: { id: true, description: true, plateOrInternalCode: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.invoice.count({ where }),
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

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      supplier: true,
      contract: true,
      valuation: { include: { equipment: true } },
      alerts: true,
    },
  })

  if (!invoice) {
    throw new HttpError(404, 'INVOICE_NOT_FOUND', 'Factura no encontrada')
  }

  return invoice
}

export async function createInvoice(input: CreateInvoiceInput, userId?: string) {
  const valuation = await prisma.valuation.findUnique({
    where: { id: input.valuationId },
    include: { contract: true, invoice: true },
  })

  if (!valuation) {
    throw new HttpError(404, 'VALUATION_NOT_FOUND', 'Valorizacion no encontrada')
  }

  if (valuation.invoice) {
    throw new HttpError(409, 'VALUATION_ALREADY_INVOICED', 'La valorizacion ya tiene factura')
  }

  const existingNumber = await prisma.invoice.findFirst({
    where: {
      supplierId: valuation.contract.supplierId,
      invoiceNumber: input.invoiceNumber,
    },
  })
  if (existingNumber) {
    throw new HttpError(409, 'INVOICE_NUMBER_EXISTS', 'Ya existe una factura con ese numero para el proveedor')
  }

  const issueDate = parseDate(input.issueDate)
  const dueDate = input.dueDate ? parseDate(input.dueDate) : addDays(issueDate, valuation.contract.invoiceDueDays)
  const totalAmount = input.totalAmount ?? Number(valuation.calculatedAmount)
  const currency = input.currency ?? valuation.currency
  const hasMismatch = amountsDiffer(totalAmount, Number(valuation.calculatedAmount)) || currency !== valuation.currency

  if (hasMismatch && !input.amountMismatchAccepted) {
    throw new HttpError(
      422,
      'INVOICE_AMOUNT_MISMATCH',
      'El monto o moneda de factura no coincide con la valorizacion. Confirme si desea registrarla de todos modos.',
      {
        valuationAmount: valuation.calculatedAmount,
        valuationCurrency: valuation.currency,
        invoiceAmount: totalAmount,
        invoiceCurrency: currency,
      },
    )
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        supplierId: valuation.contract.supplierId,
        contractId: valuation.contractId,
        valuationId: valuation.id,
        invoiceNumber: input.invoiceNumber,
        issueDate,
        dueDate,
        currency,
        totalAmount,
        amountMismatchAccepted: hasMismatch ? input.amountMismatchAccepted : false,
        status: input.status,
        notes: input.notes,
        folderPath: valuation.folderPath,
      },
      include: {
        supplier: { select: { id: true, businessName: true, ruc: true } },
        contract: { select: { id: true, contractNumber: true, invoiceDueDays: true } },
        valuation: {
          select: {
            id: true,
            valuationNumber: true,
            calculatedAmount: true,
            currency: true,
            equipment: { select: { id: true, description: true, plateOrInternalCode: true } },
          },
        },
      },
    })

    await tx.valuation.update({
      where: { id: valuation.id },
      data: { status: 'FACTURADA' },
    })

    return created
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'INVOICE',
      entityId: invoice.id,
      action: 'CREATE',
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount,
        currency,
        hasMismatch,
      },
    },
  })

  return invoice
}

export async function updateInvoice(id: string, input: UpdateInvoiceInput, userId?: string) {
  const current = await getInvoice(id)

  if (current.status === 'PAGADA') {
    throw new HttpError(422, 'INVOICE_ALREADY_PAID', 'No se puede editar una factura pagada')
  }

  const totalAmount = input.totalAmount ?? Number(current.totalAmount)
  const currency = input.currency ?? current.currency
  const hasMismatch =
    amountsDiffer(totalAmount, Number(current.valuation.calculatedAmount)) ||
    currency !== current.valuation.currency

  if (hasMismatch && !input.amountMismatchAccepted && !current.amountMismatchAccepted) {
    throw new HttpError(
      422,
      'INVOICE_AMOUNT_MISMATCH',
      'El monto o moneda de factura no coincide con la valorizacion. Confirme si desea registrarla de todos modos.',
    )
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      invoiceNumber: input.invoiceNumber,
      issueDate: input.issueDate ? parseDate(input.issueDate) : undefined,
      dueDate: input.dueDate ? parseDate(input.dueDate) : undefined,
      currency: input.currency,
      totalAmount: input.totalAmount,
      amountMismatchAccepted: input.amountMismatchAccepted,
      paymentExtensionDate: input.paymentExtensionDate ? parseDate(input.paymentExtensionDate) : undefined,
      paymentExtensionReason: input.paymentExtensionReason,
      status: input.status,
      notes: input.notes,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'INVOICE',
      entityId: invoice.id,
      action: 'UPDATE',
      metadata: input,
    },
  })

  return invoice
}

export async function markInvoicePaid(id: string, input: MarkInvoicePaidInput, userId?: string) {
  const current = await getInvoice(id)
  if (current.status === 'PAGADA') {
    return current
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: {
        status: 'PAGADA',
        paidAt: parseDate(input.paidAt),
        notes: input.notes ?? current.notes,
      },
    })

    await tx.valuation.update({
      where: { id: current.valuationId },
      data: { status: 'PAGADA' },
    })

    await tx.alert.updateMany({
      where: { invoiceId: id },
      data: { isResolved: true },
    })

    return updated
  })

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: 'INVOICE',
      entityId: invoice.id,
      action: 'MARK_PAID',
      metadata: { paidAt: input.paidAt },
    },
  })

  return invoice
}
