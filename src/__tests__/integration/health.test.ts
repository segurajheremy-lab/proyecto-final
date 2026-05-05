import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Mock the config module so app.ts doesn't trigger validateEnv side effects
vi.mock('../../config/env', () => ({
  config: {
    PORT: 3000,
    NODE_ENV: 'test',
    JWT_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
    JWT_EXPIRES_IN: '7d',
    MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.mongodb.net/db',
    MAIL_HOST: 'smtp.example.com',
    MAIL_PORT: 587,
    MAIL_USER: 'user@example.com',
    MAIL_PASS: 'password',
    MAIL_FROM: 'no-reply@example.com',
    ANTHROPIC_API_KEY: 'sk-ant-test-key',
    CORS_ORIGIN: '*',
  },
  validateEnv: () => ({
    PORT: 3000,
    NODE_ENV: 'test',
  }),
}));

import { vi } from 'vitest';
import app from '../../app';

// ---------------------------------------------------------------------------
// Integration tests for GET /health
// Validates: Requirements 4.1, 4.2, 4.3
// ---------------------------------------------------------------------------

describe('GET /health', () => {
  it('responds with HTTP 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('returns JSON body with status "ok"', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('ok');
  });

  it('returns a timestamp field in ISO 8601 format', async () => {
    const res = await request(app).get('/health');
    expect(res.body.timestamp).toBeDefined();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('returns an uptime field as a positive number', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThan(0);
  });

  it('does not require an Authorization header', async () => {
    const res = await request(app)
      .get('/health')
      // No Authorization header
      ;
    expect(res.status).toBe(200);
  });

  it('returns Content-Type application/json', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
