# Implementation Plan — Real-Time Messaging (SSE + Notifications)

Ground truth from code exploration:
- Backend: NestJS + Firestore; `EventsService.emit()` already supports per-userId filtering — the subscriber `filter()` in `events.service.ts` matches `event.userId === userId`. The critical bug is that `sendMessage()` controller emits with **no userId at all** (global broadcast), so the EventSource on the recipient side only gets it if the backend chooses to route it — but the frontend SSE filter in `events.service.ts` with `userId` matching means the event is only delivered to a subscriber whose `userId` matches. Because no `userId` is set on the emitted event, the broadcast goes to **all** connected users — but `useMessagingPoller.ts` only re-fetches on `message_new`; every user will re-fetch. This means messages *do* arrive eventually, but only for the current user because each user fetches their own conversations. However the root bug confirmed: the **recipient** doesn't get pushed the event in isolation — every user gets it — and if the recipient's SSE has disconnected (max 30s reconnect delay), they miss it entirely.
- Frontend: `useMessagingPoller.ts` listens to `message_new` / `message_read` / `conversation_new` and calls `fetchData()` (full re-fetch of conversations + unread count) on each SSE event.
- SSE reconnect: `scheduleReconnect` uses `Math.min(1000 * Math.pow(2, attempts), 30000)` — 30-second cap.
- `markRead()` controller emits `message_read` only to the *reading* user (`userId`), not the sender. The sender's unread indicator therefore never clears via SSE.
- `notifyRecipient()` dedup uses `lastNotifiedAt` for the 10-min guard AND the field name will conflict with the 24h scheduler's intended use of `lastNotifiedAt`.
- `DashboardSidebar.tsx` (tenant sidebar) already has a complete `getUnreadBadgeLabel()` helper and numeric badge. The landlord sidebar (`MainLayout.tsx`) uses `hasNotification: unreadCount > 0` and renders `ll-sidebar-nav-dot`. The landlord dashboard header (`Dashboard.tsx` `DashboardOverviewHeader`) renders `{unreadCount > 0 && <span className="ll-header-dot" />}` — a plain dot.
- `@nestjs/schedule ^6.1.3` is in `v2-backend/package.json` but `ScheduleModule.forRoot()` is **not imported** in `app.module.ts`.
- Build: `cd v2-backend && npm run build` (compiles NestJS). Frontend: `npm run typecheck` (tsc --noEmit).
- Test: `cd v2-backend && npm test` (nest build + vitest run); frontend: `npm test` (vitest).

---

## Sub-task 1 — Fix SSE recipient targeting (CRITICAL bug fix)

- [ ] 1. Add `getParticipants(conversationId)` to `CommunicationService`.
      Returns `{ tenantId: string; landlordId: string }` by reading the Firestore conversation doc. Returns empty strings if doc doesn't exist (no-throw). This method is called by both the send and markRead controller handlers.
      Files: `v2-backend/src/services/communication.service.ts`
      Verify: `cd v2-backend && npm run build` — compiles with no errors.

- [ ] 2. Fix `sendMessage()` controller to emit **targeted** SSE events.
      After `communicationService.sendMessage()` returns, call `communicationService.getParticipants(conversationId)` to get `{ tenantId, landlordId }`. Then emit four events in this order:
      1. `eventsService.emit({ type: 'message_new', userId: tenantId, data: { conversationId, senderId: userId, message: result.data } })`
      2. `eventsService.emit({ type: 'message_new', userId: landlordId, data: { conversationId, senderId: userId, message: result.data } })`
      3. `eventsService.emit({ type: 'conversation_updated', userId: tenantId, data: { conversationId } })`
      4. `eventsService.emit({ type: 'conversation_updated', userId: landlordId, data: { conversationId } })`
      Remove the current single global-broadcast `eventsService.emit({ type: 'message_new', data: ... })`.
      Files: `v2-backend/src/controllers/communication.controller.ts`
      Verify: `cd v2-backend && npm run build` — compiles with no errors.

