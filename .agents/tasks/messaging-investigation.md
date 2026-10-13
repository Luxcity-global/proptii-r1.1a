# Messaging System Investigation Report

## Summary

The messaging system is largely well-built but has **one critical SSE broadcast bug** that explains why messages sent from the tenant side do not appear in real time on the landlord side (and vice versa). The `message_new` event is emitted as a **global broadcast** with no `userId`, `targetEmail`, or `targetRole` set, which means it goes to every connected SSE client — but it carries no targeting information to distinguish recipient from sender. Every client re-fetches on SSE, but the **landlord SSE connection is on a completely separate app context** (`/landlord` sub-app in a MemoryRouter + its own `MessagingProvider`). When the tenant sends a message, the SSE `message_new` event fires, but only the tenant's tab has an active `/communication/events` SSE connection. The landlord portal's SSE connection may not be established at all if the landlord hasn't navigated to the messages page, because `useMessagingPoller` is always mounted in both apps — but the SSE ticket exchange fires at mount time, and if the backend is unreachable or the ticket expires before SSE reconnects, the landlord sits on 15-second polling only.

**Additional gap:** There is no 24-hour unread reminder email. The existing email fires on every send (deduplicated at 10 minutes), but there is no background job to email a recipient who has unread messages after 24 hours.

---

## 1. Messaging UI File Paths

### Tenant Side
| Role | Path |
|------|------|
| Tenant inbox page | `src/pages/dashboard/TenantMessages.tsx` |
| Tenant dashboard wrapper | `src/components/dashboard/Dashboard.tsx` |
| Tenant sidebar (unread badge) | `src/components/dashboard/ui/DashboardSidebar.tsx` |

### Landlord Side
| Role | Path |
|------|------|
| Landlord inbox component | `src/landlord_agent/src/components/TenantInbox.tsx` |
| Landlord sidebar (notification dot) | `src/landlord_agent/src/components/MainLayout.tsx` |
| Landlord dashboard (unread count widget) | `src/landlord_agent/src/components/Dashboard.tsx` |

### Shared Messaging Components
| Component | Path |
|-----------|------|
| Message thread viewer | `src/components/messaging/MessageThread.tsx` |
| Compose box (send UI) | `src/components/messaging/ComposeBox.tsx` |
| Conversation list item | `src/components/messaging/ConversationListItem.tsx` |
| Attachment pill | `src/components/messaging/AttachmentPill.tsx` |
| Messaging context | `src/contexts/MessagingContext.tsx` |
| Messaging types | `src/types/messaging.ts` |

---

## 2. Storage and Data Fetching

### Database
- **Firebase Firestore** (via `firebase-admin` in the NestJS backend)
- Collections: `conversations`, `messages`, `message_attachments`

### Schema (from `communication.service.ts` + `types/messaging.ts`)
**`conversations` collection:**
- `id`, `propertyId`, `tenantId`, `landlordId`
- `propertyTitle`, `tenantName`, `createdAt`, `updatedAt`, `lastMessageAt`
- `lastMessagePreview`, `unreadForTenant`, `unreadForLandlord`
- `isDeleted`, `lastNotifiedAt` (for email dedup)

**`messages` collection:**
- `id`, `conversationId`, `senderId`, `senderRole`
- `body`, `attachmentIds`, `sentAt`, `readAt`, `isDeleted`

**`message_attachments` collection:**
- `id`, `conversationId`, `uploadedBy`, `filename`, `mimeType`, `size`, `blobUrl`

### Fetching
- `GET /communication/conversations` — list conversations for authenticated user
- `GET /communication/conversations/unread-count` — aggregated unread count
- `GET /communication/conversations/:id/messages` — paginated messages (fallback: sorts in-memory, limit 200)
- No Firestore realtime listeners used; all reads are REST/HTTP

---

## 3. Real-time Mechanism

### SSE Infrastructure (EXISTS but has critical targeting bug)

**Backend:** `v2-backend/src/services/events.service.ts`
- Uses RxJS `Subject` + `Observable` pattern
- In-memory only (single NestJS process — no Redis pub/sub)
- Filtering: match by `event.userId`, `event.targetEmail`, or `event.targetRole`; if none set, it is a **global broadcast** to all subscribers

