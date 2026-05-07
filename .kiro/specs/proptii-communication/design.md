# Design Document: Proptii Communication Feature

## Overview

The Proptii Communication Feature replaces three non-functional UI scaffolding buttons (Chat, Call, Message) with a fully working communication system. It is delivered in three phases:

- **Phase 1** — Remove the Chat CTA and wire up the Call CTA using E.164-normalised phone numbers.
- **Phase 2** — Messaging infrastructure: Cosmos DB schema, `ConversationParticipantGuard`, Core REST API, file attachments via Azure Blob Storage, and in-app/email notifications.
- **Phase 3** — Tenant and Landlord inbox UIs, shared messaging components, polling, unread badge, and production hardening.

### Key Constraints (Non-Negotiable)

| Constraint | Decision |
|---|---|
| Auth | Azure AD B2C / MSAL only |
| API gateway | NestJS `proptii-backend` (Azure Functions v4) only |
| Messaging data store | Cosmos DB SQL API (serverless) |
| File storage | Azure Blob Storage (LRS) |
| Real-time | 30-second polling, tab-aware via Page Visibility API |
| Email notifications | Existing backend emailer (nodemailer) |
| Routing | `/dashboard/*` for tenant, `/landlord/*` for landlord |

---

## Architecture

The feature follows the existing layered architecture of the Proptii platform:

```
Browser (React + Vite + MSAL)
        │
        │  Bearer JWT (Azure AD B2C id_token)
        ▼
Azure Functions v4 (TypeScript)
  ├── withAuth middleware  ──► Azure AD B2C JWKS validation
  ├── ConversationParticipantGuard
  ├── CommunicationController
  │     ├── ConversationService  ──► Cosmos DB (conversations, messages, conversation_participants)
  │     ├── AttachmentService   ──► Azure Blob Storage + Cosmos DB (message_attachments)
  │     └── NotificationService ──► Cosmos DB (notification_log) + nodemailer
  └── PhoneNormaliser (pure utility)
```

### Data Flow — Sending a Message

```
Tenant clicks Send
  → ComposeBox calls POST /api/communication/conversations/:id/messages
  → withAuth validates Bearer token against B2C JWKS
  → ConversationParticipantGuard checks conversation_participants in Cosmos DB
  → ConversationService.createMessage() writes to messages container
  → NotificationService.notify() checks lastSeenAt, dedup window, sends email if needed
  → HTTP 201 returned with created message
  → MessageThread appends message optimistically
```

### Polling Architecture

The `useMessagingPoller` hook lives at the `Dashboard` layout level. It uses the Page Visibility API to pause when the tab is hidden and resume immediately when the tab becomes visible again. The hook calls two endpoints every 30 seconds:

- `GET /api/communication/conversations` — refreshes the conversation list
- `GET /api/communication/conversations/unread-count` — updates the badge

```
Dashboard (layout)
  └── useMessagingPoller
        ├── document.addEventListener('visibilitychange', ...)
        ├── setInterval(30_000) when visible
        └── dispatches to MessagingContext (conversations, unreadCount)
```

---

## Components and Interfaces

### Backend Components

#### `PhoneNormaliser` (utility, `api/src/shared/utils/phoneNormaliser.ts`)

A pure function that converts raw phone strings to E.164 format. Uses the `libphonenumber-js` library for robust parsing.

```typescript
export type PhoneNormaliseResult =
  | { success: true; e164: string }
  | { success: false; field: string; rawValue: string; reason: string };

export function normalisePhone(raw: string, field: string, defaultRegion?: string): PhoneNormaliseResult;
```

#### `ConversationParticipantGuard` (`api/src/shared/middleware/conversationParticipantGuard.ts`)

A higher-order function wrapping any handler that requires participant verification. Extracts `conversationId` from path params or query string, looks up `conversation_participants` in Cosmos DB, and rejects with 403 (`FORBIDDEN_NOT_PARTICIPANT`) or 404 (`CONVERSATION_NOT_FOUND`) as appropriate.

```typescript
export function withParticipantGuard(
  handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>
): (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>;
```

#### `ConversationService` (`api/src/shared/services/ConversationService.ts`)

Extends `BaseService`. Manages the `conversations`, `messages`, and `conversation_participants` containers.

