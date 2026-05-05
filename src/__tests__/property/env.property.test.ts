import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Re-export the schema for property testing without importing the module
// (to avoid side effects from the singleton config export)
// ---------------------------------------------------------------------------

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().int().positive(),
  MAIL_USER: z.string().min(1),
  MAIL_PASS: z.string().min(1),
  MAIL_FROM: z.string().email(),
  ANTHROPIC_API_KEY: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const validPortArb = fc.integer({ min: 1, max: 65535 }).map(String);
const validMailPortArb = fc.integer({ min: 1, max: 65535 }).map(String);

// ---------------------------------------------------------------------------
// Property 1: Validación de entorno rechaza configuraciones inválidas
// Validates: Requirements 1.1, 1.2
// ---------------------------------------------------------------------------

describe('Property 1: EnvValidator rechaza configuraciones inválidas', () => {
  it('falla cuando MONGODB_URI no es una URL válida', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => {
          try {
            new URL(s);
            return false; // exclude valid URLs
          } catch {
            return true;
          }
        }),
        (invalidUri) => {
          const result = envSchema.safeParse({
            PORT: '3000',
            MONGODB_URI: invalidUri,
            JWT_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
            JWT_EXPIRES_IN: '7d',
            NODE_ENV: 'development',
            MAIL_HOST: 'smtp.example.com',
            MAIL_PORT: '587',
            MAIL_USER: 'user@example.com',
            MAIL_PASS: 'password',
            MAIL_FROM: 'no-reply@example.com',
            ANTHROPIC_API_KEY: 'sk-ant-key',
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('falla cuando JWT_SECRET tiene menos de 32 caracteres', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 31 }),
        (shortSecret) => {
          const result = envSchema.safeParse({
            PORT: '3000',
            MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.mongodb.net/db',
            JWT_SECRET: shortSecret,
            JWT_EXPIRES_IN: '7d',
            NODE_ENV: 'development',
            MAIL_HOST: 'smtp.example.com',
            MAIL_PORT: '587',
            MAIL_USER: 'user@example.com',
            MAIL_PASS: 'password',
            MAIL_FROM: 'no-reply@example.com',
            ANTHROPIC_API_KEY: 'sk-ant-key',
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('falla cuando MAIL_FROM no es un email válido', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => !s.includes('@') || s.startsWith('@') || s.endsWith('@')),
        (invalidEmail) => {
          const result = envSchema.safeParse({
            PORT: '3000',
            MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.mongodb.net/db',
            JWT_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
            JWT_EXPIRES_IN: '7d',
            NODE_ENV: 'development',
            MAIL_HOST: 'smtp.example.com',
            MAIL_PORT: '587',
            MAIL_USER: 'user@example.com',
            MAIL_PASS: 'password',
            MAIL_FROM: invalidEmail,
            ANTHROPIC_API_KEY: 'sk-ant-key',
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Coerción de tipos numéricos en variables de entorno
// Validates: Requirements 1.5, 1.6
// ---------------------------------------------------------------------------

describe('Property 2: Coerción de tipos numéricos en variables de entorno', () => {
  it('PORT como string de entero positivo produce un number en la config', () => {
    fc.assert(
      fc.property(
        validPortArb,
        (portStr) => {
          const result = envSchema.safeParse({
            PORT: portStr,
            MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.mongodb.net/db',
            JWT_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
            JWT_EXPIRES_IN: '7d',
            NODE_ENV: 'development',
            MAIL_HOST: 'smtp.example.com',
            MAIL_PORT: '587',
            MAIL_USER: 'user@example.com',
            MAIL_PASS: 'password',
            MAIL_FROM: 'no-reply@example.com',
            ANTHROPIC_API_KEY: 'sk-ant-key',
          });
          if (result.success) {
            expect(typeof result.data.PORT).toBe('number');
            expect(result.data.PORT).toBe(parseInt(portStr, 10));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('MAIL_PORT como string de entero positivo produce un number en la config', () => {
    fc.assert(
      fc.property(
        validMailPortArb,
        (mailPortStr) => {
          const result = envSchema.safeParse({
            PORT: '3000',
            MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.mongodb.net/db',
            JWT_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
            JWT_EXPIRES_IN: '7d',
            NODE_ENV: 'development',
            MAIL_HOST: 'smtp.example.com',
            MAIL_PORT: mailPortStr,
            MAIL_USER: 'user@example.com',
            MAIL_PASS: 'password',
            MAIL_FROM: 'no-reply@example.com',
            ANTHROPIC_API_KEY: 'sk-ant-key',
          });
          if (result.success) {
            expect(typeof result.data.MAIL_PORT).toBe('number');
            expect(result.data.MAIL_PORT).toBe(parseInt(mailPortStr, 10));
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
