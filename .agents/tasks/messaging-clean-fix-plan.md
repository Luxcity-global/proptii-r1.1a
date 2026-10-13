# Messaging Clean Fix — Implementation Plan

> Written after reading every relevant source file. Each item is ordered by
> dependency and leaves the codebase in a buildable state when complete.

---

## Root-cause summary (verified against source)

1. **Three competing update paths** — When a message is sent the backend emits
   `message_new` AND `conversation_updated` to both participants. The frontend
   reacts with:
   - **(a)** `MessageThread`'s `sseService.on('message_new')` → direct append
     (correct path).
   - **(b)** `useMessagingPoller`'s `sseService.on(['message_new', 'message_read',
     'conversation_new', 'conversation_updated'])` → calls `fetchData()` which
     re-fetches ALL conversations and overwrites context.
   - **(c)** Both `TenantInbox` and `TenantMessages` watch `conv.lastMessageAt`
     in a `useEffect`; when context is updated by (b), `lastMessageAt` advances,
     triggering a `setTimeout(1500ms)` that clears `optimisticMessages[convId]`.

   Race: (a) appends the real message at SSE time. (b) fires `fetchData` almost
   simultaneously, updating `lastMessageAt` in context. (c) schedules a 1500ms
   clear of the optimistic bubble. Meanwhile (a) has already rendered the real
   message — the optimistic bubble disappears after 1500ms leaving a visual
   double-then-vanish flash. On a slow connection (a) may not have fired yet, so
   the user sees: optimistic → disappears → real message arrives later.

2. **`scrollContainerRef` not passed to `<MessageThread>`** — Both
   `TenantMessages.tsx` and `TenantInbox.tsx` create `scrollContainerRef` and
   attach it to the feed `div`, but neither passes it as the
   `scrollContainerRef` prop to `<MessageThread>`. So `loadEarlier`'s scroll-
   position restoration (`container.scrollTop = ...`) never works because
   `scrollContainerRef?.current` is always `undefined` inside the component.

3. **SSE wire format** — Confirmed correct. Do not touch `sseService.ts`.

4. **`MessageThread` SSE listener** — Confirmed: exactly one
   `sseService.on('message_new')` in `MessageThread.tsx`, with dedup by `msg.id`.
   No changes needed there.

---

## Item 1 — Fix `useMessagingPoller.ts`: remove noisy SSE triggers

**Current problem.** The hook subscribes to
`['message_new', 'message_read', 'conversation_new', 'conversation_updated']`
and calls `fetchData()` on any of them. Every sent message emits *four* SSE
events (two `message_new` + two `conversation_updated`), triggering up to four
parallel `fetchData()` calls within milliseconds. This churns the conversation
list, advances `lastMessageAt` in context, and kicks off the optimistic-clear
race in the parent pages.

**Exact change.**  
File: `src/hooks/useMessagingPoller.ts`

Replace the single `sseService.on(...)` call (currently on the line that reads
`sseService.on(['message_new', 'message_read', 'conversation_new',
'conversation_updated'], () => {...})`) with a subscription only to
`['conversation_new', 'presence_update']`. Keep the `presence_update` handler
exactly as-is (it is separate and already correct). Remove `message_new`,
`message_read`, and `conversation_updated` from the SSE trigger list entirely.

Before (lines ~60–63):
```ts
const unsubscribeSse = sseService.on(['message_new', 'message_read', 'conversation_new', 'conversation_updated'], () => {
    console.debug('[useMessagingPoller] SSE message event received, updating inbox immediately');
    void fetchData();
});
```

After:
```ts
const unsubscribeSse = sseService.on(['conversation_new'], () => {
    console.debug('[useMessagingPoller] New conversation event received, refreshing inbox');
    void fetchData();
});
```

Rationale: `MessageThread` owns `message_new` — it appends directly and marks
read without going through context. The 15 s interval handles conversation list
freshness (unread badge, preview text) for everything else. `conversation_new`
must stay because a newly-created conversation has no prior SSE listener.

**Files:** `src/hooks/useMessagingPoller.ts`

**Verify:** `cd /home/angeli/Desktop/luxcity/proptii-r1.1a && npx vite build`
exits 0. Also grep confirms: `grep -n "message_new\|message_read\|conversation_updated" src/hooks/useMessagingPoller.ts` returns no lines inside `sseService.on(...)`.

---

## Item 2 — Fix `TenantMessages.tsx`: pass `scrollContainerRef` + increase optimistic timeout

**Current problem.**  
(a) `scrollContainerRef` is created and attached to the feed `div` but never
passed to `<MessageThread scrollContainerRef={scrollContainerRef}>`, so
`loadEarlier`'s scroll restoration is a no-op.  
(b) The `lastSeenAt` effect clears `optimisticMessages` after 1500ms — too
short once SSE triggers are removed from the poller (the conversation list will
update on the next 15s poll, not instantly). The clear should happen after
MessageThread has definitely received the real message via SSE, so increase to
3000ms to be safe.

**Exact changes.**  
File: `src/pages/dashboard/TenantMessages.tsx`

**Change A** — Find the `<MessageThread>` JSX (currently):
```tsx
<MessageThread ref={threadRef} conversationId={activeConversationId} currentUserId={currentUserId} onScrollRequest={scrollToBottom} />
```
Change to:
```tsx
<MessageThread ref={threadRef} conversationId={activeConversationId} currentUserId={currentUserId} onScrollRequest={scrollToBottom} scrollContainerRef={scrollContainerRef} />
```

**Change B** — There is no `lastSeenAt` / optimistic-clear `useEffect` in
`TenantMessages.tsx` (that logic lives only in `TenantInbox.tsx`). Confirm
this during implementation — if a similar useEffect is found, increase its
timeout from 1500ms to 3000ms.

**Files:** `src/pages/dashboard/TenantMessages.tsx`

**Verify:** `npx vite build` exits 0. Confirm in built output or grep:
`grep -n "scrollContainerRef" src/pages/dashboard/TenantMessages.tsx` shows
the prop being passed to `MessageThread`.

---

## Item 3 — Fix `TenantInbox.tsx`: pass `scrollContainerRef` + increase optimistic timeout

**Current problem.**  
(a) Same `scrollContainerRef` missing from `<MessageThread>` as in Item 2.  
(b) `TenantInbox.tsx` has the `lastSeenAt` / optimistic-clear `useEffect` at
lines ~185–202. It clears `optimisticMessages` via `setTimeout(..., 1500)`.
After Item 1's fix, `lastMessageAt` will only advance when the 15s poll fires
(not immediately on SSE), so the race is largely eliminated. But 1500ms is
still dangerously short for slow connections where MessageThread's SSE append
may not have fired. Increase to 3000ms as an extra safety margin.

**Exact changes.**  
File: `src/landlord_agent/src/components/TenantInbox.tsx`

**Change A** — Find the `<MessageThread>` JSX (currently):
```tsx
<MessageThread
    ref={threadRef}
    conversationId={activeConversationId}
    currentUserId={currentUserId}
    onScrollRequest={scrollToBottom}
