# Implementation Plan: Proptii Communication Feature

## Overview

Three-phase delivery: Phase 1 removes the Chat CTA and wires the Call CTA to E.164-normalised phone numbers. Phase 2 builds the full messaging backend (Cosmos DB schema, guards, services, REST API, attachments, notifications). Phase 3 delivers the frontend inbox UIs, shared components, polling, and unread badge.

All backend code is TypeScript targeting Azure Functions v4, extending the existing `BaseService` / `BaseController` patterns. All frontend code is TypeScript + React + Vite, using the existing `apiService` singleton and MSAL auth context.

The property-based test library is **fast-check** (added to `devDependencies` in both `api/package.json` and the root `package.json`). Tests run with Jest.

---

## Tasks

## Phase 1 — UI Cleanup & Call Feature

- [x] 1. Remove Chat CTA from all property listing surfaces
  - In `src/components/listings/ListingCard.tsx`, remove any Chat/Message button element and its click handler from the agent contact row; preserve the layout and spacing of the remaining Call and Message CTAs
  - In `src/components/listings/ListingDetailsModal.tsx`, remove the Chat button from the agent contact grid; ensure the two-column grid collapses cleanly to the remaining Call and Email buttons
  - Search the rest of `src/components/` for any other surface that renders a Chat CTA (e.g. `PropertyModal.tsx`, `SearchResults.tsx`) and remove it from each
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Build `PhoneNormaliser` utility
  - Add `libphonenumber-js` to `api/package.json` dependencies
  - Create `api/src/shared/utils/phoneNormaliser.ts` exporting the `PhoneNormaliseResult` union type and the `normalisePhone(raw, field, defaultRegion?)` pure function as specified in the design
  - Return `{ success: true, e164 }` for parseable inputs; return `{ success: false, field, rawValue, reason }` for unparseable inputs
  - Create `api/src/shared/utils/__tests__/phoneNormaliser.test.ts` with unit tests covering: UK mobile with spaces, US number with country code, number with parentheses and hyphens, leading-zero UK number, empty string, random alphanumeric string, string shorter than 7 digits
  - _Requirements: 2.1, 2.2, 2.5, 2.6_

  - [x] 2.1 Write property test — Property 1: valid E.164 output for parseable inputs
    - **Property 1: Phone normalisation produces valid E.164 for parseable inputs**
    - Create `api/src/shared/utils/__tests__/properties/phoneNormaliser.property.test.ts`
    - Use `fc.string()` filtered to strings containing digit sequences; assert result matches `^\+[1-9]\d{6,14}$` when `success === true`
    - **Validates: Requirements 2.1, 2.5**

  - [x] 2.2 Write property test — Property 2: structured error for unparseable inputs
    - **Property 2: Phone normalisation returns structured error for unparseable inputs**
    - Use `fc.string()` filtered to strings with no recognisable phone pattern; assert `success === false` and `field` and `rawValue` are non-empty strings
    - **Validates: Requirements 2.2**

- [x] 3. Wire Call CTA to E.164-normalised phone field
  - Add a `phone` field (type `string | undefined`) to the `Property` interface in `src/components/listings/ListingCard.tsx` and `ListingDetailsModal.tsx`; populate it from `property.agent.phone` after passing through `normalisePhone` on the backend response
  - Update `ListingCard.tsx`: when `property.phone` is a valid E.164 string, render `<a href={\`tel:${property.phone}\`}>` with the Phone icon and "Call" label; when absent, render the existing disabled button with `aria-disabled="true"` and `title="Phone number unavailable"`
  - Update `ListingDetailsModal.tsx` with the same conditional rendering for the "Call Agent" button
  - Update `api/src/shared/services/PropertyService.ts` to call `normalisePhone` on the `agent.phone` field before returning a property document; add `phone` (E.164 string) to the property schema
  - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [x] 3.1 Write property test — Property 3: Call CTA renders as tel: anchor for valid E.164
    - **Property 3: Call CTA renders as tel: anchor for valid E.164 numbers**
    - Create `src/components/listings/__tests__/properties/ListingCard.property.test.tsx`
    - Use `fc.string()` filtered to valid E.164 patterns; render `ListingCard` with the generated phone value and assert the rendered `<a>` element has `href === \`tel:${e164}\``
    - **Validates: Requirements 2.3**

