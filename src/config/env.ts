import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MAIL_HOST: z.string().min(1, 'MAIL_HOST is required'),
  MAIL_PORT: z.coerce.number().int().positive('MAIL_PORT must be a positive integer'),
  MAIL_USER: z.string().min(1, 'MAIL_USER is required'),
  MAIL_PASS: z.string().min(1, 'MAIL_PASS is required'),
  MAIL_FROM: z.string().email('MAIL_FROM must be a valid email address'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppConfig = z.infer<typeof envSchema>;

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validates all required environment variables using the Zod schema.
 * Logs each validation error and terminates the process with exit code 1
 * if any variable is missing or invalid.
 */
export function validateEnv(): AppConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.errors.forEach((err) => {
      const field = err.path.join('.');
      console.error(`  - ${field}: ${err.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Singleton config — validated once at module load time
// ---------------------------------------------------------------------------

export const config: AppConfig = validateEnv();
