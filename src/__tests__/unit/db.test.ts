import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Mock the env config so db.ts doesn't trigger validateEnv side effects
// ---------------------------------------------------------------------------

vi.mock('../../config/env', () => ({
  config: {
    MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.mongodb.net/db',
  },
}));

describe('connectDB', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: number | string | null | undefined) => {
      throw new Error(`process.exit called with code ${_code}`);
    });
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.resetModules();
  });

  it('logs the connected host on successful connection', async () => {
    const fakeHost = 'cluster.example.mongodb.net';
    vi.spyOn(mongoose, 'connect').mockResolvedValueOnce({
      connection: { host: fakeHost },
    } as unknown as typeof mongoose);

    const { connectDB } = await import('../../config/db');
    await connectDB();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(fakeHost)
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('logs the error and calls process.exit(1) on connection failure', async () => {
    const errorMessage = 'Authentication failed';
    vi.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error(errorMessage));

    const { connectDB } = await import('../../config/db');

    await expect(connectDB()).rejects.toThrow('process.exit called with code 1');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(errorMessage)
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
