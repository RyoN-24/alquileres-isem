import { prisma } from '../db/prisma'

function sumByCurrency<T extends { currency: 'PEN' | 'USD'; totalAmount: unknown }>(items: T[]) {
  return items.reduce(
    (totals, item) => {
      totals[item.currency] += Number(item.totalAmount)
      return totals
    },
    { PEN: 0, USD: 0 },
  )
}

export async function getDashboardSummary() {
  const [
    activeContracts,
    pendingInvoices,
    dueSoonInvoices,
    overdueInvoices,
    valuationsPendingInvoice,
  ] = await Promise.all([
    prisma.contract.findMany({
      where: { status: { in: ['ACTIVO', 'POR_VENCER'] } },
      include: { site: { select: { id: true, name: true } } },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ['PENDIENTE', 'OBSERVADA', 'VENCIDA', 'VENCIDA_CON_PRORROGA'] } },
      include: { supplier: { select: { businessName: true } } },
    }),
    prisma.invoice.findMany({
      where: { status: 'PENDIENTE' },
      include: { supplier: { select: { businessName: true } }, contract: true },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: { status: { in: ['VENCIDA', 'VENCIDA_CON_PRORROGA'] } },
      include: { supplier: { select: { businessName: true } }, contract: true },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.valuation.count({ where: { status: 'PENDIENTE_FACTURA' } }),
  ])

  const bySiteMap = new Map<string, { siteId: string; siteName: string; total: number }>()
  for (const contract of activeContracts) {
    const current = bySiteMap.get(contract.siteId) ?? {
      siteId: contract.siteId,
      siteName: contract.site.name,
      total: 0,
    }
    current.total += 1
    bySiteMap.set(contract.siteId, current)
  }

  return {
    activeContracts: {
      total: activeContracts.length,
      bySite: Array.from(bySiteMap.values()),
    },
    pendingInvoices: sumByCurrency(pendingInvoices),
    dueSoonInvoices,
    overdueInvoices,
    valuationsPendingInvoice,
  }
}

