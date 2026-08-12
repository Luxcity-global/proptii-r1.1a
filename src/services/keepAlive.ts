/**
 * keepAlive.ts
 *
 * Client-side background heartbeat service that periodically pings the backend
 * (/api/health) every 4 minutes to ensure the server dyno/instance never spins down
 * in production environments (Render, Fly, Railway).
 */

import apiService from './api';
import { resolveSearchBackendUrl } from '../utils/searchBackendUrl';

const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

let timerId: ReturnType<typeof setInterval> | null = null;

export function startKeepAlivePing(): void {
  if (timerId) return;

  const ping = async () => {
    try {
      // 1. Main API Backend Keep-Alive
      await apiService.get('/health').catch(() => null);

      // 2. Search Service Keep-Alive
      const searchServiceUrl = resolveSearchBackendUrl();

      await fetch(`${searchServiceUrl.replace(/\/$/, '')}/health`, { method: 'GET', mode: 'cors' }).catch(() => null);
    } catch {
      // Ignore background keepalive failures
    }
  };

  // Immediate initial ping
  ping();

  // Recurring ping loop
  timerId = setInterval(ping, PING_INTERVAL_MS);
}

export function stopKeepAlivePing(): void {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}
