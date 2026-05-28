import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.string().url().default('http://127.0.0.1:5174'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  JWT_EXPIRES_IN: z.string().default('8h'),
  FILE_STORAGE_MODE: z.enum(['LOCAL_VISIBLE', 'CLOUD_STORAGE']).default('LOCAL_VISIBLE'),
  LOCAL_STORAGE_ROOT: z.string().min(1).default('E:/ISEM_ARCHIVOS'),
  ALERT_DAYS_BEFORE_DUE: z.coerce.number().int().positive().default(3),
  CONTRACT_ALERT_DAYS_BEFORE_DUE: z.coerce.number().int().positive().default(3),
})

export const env = envSchema.parse(process.env)