```typescript
class ConversationService extends BaseService {
  getOrCreateConversation(dto: CreateConversationDto): Promise<Conversation>;
  listConversationsForUser(userId: string): Promise<Conversation[]>;
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(conversationId: string, dto: CreateMessageDto, senderId: string, senderRole: SenderRole): Promise<Message>;
  markMessageRead(messageId: string, conversationId: string): Promise<Message>;
  getUnreadCount(userId: string): Promise<number>;
  softDeleteMessage(messageId: string, conversationId: string, actorId: string): Promise<void>;
}
```

#### `AttachmentService` (`api/src/shared/services/AttachmentService.ts`)

Handles multipart uploads to Azure Blob Storage and metadata persistence in `message_attachments`.

```typescript
class AttachmentService extends BaseService {
  uploadAttachment(file: Buffer, fileName: string, mimeType: string, sizeBytes: number, uploaderId: string, conversationId: string): Promise<MessageAttachment>;
  generateSasUrl(attachmentId: string, conversationId: string): Promise<string>;
}
```

#### `NotificationService` (`api/src/shared/services/NotificationService.ts`)

Checks `lastSeenAt`, dedup window, and sends email via nodemailer.

```typescript
class NotificationService extends BaseService {
  notify(recipientId: string, conversationId: string, senderName: string): Promise<void>;
  updateLastSeen(userId: string): Promise<void>;
}
```

#### `CommunicationController` (`api/src/functions/communication/index.ts`)

Registers all Azure Functions routes under `/api/communication`. Follows the existing controller pattern (class with methods, registered via `app.http()`).

### Frontend Components

#### `useMessagingPoller` hook (`src/hooks/useMessagingPoller.ts`)

```typescript
function useMessagingPoller(intervalMs?: number): void;
```

Initialised in `Dashboard.tsx`. Polls `GET /api/communication/conversations` and `GET /api/communication/conversations/unread-count` every 30 seconds while the tab is visible. Writes results to `MessagingContext`.

#### `MessagingContext` (`src/contexts/MessagingContext.tsx`)

```typescript
interface MessagingContextType {
  conversations: Conversation[];
  unreadCount: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  refreshConversations: () => Promise<void>;
}
```

#### `communicationService` (`src/services/communicationService.ts`)

Thin wrapper around the existing `apiService` singleton. All calls go through the existing Axios instance (which already attaches the MSAL Bearer token).

```typescript
const communicationService = {
  getConversations(): Promise<Conversation[]>;
  getOrCreateConversation(dto: CreateConversationDto): Promise<Conversation>;
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, dto: SendMessageDto): Promise<Message>;
  markRead(messageId: string): Promise<void>;
  getUnreadCount(): Promise<number>;
  uploadAttachment(file: File, conversationId: string): Promise<MessageAttachment>;
  getAttachmentUrl(attachmentId: string): Promise<string>;
};
```

#### Shared Messaging UI Components (`src/components/messaging/`)

**`MessageThread.tsx`**
```typescript
interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
}
```
Renders messages in chronological order. Sent messages (where `senderId === currentUserId`) are right-aligned; received messages are left-aligned.

**`ComposeBox.tsx`**
```typescript
interface ComposeBoxProps {
  conversationId: string;
  onSend: (message: Message) => void;
}
```
Text area with 4,000-character limit and visible counter. File picker restricted to `.pdf,.doc,.docx,.txt`. Calls `uploadAttachment` before `sendMessage` when a file is attached.

**`ConversationListItem.tsx`**
```typescript
interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
}
```
Renders property address, participant name, last message preview (truncated to 80 characters), timestamp, and an unread dot indicator.

#### Page Components

- `src/pages/dashboard/TenantMessages.tsx` — route `/dashboard/messages`, tenant role only
- `src/pages/landlord/LandlordMessages.tsx` — route `/landlord/messages`, landlord role only

Both pages use a two-column layout: `ConversationListItem` list on the left, `MessageThread` + `ComposeBox` on the right.

---

## Data Models

### Cosmos DB Containers

#### `conversations` (partitionKey: `/tenantId`)

```typescript
interface Conversation {
  id: string;                  // UUID
  propertyId: string;
  tenantId: string;            // partition key
  landlordId: string;
  createdAt: string;           // ISO 8601
  updatedAt: string;
  lastMessageAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
}
```

