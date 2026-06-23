import mongoose from 'mongoose';
import { validateEnv } from './environment';

let connectionPromise: Promise<typeof mongoose> | null = null;

/**
 * Returns a singleton Mongoose connection.
 * Safe to call multiple times — only connects once per process.
 */
export async function getMongoConnection(): Promise<typeof mongoose> {
    if (connectionPromise) return connectionPromise;

    const env = validateEnv();

    connectionPromise = mongoose.connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        serverSelectionTimeoutMS: 5000,
    }).catch(err => {
        connectionPromise = null;
        throw err;
    });

    return connectionPromise;
}

/**
 * Disconnects from MongoDB. Used in tests and graceful shutdown.
 */
export async function closeMongoConnection(): Promise<void> {
    connectionPromise = null;
    await mongoose.disconnect();
}