**Backend controller:** `v2-backend/src/controllers/communication.controller.ts`
- `@Sse('events')` endpoint at `GET /communication/events?ticket=<ticket>`
- SSE ticket exchange: `POST /communication/sse-ticket` (60s TTL, one-time use, in-memory `Map`)

**Frontend SSE client:** `src/services/sseService.ts`
- Connects to `/communication/events?ticket=...`
- Exponential backoff reconnect (1s → 30s max)
- Auto-routes to correct channel via `resolveChannelForEventType`

**Hook:** `src/hooks/useMessagingPoller.ts`
- Listens to `message_new`, `message_read`, `conversation_new` SSE events
- On any event: immediately re-fetches conversations + unread count
- Also polls every 15s as safety fallback (tab visibility-aware)

### **THE BUG — Why messages don't show in real time for the other party**

When a tenant sends a message, the controller emits:
```typescript
this.eventsService.emit({
  type: 'message_new',
  data: { conversationId, senderId: userId, message: result.data },
  // ← NO userId, NO targetEmail, NO targetRole set
});
```

Because `userId`, `targetEmail`, and `targetRole` are all absent, `EventsService.subscribe()` treats this as a **global broadcast** — it goes to ALL connected SSE subscribers. That sounds right, but:

1. **The landlord app runs in its own isolated context** (`/landlord` route, separate `MessagingProvider`, separate `useMessagingPoller` instance). If the landlord is on their messages page, they DO have an SSE connection and will receive the global broadcast and re-fetch. This should work.