- [x] 4. Checkpoint — Phase 1 complete
  - Ensure all Phase 1 tests pass, ask the user if questions arise.

---

## Phase 2 — Messaging Infrastructure

- [x] 5. Add messaging environment variables to `environment.ts`
  - Extend the Zod schema in `api/src/shared/config/environment.ts` with the six new fields from the design: `BLOB_STORAGE_CONNECTION_STRING`, `BLOB_STORAGE_CONTAINER_NAME`, `ATTACHMENT_SAS_EXPIRY_SECONDS` (coerce number, default 3600), `EMAIL_FROM_ADDRESS` (email), `ACTIVE_USER_THRESHOLD_SECONDS` (coerce number, default 300), `EMAIL_DEDUP_WINDOW_SECONDS` (coerce number, default 900)
  - Add the corresponding keys (with placeholder values) to `api/local.settings.json.backup-1753100176765` as documentation; do not commit real secrets
  - _Requirements: 7.5, 9.1, 9.2, 9.5_

- [x] 6. Define Cosmos DB messaging TypeScript interfaces
  - Create `api/src/shared/types/messaging.ts` exporting the six interfaces exactly as specified in the design: `Conversation`, `Message`, `MessageAttachment`, `ConversationParticipant`, `NotificationLog`, `AuditLog`
  - Include JSDoc comments referencing the container name and partition key for each interface
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Implement `ConversationParticipantGuard`
  - Create `api/src/shared/middleware/conversationParticipantGuard.ts` exporting `withParticipantGuard(handler)` as specified in the design
  - Extract `conversationId` from `request.params.conversationId` or `request.query.get('conversationId')`; extract `userId` from the decoded Bearer token (`sub` claim)
  - Query the `conversation_participants` Cosmos DB container; return HTTP 404 (`CONVERSATION_NOT_FOUND`) if no participants exist for the conversation; return HTTP 403 (`FORBIDDEN_NOT_PARTICIPANT`) if the userId is not among them
  - Create `api/src/shared/middleware/__tests__/conversationParticipantGuard.test.ts` with unit tests: participant allowed through, non-participant rejected with 403, missing conversation returns 404
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.1 Write property test — Property 8: guard rejects non-participants with HTTP 403
    - **Property 8: ConversationParticipantGuard rejects non-participants with HTTP 403**
    - Create `api/src/shared/middleware/__tests__/properties/conversationParticipantGuard.property.test.ts`
    - Use `fc.record({ userId: fc.uuid(), conversationId: fc.uuid() })` with a mocked Cosmos DB that never returns the userId as a participant; assert every call returns HTTP 403 with `FORBIDDEN_NOT_PARTICIPANT`
    - **Validates: Requirements 5.3**