Unique index on `[propertyId, tenantId, landlordId]` — enforces one active thread per triple.

#### `messages` (partitionKey: `/conversationId`)

```typescript
interface Message {
  id: string;
  conversationId: string;      // partition key
  senderId: string;
  senderRole: 'tenant' | 'landlord';
  body: string;                // max 4,000 chars
  attachmentIds: string[];
  sentAt: string;
  readAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
}
```

Composite index on `[conversationId ASC, sentAt ASC]`.

#### `message_attachments` (partitionKey: `/conversationId`)

```typescript
interface MessageAttachment {
  id: string;
  conversationId: string;      // partition key
  messageId: string;
  uploaderId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blobPath: string;
  uploadedAt: string;
}
```

#### `conversation_participants` (partitionKey: `/conversationId`)

```typescript
interface ConversationParticipant {
  id: string;
  conversationId: string;      // partition key
  userId: string;
  role: 'tenant' | 'landlord';
  joinedAt: string;
}
```

#### `notification_log` (partitionKey: `/recipientId`, TTL: 90 days)

```typescript
interface NotificationLog {
  id: string;
  recipientId: string;         // partition key
  conversationId: string;
  channel: 'email';
  sentAt: string;
  dedupKey: string;            // "{recipientId}:{conversationId}"
  _ts?: number;                // Cosmos DB TTL field
}
```

#### `audit_log` (partitionKey: `/actorId`)

```typescript
interface AuditLog {
  id: string;
  entityType: 'message' | 'conversation';
  entityId: string;
  actorId: string;             // partition key
  action: 'soft_delete';
  timestamp: string;
}
```

### Frontend TypeScript Types (`src/types/messaging.ts`)

Mirror the Cosmos DB models above. Shared between all messaging components and services.

### Environment Variables (additions to `environment.ts`)

```typescript
BLOB_STORAGE_CONNECTION_STRING: z.string(),
BLOB_STORAGE_CONTAINER_NAME: z.string(),
ATTACHMENT_SAS_EXPIRY_SECONDS: z.coerce.number().default(3600),
EMAIL_FROM_ADDRESS: z.string().email(),
ACTIVE_USER_THRESHOLD_SECONDS: z.coerce.number().default(300),   // 5 minutes
EMAIL_DEDUP_WINDOW_SECONDS: z.coerce.number().default(900),       // 15 minutes
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property-based testing is applicable here because the feature contains pure transformation logic (phone normalisation), universal validation rules (body length, MIME type, file size), ordering invariants (message and conversation lists), security rules (auth, participant guard), and notification logic (lastSeenAt threshold, dedup window) — all of which have meaningful input variation and benefit from 100+ iterations.

The chosen PBT library is **`fast-check`** (TypeScript-native, works with Jest).

---

### Property 1: Phone normalisation produces valid E.164 for parseable inputs

*For any* raw phone string that contains a recognisable phone number (with or without spaces, hyphens, parentheses, or leading zeros), the `PhoneNormaliser` SHALL return a string matching the E.164 pattern `^\+[1-9]\d{6,14}$`.

**Validates: Requirements 2.1, 2.5**

---

### Property 2: Phone normalisation returns structured error for unparseable inputs

*For any* string that cannot be parsed as a valid phone number (e.g. random alphanumeric strings, strings shorter than 7 digits, strings with no country code and no default region), the `PhoneNormaliser` SHALL return `{ success: false, field, rawValue, reason }` where `field` and `rawValue` are non-empty strings.

**Validates: Requirements 2.2**

---

### Property 3: Call CTA renders as tel: anchor for valid E.164 numbers

*For any* valid E.164 phone number string, the `ListingCard` component SHALL render an `<a>` element whose `href` attribute equals `tel:{e164Number}`.

**Validates: Requirements 2.3**

---

### Property 4: Conversation creation is idempotent

*For any* `(propertyId, tenantId, landlordId)` triple, calling `POST /api/communication/conversations` two or more times SHALL return the same `conversationId` on every call, and exactly one document SHALL exist in the `conversations` container for that triple.

**Validates: Requirements 3.3**

---

### Property 5: Unauthenticated requests to /api/communication return HTTP 401

*For any* endpoint under `/api/communication`, a request made without a Bearer token or with an invalid/expired Bearer token SHALL receive HTTP 401.

**Validates: Requirements 3.6, 6.8, 14.1**

---

### Property 6: Message body length validation

*For any* message body string, `POST /api/communication/conversations/:id/messages` SHALL return HTTP 422 when `body.length > 4000` and SHALL return HTTP 201 when `body.length >= 1 && body.length <= 4000`.

**Validates: Requirements 4.6**

---

### Property 7: senderRole validation

*For any* string value for `senderRole` that is not exactly `"tenant"` or `"landlord"`, `POST /api/communication/conversations/:id/messages` SHALL reject the request with HTTP 422.

**Validates: Requirements 4.7**

---

### Property 8: ConversationParticipantGuard rejects non-participants with HTTP 403

*For any* authenticated user whose `userId` is not present in the `conversation_participants` container for the given `conversationId`, every guarded endpoint SHALL return HTTP 403 with error code `FORBIDDEN_NOT_PARTICIPANT`.

**Validates: Requirements 5.3**

---

### Property 9: GET /conversations returns conversations ordered by lastMessageAt descending

*For any* set of conversations where the authenticated user is a participant, `GET /api/communication/conversations` SHALL return them in descending order of `lastMessageAt` (conversations with `null` lastMessageAt appear last).

**Validates: Requirements 6.1**

---

### Property 10: GET /conversations/:id/messages excludes deleted messages and is ordered by sentAt ascending

*For any* conversation containing a mix of deleted and non-deleted messages, `GET /api/communication/conversations/:id/messages` SHALL return only messages where `isDeleted` is `false`, ordered by `sentAt` ascending.

**Validates: Requirements 6.3, 6.7**

---

### Property 11: Unread count matches expected formula

*For any* set of messages in the authenticated user's conversations, `GET /api/communication/conversations/unread-count` SHALL return a count equal to the number of messages where `readAt` is `null` AND `senderId` is not the authenticated user's `userId`.

**Validates: Requirements 6.6**

---

### Property 12: Attachment MIME type validation

*For any* MIME type string that is not one of `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, or `text/plain`, `POST /api/communication/attachments/upload` SHALL return HTTP 415.

