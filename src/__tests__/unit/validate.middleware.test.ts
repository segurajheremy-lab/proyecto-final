import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../../middlewares/validate.middleware';

// ---------------------------------------------------------------------------
// Test schema
// ---------------------------------------------------------------------------

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
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
// Tests
// ---------------------------------------------------------------------------

describe('validateBody', () => {
  it('calls next() when req.body conforms to the schema', () => {
    const middleware = validateBody(userSchema);
    const req = createMockReq({ name: 'Alice', email: 'alice@example.com' });
    const { res, statusMock } = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    middleware(req as Request, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('does not modify the response when body is valid', () => {
    const middleware = validateBody(userSchema);
    const req = createMockReq({ name: 'Bob', email: 'bob@example.com', age: 30 });
    const { res, jsonMock } = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    middleware(req as Request, res, next);

    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('responds 400 when req.body is missing required fields', () => {
    const middleware = validateBody(userSchema);
    const req = createMockReq({});
    const { res, statusMock, jsonMock } = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    middleware(req as Request, res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: expect.arrayContaining([
          expect.objectContaining({ field: expect.any(String), message: expect.any(String) }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 400 when email field is invalid', () => {
    const middleware = validateBody(userSchema);
    const req = createMockReq({ name: 'Charlie', email: 'not-an-email' });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    middleware(req as Request, res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    const body = jsonMock.mock.calls[0][0];
    expect(body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
      ])
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('includes field path and message in each error object', () => {
    const middleware = validateBody(userSchema);
    const req = createMockReq({ name: '', email: 'bad' });
    const { res, jsonMock } = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    middleware(req as Request, res, next);

    const body = jsonMock.mock.calls[0][0];
    body.errors.forEach((err: { field: string; message: string }) => {
      expect(err).toHaveProperty('field');
      expect(err).toHaveProperty('message');
      expect(typeof err.field).toBe('string');
      expect(typeof err.message).toBe('string');
    });
  });

  it('replaces req.body with the parsed data on success', () => {
    const trimSchema = z.object({ name: z.string().trim() });
    const middleware = validateBody(trimSchema);
    const req = createMockReq({ name: '  Alice  ' }) as Request;
    const { res } = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(req.body.name).toBe('Alice');
  });
});