- [x] 8. Implement `ConversationService`
  - Create `api/src/shared/services/ConversationService.ts` extending `BaseService` (container: `conversations`)
  - Implement `getOrCreateConversation(dto)`: query for existing document matching `(propertyId, tenantId, landlordId)`; if found return it; if not, create new document with UUID id, ISO timestamps, `isDeleted: false`, and simultaneously create two `conversation_participants` records (one for tenantId, one for landlordId); return HTTP 201 on create, existing document on find
  - Implement `listConversationsForUser(userId)`: query `conversation_participants` for all conversationIds where `userId` matches, then fetch each conversation; return sorted by `lastMessageAt` descending (null values last)
  - Implement `getMessages(conversationId)`: query `messages` container where `conversationId` matches and `isDeleted === false`, ordered by `sentAt` ascending
  - Implement `createMessage(conversationId, dto, senderId, senderRole)`: validate `body.length >= 1 && body.length <= 4000` (throw `AppError(422, ..., 'MESSAGE_BODY_TOO_LONG')` on violation); validate `senderRole` is `'tenant'` or `'landlord'` (throw `AppError(422, ..., 'INVALID_SENDER_ROLE')`); create message document; update `conversations.lastMessageAt` and `updatedAt`
  - Implement `markMessageRead(messageId, conversationId)`: set `readAt` to current UTC ISO string
  - Implement `getUnreadCount(userId)`: count messages where `readAt === null` and `senderId !== userId` across all conversations where the user is a participant
  - Implement `softDeleteMessage(messageId, conversationId, actorId)`: call `BaseService.softDelete`; then create an `audit_log` document with `entityType: 'message'`, `entityId: messageId`, `actorId`, `action: 'soft_delete'`, `timestamp`
  - Create `api/src/shared/services/__tests__/ConversationService.test.ts` with unit tests for each method using mocked Cosmos DB
  - _Requirements: 3.3, 3.4, 4.1, 4.2, 4.6, 4.7, 6.1, 6.3, 6.5, 6.6, 6.7, 13.1, 13.2, 13.4_

  - [x] 8.1 Write property test — Property 4: conversation creation is idempotent
    - **Property 4: Conversation creation is idempotent**
    - Create `api/src/shared/services/__tests__/properties/ConversationService.property.test.ts`
    - Use `fc.record({ propertyId: fc.uuid(), tenantId: fc.uuid(), landlordId: fc.uuid() })`; call `getOrCreateConversation` twice with the same triple; assert both calls return the same `conversationId` and only one document exists
    - **Validates: Requirements 3.3**

  - [x] 8.2 Write property test — Property 6: message body length validation
    - **Property 6: Message body length validation**
    - Use `fc.string({ minLength: 4001 })` for over-limit bodies; assert HTTP 422 with `MESSAGE_BODY_TOO_LONG`
    - Use `fc.string({ minLength: 1, maxLength: 4000 })` for valid bodies; assert message is created
    - **Validates: Requirements 4.6**

  - [x] 8.3 Write property test — Property 7: senderRole validation
    - **Property 7: senderRole validation**
    - Use `fc.string()` filtered to exclude `'tenant'` and `'landlord'`; assert HTTP 422 with `INVALID_SENDER_ROLE`
    - **Validates: Requirements 4.7**

  - [x] 8.4 Write property test — Property 9: conversations ordered by lastMessageAt descending
    - **Property 9: GET /conversations returns conversations ordered by lastMessageAt descending**
    - Use `fc.array(fc.record({ lastMessageAt: fc.option(fc.date()) }), { minLength: 2 })`; assert returned list is sorted descending with nulls last
    - **Validates: Requirements 6.1**

  - [x] 8.5 Write property test — Property 10: messages exclude deleted and are ordered by sentAt ascending
    - **Property 10: GET /conversations/:id/messages excludes deleted messages and is ordered by sentAt ascending**
    - Use `fc.array(fc.record({ isDeleted: fc.boolean(), sentAt: fc.date() }))`; assert only non-deleted messages are returned, in ascending sentAt order
    - **Validates: Requirements 6.3, 6.7**

  - [x] 8.6 Write property test — Property 11: unread count matches expected formula
    - **Property 11: Unread count matches expected formula**
    - Use `fc.array(fc.record({ readAt: fc.option(fc.string()), senderId: fc.uuid() }))` with a fixed `currentUserId`; assert count equals messages where `readAt === null && senderId !== currentUserId`
    - **Validates: Requirements 6.6**

  - [x] 8.7 Write property test — Property 24: soft delete sets isDeleted and deletedAt without removing document
    - **Property 24: Soft delete sets isDeleted and deletedAt without removing the document**
    - Use `fc.record({ messageId: fc.uuid(), conversationId: fc.uuid() })`; after soft delete, assert document is still retrievable with `isDeleted === true` and `deletedAt` is a valid ISO 8601 string
    - **Validates: Requirements 13.1, 13.2**

  - [x] 8.8 Write property test — Property 25: soft delete creates audit_log entry
    - **Property 25: Soft delete creates audit_log entry**
    - After each soft delete, assert an `audit_log` document exists with `entityType === 'message'`, correct `entityId`, `actorId`, and `action === 'soft_delete'`
    - **Validates: Requirements 13.4**

  - [x] 8.9 Write property test — Property 26: data isolation — user responses contain only their own conversation IDs
    - **Property 26: Data isolation — user responses contain only their own conversation IDs**
    - Use `fc.record({ userA: fc.uuid(), userB: fc.uuid() })` with distinct conversation sets; assert `listConversationsForUser(userA)` contains no `tenantId`, `landlordId`, or participant `userId` belonging exclusively to userB's conversations
    - **Validates: Requirements 14.3**

