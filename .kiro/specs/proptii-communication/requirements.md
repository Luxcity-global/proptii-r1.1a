# Requirements Document

## Introduction

The Proptii Communication Feature replaces three UI-only scaffolding buttons (Chat, Call, Message) with a fully functional communication system. The feature is delivered in three phases:

- **Phase 1** — UI cleanup (remove Chat CTA) and a working Call flow using E.164-normalised phone numbers from the property API.
- **Phase 2** — Messaging infrastructure: Cosmos DB schema, a ConversationParticipantGuard, a Core API under `/api/communication`, file attachments via Azure Blob Storage, and in-app/email notifications.
- **Phase 3** — Dashboard Messaging UI: a tenant inbox, a landlord inbox, shared UI components, and production hardening.

All authentication is handled exclusively by Azure AD B2C / MSAL. All messaging data is stored exclusively in Cosmos DB SQL API. All API calls are routed exclusively through the NestJS `proptii-backend`.

---

## Glossary

- **System**: The Proptii platform (frontend React/TypeScript/Vite app + NestJS proptii-backend API).
- **Frontend**: The React + TypeScript + Vite single-page application.
- **Backend**: The NestJS `proptii-backend` service.
- **Auth_Service**: Azure AD B2C / MSAL — the sole authentication and identity provider.
- **Cosmos_DB**: Azure Cosmos DB SQL API — the sole data store for all messaging domain entities.
- **Blob_Storage**: Azure Blob Storage — the sole store for message file attachments.
- **Phone_Normaliser**: The component responsible for converting raw phone strings to E.164 format.
- **ConversationParticipantGuard**: The NestJS guard that verifies the authenticated caller is a participant of the requested conversation before allowing access to any messaging endpoint.
- **Poller**: The tab-aware polling mechanism that fetches new messages every 30 seconds while the browser tab is visible.
- **Notification_Service**: The component that sends in-app badge updates and email notifications to message recipients.
- **MessageThread**: The shared React component that renders a conversation's message history.
- **ComposeBox**: The shared React component that allows a user to type and send a message or attach a file.
- **ConversationListItem**: The shared React component that renders a single conversation summary row in an inbox list.
- **Tenant**: An authenticated user with the `tenant` role browsing or renting properties.
- **Landlord**: An authenticated user with the `landlord` role managing property listings.
- **Conversation**: A unique messaging thread scoped to a `(propertyId, tenantId, landlordId)` triple, stored in the `conversations` Cosmos DB container.
- **Message**: A single text or attachment-reference entry within a Conversation, stored in the `messages` Cosmos DB container.
- **Soft_Delete**: Marking a record as deleted by setting `isDeleted: true` and `deletedAt` without physically removing it from Cosmos DB.
- **Hard_Delete**: Physically removing a record from Cosmos DB, performed only as an ops procedure for GDPR compliance.
- **E.164**: The ITU-T international phone number format, e.g. `+447911123456`.
- **SAS_Token**: A time-limited Azure Blob Storage Shared Access Signature URL used to serve attachment files.
- **Dedup_Window**: A 15-minute window during which duplicate email notifications for the same conversation are suppressed.
- **lastSeenAt**: A timestamp on the user record updated whenever the user makes an authenticated API call; used to determine whether a user is "active" (within 5 minutes) for notification suppression.

---

## Requirements

### Requirement 1: Remove Chat CTA

**User Story:** As a product owner, I want the Chat button removed from all property listing surfaces, so that users are not presented with a non-functional UI element.

#### Acceptance Criteria

1. THE Frontend SHALL remove the Chat call-to-action button from `ListingCard` and `ListingDetailsModal` components.
2. THE Frontend SHALL remove the Chat call-to-action button from any other property listing surface that currently renders it.
3. WHEN the Chat CTA is removed, THE Frontend SHALL preserve the layout and spacing of the remaining Call and Message CTAs without visual regression.

---

### Requirement 2: Call CTA — E.164 Phone Number Normalisation

**User Story:** As a tenant, I want to tap a Call button on a property listing and have my device dial the landlord or agent directly, so that I can quickly make contact without manually copying a number.

#### Acceptance Criteria

