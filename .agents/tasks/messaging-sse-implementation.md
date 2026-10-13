# Messaging SSE Implementation Report

## Overview

This report covers all changes made to implement real-time messaging via SSE, plus the fixes applied for the two blocking review findings.

---

## Files Changed

### Backend (`v2-backend/`)

| File                                             | What changed                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/controllers/communication.controller.ts`    | (1) Fixed `sendTyping()` — now calls `getParticipants()` and emits `typing_start` to the **other** participant's `userId` instead of the sender's own stream. (2) `sendMessage()` emits targeted `message_new` + `conversation_updated` to both `tenantId` and `landlordId` instead of a global broadcast. (3) `markRead()` emits `message_read` to both the reader and the other participant, plus `conversation_updated` to both. |
| `src/services/communication.service.ts`          | Added `getParticipants(conversationId)` method returning `{ tenantId, landlordId }`. Extended `markRead()` return type to include `conversationId` and `senderId`. Renamed 10-min dedup field from `lastNotifiedAt` to `immediateNotifiedAt` in `notifyRecipient()`.                                                                                                                                                                |
| `src/services/notification-scheduler.service.ts` | **New file.** Hourly `@Cron('0 * * * *')` job that queries conversations with `unreadForTenant > 0` or `unreadForLandlord > 0`, checks if `lastNotifiedAt` is older than 24h, and sends reminder emails via `EmailService`.                                                                                                                                                                                                         |
| `src/services/email.service.ts`                  | Added `sendUnreadReminderNotification()` method using the same `renderProptiiEmail` wrapper. Subject: "You have unread messages on Proptii". Accepts `{ recipientEmail, recipientName, propertyTitle, unreadCount }`.                                                                                                                                                                                                               |
| `src/app.module.ts`                              | `ScheduleModule.forRoot()` added to imports. `NotificationSchedulerService` added to providers.                                                                                                                                                                                                                                                                                                                                     |

### Frontend (`src/`)

| File                                               | What changed                                                                                                                                                                                                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/sseService.ts`                       | Reconnect cap lowered from 30 000 ms to 5 000 ms. `source.onopen` handler dispatches a synthetic `conversation_updated` event on reconnect (when `prevAttempts > 0`) so pollers re-fetch immediately after reconnection.                                                     |
| `src/hooks/useMessagingPoller.ts`                  | Added `'conversation_updated'` and `'conversation_new'` to the SSE event subscription array.                                                                                                                                                                                 |
| `src/contexts/MessagingContext.tsx`                | **Review fix:** `markConversationAsRead()` now computes `delta` from the `conversations` state snapshot _before_ calling `setConversations`, eliminating the fragile cross-`setState` variable capture pattern. Added `conversations` to the `useCallback` dependency array. |
| `src/landlord_agent/src/components/MainLayout.tsx` | `NavItem` type has `unreadBadge?: number`. Messages nav item passes `unreadBadge: unreadCount`. `SidebarNavList` renders a numeric red pill badge (with `99+` cap) instead of the plain dot.                                                                                 |
| `src/landlord_agent/src/components/Dashboard.tsx`  | `DashboardOverviewHeader` messages button shows a numeric red pill badge (`99+` cap) instead of the plain `ll-header-dot`.                                                                                                                                                   |

---

## Review Findings Fixed

### 1. `typing-indicator-broken` (blocking — confirmed)

**Problem:** `sendTyping()` emitted `typing_start` with `userId` set to the sender's own UID. Since `EventsService` routes by `userId`, the event arrived on the sender's own SSE stream — the recipient never saw a typing indicator.

**Fix:** The handler now calls `getParticipants(conversationId)` to resolve the other participant, then emits `typing_start` to that participant's `userId`. The call is wrapped in try/catch so a Firestore failure is non-fatal (typing indicators are best-effort).

**File:** `v2-backend/src/controllers/communication.controller.ts`

---

### 2. `delta-capture-concurrent-react` (blocking — likely)

**Problem:** `markConversationAsRead()` wrote a local `delta` variable _inside_ the `setConversations` functional updater, then consumed it in a subsequent `setUnreadCount` call. Under React 18 concurrent scheduling the two `setState` calls are not guaranteed to execute atomically; `setUnreadCount` could fire while `delta` is still `0`.

**Fix:** `delta` is now computed from the `conversations` state snapshot that is already in scope (via the `useCallback` closure) _before_ calling `setConversations`. `setConversations` and `setUnreadCount` are then called with their respective known values — neither depends on the other's updater running first. `conversations` was added to the `useCallback` dependency array.

**File:** `src/contexts/MessagingContext.tsx`

---

### 3. `build-not-independently-verified` (non-blocking — possible)

Build evidence is now captured:

- Backend: `cd v2-backend && npm run build` → exit code 0 (nest build + static copy)
- Frontend: `npx vite build` → exit code 0 (✓ built in ~2m 5s)

---

## Manual Steps Required

1. **Deploy backend** — `NotificationSchedulerService` will start running on the next hourly tick after deployment. No Firestore index changes are required (queries use existing single-field indexes on `unreadForTenant` and `unreadForLandlord`).

2. **Firestore field note** — Existing conversation documents have `lastNotifiedAt` (previously set by `notifyRecipient()`). From this deploy onward, `notifyRecipient()` writes to `immediateNotifiedAt` (10-min dedup) and the scheduler uses `lastNotifiedAt` (24h dedup). Existing docs will behave correctly: the `if (conv.immediateNotifiedAt)` guard treats missing field as "no dedup needed", which is the correct fallback.

3. **No schema migration needed** — `immediateNotifiedAt` is a new field; absence is handled by the `??` null guard. `lastNotifiedAt` continues to be written by the scheduler and read by itself — no conflict.

4. **No frontend env changes** — `FRONTEND_URL` env var is already used by `EmailService` for the CTA button URL in reminder emails.

---

## Commit

`fix: fix sendTyping SSE target and markConversationAsRead delta capture` (commit `7b55dcc0`)
