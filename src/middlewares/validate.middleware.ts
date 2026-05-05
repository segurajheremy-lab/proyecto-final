import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware factory.
 * Accepts a Zod schema and returns a middleware that validates req.body against it.
 *
 * - If validation passes: calls next()
 * - If validation fails: responds with HTTP 400 and an array of field errors
 */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace req.body with the parsed (and potentially transformed) data
    req.body = result.data;
    next();
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FieldError {
  field: string;
  message: string;
}

function formatZodErrors(error: ZodError): FieldError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.') || 'body',
    message: err.message,
  }));
}
