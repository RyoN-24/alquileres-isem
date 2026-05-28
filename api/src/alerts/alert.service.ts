import { AlertType } from '@prisma/client'
import { prisma } from '../db/prisma'
import { getAlertSettings } from '../settings/settings.service'

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

async function upsertInvoiceAlert(invoiceId: string, alertType: AlertType, triggerDate: Date) {
  const existing = await prisma.alert.findFirst({
    where: { invoiceId, alertType, isResolved: false },
  })

  if (existing) return existing

  return prisma.alert.create({
    data: { invoiceId, alertType, triggerDate },
  })
}

async function upsertContractAlert(contractId: string, alertType: AlertType, triggerDate: Date) {
  const existing = await prisma.alert.findFirst({
    where: { contractId, alertType, isResolved: false },
  })

  if (existing) return existing

  return prisma.alert.create({
    data: { contractId, alertType, triggerDate },
  })
}

export async function runAlertEvaluation(today = startOfUtcDay()) {
  const settings = await getAlertSettings()
  const invoiceAlertDate = addDays(today, settings.invoiceDaysBeforeDue)
  const contractAlertDate = addDays(today, settings.contractDaysBeforeDue)

  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ['PENDIENTE', 'OBSERVADA', 'VENCIDA', 'VENCIDA_CON_PRORROGA'] } },
  })

  let invoiceDueSoon = 0
  let invoiceOverdue = 0

  for (const invoice of invoices) {
    if (invoice.dueDate <= today && !invoice.paidAt) {
      if (invoice.paymentExtensionDate && invoice.paymentExtensionDate > today) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'VENCIDA_CON_PRORROGA' },
        })
        continue
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'VENCIDA' },
      })
      if (settings.dailyOverdueReminderEnabled) {
        await upsertInvoiceAlert(invoice.id, 'FACTURA_VENCIDA', today)
      }
      invoiceOverdue += 1
      continue
    }

    if (invoice.dueDate <= invoiceAlertDate && invoice.dueDate >= today && !invoice.paidAt) {
      await upsertInvoiceAlert(invoice.id, 'FACTURA_POR_VENCER', invoice.dueDate)
      invoiceDueSoon += 1
    }
  }

  const contracts = await prisma.contract.findMany({
    where: { status: { in: ['ACTIVO', 'POR_VENCER'] } },
  })

  let contractsDueSoon = 0
  let contractsOverdue = 0

  for (const contract of contracts) {
    if (contract.endDate < today) {
      await upsertContractAlert(contract.id, 'CONTRATO_VENCIDO', today)
      contractsOverdue += 1
      continue
    }

    if (contract.endDate <= contractAlertDate && contract.endDate >= today) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: 'POR_VENCER' },
      })
      await upsertContractAlert(contract.id, 'CONTRATO_POR_VENCER', contract.endDate)
      contractsDueSoon += 1
    }
  }

  return { invoiceDueSoon, invoiceOverdue, contractsDueSoon, contractsOverdue }
}

export async function listActiveAlerts() {
  return prisma.alert.findMany({
    where: { isResolved: false },
    include: {
      invoice: {
        include: {
          supplier: { select: { businessName: true, ruc: true } },
          contract: { select: { contractNumber: true } },
        },
      },
    },
    orderBy: { triggerDate: 'asc' },
  })
}
