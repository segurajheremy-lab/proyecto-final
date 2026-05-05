import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express'; // Importa el tipo desde express directamente

// Tu configuración de rateLimit...

/**
 * Global rate limiter middleware.
 * Allows a maximum of 100 requests per 15-minute window per IP address.
 * Responds with HTTP 429 and a descriptive JSON error when the limit is exceeded.
 */
export const rateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});