**Validates: Requirements 7.2**

---

### Property 13: Attachment file size validation

*For any* file size in bytes, `POST /api/communication/attachments/upload` SHALL return HTTP 413 when `sizeBytes > 10_485_760` and SHALL proceed normally when `sizeBytes <= 10_485_760`.

**Validates: Requirements 7.3**

---

### Property 14: Attachment upload round-trip persists metadata

*For any* valid file upload (allowed MIME type, within size limit), the metadata stored in `message_attachments` SHALL contain the correct `fileName`, `mimeType`, `sizeBytes`, `uploaderId`, and `conversationId` matching the upload request.

**Validates: Requirements 7.6**

---

### Property 15: Poller calls APIs at 30-second intervals when tab is visible

*For any* duration of tab visibility, the `useMessagingPoller` hook SHALL call `GET /api/communication/conversations` and `GET /api/communication/conversations/unread-count` at intervals of approximately 30 seconds (±100ms tolerance for timer drift).

**Validates: Requirements 8.1**

---

### Property 16: Poller resumes immediately on tab becoming visible

*For any* sequence of tab-hidden then tab-visible transitions, the `useMessagingPoller` hook SHALL make an immediate API call upon each transition to visible, before restarting the 30-second interval.

**Validates: Requirements 8.3**

---

### Property 17: Email suppressed when recipient is active (lastSeenAt within 5 minutes)

*For any* `lastSeenAt` timestamp that is within 300 seconds of the current time, the `NotificationService` SHALL NOT send an email notification and SHALL NOT create a `notification_log` entry.

**Validates: Requirements 9.2**

---

### Property 18: Email dedup suppresses duplicate notifications within 15-minute window

*For any* `(recipientId, conversationId)` pair that already has a `notification_log` entry with `sentAt` within the last 900 seconds, the `NotificationService` SHALL suppress the email and SHALL NOT create a duplicate `notification_log` entry.

**Validates: Requirements 9.5**

---

