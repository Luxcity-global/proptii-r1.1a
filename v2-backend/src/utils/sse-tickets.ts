/**
 * Shared SSE ticket store — used by FirebaseAuthGuard (validation)
 * and CommunicationController (issuance + consumption).
 *
 * Tickets are short-lived (60 s) opaque UUIDs that let the browser
 * open an EventSource connection without exposing the Bearer token in the URL.
 */

export interface SseTicketInfo {
  uid: string;
  email: string;
  role: string;
  expiresAt: number; // unix ms
}

const store = new Map<string, SseTicketInfo>();

/** Prune expired tickets every 30 s to avoid memory leaks. */
setInterval(() => {
  const now = Date.now();
  store.forEach((v, k) => {
    if (v.expiresAt < now) store.delete(k);
  });
}, 30_000);

export function setSseTicket(ticket: string, info: SseTicketInfo): void {
  store.set(ticket, info);
}

export function getSseTicketInfo(ticket: string): SseTicketInfo | undefined {
  return store.get(ticket);
}

export function deleteSseTicket(ticket: string): void {
  store.delete(ticket);
}