- [ ] 3. Fix `markRead()` controller to notify the **other** participant.
      After `communicationService.markRead(messageId, userId)` returns, call `communicationService.getParticipants(conversationId)` — but `markRead` controller currently only has `messageId`, not `conversationId`. Resolve: the `markRead` service method already fetches the message doc and reads `msg.conversationId` from it. Extend `markRead()` service return value to include `{ conversationId: string; senderId: string }` (the `senderId` from the message). Back in the controller, look up participants using that conversationId, then determine the other party (the one who is *not* `userId`), and emit `eventsService.emit({ type: 'message_read', userId: <otherPartyId>, data: { messageId, conversationId } })`. Also emit a targeted event to `userId` (the reader) for optimistic badge clearing: `eventsService.emit({ type: 'message_read', userId, data: { messageId, conversationId } })`.
      Files:
      - `v2-backend/src/services/communication.service.ts` — extend `markRead()` return type to `{ data: { success: boolean; conversationId: string; senderId: string } }`
      - `v2-backend/src/controllers/communication.controller.ts` — use the returned conversationId + senderId to emit targeted events
      Verify: `cd v2-backend && npm run build` — compiles with no errors.

- [ ] 4. Update `useMessagingPoller.ts` to also subscribe to `conversation_updated`.
      Add `'conversation_updated'` to the SSE event types array in `sseService.on([...], callback)`. This ensures both parties' pollers fire a re-fetch immediately when `conversation_updated` arrives (which carries no message body — just a signal to re-fetch the conversation list and unread count).
      Files: `src/hooks/useMessagingPoller.ts`
      Verify: `npm run typecheck` — no TypeScript errors.

---

## Sub-task 2 — Reduce SSE reconnect max delay

- [ ] 5. Cap SSE reconnect delay at 5 000 ms globally.
      In `src/services/sseService.ts`, `scheduleReconnect()`, change `Math.min(1000 * Math.pow(2, attempts), 30000)` to `Math.min(1000 * Math.pow(2, attempts), 5000)`. The comment should read `// Exponential backoff capped at 5s`.
      Also add a re-fetch trigger in `source.onopen`: if `reconnectAttempts.get(channel) > 0` when the connection opens, dispatch a synthetic `conversation_updated` event via `this.dispatch({ type: 'conversation_updated', data: { reconnect: true }, timestamp: Date.now() })` so the poller immediately re-syncs after a reconnect.
      Files: `src/services/sseService.ts`
      Verify: `npm run typecheck` — no TypeScript errors.

---

## Sub-task 3 — Add 24-hour unread reminder email

- [ ] 6. Import `ScheduleModule` in `app.module.ts`.
      Add `import { ScheduleModule } from '@nestjs/schedule';` at the top of imports. Add `ScheduleModule.forRoot()` to the `imports` array in `@Module`. This activates the scheduler globally. Note: `@nestjs/schedule ^6.1.3` is already in `v2-backend/package.json`; do not add it again.
      Files: `v2-backend/src/app.module.ts`
      Verify: `cd v2-backend && npm run build` — compiles with no errors.

- [ ] 7. Add `sendUnreadReminderNotification()` to `EmailService`.
      Model it after `sendNewMessageNotification()` in the same file — use the same `renderProptiiEmail` wrapper and `proptiiButton` helper from `../utils/emailLayout`. The subject should be `"You have unread messages on Proptii"`. The body should mention the property title, how many messages are waiting, and include a CTA button to `${this.frontendUrl}/dashboard/messages`. Accept params: `{ recipientEmail: string; recipientName: string; propertyTitle: string; unreadCount: number }`.
      Files: `v2-backend/src/services/email.service.ts`
      Verify: `cd v2-backend && npm run build` — compiles with no errors.

- [ ] 8. Create `NotificationSchedulerService` at `v2-backend/src/services/notification-scheduler.service.ts`.
      This is a new `@Injectable()` class with `constructor(private readonly emailService: EmailService, private readonly userProfileService: UserProfileService)`.
      Implement `@Cron('0 * * * *') async checkUnreadReminders(): Promise<void>`:
      a. Get `db = admin.firestore()`. If unavailable, return early.
      b. Query `conversations` collection. Because Firestore does not support OR in a single query, run two separate queries: `where('unreadForTenant', '>', 0)` and `where('unreadForLandlord', '>', 0)`. Merge results into a `Map<string, any>` by doc id to de-duplicate.
      c. For each conversation doc, determine if it needs a reminder:
         - `lastNotifiedAt` is null OR `Date.now() - new Date(lastNotifiedAt).getTime() >= 24 * 60 * 60 * 1000`.
      d. Determine which party (tenant or landlord) has unread messages; if both, notify both.
      e. For each recipient:
         - Fetch profile via `this.userProfileService.getProfile(recipientId)` — cast to `any` to access `.email`, `.name`, `.displayName`.
         - If email is truthy, call `this.emailService.sendUnreadReminderNotification({ recipientEmail, recipientName, propertyTitle: conv.propertyTitle || 'a property', unreadCount })`.
      f. After sending (whether one or both), set `lastNotifiedAt` to `new Date().toISOString()` on the conversation doc using `{ merge: true }`.
      g. Wrap the per-conversation block in a try/catch so one failure doesn't abort the rest.
      Imports needed: `@nestjs/schedule` (`@Cron`, `CronExpression` optional), `firebase-admin`, `@nestjs/common` (`Injectable`, `Logger`), `EmailService`, `UserProfileService`.
      Files: `v2-backend/src/services/notification-scheduler.service.ts` (new file)
      Verify: `cd v2-backend && npm run build` — compiles with no errors.

