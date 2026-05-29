import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.string().url().default('http://127.0.0.1:5174'),
  APP_URLS: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  JWT_EXPIRES_IN: z.string().default('8h'),
  FILE_STORAGE_MODE: z.enum(['LOCAL_VISIBLE', 'CLOUD_STORAGE']).default('LOCAL_VISIBLE'),
  LOCAL_STORAGE_ROOT: z.string().min(1).default('E:/ISEM_ARCHIVOS'),
  ALERT_DAYS_BEFORE_DUE: z.coerce.number().int().positive().default(3),
  CONTRACT_ALERT_DAYS_BEFORE_DUE: z.coerce.number().int().positive().default(3),
})

export const env = envSchema.parse(process.env)

export const allowedAppOrigins = Array.from(
  new Set([
    env.APP_URL,
    ...(env.APP_URLS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]),
)

export function isAllowedAppOrigin(origin?: string) {
  if (!origin) return true
  if (allowedAppOrigins.includes(origin)) return true

  try {
    const url = new URL(origin)
    return ['localhost', '127.0.0.1'].includes(url.hostname)
  } catch {
    return false
  }
}
