import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'a-very-long-secret-key-that-is-at-least-32-chars';
const WRONG_SECRET = 'wrong-secret-key-that-is-at-least-32-chars-long';

vi.mock('../../config/env', () => ({
  config: { JWT_SECRET: TEST_SECRET },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockReq(authHeader?: string): Partial<Request> {
  return { headers: authHeader ? { authorization: authHeader } : {} };
}

function createMockRes() {
  const jsonMock = vi.fn();
  const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
  return {
    res: { status: statusMock } as unknown as Response,
    statusMock,
    jsonMock,
  };
}

// ---------------------------------------------------------------------------
// Property 5: AuthMiddleware rechaza tokens inválidos
// Validates: Requirements 5.3, 5.4
// ---------------------------------------------------------------------------

describe('Property 5: AuthMiddleware rechaza tokens inválidos', () => {
  it('responde 401 para cualquier token firmado con un secreto incorrecto', async () => {
    const { authMiddleware } = await import('../../middlewares/auth.middleware');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          sub: fc.uuid(),
          email: fc.emailAddress(),
          role: fc.constantFrom('user', 'admin'),
        }),
        async (payload) => {
          const tokenWithWrongSecret = jwt.sign(payload, WRONG_SECRET, { expiresIn: '1h' });
          const req = createMockReq(`Bearer ${tokenWithWrongSecret}`);
          const { res, statusMock } = createMockRes();
          const next = vi.fn() as unknown as NextFunction;

          authMiddleware(req as Request, res, next);

          expect(statusMock).toHaveBeenCalledWith(401);
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('responde 401 para cualquier string arbitrario como token', async () => {
    const { authMiddleware } = await import('../../middlewares/auth.middleware');

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => !s.includes(' ')),
        async (randomToken) => {
          const req = createMockReq(`Bearer ${randomToken}`);
          const { res, statusMock } = createMockRes();
          const next = vi.fn() as unknown as NextFunction;

          authMiddleware(req as Request, res, next);

          // A random string is almost certainly not a valid JWT
          // (it would need to be a valid JWT signed with TEST_SECRET)
          try {
            jwt.verify(randomToken, TEST_SECRET);
            // If it somehow verifies, next() should have been called — skip assertion
          } catch {
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: AuthMiddleware acepta tokens válidos
// Validates: Requirements 5.1, 5.2
// ---------------------------------------------------------------------------

describe('Property 6: AuthMiddleware acepta tokens válidos', () => {
  it('llama a next() y popula req.user para cualquier JWT válido no expirado', async () => {
    const { authMiddleware } = await import('../../middlewares/auth.middleware');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          sub: fc.uuid(),
          email: fc.emailAddress(),
          role: fc.constantFrom('user', 'admin'),
        }),
        async (payload) => {
          const validToken = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
          const req = createMockReq(`Bearer ${validToken}`) as Request;
          const { res, statusMock } = createMockRes();
          const next = vi.fn() as unknown as NextFunction;

          authMiddleware(req, res, next);

          expect(next).toHaveBeenCalledOnce();
          expect(statusMock).not.toHaveBeenCalled();
          expect(req.user).toBeDefined();
          expect(req.user?.sub).toBe(payload.sub);
          expect(req.user?.email).toBe(payload.email);
          expect(req.user?.role).toBe(payload.role);
        }
      ),
      { numRuns: 100 }
    );
  });
});
