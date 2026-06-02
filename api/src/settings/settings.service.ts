import { z } from 'zod'
import { env } from '../config/env'
import { prisma } from '../db/prisma'
import { DEFAULT_CONTRACT_TEMPLATE } from './contract-template'
import { updateAlertSettingsSchema, updateContractTemplateSchema } from './settings.schemas'

const ALERT_SETTING_KEYS = {
  invoiceDaysBeforeDue: 'alerts.invoiceDaysBeforeDue',
  contractDaysBeforeDue: 'alerts.contractDaysBeforeDue',
  dailyOverdueReminderEnabled: 'alerts.dailyOverdueReminderEnabled',
} as const

const CONTRACT_TEMPLATE_KEY = 'contracts.template'

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
