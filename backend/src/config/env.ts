import { z } from 'zod'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const envSchema = z.object({
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('8h'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  MAIL_HOST: z.string(),
  MAIL_PORT: z.string(),
  MAIL_USER: z.string(),
  MAIL_PASS: z.string(),
  MAIL_FROM: z.string(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:', parsed.error.format())
  process.exit(1)
}

export const env = parsed.data