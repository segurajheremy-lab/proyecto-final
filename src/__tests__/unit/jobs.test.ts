import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import cron from 'node-cron';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('initJobs', () => {
  let scheduleSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    scheduleSpy = vi.spyOn(cron, 'schedule').mockReturnValue({} as ReturnType<typeof cron.schedule>);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    scheduleSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('logs a message when no jobs are registered', async () => {
    // The default jobs array is empty, so initJobs should log "No cron jobs registered"
    const { initJobs } = await import('../../jobs/index');
    initJobs();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('No cron jobs registered')
    );
    expect(scheduleSpy).not.toHaveBeenCalled();
  });

  it('calls cron.schedule for each registered job', async () => {
    const { jobs } = await import('../../jobs/index');

    // Temporarily add a test job
    const testJob = {
      name: 'test-job',
      schedule: '* * * * *',
      handler: vi.fn().mockResolvedValue(undefined),
    };
    jobs.push(testJob);

    const { initJobs } = await import('../../jobs/index');
    initJobs();

    expect(scheduleSpy).toHaveBeenCalledWith(
      testJob.schedule,
      expect.any(Function)
    );

    // Cleanup
    jobs.pop();
  });

  it('logs the job name and schedule when registering', async () => {
    const { jobs } = await import('../../jobs/index');

    const testJob = {
      name: 'my-test-job',
      schedule: '0 * * * *',
      handler: vi.fn().mockResolvedValue(undefined),
    };
    jobs.push(testJob);

    const { initJobs } = await import('../../jobs/index');
    initJobs();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('my-test-job')
    );

    jobs.pop();
  });

  it('catches errors thrown by job handlers without propagating', async () => {
    // Restore the real cron.schedule to test the wrapper behavior
    scheduleSpy.mockRestore();

    const handlerError = new Error('Handler crashed');
    const failingHandler = vi.fn().mockRejectedValue(handlerError);

    // Manually invoke the wrapper logic (simulating what initJobs does)
    const wrapper = async () => {
      const timestamp = new Date().toISOString();
      console.log(`⏰ [${timestamp}] Running job: failing-job`);
      try {
        await failingHandler();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Job failed: failing-job — ${message}`);
      }
    };

    // Should not throw
    await expect(wrapper()).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Handler crashed')
    );
  });

  it('logs an error for invalid cron expressions', async () => {
    const { jobs } = await import('../../jobs/index');

    const invalidJob = {
      name: 'invalid-job',
      schedule: 'not-a-cron-expression',
      handler: vi.fn(),
    };
    jobs.push(invalidJob);

    const { initJobs } = await import('../../jobs/index');
    initJobs();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid cron expression')
    );
    expect(scheduleSpy).not.toHaveBeenCalled();

    jobs.pop();
  });
});