- [x] 9. Implement `AttachmentService`
  - Add `@azure/storage-blob` to `api/package.json` dependencies
  - Create `api/src/shared/services/AttachmentService.ts` extending `BaseService` (container: `message_attachments`)
  - Implement `uploadAttachment(file, fileName, mimeType, sizeBytes, uploaderId, conversationId)`: validate MIME type against the four allowed values (throw `AppError(415, ..., 'UNSUPPORTED_MEDIA_TYPE')` on failure); validate `sizeBytes <= 10_485_760` (throw `AppError(413, ..., 'FILE_TOO_LARGE')` on failure); upload buffer to Azure Blob Storage using `BlobServiceClient.fromConnectionString`; on Blob Storage failure throw `AppError(502, ..., 'BLOB_UPLOAD_FAILED')` without creating a Cosmos DB record; on success create and return a `message_attachments` document
  - Implement `generateSasUrl(attachmentId, conversationId)`: retrieve attachment metadata; generate a SAS URL with expiry from `ATTACHMENT_SAS_EXPIRY_SECONDS`; return the URL string
  - Create `api/src/shared/services/__tests__/AttachmentService.test.ts` with unit tests using mocked Blob Storage SDK
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 9.1 Write property test — Property 12: attachment MIME type validation
    - **Property 12: Attachment MIME type validation**
    - Create `api/src/shared/services/__tests__/properties/AttachmentService.property.test.ts`
    - Use `fc.string()` filtered to exclude the four allowed MIME types; assert HTTP 415 for every disallowed value
    - **Validates: Requirements 7.2**

  - [x] 9.2 Write property test — Property 13: attachment file size validation
    - **Property 13: Attachment file size validation**
    - Use `fc.integer({ min: 10_485_761, max: 100_000_000 })` for over-limit sizes; assert HTTP 413
    - Use `fc.integer({ min: 1, max: 10_485_760 })` for valid sizes; assert upload proceeds
    - **Validates: Requirements 7.3**

  - [x] 9.3 Write property test — Property 14: attachment upload round-trip persists metadata
    - **Property 14: Attachment upload round-trip persists metadata**
    - Use `fc.record({ fileName: fc.string(), mimeType: fc.constantFrom('application/pdf', 'text/plain'), sizeBytes: fc.integer({ min: 1, max: 10_485_760 }), uploaderId: fc.uuid(), conversationId: fc.uuid() })`; assert stored metadata matches input exactly
    - **Validates: Requirements 7.6**

- [x] 10. Implement `NotificationService`
  - Create `api/src/shared/services/NotificationService.ts` extending `BaseService` (container: `notification_log`)
  - Implement `notify(recipientId, conversationId, senderName)`:
    1. Fetch recipient's `lastSeenAt` from the user record; if within `ACTIVE_USER_THRESHOLD_SECONDS` seconds of now, return without sending email or creating a log entry
    2. Query `notification_log` for a document with `dedupKey === "{recipientId}:{conversationId}"` and `sentAt` within the last `EMAIL_DEDUP_WINDOW_SECONDS` seconds; if found, return without sending
    3. Send email via nodemailer using `EMAIL_FROM_ADDRESS`; create a `notification_log` document with `channel: 'email'`, `sentAt` (ISO 8601), `dedupKey`
  - Implement `updateLastSeen(userId)`: update the user record's `lastSeenAt` to the current UTC ISO string
  - Create `api/src/shared/services/__tests__/NotificationService.test.ts` with unit tests using mocked nodemailer and Cosmos DB
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 10.1 Write property test — Property 17: email suppressed when recipient is active
    - **Property 17: Email suppressed when recipient is active (lastSeenAt within 5 minutes)**
    - Create `api/src/shared/services/__tests__/properties/NotificationService.property.test.ts`
    - Use `fc.integer({ min: 0, max: 299 })` for seconds-ago values; assert no email is sent and no `notification_log` entry is created
    - **Validates: Requirements 9.2**

  - [x] 10.2 Write property test — Property 18: email dedup suppresses duplicate notifications
    - **Property 18: Email dedup suppresses duplicate notifications within 15-minute window**
    - Use `fc.record({ recipientId: fc.uuid(), conversationId: fc.uuid() })` with an existing `notification_log` entry within 900 seconds; assert no email is sent and no duplicate log entry is created
    - **Validates: Requirements 9.5**

  - [x] 10.3 Write property test — Property 19: email notification creates notification_log entry with correct fields
    - **Property 19: Email notification creates notification_log entry with correct fields**
    - For cases where recipient is inactive and no dedup entry exists, assert `notification_log` has `channel === 'email'`, `dedupKey === "{recipientId}:{conversationId}"`, and `sentAt` within 1 second of send time
    - **Validates: Requirements 9.6**

  - [x] 10.4 Write property test — Property 20: lastSeenAt updated on every authenticated request
    - **Property 20: lastSeenAt is updated on every authenticated /api/communication request**
    - Use `fc.record({ userId: fc.uuid() })`; call `updateLastSeen` and assert the stored `lastSeenAt` is within 1 second of the call time
    - **Validates: Requirements 9.7**

