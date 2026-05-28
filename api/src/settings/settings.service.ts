import { z } from 'zod'
import { env } from '../config/env'
import { prisma } from '../db/prisma'
import { updateAlertSettingsSchema, updateContractTemplateSchema } from './settings.schemas'

const ALERT_SETTING_KEYS = {
  invoiceDaysBeforeDue: 'alerts.invoiceDaysBeforeDue',
  contractDaysBeforeDue: 'alerts.contractDaysBeforeDue',
  dailyOverdueReminderEnabled: 'alerts.dailyOverdueReminderEnabled',
} as const

const CONTRACT_TEMPLATE_KEY = 'contracts.template'

export const DEFAULT_CONTRACT_TEMPLATE = `CONTRATO DE SERVICIO DE ALQUILER DE EQUIPO

Conste por el presente documento el contrato de servicio de alquiler que celebran, de una parte, INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL, con RUC 20220199968, a quien en adelante se denominara EL CONTRATANTE; y de la otra parte {{supplierName}}, con RUC {{supplierRuc}}, a quien en adelante se denominara EL PROVEEDOR.

PRIMERA: OBJETO
EL PROVEEDOR entrega en alquiler el/los siguiente(s) equipo(s) o vehiculo(s) para la sede u obra {{siteName}}:
{{equipmentList}}

SEGUNDA: PLAZO
El servicio inicia el {{startDate}} y culmina el {{endDate}}, salvo ampliacion, suspension o cierre anticipado acordado por las partes.

TERCERA: TARIFA Y MONEDA
La modalidad de cobro sera por {{billingMode}}, con una tarifa de {{currency}} {{rate}}. Las valorizaciones y facturas se emitiran en {{currency}}, salvo acuerdo escrito distinto.

CUARTA: VALORIZACION Y FACTURACION
Las valorizaciones se revisaran conforme al avance o periodo pactado. La factura asociada vencera a los {{invoiceDueDays}} dias calendario desde su emision, salvo que se registre una fecha de vencimiento distinta.

QUINTA: DOCUMENTOS DE RESPALDO
El contrato firmado, orden de servicio, valorizaciones emitidas, facturas y comprobantes de pago deberan conservarse en la carpeta documentaria del contrato.

SEXTA: OBSERVACIONES
{{notes}}

Firmado por las partes en senal de conformidad.

EL CONTRATANTE: INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL
EL PROVEEDOR: {{supplierName}}
CONTRATO: {{contractNumber}}`

export type AlertSettings = z.infer<typeof updateAlertSettingsSchema>
export type ContractTemplateSettings = z.infer<typeof updateContractTemplateSchema>

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

export async function getAlertSettings(): Promise<AlertSettings> {
  const settings = await prisma.appSetting.findMany({
    where: {
      key: {
        in: Object.values(ALERT_SETTING_KEYS),
      },
    },
  })
  const map = new Map(settings.map((setting) => [setting.key, setting.value]))

  return {
    invoiceDaysBeforeDue: parseNumber(
      map.get(ALERT_SETTING_KEYS.invoiceDaysBeforeDue),
      env.ALERT_DAYS_BEFORE_DUE,
    ),
    contractDaysBeforeDue: parseNumber(
      map.get(ALERT_SETTING_KEYS.contractDaysBeforeDue),
      env.CONTRACT_ALERT_DAYS_BEFORE_DUE,
    ),
    dailyOverdueReminderEnabled: parseBoolean(
      map.get(ALERT_SETTING_KEYS.dailyOverdueReminderEnabled),
      true,
    ),
  }
}

export async function updateAlertSettings(input: AlertSettings, userId?: string) {
  const data = updateAlertSettingsSchema.parse(input)

  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: ALERT_SETTING_KEYS.invoiceDaysBeforeDue },
      update: { value: String(data.invoiceDaysBeforeDue) },
      create: { key: ALERT_SETTING_KEYS.invoiceDaysBeforeDue, value: String(data.invoiceDaysBeforeDue) },
    }),
    prisma.appSetting.upsert({
      where: { key: ALERT_SETTING_KEYS.contractDaysBeforeDue },
      update: { value: String(data.contractDaysBeforeDue) },
      create: { key: ALERT_SETTING_KEYS.contractDaysBeforeDue, value: String(data.contractDaysBeforeDue) },
    }),
    prisma.appSetting.upsert({
      where: { key: ALERT_SETTING_KEYS.dailyOverdueReminderEnabled },
      update: { value: String(data.dailyOverdueReminderEnabled) },
      create: {
        key: ALERT_SETTING_KEYS.dailyOverdueReminderEnabled,
        value: String(data.dailyOverdueReminderEnabled),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        entityType: 'SETTINGS',
        entityId: 'alerts',
        action: 'UPDATE_ALERT_SETTINGS',
        metadata: data,
      },
    }),
  ])

  return getAlertSettings()
}

export async function getContractTemplate(): Promise<ContractTemplateSettings> {
  const setting = await prisma.appSetting.findUnique({ where: { key: CONTRACT_TEMPLATE_KEY } })
  return { template: setting?.value ?? DEFAULT_CONTRACT_TEMPLATE }
}

export async function updateContractTemplate(input: ContractTemplateSettings, userId?: string) {
  const data = updateContractTemplateSchema.parse(input)

  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: CONTRACT_TEMPLATE_KEY },
      update: { value: data.template },
      create: { key: CONTRACT_TEMPLATE_KEY, value: data.template },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        entityType: 'SETTINGS',
        entityId: 'contracts.template',
        action: 'UPDATE_CONTRACT_TEMPLATE',
        metadata: { length: data.template.length },
      },
    }),
  ])

  return getContractTemplate()
}
