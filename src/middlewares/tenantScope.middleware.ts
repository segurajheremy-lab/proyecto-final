import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// tenantScope middleware
// ---------------------------------------------------------------------------

/**
 * Extracts tenantId from the authenticated user and exposes it as:
 *   - req.tenantId  — convenient shortcut used in controllers/services
 *
 * This guarantees that every downstream handler automatically operates
 * within the correct tenant boundary without having to read req.user.tenantId
 * manually every time.
 *
 * Must be used AFTER authenticate().
 *
 * @example
 * // In a controller:
 * const clients = await Client.find({ tenantId: req.tenantId });
 */
export function tenantScope(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.tenantId) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  // Expose as a top-level shortcut on the request object
  req.tenantId = req.user.tenantId;

  next();
}
