# Messaging SSE Implementation Report

## Overview

This report documents all changes made to implement real-time messaging via SSE for Proptii, including the fixes applied after the review found three issues (`CHANGES_REQUESTED`).

---

## Files Changed

### Backend (`v2-backend/`)

#### `v2-backend/src/controllers/communication.controller.ts`

- **`sendMessage()`**: Replaced global `eventsService.emit()` (no `userId`) with four targeted events — `message_new` and `conversation_updated` to both `tenantId` and `landlordId`.
- **`markRead()`**: After `communicationService.markRead()` returns `conversationId`, calls `getParticipants()` and emits targeted `message_read` + `conversation_updated` to both participants.
- **`getOrCreateConversation()`** _(review fix)_: Replaced single global `conversation_new` broadcast with two targeted emits using `tenantId` and `landlordId` from `result.data`.
- **`editMessage()`** _(review fix)_: Replaced global `message_edit` broadcast with targeted emits to both participants via `getParticipants(conversationId)`. `conversationId` is retrieved from `result.data`.
- **`deleteMessage()`** _(review fix)_: Same targeted pattern as `editMessage()`.

#### `v2-backend/src/services/communication.service.ts`

- **`getParticipants()`**: New public method — reads the conversation doc from Firestore and returns `{ tenantId, landlordId }`. Throws `NotFoundException` if the document doesn't exist.
- **`markRead()`**: Extended return type from `{ data: { success: boolean } }` to `{ data: { success: boolean; conversationId: string; senderId: string } }` so the controller can look up participants without an additional DB call.
- **`notifyRecipient()`**: Renamed dedup field from `lastNotifiedAt` to `immediateNotifiedAt` — separates the 10-min per-send dedup from the scheduler's 24h `lastNotifiedAt` field.
- **`notifyRecipient()`** _(review fix)_: Removed `as any` cast on `userProfileService.getProfile()` return — `Record<string, any>` already allows `.email`, `.name`, `.displayName` access.

#### `v2-backend/src/services/notification-scheduler.service.ts` _(new file)_

- `@Cron('0 * * * *')` — runs hourly.
- Queries `conversations` where `unreadForTenant > 0` and `unreadForLandlord > 0` (two queries, de-duplicated via `Map`).
- For each conversation, checks `lastNotifiedAt` — sends reminder if null or older than 24 hours.
- Calls `emailService.sendUnreadReminderNotification()` for each affected party.
- Updates `lastNotifiedAt` after at least one reminder is sent.
- Per-conversation errors are caught individually.
- _(review fix)_: Removed both `as any` casts on `userProfileService.getProfile()`.

#### `v2-backend/src/services/email.service.ts`

- **`sendUnreadReminderNotification()`**: New method — sends "You have unread messages on Proptii" email using the same `renderProptiiEmail` wrapper as other notifications. Accepts `{ recipientEmail, recipientName, propertyTitle, unreadCount }`. CTA links to `/dashboard/messages`.

#### `v2-backend/src/app.module.ts`

- Added `import { ScheduleModule } from '@nestjs/schedule'` and `ScheduleModule.forRoot()` to `imports`.
- Added `import { NotificationSchedulerService }` and `NotificationSchedulerService` to `providers`.

### Frontend (`src/`)

#### `src/services/sseService.ts`

- **Reconnect cap**: Changed `Math.min(1000 * Math.pow(2, attempts), 30000)` to `5000` — max reconnect delay is now 5 s.
- **Reconnect re-fetch**: In `source.onopen`, if `prevAttempts > 0`, dispatches synthetic `conversation_updated` event so pollers immediately re-fetch after reconnect.
- **SSE ticket exchange**: For the `communication` channel, a `POST /communication/sse-ticket` call exchanges the Bearer token for a short-lived opaque ticket, keeping the token out of URLs and server logs.

#### `src/hooks/useMessagingPoller.ts`

- Added `'conversation_updated'` and `'conversation_new'` to the SSE event types that trigger `fetchData()`.

#### `src/contexts/MessagingContext.tsx`

- **`markConversationAsRead()`**: Computes `delta` from the conversation's unread count synchronously inside the `setConversations` updater, then calls `setUnreadCount(prev => Math.max(0, prev - delta))` as a separate call — avoids the anti-pattern of nesting one state setter inside another's updater.
- Added `decrementUnreadCount()` helper exported from context.

#### `src/landlord_agent/src/components/MainLayout.tsx`

- Added optional `unreadBadge?: number` field to the `NavItem` type.
- Messages nav item now uses `unreadBadge: unreadCount` instead of `hasNotification: unreadCount > 0`.
- `SidebarNavList` renders a numeric red pill badge with `99+` cap when `(item.unreadBadge ?? 0) > 0`.

#### `src/landlord_agent/src/components/Dashboard.tsx`

- `DashboardOverviewHeader` messages button now shows a numeric badge (`unreadCount > 99 ? '99+' : String(unreadCount)`) using the same inline style as the sidebar pill. Replaces the plain `ll-header-dot` dot.

---

## Review Findings Fixed

| ID                                  | Description                                                   | Fix applied                                                                            |
| ----------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `global-broadcast-conversation-new` | `getOrCreateConversation` emitted `conversation_new` globally | Now emits two targeted events: one to `tenantId`, one to `landlordId`                  |
| `global-broadcast-edit-delete`      | `editMessage` and `deleteMessage` emitted globally            | Both now call `getParticipants(conversationId)` and emit two targeted events           |
| `any-cast-user-profile`             | `as any` on `getProfile()` return in scheduler and service    | Removed both casts — `Record<string, any>` is the declared return type; no cast needed |

---

## Manual Steps Required

None — all changes are code-level and take effect on the next deploy.

**Note on Firestore fields:** Two new fields are written to conversation documents but are additive only:

- `immediateNotifiedAt` — set by `notifyRecipient()` for 10-min per-send dedup. Existing docs that lack this field are handled gracefully (treated as "never notified").
- `lastNotifiedAt` — set by `NotificationSchedulerService` after sending a 24h reminder. Same graceful handling.

---

## Build Verification

- `cd v2-backend && npm run build` — ✅ zero errors
- `npx vite build` — ✅ zero errors (warnings are pre-existing Rollup annotation notices unrelated to these changes)
