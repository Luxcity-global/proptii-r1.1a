# Real-Time Messaging via SSE for Proptii (v2 Review)

This change wires up Server-Sent Events for the Proptii messaging feature so new messages, read receipts, and conversation updates arrive in near-real-time on both tenant and landlord dashboards. It adds targeted per-user SSE emission on every write path, a 24-hour unread reminder scheduler, numeric badge rendering on the landlord sidebar, and a reconnect cap so disconnections recover in seconds rather than minutes. The primary problem being solved was that messages sent from the tenant side did not appear on the landlord side without a page reload.

This is a v2 pass. Issues #1 and #2 from the prior review (`sendTyping()` emitting to the sender, and `delta` computed inside a functional updater) have both been fixed in the current code. The remaining open item is build evidence: no CI artifact or captured terminal output exists to independently confirm the claimed clean build.

**Watch for:** **confirmed** — Build evidence is self-reported. The implementation summary claims `npm run build` and `npx vite build` passed with zero errors, but no CI log or captured terminal output was produced to verify this independently.

**Verdict**: APPROVED

---

## High-level view

SSE emission is fully targeted across all write paths. `sendMessage`, `markRead`, `editMessage`, `deleteMessage`, and `getOrCreateConversation` all call `getParticipants()` and emit to both `tenantId` and `landlordId`. The `sendTyping()` handler, which was broken in v1, now correctly resolves the other participant and emits only to `recipientId` — the typing indicator is functional.

`markConversationAsRead()` in `MessagingContext` computes `delta` from the conversation snapshot captured in the `useCallback` closure, before any state mutation — the concurrent-scheduling fragility from v1 is gone.

`notifyRecipient()` uses `immediateNotifiedAt` for the 10-minute dedup window; `checkUnreadReminders()` uses the separate `lastNotifiedAt` for the 24-hour window. The two fields don't interfere. `ScheduleModule.forRoot()` is in `app.module.ts` imports and `NotificationSchedulerService` is registered in providers.

The SSE client reconnect cap is 5 s, `onopen` dispatches a synthetic `conversation_updated` on reconnect, and `useMessagingPoller` subscribes to `['message_new', 'message_read', 'conversation_new', 'conversation_updated']`. The landlord sidebar shows a numeric red pill with a `99+` cap; the dashboard header button mirrors the same badge.

---

<details>
<summary>Issues (1)</summary>

1. **Build not independently verified** — The implementation report claims `npm run build` (backend) and `npx vite build` (frontend) completed with zero errors. No CI log or captured terminal output was produced to confirm this. Reject if independent build evidence is required by the team's process.

</details>

---

<details>
<summary>Details</summary>

## v1 findings resolved

`sendTyping()` in `communication.controller.ts` now calls `getParticipants(conversationId)`, computes `recipientId = userId === tenantId ? landlordId : tenantId`, and emits `typing_start` to `recipientId`. Non-fatal errors from the DB round-trip are caught and logged; the endpoint returns `{ ok: true }` regardless. This is correct.

`markConversationAsRead()` in `MessagingContext.tsx` computes `delta` synchronously from the `conversations` array in the closure scope, before any `setState` call, then calls both `setConversations` and `setUnreadCount` with the pre-computed value. The concurrent scheduling hazard from v1 is no longer present.

## Criteria checklist

**SSE targeting in sendMessage()** — emits `message_new` and `conversation_updated` to both `tenantId` and `landlordId` individually. No global broadcast. Confirmed.

**markRead() SSE** — resolves `tenantId`/`landlordId` via `getParticipants()`, emits `message_read` to both the reading user and the other participant, then `conversation_updated` to both. Confirmed.

**notifyRecipient() dedup field** — uses `immediateNotifiedAt` for the 10-minute window check; no reference to `lastNotifiedAt` in `notifyRecipient()`. Confirmed.

**Scheduler dedup field** — `checkUnreadReminders()` reads `conv.lastNotifiedAt` for the 24-hour threshold, writes `lastNotifiedAt` after sending. Per-conversation error isolation via `try/catch` inside the `for` loop. Confirmed.

**ScheduleModule.forRoot()** — present in `app.module.ts` imports array. Confirmed.

**NotificationSchedulerService in providers** — present in the providers array in `app.module.ts`. Confirmed.

**SSE reconnect cap** — `scheduleReconnect()` in `sseService.ts`: `Math.min(1000 * Math.pow(2, attempts), 5000)`. Cap is 5 s. Confirmed.

**Reconnect re-fetch** — `source.onopen` reads `prevAttempts`; dispatches a synthetic `conversation_updated` event when `prevAttempts > 0`. Confirmed.

**Landlord numeric badge** — `SidebarNavList` renders a red pill with inline styles when `(item.unreadBadge ?? 0) > 0`; displays `'99+'` when over 99. The Messages `NavItem` passes `unreadBadge: unreadCount`. Dashboard header button mirrors the same logic. Confirmed.

**TypeScript `any` usage** — `dto: any` parameters in controller handlers, `user?: any` in `sendMessage()`, and Firestore snapshot generics use `any` in several places. These are localized to boundary and Firestore adapter layers; no spreading `any` into business logic type signatures. Acceptable.

**Build evidence** — No CI artifact or captured terminal output. Self-reported only. See Issues.

## Build evidence

The coder's implementation report claims both `npm run build` (backend) and `npx vite build` (frontend) completed with zero errors. No external CI artifact or terminal log was captured to verify this. Flagged as unverified; team process determines whether to require independent evidence before merging.

</details>

---

<details>
<summary>Files changed</summary>

| File                                                        | What changed                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `v2-backend/src/controllers/communication.controller.ts`    | All write actions emit targeted SSE to both participants; `sendTyping` now correctly targets the recipient (v1 bug fixed) |
| `v2-backend/src/services/communication.service.ts`          | `getParticipants()`; `markRead()` returns `conversationId`; `notifyRecipient()` uses `immediateNotifiedAt`                |
| `v2-backend/src/services/notification-scheduler.service.ts` | New file — hourly cron, `lastNotifiedAt` dedup, per-conversation error isolation                                          |
| `v2-backend/src/services/email.service.ts`                  | `sendUnreadReminderNotification()` added                                                                                  |
| `v2-backend/src/app.module.ts`                              | `ScheduleModule.forRoot()` added; `NotificationSchedulerService` registered                                               |
| `src/services/sseService.ts`                                | Reconnect cap 5 s; synthetic re-sync on reconnect; ticket exchange for communication channel                              |
| `src/hooks/useMessagingPoller.ts`                           | Subscribes to `conversation_updated` and `conversation_new` in addition to `message_new`/`message_read`                   |
| `src/contexts/MessagingContext.tsx`                         | `markConversationAsRead()` rewritten with safe `delta` capture; `decrementUnreadCount()` added                            |
| `src/landlord_agent/src/components/MainLayout.tsx`          | Numeric badge with `99+` cap on Messages nav item                                                                         |
| `src/landlord_agent/src/components/Dashboard.tsx`           | Numeric badge on dashboard messages header button                                                                         |

</details>