- [ ] 9. Register `NotificationSchedulerService` in `app.module.ts`.
      Add `import { NotificationSchedulerService } from './services/notification-scheduler.service';` and add `NotificationSchedulerService` to the `providers` array, after `CommunicationService` (so its dependencies `EmailService` and `UserProfileService` are already declared above it in the array).
      Files: `v2-backend/src/app.module.ts`
      Verify: `cd v2-backend && npm run build` — compiles with no errors.

---

## Sub-task 4 — Fix immediate notification dedup field conflict

- [ ] 10. Rename the 10-minute dedup field from `lastNotifiedAt` to `immediateNotifiedAt` in `notifyRecipient()`.
       In `CommunicationService.notifyRecipient()` (currently near line 280–310 in `communication.service.ts`):
       - Change the read check from `if (conv.lastNotifiedAt)` → `if (conv.immediateNotifiedAt)`.
       - Change the `Date.now() - lastNotified` calculation to use `conv.immediateNotifiedAt`.
       - Change the Firestore write from `{ lastNotifiedAt: new Date().toISOString() }` to `{ immediateNotifiedAt: new Date().toISOString() }`.
       This leaves `lastNotifiedAt` free for exclusive use by `NotificationSchedulerService` (sub-task 3).
       Note: this adds a new Firestore field `immediateNotifiedAt` to conversation docs — existing docs simply won't have it and the `if (conv.immediateNotifiedAt)` guard handles null/undefined correctly (skip dedup, treat as first notification).
       Files: `v2-backend/src/services/communication.service.ts`
       Verify: `cd v2-backend && npm run build` — compiles with no errors.

---

## Sub-task 5 — Upgrade landlord badge to numeric count

- [ ] 11. Upgrade the sidebar nav dot in `MainLayout.tsx` to a numeric badge.
       In `MainLayout.tsx`, the `messages` nav item uses `hasNotification: unreadCount > 0` which the `SidebarNavList` renders as `<span className="ll-sidebar-nav-dot" />` (a plain dot). Change this to pass `unreadCount` directly instead:
       - In the `NavItem` type, add an optional `unreadBadge?: number` field alongside the existing `hasNotification?: boolean`.
       - For the `messages` nav item, set `unreadBadge: unreadCount` (not just a boolean).
       - In `SidebarNavList`, render the badge using the same pattern as `DashboardSidebar.tsx`'s `getUnreadBadgeLabel()`: import or inline the helper, and render a `<span>` with the same inline style already established in `DashboardSidebar.tsx` (absolute position, red background `#ef4444`, white text, `fontSize: 10`, `minWidth: 16`, `height: 16`, `borderRadius: 8`, etc.) when `unreadBadge > 0`.
       - Keep `hasNotification` for the `contracts` item (which has no count, just a dot).
       Files: `src/landlord_agent/src/components/MainLayout.tsx`
       Verify: `npm run typecheck` — no TypeScript errors.

- [ ] 12. Upgrade the messages button in the dashboard header to a numeric badge.
       In `Dashboard.tsx`, the `DashboardOverviewHeader` component renders:
       ```tsx
       {unreadCount > 0 && <span className="ll-header-dot" />}
       ```
       Replace this with a numeric badge following the same pattern as `DashboardSidebar.tsx`. The badge span should show `unreadCount > 99 ? '99+' : String(unreadCount)` when `unreadCount > 0`, using the same absolute-positioned inline style (red pill, white text, fontSize 10). Keep the `ll-header-dot` class on the notification bell button (the one for general alerts, not messages) unchanged.
       Files: `src/landlord_agent/src/components/Dashboard.tsx`
       Verify: `npm run typecheck` — no TypeScript errors.

---

## Sub-task 6 — Mark-as-read clears badge in real time