1. WHEN a property record is retrieved from the Backend, THE Phone_Normaliser SHALL convert the raw phone string to E.164 format before it is stored or returned to the Frontend.
2. IF a raw phone string cannot be parsed into a valid E.164 number, THEN THE Phone_Normaliser SHALL return a structured error indicating the field name and the invalid value.
3. THE Frontend SHALL render the Call CTA as an `<a href="tel:{e164Number}">` anchor element when a valid E.164 phone number is available for the property.
4. WHEN a valid E.164 phone number is not available for a property, THE Frontend SHALL render the Call CTA as a disabled button with an accessible `aria-disabled="true"` attribute and a visible tooltip stating "Phone number unavailable".
5. THE Phone_Normaliser SHALL accept phone strings containing spaces, hyphens, parentheses, and leading zeros and produce a valid E.164 string.
6. THE Backend SHALL validate that the normalised phone number matches the E.164 pattern `^\+[1-9]\d{6,14}$` before persisting it.

---

### Requirement 3: Message CTA — Initiate Conversation from Listing

**User Story:** As a tenant, I want to click a Message button on a property listing and start a conversation with the landlord, so that I can ask questions about the property without leaving the platform.

#### Acceptance Criteria

1. WHEN an unauthenticated user clicks the Message CTA, THE Frontend SHALL redirect the user to the Auth_Service login flow and return them to the originating listing page after successful authentication.
2. WHEN an authenticated Tenant clicks the Message CTA on a property listing, THE Frontend SHALL call `POST /api/communication/conversations` with the `propertyId`, `tenantId`, and `landlordId`.
3. WHEN `POST /api/communication/conversations` is called and a Conversation for the `(propertyId, tenantId, landlordId)` triple already exists, THE Backend SHALL return the existing Conversation document without creating a duplicate (idempotent get-or-create).
4. WHEN `POST /api/communication/conversations` is called and no matching Conversation exists, THE Backend SHALL create a new Conversation document in Cosmos_DB with `partitionKey: /tenantId` and return it with HTTP 201.
5. AFTER a Conversation is obtained or created, THE Frontend SHALL navigate the user to the messaging thread view for that Conversation.
6. THE Backend SHALL reject `POST /api/communication/conversations` requests that do not carry a valid Bearer token from Auth_Service with HTTP 401.

---

### Requirement 4: Cosmos DB Messaging Schema

**User Story:** As a backend engineer, I want a well-defined Cosmos DB schema for all messaging entities, so that the data model is consistent, queryable, and supports all messaging features.

#### Acceptance Criteria

1. THE Cosmos_DB SHALL contain a `conversations` container with partition key `/tenantId`, storing documents with fields: `id`, `propertyId`, `tenantId`, `landlordId`, `createdAt`, `updatedAt`, `lastMessageAt`, `isDeleted`, `deletedAt`.
2. THE Cosmos_DB SHALL contain a `messages` container with partition key `/conversationId`, storing documents with fields: `id`, `conversationId`, `senderId`, `senderRole`, `body`, `attachmentIds`, `sentAt`, `readAt`, `isDeleted`, `deletedAt`.
3. THE Cosmos_DB SHALL contain a `message_attachments` container with partition key `/conversationId`, storing documents with fields: `id`, `conversationId`, `messageId`, `uploaderId`, `fileName`, `mimeType`, `sizeBytes`, `blobPath`, `uploadedAt`.
4. THE Cosmos_DB SHALL contain a `conversation_participants` container with partition key `/conversationId`, storing documents with fields: `id`, `conversationId`, `userId`, `role`, `joinedAt`.
5. THE Cosmos_DB SHALL contain a `notification_log` container with partition key `/recipientId` and a TTL of 90 days, storing documents with fields: `id`, `recipientId`, `conversationId`, `channel`, `sentAt`, `dedupKey`.
6. THE Backend SHALL enforce that the `messages.body` field does not exceed 4,000 characters, returning HTTP 422 with a descriptive error when the limit is exceeded.
7. THE Backend SHALL enforce that `messages.senderRole` is one of the values `tenant` or `landlord`.

---

### Requirement 5: ConversationParticipantGuard

**User Story:** As a security engineer, I want every messaging API endpoint protected by a guard that verifies the caller is a participant of the requested conversation, so that tenants cannot read landlord-only conversations and vice versa.

#### Acceptance Criteria

