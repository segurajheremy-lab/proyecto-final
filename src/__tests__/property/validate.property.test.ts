import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../../middlewares/validate.middleware';

// ---------------------------------------------------------------------------
// Test schema: name (string), email (email), age (positive int, optional)
// ---------------------------------------------------------------------------

const testSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockReq(body: unknown): Partial<Request> {
  return { body };
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
// Property 3: Validación de body rechaza payloads inválidos
// Validates: Requirements 6.1, 6.2, 6.3
// ---------------------------------------------------------------------------

describe('Property 3: validateBody rechaza payloads inválidos', () => {
  it('responde 400 con array de errores para cualquier body con name como número', () => {
    const middleware = validateBody(testSchema);

    fc.assert(
      fc.property(
        fc.record({
          name: fc.integer(), // name should be string, not integer
          email: fc.emailAddress(),
        }),
        (invalidBody) => {
          const req = createMockReq(invalidBody);
          const { res, statusMock, jsonMock } = createMockRes();
          const next = vi.fn() as unknown as NextFunction;

          middleware(req as Request, res, next);

          expect(statusMock).toHaveBeenCalledWith(400);
          const body = jsonMock.mock.calls[0][0];
          expect(body.success).toBe(false);
          expect(Array.isArray(body.errors)).toBe(true);
          expect(body.errors.length).toBeGreaterThan(0);
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('responde 400 con array de errores para cualquier body con email inválido', () => {
    const middleware = validateBody(testSchema);

    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1 }),
          email: fc.string({ minLength: 1 }).filter((s) => !s.includes('@') || s.startsWith('@')),
        }),
        (invalidBody) => {
          const req = createMockReq(invalidBody);
          const { res, statusMock, jsonMock } = createMockRes();
          const next = vi.fn() as unknown as NextFunction;

          middleware(req as Request, res, next);

          expect(statusMock).toHaveBeenCalledWith(400);
          const body = jsonMock.mock.calls[0][0];
          expect(body.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ field: expect.any(String), message: expect.any(String) }),
            ])
          );
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Validación de body acepta payloads válidos
// Validates: Requirements 6.1, 6.2
// ---------------------------------------------------------------------------

// Build a constrained email arbitrary that Zod's .email() always accepts:
// format: <localPart>@<domain>.<tld>
const safeEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{2,8}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{2,8}$/),
    fc.constantFrom('com', 'net', 'org', 'io')
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

// Build a constrained name arbitrary: non-empty, no leading/trailing spaces
const safeNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/);

describe('Property 4: validateBody acepta payloads válidos', () => {
  it('llama a next() sin modificar la respuesta para cualquier body válido', () => {
    const middleware = validateBody(testSchema);

    fc.assert(
      fc.property(
        fc.record({
          name: safeNameArb,
          email: safeEmailArb,
        }),
        (validBody) => {
          const req = createMockReq(validBody);
          const { res, statusMock, jsonMock } = createMockRes();
          const next = vi.fn() as unknown as NextFunction;

          middleware(req as Request, res, next);

          expect(next).toHaveBeenCalledOnce();
          expect(statusMock).not.toHaveBeenCalled();
          expect(jsonMock).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
