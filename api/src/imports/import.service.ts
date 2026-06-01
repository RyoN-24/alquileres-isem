import fs from 'node:fs/promises'
import ExcelJS from 'exceljs'
import { prisma } from '../db/prisma'
import { createContract } from '../contracts/contract.service'
import { createEquipment, createEquipmentType, createSite } from '../equipment/equipment.service'
import { createInvoice } from '../invoices/invoice.service'
import { createSupplier } from '../suppliers/supplier.service'
import { createValuation } from '../valuations/valuation.service'

type ImportAction = 'CREATE' | 'SKIP' | 'ERROR'
type ImportSection = 'Proveedores' | 'Equipos' | 'Contratos' | 'Valorizaciones' | 'Facturas'

type ImportRowResult = {
  section: ImportSection
  row: number
  action: ImportAction
  message: string
  reference?: string
}

type ImportSummary = Record<ImportSection, { total: number; create: number; skip: number; error: number }>

type ParsedRow = { rowNumber: number; values: Record<string, unknown> }

const SHEETS: Array<{ name: ImportSection; headers: string[]; sample: unknown[][] }> = [
  {
    name: 'Proveedores',
    headers: [
      'ruc',
      'razonSocial',
      'nombreComercial',
      'contacto',
      'telefono',
      'correo',
      'direccion',
      'banco',
      'cuenta',
      'plazoPagoDias',
      'estado',
    ],
    sample: [
      [
        '20600000001',
        'PROVEEDOR EJEMPLO SAC',
        'Proveedor Ejemplo',
        'Juan Perez',
        '999999999',
        'proveedor@correo.com',
        'Lima',
        'BCP',
        '001-000000000',
        30,
        'ACTIVO',
      ],
    ],
  },
  {
    name: 'Equipos',
    headers: ['rucProveedor', 'tipoEquipo', 'descripcion', 'marca', 'modelo', 'anio', 'placaCodigo', 'sede', 'estado'],
    sample: [['20600000001', 'Maquinaria pesada', 'Excavadora 320', 'CAT', '320', 2020, 'ABC-123', 'Toquepala', 'EN_OBRA']],
  },
  {
    name: 'Contratos',
    headers: [
      'numeroContrato',
      'rucProveedor',
      'placaCodigo',
      'sede',
      'fechaInicio',
      'fechaFin',
      'modalidadCobro',
      'tarifa',
      'moneda',
      'plazoFacturaDias',
      'estado',
      'notas',
    ],
    sample: [['ISEM-2026-001', '20600000001', 'ABC-123', 'Toquepala', '2026-05-01', '2026-05-31', 'DIA', 850, 'PEN', 30, 'ACTIVO', '']],
  },
  {
    name: 'Valorizaciones',
    headers: [
      'numeroContrato',
      'placaCodigo',
      'numeroValorizacion',
      'periodoInicio',
      'periodoFin',
      'fechaCorte',
      'cantidad',
      'moneda',
      'estado',
      'notas',
    ],
    sample: [['ISEM-2026-001', 'ABC-123', 'VAL-001', '2026-05-01', '2026-05-15', '2026-05-15', 10, 'PEN', 'PENDIENTE_FACTURA', '']],
  },
  {
    name: 'Facturas',
    headers: [
      'numeroContrato',
      'numeroValorizacion',
      'numeroFactura',
      'fechaEmision',
      'fechaVencimiento',
      'moneda',
      'montoTotal',
      'estado',
      'aceptarDiferencia',
      'notas',
    ],
    sample: [['ISEM-2026-001', 'VAL-001', 'F001-123', '2026-05-16', '2026-06-15', 'PEN', 8500, 'PENDIENTE', 'SI', '']],
  },
]

const EMPTY_SUMMARY: ImportSummary = {
  Proveedores: { total: 0, create: 0, skip: 0, error: 0 },
  Equipos: { total: 0, create: 0, skip: 0, error: 0 },
  Contratos: { total: 0, create: 0, skip: 0, error: 0 },
  Valorizaciones: { total: 0, create: 0, skip: 0, error: 0 },
  Facturas: { total: 0, create: 0, skip: 0, error: 0 },
}