1. THE ConversationParticipantGuard SHALL be applied to every endpoint under `/api/communication` that accepts a `conversationId` path or query parameter.
2. WHEN a request reaches a guarded endpoint, THE ConversationParticipantGuard SHALL look up the `conversation_participants` container in Cosmos_DB using the `conversationId` and the `userId` extracted from the Bearer token.
3. IF the authenticated user's `userId` is not present in the `conversation_participants` document for the given `conversationId`, THEN THE ConversationParticipantGuard SHALL reject the request with HTTP 403 and the error code `FORBIDDEN_NOT_PARTICIPANT`.
4. THE ConversationParticipantGuard SHALL execute its participant check before any business logic in the route handler.
5. IF the `conversationId` does not exist in Cosmos_DB, THEN THE ConversationParticipantGuard SHALL return HTTP 404 and the error code `CONVERSATION_NOT_FOUND`.

---

### Requirement 6: Core Messaging API

**User Story:** As a frontend engineer, I want a complete set of REST endpoints for conversations and messages, so that the UI can list, read, send, and mark messages without direct database access.

#### Acceptance Criteria

1. THE Backend SHALL expose `GET /api/communication/conversations` returning all Conversations where the authenticated user is a participant, ordered by `lastMessageAt` descending.
2. THE Backend SHALL expose `POST /api/communication/conversations` as described in Requirement 3.
3. THE Backend SHALL expose `GET /api/communication/conversations/:id/messages` returning all non-deleted Messages for the given Conversation, ordered by `sentAt` ascending, subject to ConversationParticipantGuard.
4. THE Backend SHALL expose `POST /api/communication/conversations/:id/messages` accepting `{ body: string, attachmentIds?: string[] }`, creating a new Message document in Cosmos_DB, and returning HTTP 201 with the created Message, subject to ConversationParticipantGuard.
5. THE Backend SHALL expose `PATCH /api/communication/messages/:id/read` setting `readAt` to the current UTC timestamp on the specified Message and returning HTTP 200, subject to ConversationParticipantGuard.
6. THE Backend SHALL expose `GET /api/communication/conversations/unread-count` returning `{ count: number }` representing the total number of Messages where `readAt` is null and `senderId` is not the authenticated user.
7. WHEN `GET /api/communication/conversations/:id/messages` is called, THE Backend SHALL exclude Messages where `isDeleted` is `true`.
8. THE Backend SHALL return HTTP 401 for any `/api/communication` request that does not carry a valid Bearer token from Auth_Service.

---

### Requirement 7: File Attachments

**User Story:** As a tenant or landlord, I want to attach files to messages, so that I can share documents such as tenancy agreements or identification without leaving the platform.

#### Acceptance Criteria