- [x] 11. Implement `CommunicationController` and register all routes
  - Create `api/src/functions/communication/index.ts` following the existing controller class pattern (see `viewings/index.ts`)
  - Instantiate `ConversationService`, `AttachmentService`, `NotificationService`
  - Register the following `app.http()` routes, each wrapped with `withAuth` and (where applicable) `withParticipantGuard`; call `notificationService.updateLastSeen(userId)` at the start of every authenticated handler:
    - `GET  /api/communication/conversations` → `listConversationsForUser`
    - `POST /api/communication/conversations` → `getOrCreateConversation` (withAuth only)
    - `GET  /api/communication/conversations/unread-count` → `getUnreadCount`
    - `GET  /api/communication/conversations/{id}/messages` → `getMessages` (+ guard)
    - `POST /api/communication/conversations/{id}/messages` → `createMessage` (+ guard); call `notificationService.notify` after successful create
    - `PATCH /api/communication/messages/{id}/read` → `markMessageRead` (+ guard)
    - `DELETE /api/communication/messages/{id}` → `softDeleteMessage` (+ guard)
    - `POST /api/communication/attachments/upload` → `uploadAttachment` (+ guard via query param)
    - `GET  /api/communication/attachments/{id}/url` → `generateSasUrl` (+ guard)
  - Log every HTTP 401 and 403 response to `MonitoringService`
  - Create `api/src/functions/communication/__tests__/CommunicationController.test.ts` with unit tests for each route: correct HTTP status codes, response shapes, and guard invocation
  - _Requirements: 3.2, 3.6, 5.1, 6.1–6.8, 7.1, 7.4, 9.7, 13.3, 14.1, 14.2, 14.5_

  - [x] 11.1 Write property test — Property 5: unauthenticated requests return HTTP 401
    - **Property 5: Unauthenticated requests to /api/communication return HTTP 401**
    - Create `api/src/functions/communication/__tests__/properties/CommunicationController.property.test.ts`
    - Use `fc.constantFrom(...allEndpoints)` with no Bearer token or an invalid token; assert every endpoint returns HTTP 401
    - **Validates: Requirements 3.6, 6.8, 14.1**

- [x] 12. Checkpoint — Phase 2 complete
  - Ensure all Phase 2 tests pass, ask the user if questions arise.

---

## Phase 3 — Dashboard Messaging UI

- [x] 13. Add `fast-check` to both package.json files and define frontend messaging types
  - Add `"fast-check": "^3.x"` to `devDependencies` in `api/package.json` and the root `package.json`
  - Create `src/types/messaging.ts` exporting the six TypeScript interfaces that mirror the Cosmos DB models: `Conversation`, `Message`, `MessageAttachment`, `ConversationParticipant`, `NotificationLog`, `AuditLog`; also export `CreateConversationDto`, `CreateMessageDto`, `SendMessageDto` request DTOs
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 14. Implement `communicationService` frontend API wrapper
  - Create `src/services/communicationService.ts` as a plain object (not a class) wrapping the existing `apiService` singleton
  - Implement all eight methods from the design: `getConversations`, `getOrCreateConversation`, `getMessages`, `sendMessage`, `markRead`, `getUnreadCount`, `uploadAttachment` (uses `apiService.uploadFile`), `getAttachmentUrl`
  - All methods return typed promises using the interfaces from `src/types/messaging.ts`
  - Create `src/services/__tests__/communicationService.test.ts` with unit tests mocking `apiService`; assert correct endpoints, HTTP methods, and payloads for each method
  - _Requirements: 3.2, 6.1–6.6, 7.1, 7.4_