function cloneSummary(): ImportSummary {
  return JSON.parse(JSON.stringify(EMPTY_SUMMARY)) as ImportSummary
}

function asText(value: unknown) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object' && 'text' in value) return String((value as { text: unknown }).text).trim()
  return String(value).trim()
}

function asNumber(value: unknown) {
  const parsed = Number(asText(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : undefined
}

function asDate(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const text = asText(value)
  if (!text) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  }
  return undefined
}

function normalizeStatus(value: unknown, fallback: string) {
  return asText(value).toUpperCase().replaceAll(' ', '_') || fallback
}

function boolFromText(value: unknown) {
  const text = asText(value).toUpperCase()
  return ['SI', 'SÍ', 'TRUE', '1', 'X'].includes(text)
}

function readSheet(workbook: ExcelJS.Workbook, section: ImportSection, headers: string[]): ParsedRow[] {
  const sheet = workbook.getWorksheet(section)
  if (!sheet) return []
  const rows: ParsedRow[] = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const values: Record<string, unknown> = {}
    let hasAnyValue = false
    headers.forEach((header, index) => {
      const value = row.getCell(index + 1).value
      values[header] = value
      if (asText(value)) hasAnyValue = true
    })
    if (hasAnyValue) rows.push({ rowNumber, values })
  })

  return rows
}

function pushResult(results: ImportRowResult[], summary: ImportSummary, result: ImportRowResult) {
  results.push(result)
  summary[result.section].total += 1
  if (result.action === 'CREATE') summary[result.section].create += 1
  if (result.action === 'SKIP') summary[result.section].skip += 1
  if (result.action === 'ERROR') summary[result.section].error += 1
}

export async function buildImportTemplate() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ISEM Alquileres'

  for (const sheetConfig of SHEETS) {
    const sheet = workbook.addWorksheet(sheetConfig.name)
    sheet.addRow(sheetConfig.headers)
    sheet.addRows(sheetConfig.sample)
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } }
    sheet.columns = sheetConfig.headers.map((header) => ({ header, key: header, width: Math.max(header.length + 4, 18) }))
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
  }

  return workbook.xlsx.writeBuffer()
}