1. THE Backend SHALL expose `POST /api/communication/attachments/upload` accepting a multipart form upload and storing the file in Blob_Storage, returning an `attachmentId` and metadata on HTTP 201.
2. THE Backend SHALL reject uploads where the MIME type is not one of `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, or `text/plain`, returning HTTP 415.
3. THE Backend SHALL reject uploads where the file size exceeds 10 MB (10,485,760 bytes), returning HTTP 413.
4. THE Backend SHALL expose `GET /api/communication/attachments/:id/url` returning a time-limited SAS_Token URL for the requested attachment, subject to ConversationParticipantGuard.
5. WHEN a SAS_Token URL is generated, THE Backend SHALL set the token expiry to the value configured in the `ATTACHMENT_SAS_EXPIRY_SECONDS` environment variable (default: 3,600 seconds).
6. THE Backend SHALL store attachment metadata in the `message_attachments` Cosmos_DB container upon successful upload.
7. IF an upload to Blob_Storage fails, THEN THE Backend SHALL return HTTP 502 and SHALL NOT create a `message_attachments` record.

---

### Requirement 8: Polling for Real-Time Updates

**User Story:** As a tenant or landlord, I want new messages to appear in my inbox without manually refreshing the page, so that I can have a near-real-time conversation experience.

#### Acceptance Criteria

1. THE Poller SHALL call `GET /api/communication/conversations` and `GET /api/communication/conversations/unread-count` at a 30-second interval when the browser tab is visible.
2. WHEN the browser tab becomes hidden (Page Visibility API `document.visibilityState === 'hidden'`), THE Poller SHALL pause all polling requests.
3. WHEN the browser tab becomes visible again, THE Poller SHALL resume polling immediately with a fresh request before restarting the 30-second interval.
4. THE Poller SHALL be initialised at the dashboard layout level so that it is active for both the tenant and landlord inbox views.
5. WHEN the Poller receives a response indicating new messages, THE Frontend SHALL update the unread badge count in the dashboard navigation without a full page reload.

---

### Requirement 9: Notifications

**User Story:** As a landlord or tenant, I want to receive an in-app badge and an email when I receive a new message, so that I am aware of new communications even when I am not actively viewing the inbox.

#### Acceptance Criteria

1. WHEN a new Message is created via `POST /api/communication/conversations/:id/messages`, THE Notification_Service SHALL check whether the recipient's `lastSeenAt` timestamp is within the last 5 minutes.
2. IF the recipient's `lastSeenAt` is within the last 5 minutes, THEN THE Notification_Service SHALL update the in-app unread badge count and SHALL NOT send an email notification.
3. IF the recipient's `lastSeenAt` is older than 5 minutes, THEN THE Notification_Service SHALL send an email notification to the recipient's registered email address.
4. WHEN an email notification is to be sent, THE Notification_Service SHALL check the `notification_log` container for an existing entry with the same `(recipientId, conversationId)` pair sent within the last 15 minutes (Dedup_Window).
5. IF a matching `notification_log` entry exists within the Dedup_Window, THEN THE Notification_Service SHALL suppress the email and SHALL NOT create a duplicate `notification_log` entry.
6. WHEN an email notification is sent, THE Notification_Service SHALL create a `notification_log` entry with `channel: 'email'`, `sentAt`, and a `dedupKey` composed of `{recipientId}:{conversationId}`.
7. THE Backend SHALL update the authenticated user's `lastSeenAt` timestamp on every authenticated API request to `/api/communication`.

---

### Requirement 10: Tenant Inbox UI

**User Story:** As a tenant, I want a dedicated inbox in my dashboard where I can see all my property conversations and reply to messages, so that I can manage all my landlord communications in one place.

#### Acceptance Criteria

1. THE Frontend SHALL render a Tenant Inbox page at the route `/dashboard/messages` accessible only to authenticated users with the `tenant` role.
2. THE Frontend SHALL display a list of Conversations using the `ConversationListItem` component, showing the property address, the last message preview (truncated to 80 characters), the timestamp of the last message, and an unread indicator.
3. WHEN a Tenant selects a Conversation from the list, THE Frontend SHALL display the full message thread using the `MessageThread` component and the `ComposeBox` component.
4. WHEN the Tenant submits a message via `ComposeBox`, THE Frontend SHALL call `POST /api/communication/conversations/:id/messages` and append the new message to the `MessageThread` without a full page reload.
5. WHEN the Tenant opens a Conversation, THE Frontend SHALL call `PATCH /api/communication/messages/:id/read` for all unread messages in that thread.
6. THE Frontend SHALL display an empty-state illustration and the text "No conversations yet" when the Tenant has no Conversations.

---

### Requirement 11: Landlord Inbox UI

**User Story:** As a landlord, I want a dedicated inbox in my dashboard where I can see all tenant conversations grouped by property, so that I can respond to tenant enquiries efficiently.

#### Acceptance Criteria

1. THE Frontend SHALL render a Landlord Inbox page at the route `/landlord/messages` accessible only to authenticated users with the `landlord` role.
2. THE Frontend SHALL display Conversations grouped by property, using the `ConversationListItem` component for each conversation row, showing the tenant name, last message preview (truncated to 80 characters), timestamp, and unread indicator.
3. WHEN a Landlord selects a Conversation, THE Frontend SHALL display the full message thread using the `MessageThread` component and the `ComposeBox` component.
4. WHEN the Landlord submits a message via `ComposeBox`, THE Frontend SHALL call `POST /api/communication/conversations/:id/messages` and append the new message to the `MessageThread` without a full page reload.
5. WHEN the Landlord opens a Conversation, THE Frontend SHALL call `PATCH /api/communication/messages/:id/read` for all unread messages in that thread.
6. THE Frontend SHALL display an empty-state illustration and the text "No conversations yet" when the Landlord has no Conversations.

---

### Requirement 12: Shared UI Components

**User Story:** As a frontend engineer, I want a single set of shared messaging UI components used by both the tenant and landlord inboxes, so that the visual design and behaviour are consistent and maintenance cost is reduced.

#### Acceptance Criteria

1. THE Frontend SHALL implement a `MessageThread` component that accepts a `conversationId` prop and renders all messages in chronological order, distinguishing sent messages (right-aligned) from received messages (left-aligned).
2. THE Frontend SHALL implement a `ComposeBox` component that accepts an `onSend` callback prop, enforces a maximum input length of 4,000 characters with a visible character counter, and supports attaching files via a file picker.
3. THE Frontend SHALL implement a `ConversationListItem` component that accepts conversation metadata props and renders a single row with property address, participant name, last message preview, timestamp, and an unread dot indicator.
4. THE `ComposeBox` component SHALL display a file attachment button that opens a file picker restricted to `.pdf`, `.doc`, `.docx`, and `.txt` file types.
5. WHEN a file is selected in `ComposeBox`, THE Frontend SHALL call `POST /api/communication/attachments/upload` before sending the message, and SHALL include the returned `attachmentId` in the `POST /api/communication/conversations/:id/messages` request body.
6. THE `MessageThread`, `ComposeBox`, and `ConversationListItem` components SHALL be importable from a shared path (e.g. `src/components/messaging/`) and SHALL NOT contain tenant-specific or landlord-specific logic.

---

### Requirement 13: Soft Delete and GDPR

**User Story:** As a data protection officer, I want messages to be soft-deleted by default and hard-deleted only through a controlled ops procedure, so that the platform complies with GDPR data retention obligations.

#### Acceptance Criteria

1. WHEN a user requests deletion of a message, THE Backend SHALL perform a Soft_Delete by setting `isDeleted: true` and `deletedAt` to the current UTC timestamp on the `messages` document.
2. WHEN a Soft_Delete is performed, THE Backend SHALL NOT physically remove the document from Cosmos_DB.
3. THE Backend SHALL expose no public API endpoint that performs a Hard_Delete on messaging data.
4. THE Backend SHALL maintain an `audit_log` Cosmos DB container recording every Soft_Delete event with fields: `id`, `entityType`, `entityId`, `actorId`, `action`, `timestamp`.
5. WHEN a Hard_Delete is required for GDPR compliance, THE System SHALL require it to be executed as a documented ops procedure with access restricted to authorised operations personnel.
6. THE Backend SHALL apply the data retention policy defined in decision gate DG-04 to the `notification_log` container TTL configuration.

---

### Requirement 14: Security and Access Control

**User Story:** As a security engineer, I want all communication endpoints to enforce authentication and participant-level authorisation, so that no user can access another user's messages.

#### Acceptance Criteria

1. THE Backend SHALL authenticate every request to `/api/communication` by validating the Bearer token against Auth_Service using the existing `withAuth` middleware pattern.
2. THE ConversationParticipantGuard SHALL be the sole mechanism for participant-level authorisation on conversation-scoped endpoints; no endpoint SHALL bypass it.
3. THE Backend SHALL not expose any `userId`, `tenantId`, or `landlordId` from one user's conversation in a response to a different user.
4. WHEN generating a SAS_Token URL for an attachment, THE Backend SHALL verify via ConversationParticipantGuard that the requesting user is a participant of the conversation that owns the attachment.
5. THE Backend SHALL log every HTTP 401 and HTTP 403 response from `/api/communication` endpoints to the application monitoring service.

---

### Requirement 15: Dashboard Navigation — Unread Badge

**User Story:** As a tenant or landlord, I want to see an unread message count badge on the Messages navigation item in my dashboard sidebar, so that I know at a glance whether I have new messages.

#### Acceptance Criteria

1. THE Frontend SHALL display a numeric badge on the Messages navigation item in `DashboardSidebar` showing the count returned by `GET /api/communication/conversations/unread-count`.
2. WHEN the unread count is zero, THE Frontend SHALL hide the badge rather than displaying "0".
3. WHEN the unread count exceeds 99, THE Frontend SHALL display "99+" in the badge.
4. THE Frontend SHALL update the badge count each time the Poller receives a response from `GET /api/communication/conversations/unread-count`.
