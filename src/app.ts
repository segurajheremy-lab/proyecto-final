import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { rateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler.middleware';
import healthRouter from './routes/health.route';
import apiRouter from './routes/index';

// ---------------------------------------------------------------------------
// CORS options
// ---------------------------------------------------------------------------

const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// JSON body parser
app.use(express.json());

// Global rate limiter
app.use(rateLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check (no auth required)
app.use('/health', healthRouter);

// API v1
app.use('/api/v1', apiRouter);

// ---------------------------------------------------------------------------
// Centralized error handler (must be last)
// ---------------------------------------------------------------------------

app.use(errorHandler);

export default app;