/>
```
Change to:
```tsx
<MessageThread
    ref={threadRef}
    conversationId={activeConversationId}
    currentUserId={currentUserId}
    onScrollRequest={scrollToBottom}
    scrollContainerRef={scrollContainerRef}
/>
```

**Change B** — In the `lastSeenAt` useEffect, find `setTimeout(() => {`, and
change the delay from `1500` to `3000`:
```ts
// Before:
setTimeout(() => {
    setOptimisticMessages((m) => ({ ...m, [activeConversationId]: [] }));
}, 1500);

// After:
setTimeout(() => {
    setOptimisticMessages((m) => ({ ...m, [activeConversationId]: [] }));
}, 3000);
```

**Files:** `src/landlord_agent/src/components/TenantInbox.tsx`

**Verify:** `npx vite build` exits 0. Grep confirms both changes:
```
grep -n "scrollContainerRef" src/landlord_agent/src/components/TenantInbox.tsx
grep -n "3000" src/landlord_agent/src/components/TenantInbox.tsx
```

---

## Item 4 — Verify `MessageThread.tsx` has no regressions (read-only audit)

**No code changes needed** — confirmed from source read:
- Exactly one `sseService.on('message_new', ...)` registration inside
  `useEffect([conversationId, currentUserId, scrollToBottom])`.
- Dedup guard: `if (prev.some(m => m.id === msg.id)) return prev;`
- `fetchAndMarkRead` useCallback depends on `[conversationId, currentUserId]`
  — re-runs when conversation changes (correct).
- `loadEarlier` uses `scrollContainerRef?.current` for scroll restoration —
  will work correctly once Item 2/3 pass the prop.

**Action:** During implementation, confirm with
`grep -c "sseService.on" src/components/messaging/MessageThread.tsx` returns
`4` (message_new, typing_start, message_edit, message_delete — all correct,
none of them trigger a context refetch).

---

## Item 5 — Build verification: backend

**Action:** Run the backend TypeScript build to confirm no compilation errors
were introduced by previous changes (none of our changes touch backend files,
but this is a required gate).

```bash
cd /home/angeli/Desktop/luxcity/proptii-r1.1a/v2-backend && npm run build
```

Expected: exits 0 with NestJS compilation success messages.

If the build fails with TypeScript errors unrelated to our changes (e.g.
pre-existing errors in `communication.service.ts`), fix those TypeScript errors
as a prerequisite — the plan identified no such errors during the read, but
confirm at implementation time.

**Files:** none (read-only verification step — fix only if pre-existing errors
are found).

**Verify:** `npm run build` exits 0.

---

## Item 6 — Build verification: frontend

```bash
cd /home/angeli/Desktop/luxcity/proptii-r1.1a && npx vite build
```

Expected: exits 0. This is the final gate that confirms Items 1–3 compile
cleanly together.

**Files:** none (build verification only).

**Verify:** `npx vite build` exits 0.

---

## Verification checklist

All of the following must pass before committing:

- [ ] **1. Backend build** — `cd v2-backend && npm run build` exits 0.

- [ ] **2. Frontend build** — `cd /home/angeli/Desktop/luxcity/proptii-r1.1a && npx vite build` exits 0.

- [ ] **3. Poller SSE subscription** — `grep -n "sseService.on" src/hooks/useMessagingPoller.ts`
  shows only `['conversation_new']` (and separately `'presence_update'`).
  Must NOT contain `message_new`, `message_read`, or `conversation_updated`
  as SSE triggers.

- [ ] **4. TenantMessages passes scrollContainerRef** —
  `grep -n "scrollContainerRef" src/pages/dashboard/TenantMessages.tsx`
  shows the prop passed to `<MessageThread>`.

- [ ] **5. TenantInbox passes scrollContainerRef** —
  `grep -n "scrollContainerRef" src/landlord_agent/src/components/TenantInbox.tsx`
  shows the prop passed to `<MessageThread>`.

- [ ] **6. MessageThread has exactly one message_new listener** —
  `grep -c "sseService.on" src/components/messaging/MessageThread.tsx`
  returns `4` (message_new, typing_start, message_edit, message_delete).

- [ ] **7. No message_new SSE in parent pages** —
  `grep -rn "sseService.on" src/pages/dashboard/TenantMessages.tsx src/landlord_agent/src/components/TenantInbox.tsx`
  returns no matches.

- [ ] **8. Optimistic-clear timeout increased** —
  `grep -n "3000" src/landlord_agent/src/components/TenantInbox.tsx`
  shows the updated timeout in the `lastSeenAt` useEffect.

---

## Expected runtime behaviour after this fix

| Scenario | Before | After |
|---|---|---|
| User sends message | Optimistic bubble appears; real message appended via SSE; 1500ms later optimistic clears causing a flash/duplicate | Optimistic bubble appears; real message appended via SSE (no context churn); optimistic clears after 3000ms (well after real message visible) |
| Message received in open conversation | MessageThread appends via SSE; simultaneously poller refetches, list re-renders, potential jank | MessageThread appends via SSE; poller only ticks every 15s — no simultaneous refetch |
| Conversation list preview / unread badge | Updates within ~15s or on next `conversation_new` SSE | Same — unchanged; 15s poll handles it |
| Load earlier messages | Scroll position restoration broken (ref not passed) | Scroll position restored correctly |
| New conversation from the other party | Appears on next `conversation_new` SSE immediately | Same — `conversation_new` is kept |

---

*Gate file for the review loop:*  
`/home/angeli/Desktop/luxcity/proptii-r1.1a/.agents/tasks/messaging-clean-fix-review.json`  
Shape: `{ "verdict": "APPROVED" | "CHANGES_REQUESTED", "findings": [...], "reviewDoc": "..." }`