### Property 19: Email notification creates notification_log entry with correct fields

*For any* email notification that is sent (recipient inactive, no dedup entry), the `NotificationService` SHALL create a `notification_log` entry where `channel === 'email'`, `dedupKey === "{recipientId}:{conversationId}"`, and `sentAt` is a valid ISO 8601 timestamp within 1 second of the send time.

**Validates: Requirements 9.6**

---

### Property 20: lastSeenAt is updated on every authenticated /api/communication request

*For any* authenticated request to any endpoint under `/api/communication`, the `lastSeenAt` field on the user record SHALL be updated to a timestamp within 1 second of the request time.

**Validates: Requirements 9.7**

---

### Property 21: ConversationListItem renders all required fields with preview truncated to 80 characters

*For any* conversation with a last message body of arbitrary length, the `ConversationListItem` component SHALL render the property address, participant name, timestamp, and unread indicator, and the last message preview SHALL be truncated to at most 80 characters.

**Validates: Requirements 10.2, 11.2**

---

### Property 22: MessageThread renders messages in chronological order with correct alignment

*For any* list of messages with arbitrary `sentAt` timestamps and `senderId` values, the `MessageThread` component SHALL render them in ascending `sentAt` order, with messages where `senderId === currentUserId` right-aligned and all others left-aligned.

**Validates: Requirements 12.1**

---

### Property 23: ComposeBox enforces 4,000-character limit

*For any* input string of length greater than 4,000 characters, the `ComposeBox` component SHALL prevent form submission and SHALL display a character counter indicating the limit has been exceeded.

**Validates: Requirements 12.2**

---

### Property 24: Soft delete sets isDeleted and deletedAt without removing the document

*For any* message soft-delete request, the `messages` document SHALL have `isDeleted === true` and `deletedAt` set to a valid ISO 8601 timestamp, and the document SHALL still be retrievable from Cosmos DB by its `id` and `conversationId`.

**Validates: Requirements 13.1, 13.2**

---

### Property 25: Soft delete creates audit_log entry

*For any* soft-delete operation on a message, an `audit_log` document SHALL be created with `entityType === 'message'`, `entityId` matching the deleted message's `id`, `actorId` matching the requesting user's `userId`, and `action === 'soft_delete'`.

**Validates: Requirements 13.4**

---

### Property 26: Data isolation — user responses contain only their own conversation IDs

*For any* two distinct authenticated users A and B, the conversations returned by `GET /api/communication/conversations` for user A SHALL NOT contain any `tenantId`, `landlordId`, or participant `userId` belonging exclusively to user B's conversations.

**Validates: Requirements 14.3**

---

### Property 27: Unread badge displays correct count and hides at zero

*For any* unread count value returned by the API, the `DashboardSidebar` SHALL display the numeric count when `count > 0`, display "99+" when `count > 99`, and hide the badge entirely when `count === 0`.

**Validates: Requirements 15.1, 15.2, 15.3**

---

## Error Handling

### Backend Error Codes

All errors follow the existing `AppError` pattern and return `{ error: { message, code } }`.

| Scenario | HTTP Status | Error Code |
|---|---|---|
| Missing/invalid Bearer token | 401 | `UNAUTHORIZED` / `TOKEN_EXPIRED` |
| User not a conversation participant | 403 | `FORBIDDEN_NOT_PARTICIPANT` |
| Conversation not found | 404 | `CONVERSATION_NOT_FOUND` |
| Message not found | 404 | `MESSAGE_NOT_FOUND` |
| Attachment not found | 404 | `ATTACHMENT_NOT_FOUND` |
| Message body > 4,000 chars | 422 | `MESSAGE_BODY_TOO_LONG` |
| Invalid senderRole | 422 | `INVALID_SENDER_ROLE` |
| Disallowed MIME type | 415 | `UNSUPPORTED_MEDIA_TYPE` |
| File size > 10 MB | 413 | `FILE_TOO_LARGE` |
| Blob Storage upload failure | 502 | `BLOB_UPLOAD_FAILED` |
| Invalid phone number | 422 | `INVALID_PHONE_NUMBER` |
| Cosmos DB write failure | 500 | `DATABASE_ERROR` |

All 401 and 403 responses are logged to the application monitoring service (Application Insights via `MonitoringService`).

