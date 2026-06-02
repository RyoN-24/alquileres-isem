import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default('http://127.0.0.1:5174'),
  ),
  APP_URLS: z.preprocess(emptyStringToUndefined, z.string().optional()),
  DATABASE_URL: z.preprocess(emptyStringToUndefined, z.string().min(1)),
  JWT_SECRET: z.preprocess(emptyStringToUndefined, z.string().min(24)),
  JWT_EXPIRES_IN: z.preprocess(emptyStringToUndefined, z.string().default('8h')),
  FILE_STORAGE_MODE: z.enum(['LOCAL_VISIBLE', 'CLOUD_STORAGE']).default('LOCAL_VISIBLE'),
  LOCAL_STORAGE_ROOT: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).default('E:/ISEM_ARCHIVOS'),
  ),
  SUPABASE_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyStringToUndefined, z.string().optional()),
  SUPABASE_STORAGE_BUCKET: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).default('isem-documentos'),
  ),
  ALERT_DAYS_BEFORE_DUE: z.coerce.number().int().positive().default(3),
  CONTRACT_ALERT_DAYS_BEFORE_DUE: z.coerce.number().int().positive().default(3),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
  throw new Error(`Configuracion de entorno invalida: ${issues}`)
}

export const env = parsedEnv.data

if (env.FILE_STORAGE_MODE === 'CLOUD_STORAGE' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error(
    'Configuracion de entorno invalida: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorios con CLOUD_STORAGE'
  )
}

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