export async function importExcelFile(params: { filePath: string; commit: boolean; userId?: string }) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(params.filePath)
  const summary = cloneSummary()
  const results: ImportRowResult[] = []
  const createdIds = {
    suppliers: new Map<string, string>(),
    sites: new Map<string, string>(),
    equipmentTypes: new Map<string, string>(),
    equipment: new Map<string, string>(),
    contracts: new Map<string, string>(),
    valuations: new Map<string, string>(),
  }

  const suppliers = readSheet(workbook, 'Proveedores', SHEETS[0].headers)
  for (const row of suppliers) {
    const ruc = asText(row.values.ruc)
    const businessName = asText(row.values.razonSocial)
    try {
      if (!ruc || !businessName) throw new Error('RUC y razonSocial son obligatorios')
      const existing = await prisma.supplier.findUnique({ where: { ruc } })
      if (existing) {
        createdIds.suppliers.set(ruc, existing.id)
        pushResult(results, summary, { section: 'Proveedores', row: row.rowNumber, action: 'SKIP', message: 'Proveedor ya existe', reference: ruc })
        continue
      }
      if (params.commit) {
        const supplier = await createSupplier(
          {
            ruc,
            businessName,
            tradeName: asText(row.values.nombreComercial) || undefined,
            contactName: asText(row.values.contacto) || undefined,
            phone: asText(row.values.telefono) || undefined,
            email: asText(row.values.correo) || undefined,
            address: asText(row.values.direccion) || undefined,
            bankName: asText(row.values.banco) || undefined,
            bankAccountNumber: asText(row.values.cuenta) || undefined,
            defaultPaymentTermDays: asNumber(row.values.plazoPagoDias) ?? 30,
          },
          params.userId,
        )
        createdIds.suppliers.set(ruc, supplier.id)
      } else {
        createdIds.suppliers.set(ruc, `preview-supplier-${ruc}`)
      }
      pushResult(results, summary, { section: 'Proveedores', row: row.rowNumber, action: 'CREATE', message: params.commit ? 'Proveedor importado' : 'Proveedor listo para importar', reference: ruc })
    } catch (error) {
      pushResult(results, summary, { section: 'Proveedores', row: row.rowNumber, action: 'ERROR', message: error instanceof Error ? error.message : 'Error al procesar proveedor', reference: ruc })
    }
  }

  const equipmentRows = readSheet(workbook, 'Equipos', SHEETS[1].headers)
  for (const row of equipmentRows) {
    const ruc = asText(row.values.rucProveedor)
    const code = asText(row.values.placaCodigo)
    const description = asText(row.values.descripcion)
    const typeName = asText(row.values.tipoEquipo) || 'Otro'
    const siteName = asText(row.values.sede)
    try {
      const supplier = await prisma.supplier.findUnique({ where: { ruc } })
      const supplierId = supplier?.id ?? createdIds.suppliers.get(ruc)
      if (!supplierId) throw new Error(`Proveedor no encontrado para RUC ${ruc}`)
      if (!description) throw new Error('descripcion es obligatoria')
      if (code) {
        const existing = await prisma.equipment.findUnique({ where: { plateOrInternalCode: code } })
        if (existing) {
          createdIds.equipment.set(code, existing.id)
          pushResult(results, summary, { section: 'Equipos', row: row.rowNumber, action: 'SKIP', message: 'Equipo ya existe', reference: code })
          continue
        }
      }

      let equipmentType = await prisma.equipmentType.findUnique({ where: { name: typeName } })
      let site = siteName ? await prisma.site.findFirst({ where: { name: siteName } }) : null

      if (params.commit && !equipmentType) equipmentType = await createEquipmentType({ name: typeName }, params.userId)
      if (params.commit && siteName && !site) site = await createSite({ name: siteName }, params.userId)

      const equipmentTypeId = equipmentType?.id ?? createdIds.equipmentTypes.get(typeName)
      const siteId = site?.id ?? (siteName ? createdIds.sites.get(siteName) : undefined)
      if (!equipmentTypeId && !params.commit) createdIds.equipmentTypes.set(typeName, `preview-${typeName}`)
      if (!siteId && siteName && !params.commit) createdIds.sites.set(siteName, `preview-${siteName}`)

      if (params.commit) {
        const equipment = await createEquipment(
          {
            supplierId,
            equipmentTypeId: equipmentType?.id ?? '',
            currentSiteId: site?.id,
            description,
            brand: asText(row.values.marca) || undefined,
            model: asText(row.values.modelo) || undefined,
            year: asNumber(row.values.anio),
            plateOrInternalCode: code || undefined,
            status: normalizeStatus(row.values.estado, siteName ? 'EN_OBRA' : 'DISPONIBLE') as 'DISPONIBLE',
          },
          params.userId,
        )
        if (code) createdIds.equipment.set(code, equipment.id)
      } else if (code) {
        createdIds.equipment.set(code, `preview-equipment-${code}`)
      }
      pushResult(results, summary, { section: 'Equipos', row: row.rowNumber, action: 'CREATE', message: params.commit ? 'Equipo importado' : 'Equipo listo para importar', reference: code || description })
    } catch (error) {
      pushResult(results, summary, { section: 'Equipos', row: row.rowNumber, action: 'ERROR', message: error instanceof Error ? error.message : 'Error al procesar equipo', reference: code || description })
    }
  }

  const contractRows = readSheet(workbook, 'Contratos', SHEETS[2].headers)
  for (const row of contractRows) {
    const contractNumber = asText(row.values.numeroContrato)
    const ruc = asText(row.values.rucProveedor)
    const code = asText(row.values.placaCodigo)
    const siteName = asText(row.values.sede)
    try {
      const existing = await prisma.contract.findUnique({ where: { contractNumber } })
      if (existing) {
        createdIds.contracts.set(contractNumber, existing.id)
        pushResult(results, summary, { section: 'Contratos', row: row.rowNumber, action: 'SKIP', message: 'Contrato ya existe', reference: contractNumber })
        continue
      }
      const supplier = await prisma.supplier.findUnique({ where: { ruc } })
      const equipment = code ? await prisma.equipment.findUnique({ where: { plateOrInternalCode: code } }) : null
      const site = siteName ? await prisma.site.findFirst({ where: { name: siteName } }) : null
      const supplierId = supplier?.id ?? createdIds.suppliers.get(ruc)
      const equipmentId = equipment?.id ?? createdIds.equipment.get(code)
      const siteId = site?.id ?? createdIds.sites.get(siteName)
      const startDate = asDate(row.values.fechaInicio)
      const endDate = asDate(row.values.fechaFin)
      const rate = asNumber(row.values.tarifa)
      if (!contractNumber || !supplierId || !equipmentId || !siteId || !startDate || !endDate || !rate) {
        throw new Error('numeroContrato, proveedor, equipo, sede, fechas y tarifa son obligatorios')
      }
      if (params.commit) {
        const contract = await createContract(
          {
            supplierId,
            siteId,
            contractNumber,
            equipmentIds: [equipmentId],
            startDate,
            endDate,
            billingMode: normalizeStatus(row.values.modalidadCobro, 'DIA') === 'HORA' ? 'HORA' : 'DIA',
            rate,
            currency: normalizeStatus(row.values.moneda, 'PEN') === 'USD' ? 'USD' : 'PEN',
            invoiceDueDays: asNumber(row.values.plazoFacturaDias) ?? 30,
            notes: asText(row.values.notas) || undefined,
            status: normalizeStatus(row.values.estado, 'ACTIVO') === 'BORRADOR' ? 'BORRADOR' : 'ACTIVO',
          },
          params.userId,
        )
        createdIds.contracts.set(contractNumber, contract.id)
      } else {
        createdIds.contracts.set(contractNumber, `preview-contract-${contractNumber}`)
      }
      pushResult(results, summary, { section: 'Contratos', row: row.rowNumber, action: 'CREATE', message: params.commit ? 'Contrato importado' : 'Contrato listo para importar', reference: contractNumber })
    } catch (error) {
      pushResult(results, summary, { section: 'Contratos', row: row.rowNumber, action: 'ERROR', message: error instanceof Error ? error.message : 'Error al procesar contrato', reference: contractNumber })
    }
  }

  const valuationRows = readSheet(workbook, 'Valorizaciones', SHEETS[3].headers)
  for (const row of valuationRows) {
    const contractNumber = asText(row.values.numeroContrato)
    const valuationNumber = asText(row.values.numeroValorizacion)
    const code = asText(row.values.placaCodigo)
    try {
      const contract = await prisma.contract.findUnique({ where: { contractNumber } })
      const equipment = code ? await prisma.equipment.findUnique({ where: { plateOrInternalCode: code } }) : null
      const contractId = contract?.id ?? createdIds.contracts.get(contractNumber)
      const equipmentId = equipment?.id ?? createdIds.equipment.get(code)
      const cutoffDate = asDate(row.values.fechaCorte)
      const quantity = asNumber(row.values.cantidad)
      if (!contractId || !equipmentId || !valuationNumber || !cutoffDate || !quantity) {
        throw new Error('contrato, equipo, numeroValorizacion, fechaCorte y cantidad son obligatorios')
      }
      const existing = await prisma.valuation.findFirst({ where: { contractId, valuationNumber } })
      if (existing) {
        createdIds.valuations.set(`${contractNumber}:${valuationNumber}`, existing.id)
        pushResult(results, summary, { section: 'Valorizaciones', row: row.rowNumber, action: 'SKIP', message: 'Valorizacion ya existe', reference: valuationNumber })
        continue
      }
      if (params.commit) {
        const valuation = await createValuation(
          {
            contractId,
            equipmentId,
            valuationNumber,
            periodStart: asDate(row.values.periodoInicio),
            periodEnd: asDate(row.values.periodoFin),
            cutoffDate,
            quantity,
            currency: normalizeStatus(row.values.moneda, '') === 'USD' ? 'USD' : undefined,
            notes: asText(row.values.notas) || undefined,
            status: normalizeStatus(row.values.estado, 'PENDIENTE_FACTURA') === 'BORRADOR' ? 'BORRADOR' : 'PENDIENTE_FACTURA',
          },
          params.userId,
        )
        createdIds.valuations.set(`${contractNumber}:${valuationNumber}`, valuation.id)
      } else {
        createdIds.valuations.set(`${contractNumber}:${valuationNumber}`, `preview-valuation-${contractNumber}-${valuationNumber}`)
      }
      pushResult(results, summary, { section: 'Valorizaciones', row: row.rowNumber, action: 'CREATE', message: params.commit ? 'Valorizacion importada' : 'Valorizacion lista para importar', reference: valuationNumber })
    } catch (error) {
      pushResult(results, summary, { section: 'Valorizaciones', row: row.rowNumber, action: 'ERROR', message: error instanceof Error ? error.message : 'Error al procesar valorizacion', reference: valuationNumber })
    }
  }

  const invoiceRows = readSheet(workbook, 'Facturas', SHEETS[4].headers)
  for (const row of invoiceRows) {
    const contractNumber = asText(row.values.numeroContrato)
    const valuationNumber = asText(row.values.numeroValorizacion)
    const invoiceNumber = asText(row.values.numeroFactura)
    try {
      const contract = await prisma.contract.findUnique({ where: { contractNumber } })
      const contractId = contract?.id ?? createdIds.contracts.get(contractNumber)
      if (!contractId) throw new Error('Contrato no encontrado')
      const valuation =
        (await prisma.valuation.findFirst({ where: { contractId, valuationNumber }, include: { invoice: true } })) ??
        null
      const valuationId = valuation?.id ?? createdIds.valuations.get(`${contractNumber}:${valuationNumber}`)
      const issueDate = asDate(row.values.fechaEmision)
      if (!valuationId || !invoiceNumber || !issueDate) throw new Error('valorizacion, numeroFactura y fechaEmision son obligatorios')
      if (valuation?.invoice) {
        pushResult(results, summary, { section: 'Facturas', row: row.rowNumber, action: 'SKIP', message: 'La valorizacion ya tiene factura', reference: invoiceNumber })
        continue
      }
      if (params.commit) {
        await createInvoice(
          {
            valuationId,
            invoiceNumber,
            issueDate,
            dueDate: asDate(row.values.fechaVencimiento),
            currency: normalizeStatus(row.values.moneda, '') === 'USD' ? 'USD' : undefined,
            totalAmount: asNumber(row.values.montoTotal),
            status: normalizeStatus(row.values.estado, 'PENDIENTE') === 'OBSERVADA' ? 'OBSERVADA' : 'PENDIENTE',
            amountMismatchAccepted: boolFromText(row.values.aceptarDiferencia),
            notes: asText(row.values.notas) || undefined,
          },
          params.userId,
        )
      }
      pushResult(results, summary, { section: 'Facturas', row: row.rowNumber, action: 'CREATE', message: params.commit ? 'Factura importada' : 'Factura lista para importar', reference: invoiceNumber })
    } catch (error) {
      pushResult(results, summary, { section: 'Facturas', row: row.rowNumber, action: 'ERROR', message: error instanceof Error ? error.message : 'Error al procesar factura', reference: invoiceNumber })
    }
  }

  await fs.unlink(params.filePath).catch(() => undefined)

  return { commit: params.commit, summary, results }
}
