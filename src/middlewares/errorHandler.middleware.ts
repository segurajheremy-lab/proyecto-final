import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';

// ---------------------------------------------------------------------------
// AppError — operational errors with an HTTP status code
// ---------------------------------------------------------------------------

/**
 * Use AppError for expected, operational errors (e.g. "not found", "forbidden").
 * The errorHandler middleware will forward its statusCode and message directly
 * to the client.
 *
 * @example
 * throw new AppError('User not found', 404);
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'AppError';
    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// errorHandler middleware
// ---------------------------------------------------------------------------

/**
 * Centralized error handler. Must be registered as the LAST middleware.
 *
 * Handles:
 * - AppError              → err.statusCode + err.message
 * - ZodError              → 400 with per-field validation errors
 * - Mongoose duplicate    → 409 with field info
 * - Mongoose validation   → 400 with per-field messages
 * - Everything else       → 500 (stack trace only in development)
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === 'development';

  // 1. Operational errors thrown intentionally
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  // 2. Zod validation errors (from schema.parse() in controllers)
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.') || 'body',
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: errors[0]?.message ?? 'Error de validación.',
      errors,
    });
    return;
  }

  // 3. MongoDB duplicate key (e.g. unique index violation)
  const mongoErr = err as MongoServerError;
  if (mongoErr.code === 11000) {
    const fields = mongoErr.keyValue
      ? Object.keys(mongoErr.keyValue).join(', ')
      : 'unknown field';
    res.status(409).json({
      success: false,
      message: `Ya existe un registro con esos datos. Campo(s) duplicado(s): ${fields}.`,
    });
    return;
  }

  // 4. Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: 'Error de validación.',
      errors,
    });
    return;
  }

  // 5. Unknown / programming errors — log and return generic message
  console.error('[errorHandler] Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor.',
    ...(isDev && { stack: err.stack }),
  });
}
