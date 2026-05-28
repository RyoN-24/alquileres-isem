import { prisma } from '../db/prisma'

export async function globalSearch(query: string) {
  const q = query.trim()
  if (q.length < 2) {
    return {
      suppliers: [],
      equipment: [],
      contracts: [],
      valuations: [],
      invoices: [],
    }
  }

  const [suppliers, equipment, contracts, valuations, invoices] = await Promise.all([
    prisma.supplier.findMany({
      where: {
        OR: [
          { businessName: { contains: q } },
          { tradeName: { contains: q } },
          { ruc: { contains: q } },
          { contactName: { contains: q } },
        ],
      },
      take: 8,
      orderBy: { businessName: 'asc' },
    }),
    prisma.equipment.findMany({
      where: {
        OR: [
          { description: { contains: q } },
          { brand: { contains: q } },
          { model: { contains: q } },
          { plateOrInternalCode: { contains: q } },
        ],
      },
      include: {
        supplier: { select: { businessName: true, ruc: true } },
        equipmentType: { select: { name: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contract.findMany({
      where: {
        OR: [
          { contractNumber: { contains: q } },
          { supplier: { businessName: { contains: q } } },
          { supplier: { ruc: { contains: q } } },
        ],
      },
      include: {
        supplier: { select: { businessName: true, ruc: true } },
        site: { select: { name: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.valuation.findMany({
      where: {
        OR: [
          { valuationNumber: { contains: q } },
          { contract: { contractNumber: { contains: q } } },
          { equipment: { plateOrInternalCode: { contains: q } } },
        ],
      },
      include: {
        contract: { select: { contractNumber: true, supplier: { select: { businessName: true } } } },
        equipment: { select: { description: true, plateOrInternalCode: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: q } },
          { supplier: { businessName: { contains: q } } },
          { supplier: { ruc: { contains: q } } },
          { contract: { contractNumber: { contains: q } } },
          { valuation: { valuationNumber: { contains: q } } },
        ],
      },
      include: {
        supplier: { select: { businessName: true, ruc: true } },
        contract: { select: { contractNumber: true } },
        valuation: { select: { valuationNumber: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { suppliers, equipment, contracts, valuations, invoices }
}

