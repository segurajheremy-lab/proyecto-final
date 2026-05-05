import { validateEnv } from './config/env';
import { connectDB } from './config/db';
import { initJobs } from './jobs/index';
import app from './app';

/**
 * Application entry point.
 * Validates environment, connects to MongoDB, initializes cron jobs,
 * then starts the HTTP server.
 */
async function main(): Promise<void> {
  // 1. Validate environment variables (exits with code 1 if invalid)
  const cfg = validateEnv();

  // 2. Connect to MongoDB Atlas (exits with code 1 if connection fails)
  await connectDB();

  // 3. Initialize cron jobs (after DB is ready)
  initJobs();

  // 4. Start HTTP server
  app.listen(cfg.PORT, () => {
    console.log(`🚀 Server running on port ${cfg.PORT} [${cfg.NODE_ENV}]`);
  });
}

main().catch((error) => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
