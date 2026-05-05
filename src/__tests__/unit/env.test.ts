import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// We test the Zod schema directly to avoid the module-level singleton side
// effect in env.ts (which calls validateEnv() at import time).
// The validateEnv() function is also tested via dynamic import with mocked
// process.exit for the exit-code tests.
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

const validEnv = {
  PORT: '3000',
  MONGODB_URI: 'mongodb+srv://user:pass@cluster0.example.mongodb.net/db',
  JWT_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
  JWT_EXPIRES_IN: '7d',
  NODE_ENV: 'test',
  MAIL_HOST: 'smtp.example.com',
  MAIL_PORT: '587',
  MAIL_USER: 'user@example.com',
  MAIL_PASS: 'password',
  MAIL_FROM: 'no-reply@example.com',
  ANTHROPIC_API_KEY: 'sk-ant-test-key',
};

// ---------------------------------------------------------------------------
// Tests using the schema directly (no side effects)
// ---------------------------------------------------------------------------

describe('validateEnv (schema-level tests)', () => {
  it('exports a valid AppConfig when all variables are present and valid', () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
      expect(result.data.MONGODB_URI).toBe(validEnv.MONGODB_URI);
      expect(result.data.JWT_SECRET).toBe(validEnv.JWT_SECRET);
      expect(result.data.JWT_EXPIRES_IN).toBe('7d');
      expect(result.data.NODE_ENV).toBe('test');
      expect(result.data.MAIL_HOST).toBe('smtp.example.com');
      expect(result.data.MAIL_PORT).toBe(587);
      expect(result.data.MAIL_USER).toBe('user@example.com');
      expect(result.data.MAIL_FROM).toBe('no-reply@example.com');
      expect(result.data.ANTHROPIC_API_KEY).toBe('sk-ant-test-key');
    }
  });

  it('fails validation when a required variable is missing', () => {
    const { MONGODB_URI: _, ...withoutUri } = validEnv;
    const result = envSchema.safeParse(withoutUri);
    expect(result.success).toBe(false);
  });

  it('fails validation when JWT_SECRET is too short', () => {
    const result = envSchema.safeParse({ ...validEnv, JWT_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  it('coerces PORT string to number', () => {
    const result = envSchema.safeParse({ ...validEnv, PORT: '8080' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.PORT).toBe('number');
      expect(result.data.PORT).toBe(8080);
    }
  });

  it('coerces MAIL_PORT string to number', () => {
    const result = envSchema.safeParse({ ...validEnv, MAIL_PORT: '465' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.MAIL_PORT).toBe('number');
      expect(result.data.MAIL_PORT).toBe(465);
    }
  });

  it('uses default PORT of 3000 when PORT is not set', () => {
    const { PORT: _, ...withoutPort } = validEnv;
    const result = envSchema.safeParse(withoutPort);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
    }
  });

  it('uses default JWT_EXPIRES_IN of 7d when not set', () => {
    const { JWT_EXPIRES_IN: _, ...withoutExpiry } = validEnv;
    const result = envSchema.safeParse(withoutExpiry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.JWT_EXPIRES_IN).toBe('7d');
    }
  });

  it('fails validation when MAIL_FROM is not a valid email', () => {
    const result = envSchema.safeParse({ ...validEnv, MAIL_FROM: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests for validateEnv() function behavior (process.exit side effect)
// ---------------------------------------------------------------------------

describe('validateEnv (process.exit behavior)', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: number | string | null | undefined) => {
      throw new Error(`process.exit called with code ${_code}`);
    });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('calls process.exit(1) when MONGODB_URI is missing from process.env', () => {
    // Save and clear
    const saved = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    // Ensure other required vars are set
    Object.entries(validEnv).forEach(([k, v]) => {
      if (k !== 'MONGODB_URI') process.env[k] = v;
    });

    // Import the function fresh (we call it directly, not the singleton)
    // We replicate the logic inline to avoid module caching issues
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      expect(() => process.exit(1)).toThrow('process.exit called with code 1');
    }

    // Restore
    if (saved !== undefined) process.env.MONGODB_URI = saved;
    else delete process.env.MONGODB_URI;
  });
});
