import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis as connection } from './redis';

export const searchQueue = new Queue('search-tasks', { connection });

export { connection };