### Frontend Error Handling

- API errors surface via the existing `ApiError` type from `src/services/api.ts`.
- `MessageThread` and `ComposeBox` display inline error banners on send failure.
- Upload failures in `ComposeBox` show a toast notification and do not submit the message.
- If the Poller receives a 401, it triggers the MSAL silent token refresh flow.
- Empty states are shown when conversations or messages lists are empty (not treated as errors).

### Phone Normalisation Errors

- Backend: `PhoneNormaliser` returns a structured error; the controller returns HTTP 422 with `INVALID_PHONE_NUMBER` and includes `field` and `rawValue` in the response body.
- Frontend: The Call CTA renders as a disabled button with `aria-disabled="true"` and tooltip "Phone number unavailable" when no valid E.164 number is available.

---

## Testing Strategy

### Unit Tests (Jest)

Unit tests cover specific examples, edge cases, and error conditions. They are co-located with source files in `__tests__/` directories.

**Backend:**
- `PhoneNormaliser` — specific format examples (UK mobile, US, international with country code, invalid strings)
- `ConversationParticipantGuard` — mock Cosmos DB, assert 403/404 for non-participant/missing conversation
- `ConversationService` — mock Cosmos DB, test idempotent get-or-create, soft delete, message ordering
- `NotificationService` — mock nodemailer and Cosmos DB, test lastSeenAt threshold and dedup logic
- `AttachmentService` — mock Blob Storage SDK, test MIME/size validation, SAS URL generation
- `CommunicationController` — mock services, test HTTP status codes and response shapes

**Frontend:**
- `communicationService` — mock `apiService`, assert correct endpoints and payloads
- `useMessagingPoller` — fake timers, assert polling intervals and visibility pause/resume
- `MessageThread` — render with fixture data, assert ordering and alignment
- `ComposeBox` — assert character counter, file picker accept attribute, submission prevention at limit
- `ConversationListItem` — assert preview truncation, unread indicator visibility
- `DashboardSidebar` — assert badge display/hide/99+ logic

### Property-Based Tests (fast-check + Jest)

Each property test runs a minimum of **100 iterations**. Tests are tagged with a comment referencing the design property.

```typescript
// Feature: proptii-communication, Property 1: Phone normalisation produces valid E.164
it.prop([fc.string()])('normalises parseable phone strings to E.164', (raw) => { ... });
```

Property tests are located in `__tests__/properties/` directories alongside their source files.

**Backend property tests:**
- Properties 1, 2 — `PhoneNormaliser` with `fc.string()` and structured phone generators
- Properties 4, 5, 6, 7, 8, 9, 10, 11 — `ConversationService` / `CommunicationController` with mocked Cosmos DB
- Properties 12, 13, 14 — `AttachmentService` with mocked Blob Storage
- Properties 17, 18, 19, 20 — `NotificationService` with mocked nodemailer and Cosmos DB
- Properties 24, 25, 26 — `ConversationService` soft delete and data isolation

**Frontend property tests:**
- Properties 3, 21, 22, 23, 27 — React Testing Library with `fc.record()` generators for component props
- Properties 15, 16 — `useMessagingPoller` with `fc.integer()` for timing scenarios and fake timers

### Integration Tests

Integration tests verify end-to-end wiring against a local Azurite emulator (Blob Storage) and a Cosmos DB emulator.

- Full conversation lifecycle: create → send message → mark read → soft delete
- Attachment upload → SAS URL generation → metadata retrieval
- Notification flow: create message → check lastSeenAt → dedup check → email send
- `ConversationParticipantGuard` applied to all guarded endpoints

### Smoke Tests

- Cosmos DB containers exist with correct partition keys and indexes
- `notification_log` TTL is configured to 90 days
- No public endpoint performs a hard delete on messaging data
- Shared components (`MessageThread`, `ComposeBox`, `ConversationListItem`) are importable from `src/components/messaging/`
- `useMessagingPoller` is initialised in `Dashboard.tsx`

### Test Configuration

```json
// jest.config additions for fast-check
{
  "globals": {
    "fc": { "numRuns": 100 }
  }
}
```

The `fast-check` library is added to `devDependencies` in both `api/package.json` and the root `package.json`.
