import { Queue } from 'bullmq';
import { getBullMqConnection } from './redis';

let searchQueue: Queue | null = null;

export function getSearchQueue(): Queue | null {
  const connection = getBullMqConnection();
  if (!connection) return null;
  if (!searchQueue) {
    searchQueue = new Queue('search-tasks', { connection });
  }
  return searchQueue;
}
