import { z } from 'zod'

export const updateAlertSettingsSchema = z.object({
  invoiceDaysBeforeDue: z.number().int().min(0).max(30),
  contractDaysBeforeDue: z.number().int().min(0).max(90),
  dailyOverdueReminderEnabled: z.boolean(),
})

export const updateContractTemplateSchema = z.object({
  template: z.string().min(50).max(20000),
})