- [x] 15. Implement `MessagingContext` and `useMessagingPoller` hook
  - Create `src/contexts/MessagingContext.tsx` exporting `MessagingContext` and `MessagingProvider`; the context shape matches the design: `conversations`, `unreadCount`, `activeConversationId`, `setActiveConversationId`, `refreshConversations`
  - Create `src/hooks/useMessagingPoller.ts` implementing the 30-second polling loop:
    - Use `setInterval` with 30 000 ms; call `communicationService.getConversations()` and `communicationService.getUnreadCount()` on each tick; write results to `MessagingContext`
    - Add a `document.addEventListener('visibilitychange', ...)` listener: pause the interval when `document.visibilityState === 'hidden'`; on becoming visible, fire an immediate fetch then restart the interval
    - Clean up both the interval and the event listener in the `useEffect` return
  - Wrap `Dashboard` in `MessagingProvider` in `src/components/dashboard/Dashboard.tsx`; call `useMessagingPoller()` inside `Dashboard`
  - Create `src/hooks/__tests__/useMessagingPoller.test.ts` with unit tests using Jest fake timers: assert polling fires at 30-second intervals, pauses on hidden, resumes immediately on visible
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 15.1 Write property test — Property 15: poller calls APIs at 30-second intervals when tab is visible
    - **Property 15: Poller calls APIs at 30-second intervals when tab is visible**
    - Create `src/hooks/__tests__/properties/useMessagingPoller.property.test.ts`
    - Use `fc.integer({ min: 1, max: 20 })` for number of ticks; advance fake timers by `ticks * 30_000` ms; assert `getConversations` and `getUnreadCount` were each called exactly `ticks` times (plus the initial call)
    - **Validates: Requirements 8.1**

  - [x] 15.2 Write property test — Property 16: poller resumes immediately on tab becoming visible
    - **Property 16: Poller resumes immediately on tab becoming visible**
    - Use `fc.integer({ min: 1, max: 5 })` for number of hide/show cycles; assert an immediate API call is made on each visibility-restored event before the next 30-second tick
    - **Validates: Requirements 8.3**

- [x] 16. Implement shared messaging UI components
  - Create `src/components/messaging/` directory with an `index.ts` barrel export
  - **`MessageThread.tsx`**: accepts `{ conversationId: string; currentUserId: string }`; on mount and when `conversationId` changes, call `communicationService.getMessages(conversationId)` and call `communicationService.markRead` for each unread message; render messages in ascending `sentAt` order; messages where `senderId === currentUserId` are right-aligned, others left-aligned; show an inline error banner on fetch failure
  - **`ComposeBox.tsx`**: accepts `{ conversationId: string; onSend: (message: Message) => void }`; renders a `<textarea>` with a 4 000-character limit and a visible `{length}/4000` counter; disables the submit button and shows an error state when the limit is exceeded; renders a file attachment button with `accept=".pdf,.doc,.docx,.txt"`; when a file is selected, calls `communicationService.uploadAttachment` before `sendMessage`; shows a toast on upload failure without submitting the message; calls `onSend` with the created message on success
  - **`ConversationListItem.tsx`**: accepts `{ conversation: Conversation; isActive: boolean; onClick: (id: string) => void }`; renders property address, participant name, last message preview truncated to 80 characters, timestamp, and an unread dot indicator when `lastMessageAt` is newer than the last `readAt`
  - Create unit tests in `src/components/messaging/__tests__/` for each component
  - _Requirements: 10.2, 10.3, 10.4, 10.5, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 16.1 Write property test — Property 21: ConversationListItem renders all required fields with preview truncated to 80 chars
    - **Property 21: ConversationListItem renders all required fields with preview truncated to 80 characters**
    - Create `src/components/messaging/__tests__/properties/ConversationListItem.property.test.tsx`
    - Use `fc.record({ lastMessageBody: fc.string() })`; assert rendered preview is at most 80 characters for any input length
    - **Validates: Requirements 10.2, 11.2**

  - [x] 16.2 Write property test — Property 22: MessageThread renders messages in chronological order with correct alignment
    - **Property 22: MessageThread renders messages in chronological order with correct alignment**
    - Create `src/components/messaging/__tests__/properties/MessageThread.property.test.tsx`
    - Use `fc.array(fc.record({ sentAt: fc.date(), senderId: fc.uuid() }), { minLength: 2 })`; assert rendered messages are in ascending `sentAt` order and alignment matches `senderId === currentUserId`
    - **Validates: Requirements 12.1**

  - [x] 16.3 Write property test — Property 23: ComposeBox enforces 4,000-character limit
    - **Property 23: ComposeBox enforces 4,000-character limit**
    - Create `src/components/messaging/__tests__/properties/ComposeBox.property.test.tsx`
    - Use `fc.string({ minLength: 4001 })`; assert submit button is disabled and character counter shows an exceeded state
    - **Validates: Requirements 12.2**

