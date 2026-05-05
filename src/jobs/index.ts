import cron from 'node-cron';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JobDefinition {
  /** Human-readable name for logging */
  name: string;
  /** Cron expression (e.g. '0 * * * *' for every hour) */
  schedule: string;
  /** The async or sync function to execute on each tick */
  handler: () => Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Job registry
// ---------------------------------------------------------------------------

/**
 * All registered job definitions.
 * Add new jobs here — they will be automatically scheduled by initJobs().
 */
const jobs: JobDefinition[] = [
  // Example job: runs every day at midnight
  // {
  //   name: 'daily-cleanup',
  //   schedule: '0 0 * * *',
  //   handler: async () => {
  //     // TODO: implement cleanup logic
  //   },
  // },
];

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

/**
 * Initializes all registered cron jobs.
 * Each job is wrapped with logging and error handling so that a failing
 * handler does not stop future executions.
 *
 * Should be called after the database connection is established.
 */
export function initJobs(): void {
  if (jobs.length === 0) {
    console.log('ℹ️  No cron jobs registered.');
    return;
  }

  jobs.forEach((job) => {
    if (!cron.validate(job.schedule)) {
      console.error(`❌ Invalid cron expression for job "${job.name}": ${job.schedule}`);
      return;
    }

    cron.schedule(job.schedule, async () => {
      const timestamp = new Date().toISOString();
      console.log(`⏰ [${timestamp}] Running job: ${job.name}`);

      try {
        await job.handler();
        console.log(`✅ [${new Date().toISOString()}] Job completed: ${job.name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ [${new Date().toISOString()}] Job failed: ${job.name} — ${message}`);
      }
    });

    console.log(`📅 Scheduled job: ${job.name} (${job.schedule})`);
  });
}

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

export { jobs };
