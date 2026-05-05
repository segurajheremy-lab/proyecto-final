import mongoose from 'mongoose';
import { config } from './env';

/**
 * Establishes a connection to MongoDB Atlas using the MONGODB_URI from config.
 * Logs the connected host on success.
 * Logs the error and terminates the process with exit code 1 on failure.
 */
export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ MongoDB connection failed: ${message}`);
    process.exit(1);
  }
}
