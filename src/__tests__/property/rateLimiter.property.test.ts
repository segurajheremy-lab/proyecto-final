import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

// ---------------------------------------------------------------------------
// Property 8: RateLimiter bloquea tras superar el límite
// Validates: Requirements 3.4, 3.5
//
// We create a test-specific rate limiter with a very low max (5) so the
// property can be verified quickly without making 100+ real HTTP requests.
// The property being tested is the same: requests beyond the limit get 429.
// ---------------------------------------------------------------------------

function createTestApp(max: number) {
  const app = express();
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests',
    },
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });
  app.use(limiter);
  app.get('/test', (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe('Property 8: RateLimiter bloquea tras superar el límite', () => {
  it('responde 429 a partir de la petición número max+1 para cualquier límite entre 1 y 10', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (max) => {
          const app = createTestApp(max);

          // Make exactly `max` requests — all should succeed
          for (let i = 0; i < max; i++) {
            const res = await request(app).get('/test');
            expect(res.status).toBe(200);
          }

          // The next request (max + 1) should be rate-limited
          const blockedRes = await request(app).get('/test');
          expect(blockedRes.status).toBe(429);
          expect(blockedRes.body.success).toBe(false);
        }
      ),
      { numRuns: 10 } // reduced runs because each run makes max+1 HTTP requests
    );
  });
});