- [ ] 13. Verify and fix `markConversationAsRead` call on conversation open in `TenantMessages.tsx`.
       Already confirmed: `handleSelect()` in `TenantMessages.tsx` calls `markConversationAsRead(id)` when `isUnread(conv)` is true. No change needed to the call site.
       However: `markConversationAsRead` in `MessagingContext.tsx` uses `setConversations` with a functional updater that calls `setUnreadCount(count => Math.max(0, count - unread))` **inside** the `setConversations` updater function. This is a React anti-pattern — calling one state setter inside another's updater. Refactor so both state updates are done as separate `useCallback` calls:
       - Compute the total unread reduction by summing the unread counts of conversations being marked (only the target `id`).
       - Call `setConversations(prev => ...)` to zero out the conversation's counter.
       - Then call `setUnreadCount(prev => Math.max(0, prev - delta))` as a separate call after.
       This ensures React batches both updates correctly and prevents stale-closure bugs.
       Files: `src/contexts/MessagingContext.tsx`
       Verify: `npm run typecheck` — no TypeScript errors.

- [ ] 14. Verify and fix `markConversationAsRead` call on conversation open in `TenantInbox.tsx` (landlord).
       Already confirmed: `handleSelect()` in `TenantInbox.tsx` calls `markConversationAsRead(id)` when `isUnread(conv)` is true. No change needed to the call site.
       No code changes required for this file — the existing call is correct.
       Files: `src/landlord_agent/src/components/TenantInbox.tsx` (read only, confirm call exists)
       Verify: `npm run typecheck` — no TypeScript errors.

- [ ] 15. Wire `conversation_updated` into `MessagingContext` so the SSE-driven re-fetch also re-checks the badge.
       `useMessagingPoller.ts` (item 4 above) already subscribes to `conversation_updated` and calls `fetchData()`, which calls `_setUnreadCount(count)` via `communicationService.getUnreadCount()`. This is sufficient — no additional changes are needed here. However, confirm that `markRead()` controller (item 3 above) also emits `conversation_updated` to both participants after the `message_read` events, so the poller re-fetches the full conversation list (which updates `lastMessagePreview`, `updatedAt`, etc.).
       Add to the `markRead()` controller handler: after emitting the two `message_read` events, also emit:
       - `eventsService.emit({ type: 'conversation_updated', userId: tenantId, data: { conversationId } })`
       - `eventsService.emit({ type: 'conversation_updated', userId: landlordId, data: { conversationId } })`
       Files: `v2-backend/src/controllers/communication.controller.ts`
       Verify: `cd v2-backend && npm run build` — compiles with no errors.

---

## Final integration verification

- [ ] 16. Build and verify both packages.
       Run `cd v2-backend && npm run build` — must compile with zero errors.
       Run `cd /home/angeli/Desktop/luxcity/proptii-r1.1a && npm run typecheck` — must emit zero TypeScript errors.
       If there are any errors, fix them before considering the task complete.

---

## Key design decisions (rationale)

**Why emit to both sender and recipient (item 2)?** The sender's dashboard also shows the message in a thread — if we only push to the recipient, the sender's own SSE sees nothing. Both need the `message_new` to trigger a poller re-fetch that will pick up the optimistically-sent message as a server-confirmed entry.

**Why not use Firestore realtime listeners?** The frontend already has SSE infrastructure wired and deployed. Adding a second real-time channel (Firestore SDK listeners) would double the connection overhead and require restructuring MessagingContext. SSE with targeted routing is sufficient.

**Why rename `lastNotifiedAt` → `immediateNotifiedAt` instead of just renaming the 24h field?** The `lastNotifiedAt` field name is already in production Firestore docs. Renaming it would silently break dedup for any existing doc until it gets a new write. Using `immediateNotifiedAt` as the NEW field for the 10-min guard keeps existing behavior correct while freeing `lastNotifiedAt` for the scheduler.

**Why run two Firestore queries in the scheduler instead of one?** Firestore does not support logical OR across fields in a single query. The two-query + Map de-duplicate pattern mirrors the existing `getUnreadCount()` approach in `CommunicationService` and avoids introducing a Firestore composite index.

**Why fix the `setConversations`-inside-`setUnreadCount` anti-pattern (item 13)?** React's concurrent mode may batch or defer state updates. Calling a state setter inside another's functional updater is not guaranteed to see the latest external state — it only sees the current slice. The refactor makes the update sequence explicit and reliable.