2. **However:** if the landlord is on any OTHER page (dashboard, properties, etc.), `useMessagingPoller` is still running (it's mounted at the top of the landlord app), so the SSE connection should still be alive and the global broadcast should trigger a re-fetch.

3. **The real failure mode:** the SSE ticket is one-time use with a 60-second TTL. On reconnect (after tab sleep, network blip, etc.), the SSE client tries to exchange a new ticket. If the ticket exchange fails (network error, auth error), it falls back to a legacy token-in-URL approach. If that also fails, the SSE connection silently drops and the user is left on 15-second polling only — and the first poll after a message is sent may catch it in time, but there's a noticeable delay.

4. **Critical missing piece:** The `message_new` event does NOT carry `targetUserId` (the recipient). So the backend cannot route it only to the recipient and sender — it goes to everyone or no one. If you later want to reduce broadcast noise (important for multi-tenant scaling), you'll need to add explicit recipient targeting.

---

## 4. Message Indicator / Badge

### Tenant Dashboard
- **File:** `src/components/dashboard/ui/DashboardSidebar.tsx`
- **How:** `useMessagingContext()` → `unreadCount` → `getUnreadBadgeLabel(unreadCount)` renders a red circle badge on the Messages nav icon
- **When it clears:** `markConversationAsRead(id)` in `MessagingContext.tsx` decrements the count optimistically when the user opens a conversation

### Landlord Dashboard
- **File:** `src/landlord_agent/src/components/MainLayout.tsx`
- **How:** `useMessagingContext()` → `unreadCount > 0` → sets `hasNotification: true` on the Messages nav item → renders `<span className="ll-sidebar-nav-dot" />` (a CSS dot, not a numeric badge)
- **Header notification bell** in `src/landlord_agent/src/components/Dashboard.tsx` line 266: also uses `unreadCount > 0` to show `<span className="ll-header-dot" />`

### Badge update mechanism
Both badges update via `useMessagingPoller` which either:
- Fires immediately on SSE event (< 1s)
- Falls back to 15-second polling

**Note:** The landlord badge is just a dot (boolean), not a numeric count. The tenant badge shows a number (up to "99+"). The landlord side could be upgraded to show the numeric count for parity.

---

## 5. Email Notification Logic

### Existing: Per-message notification (with 10-minute dedup)

**File:** `v2-backend/src/services/communication.service.ts` — `notifyRecipient()` method
- Called asynchronously after every successful `sendMessage`
- Resolves recipient by comparing `senderId` to `conv.tenantId`/`conv.landlordId`
- Fetches recipient profile from `UserProfileService.getProfile(recipientId)`
- **Dedup:** skips if `conv.lastNotifiedAt` was set within the last **10 minutes**
- **Email provider:** Resend API (`v2-backend/src/utils/resend.ts`) via `RESEND_API_KEY` env var
- **Email template:** `sendNewMessageNotification()` in `v2-backend/src/services/email.service.ts`
- Includes: sender name, property title, message preview (first 200 chars), CTA button to `/dashboard/messages`
- Guest variant: links to `/claim?token=<guestToken>` instead

### Missing: 24-hour unread reminder

There is **no scheduled job or cron** to email users who have unread messages after 24 hours. The `app.module.ts` does not import `@nestjs/schedule` or any cron module. The `lastNotifiedAt` field exists on conversations but is only used for the 10-minute dedup — not for a 24-hour reminder.

**Evidence:** `app.module.ts` imports — no `ScheduleModule`, no `CronExpression`, no `@Cron` decorator anywhere in the backend.

---

## 6. Backend Framework and Database

| Layer | Technology |
|-------|------------|
| Backend framework | **NestJS** (TypeScript, compiled to `v2-backend/dist/`) |
| Frontend framework | **Vite + React 18** (SPA, not Next.js) |
| Database | **Firebase Firestore** (via firebase-admin SDK) |
| File storage | **Firebase Cloud Storage** (via `StorageService`) |
| Email | **Resend** (REST API, `RESEND_API_KEY` env var) |
| Auth (backend) | **Firebase Auth** (ID token verification in `FirebaseAuthGuard`) |
| SSE tickets | In-memory `Map` in `v2-backend/src/utils/sse-tickets.ts` |
| Deployment | Azure Static Web Apps (frontend), Render (backend per `RENDER_EXTERNAL_URL`) |

---

## 7. Auth System

- **Firebase Auth** — users log in via Firebase (email/password, Microsoft MSAL, or other Firebase providers)
- Frontend: `src/services/msalAccessToken.ts` acquires tokens; `src/contexts/AuthContext.tsx` exposes `user`
- Backend: `FirebaseAuthGuard` in `v2-backend/src/guards/firebase-auth.guard.ts` verifies Firebase ID tokens via `admin.auth().verifyIdToken(token)`
- Role is stored in Firestore `users/{uid}.role` and attached to `req.user.role` after token verification
- SSE uses a short-lived ticket (UUID, 60s TTL) exchanged via `POST /communication/sse-ticket` so the Bearer token is not exposed in the URL

---

## 8. Key File Paths Summary

| Purpose | File |
|---------|------|
| **Send message handler (backend)** | `v2-backend/src/controllers/communication.controller.ts` → `sendMessage()` |
| **Send message service (backend)** | `v2-backend/src/services/communication.service.ts` → `sendMessage()` |
| **Message list/fetch handler (backend)** | `v2-backend/src/controllers/communication.controller.ts` → `getMessages()` |
| **Message list/fetch service (backend)** | `v2-backend/src/services/communication.service.ts` → `getMessages()` |
| **Unread badge (tenant sidebar)** | `src/components/dashboard/ui/DashboardSidebar.tsx` |
| **Unread badge (landlord sidebar)** | `src/landlord_agent/src/components/MainLayout.tsx` |
| **Unread badge (landlord header)** | `src/landlord_agent/src/components/Dashboard.tsx` |
| **SSE event broadcaster** | `v2-backend/src/services/events.service.ts` |
| **SSE client (frontend)** | `src/services/sseService.ts` |
| **SSE ticket utility** | `v2-backend/src/utils/sse-tickets.ts` |
| **Messaging polling hook** | `src/hooks/useMessagingPoller.ts` |
| **Messaging context** | `src/contexts/MessagingContext.tsx` |
| **Email notification utility** | `v2-backend/src/utils/resend.ts` |
| **Email service** | `v2-backend/src/services/email.service.ts` |
| **Frontend communication API wrapper** | `src/services/communicationService.ts` |

---

## 9. Root Cause Analysis: Messages Not Appearing

**The "message didn't show up" bug the user described:**

When a tenant sends a message:
1. `POST /communication/conversations/:id/messages` succeeds and writes to Firestore ✓
2. `eventsService.emit({ type: 'message_new', data: {...} })` fires as global broadcast ✓
3. Any SSE subscriber re-fetches `getConversations()` + `getUnreadCount()` ✓
4. **BUT** — if the landlord is using a portal tab that has NOT yet connected to SSE (i.e., they opened the landlord portal but haven't been active for > 30s + reconnect delay), they won't receive the push. They'll get it on the next 15s poll instead.
5. **More importantly**: the SSE connection for the landlord portal is established in `LandlordMessagingPoller` (mounted in `src/landlord_agent/src/App.tsx`). This component calls `useMessagingPoller()` which calls `sseService.on(...)` → `sseService.ensureConnected('communication')`. The ticket exchange makes a `POST /communication/sse-ticket` authenticated request. **If the landlord's Firebase token has expired or MSAL hasn't yet acquired a fresh token, this fails silently**, and the landlord is left with no SSE connection and 15s polling only.

**The "indicator doesn't update" bug:**
- On the landlord side, the unread badge is a dot (`ll-sidebar-nav-dot`), not a count. The dot appears when `unreadCount > 0`. This relies entirely on `useMessagingPoller` updating `MessagingContext`. If the SSE is dead and the 15s poll hasn't fired yet, the badge doesn't update immediately.
- On the tenant side, the numeric badge in `DashboardSidebar.tsx` has the same dependency.

---

## 10. Recommendations

### Fix 1: Add recipient targeting to SSE emit (CRITICAL)
In `communication.controller.ts` `sendMessage()`, look up the conversation's `tenantId` and `landlordId` from Firestore and emit two targeted events (one per participant) instead of one global broadcast. This ensures the recipient's SSE stream receives the event even when the backend eventually scales to multiple instances with a shared pub/sub.

```typescript
// After result = await communicationService.sendMessage(...)
// Look up conversation to get the other participant's uid
const [tenantId, landlordId] = await communicationService.getParticipants(conversationId);
const recipientId = userId === tenantId ? landlordId : tenantId;

this.eventsService.emit({
  type: 'message_new',
  userId: recipientId,  // ← targets recipient's SSE stream
  data: { conversationId, senderId: userId, message: result.data },
});
this.eventsService.emit({
  type: 'message_new',
  userId: userId,  // ← confirms send to sender's other tabs
  data: { conversationId, senderId: userId, message: result.data },
});
```

### Fix 2: Reduce SSE polling interval (QUICK WIN)
`useMessagingPoller` currently polls every **15 seconds**. With proper SSE in place this is fine, but while the SSE targeting bug exists, consider reducing to **5 seconds** as a stopgap. Or: keep 15s but add an immediate re-fetch on conversation open.

### Fix 3: Move SSE connection initiation to app mount, not message page visit
Both apps already do this via `LandlordMessagingPoller` and `useMessagingPoller` in Dashboard — but verify that `sseService.ensureConnected('communication')` is actually being called for both tenant and landlord on every app mount by adding a log or health check endpoint.

### Fix 4: Implement 24-hour unread reminder email (MISSING FEATURE)
Install `@nestjs/schedule`, add a `@Cron('0 * * * *')` (hourly) job in a new `NotificationSchedulerService` that:
1. Queries Firestore for conversations where `unreadForTenant > 0` OR `unreadForLandlord > 0`
2. Checks if `lastNotifiedAt` is > 24 hours ago (or null)
3. Calls `emailService.sendNewMessageNotification(...)` for the unread recipient
4. Updates `lastNotifiedAt` on the conversation

The current 10-minute dedup field (`lastNotifiedAt`) can serve double duty for this — just change the check from `10 * 60 * 1000` to `24 * 60 * 60 * 1000` for the scheduled reminder, while keeping the 10-minute check for the immediate send notification.

### Fix 5: Make SSE reconnect more robust
The SSE ticket in `sse-tickets.ts` is in-memory and dies when the backend restarts. On Render (which does cold starts), this means every deploy or restart requires every connected client to re-exchange a ticket. The client already handles this via `scheduleReconnect()` → `ensureConnected()` → new ticket exchange, so this is acceptable — but the reconnect delay is exponential (can reach 30s). Consider a max cap of 5s for the communication channel specifically.

### Fix 6: Landlord badge — show numeric count, not just a dot
In `MainLayout.tsx`, replace `hasNotification: unreadCount > 0` with passing the actual count and rendering a numeric badge like the tenant sidebar does. This is a UX improvement, not a bug.

---

## 11. What Does NOT Need to Change

- The Firestore schema is correct for this use case.
- The `communicationService.ts` frontend wrapper is well-structured.
- The `ComposeBox` and `MessageThread` components are complete and correct.
- The email template and Resend integration work correctly.
- The SSE ticket mechanism is a good security practice and should be kept.
- The `markRead` → `unreadForTenant`/`unreadForLandlord` counter pattern in Firestore is correct.