- [x] 17. Implement `TenantMessages` page
  - Create `src/pages/dashboard/TenantMessages.tsx` at route `/dashboard/messages`
  - Two-column layout: left column renders a list of `ConversationListItem` components from `MessagingContext.conversations`; right column renders `MessageThread` + `ComposeBox` for `MessagingContext.activeConversationId`
  - On mount, call `communicationService.getConversations()` and populate context if not already populated by the poller
  - When a conversation is selected, call `setActiveConversationId`; when `ComposeBox.onSend` fires, append the new message to the thread optimistically
  - Show empty-state illustration and "No conversations yet" text when `conversations` is empty
  - Add the route `<Route path="messages" element={<TenantMessages />} />` inside the `/dashboard` `<Route>` in `src/App.tsx`
  - Add a "Messages" entry to `DASHBOARD_SECTIONS` in `src/components/dashboard/Dashboard.tsx` with path `/dashboard/messages` and a message-bubble icon
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 18. Implement `LandlordMessages` page
  - Create `src/pages/landlord/LandlordMessages.tsx` at route `/landlord/messages`
  - Same two-column layout as `TenantMessages`; left column groups `ConversationListItem` rows by property address
  - Show empty-state illustration and "No conversations yet" text when `conversations` is empty
  - Wire `MessagingProvider` and `useMessagingPoller` into the landlord layout (the component that wraps `/landlord/*` routes in `src/App.tsx`, currently `LandlordDemo`)
  - Add the route `<Route path="messages" element={<LandlordMessages />} />` inside the `/landlord/*` route in `src/App.tsx`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 19. Add unread badge to `DashboardSidebar`
  - In `src/components/dashboard/ui/DashboardSidebar.tsx`, consume `unreadCount` from `MessagingContext`
  - On the Messages navigation button, render a badge `<span>` positioned absolutely over the icon: display the numeric count when `unreadCount > 0`; display `"99+"` when `unreadCount > 99`; hide the badge entirely (do not render the element) when `unreadCount === 0`
  - Apply the same badge logic to the mobile sidebar Messages button
  - Create `src/components/dashboard/ui/__tests__/DashboardSidebar.test.tsx` with unit tests: badge shows count, badge shows "99+", badge is absent at zero
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 19.1 Write property test — Property 27: unread badge displays correct count and hides at zero
    - **Property 27: Unread badge displays correct count and hides at zero**
    - Create `src/components/dashboard/ui/__tests__/properties/DashboardSidebar.property.test.tsx`
    - Use `fc.integer({ min: 0, max: 200 })`; assert badge is hidden at 0, shows numeric value for 1–99, shows "99+" for 100+
    - **Validates: Requirements 15.1, 15.2, 15.3**

- [x] 20. Wire Message CTA on listing surfaces to initiate a conversation
  - In `src/components/listings/ListingCard.tsx`, replace the existing Email/Message button with a "Message" button that:
    - If the user is unauthenticated, redirects to the MSAL login flow with a `returnUrl` pointing back to the listing
    - If authenticated, calls `communicationService.getOrCreateConversation({ propertyId, tenantId: currentUser.id, landlordId: property.landlordId })` then navigates to `/dashboard/messages` with the returned `conversationId` set as `activeConversationId`
  - Apply the same logic to `ListingDetailsModal.tsx`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 21. Final checkpoint — Phase 3 complete
  - Ensure all Phase 3 tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they do not block the core implementation tasks
- Each property test file should include the comment `// Feature: proptii-communication, Property N: <title>` at the top for traceability
- The `fast-check` global `numRuns` should be set to `100` in `jest.config.js` (both `api/jest.config.js` and the root config)
- Cosmos DB containers (`conversations`, `messages`, `message_attachments`, `conversation_participants`, `notification_log`, `audit_log`) must be created manually in the Azure portal or via the Cosmos DB emulator before running integration tests; the `notification_log` container requires TTL set to 90 days (7 776 000 seconds)
- No public API endpoint should perform a hard delete on messaging data (Requirement 13.3)
- All 401 and 403 responses from `/api/communication` must be logged via `MonitoringService` (Requirement 14.5)
