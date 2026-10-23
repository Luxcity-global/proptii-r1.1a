/**
 * Shared SSE ticket store — used by FirebaseAuthGuard (validation)
 * and CommunicationController (issuance + consumption).
 *
 * Tickets are short-lived (60 s) opaque UUIDs stored in Redis (with in-memory fallback)
 * that let the browser open an EventSource connection without exposing the Bearer token in the URL.
 */

import { getRedisClient } from './redis-client';

export interface SseTicketInfo {
  uid: string;
  email: string;
  role: string;
  expiresAt: number; // unix ms
}

const localStore = new Map<string, SseTicketInfo>();

/** Prune expired tickets from in-memory fallback store every 30 s */
setInterval(() => {
  const now = Date.now();
  localStore.forEach((v, k) => {
    if (v.expiresAt < now) localStore.delete(k);
  });
}, 30_000);

export async function setSseTicket(ticket: string, info: SseTicketInfo): Promise<void> {
  localStore.set(ticket, info);
  try {
    const redis = getRedisClient();
    const ttlSeconds = Math.max(1, Math.ceil((info.expiresAt - Date.now()) / 1000));
    await redis.set(`sse:ticket:${ticket}`, JSON.stringify(info), 'EX', ttlSeconds);
  } catch (err: any) {
    // Redis unavailable; localStore handles fallback
  }
}

export async function getSseTicketInfo(ticket: string): Promise<SseTicketInfo | undefined> {
  if (!ticket) return undefined;
  try {
    const redis = getRedisClient();
    const raw = await redis.get(`sse:ticket:${ticket}`);
    if (raw) {
      const parsed = JSON.parse(raw) as SseTicketInfo;
      return parsed;
    }
  } catch (err: any) {
    // fallback to in-memory store
  }
  return localStore.get(ticket);
}

export function getSseTicketInfoSync(ticket: string): SseTicketInfo | undefined {
  return localStore.get(ticket);
}

export async function deleteSseTicket(ticket: string): Promise<void> {
  localStore.delete(ticket);
  try {
    const redis = getRedisClient();
    await redis.del(`sse:ticket:${ticket}`);
  } catch (err: any) {
    // ignore
  }
}
