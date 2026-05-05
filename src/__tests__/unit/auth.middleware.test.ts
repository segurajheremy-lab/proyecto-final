import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'a-very-long-secret-key-that-is-at-least-32-chars';

// Mock the config module
vi.mock('../../config/env', () => ({
  config: {
    JWT_SECRET: TEST_SECRET,
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockReq(authHeader?: string): Partial<Request> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

function createMockRes(): { res: Partial<Response>; statusMock: ReturnType<typeof vi.fn>; jsonMock: ReturnType<typeof vi.fn> } {
  const jsonMock = vi.fn();
  const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
  const res: Partial<Response> = {
    status: statusMock as unknown as Response['status'],
  };
  return { res, statusMock, jsonMock };
}

function createMockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('responds 401 when Authorization header is absent', async () => {
    const { authMiddleware } = await import('../../middlewares/auth.middleware');
    const req = createMockReq();
    const { res, statusMock, jsonMock } = createMockRes();
    const next = createMockNext();

    authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when Authorization header does not start with Bearer', async () => {
    const { authMiddleware } = await import('../../middlewares/auth.middleware');
    const req = createMockReq('Basic sometoken');
    const { res, statusMock } = createMockRes();
    const next = createMockNext();

    authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when token has an invalid signature', async () => {
    const { authMiddleware } = await import('../../middlewares/auth.middleware');
    const tokenWithWrongSecret = jwt.sign(
      { sub: '123', email: 'test@example.com', role: 'user' },
      'wrong-secret-key-that-is-at-least-32-chars'
    );
    const req = createMockReq(`Bearer ${tokenWithWrongSecret}`);
    const { res, statusMock, jsonMock } = createMockRes();
    const next = createMockNext();

    authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when token is expired', async () => {
    const { authMiddleware } = await import('../../middlewares/auth.middleware');
    const expiredToken = jwt.sign(
      { sub: '123', email: 'test@example.com', role: 'user' },
      TEST_SECRET,
      { expiresIn: -1 } // already expired
    );
    const req = createMockReq(`Bearer ${expiredToken}`);
    const { res, statusMock, jsonMock } = createMockRes();
    const next = createMockNext();

    authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining('expired') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('populates req.user and calls next() for a valid token', async () => {
    const { authMiddleware } = await import('../../middlewares/auth.middleware');
    const payload = { sub: 'user-123', email: 'test@example.com', role: 'user' };
    const validToken = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
    const req = createMockReq(`Bearer ${validToken}`) as Request;
    const { res } = createMockRes();
    const next = createMockNext();

    authMiddleware(req, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeDefined();
    expect(req.user?.sub).toBe(payload.sub);
    expect(req.user?.email).toBe(payload.email);
    expect(req.user?.role).toBe(payload.role);
  });
});
