# Notification Service Design (Full Stack MVP)

## 1) Scope and Decisions

This design follows `wiki/Module/Core/Notification Service/EPIC_OVERVIEW.md` and the linked stories:
- `wiki/Module/Core/Notification Service/[US-01][CORE] Notification Bell & Notification Center.md`
- `wiki/Module/Core/Notification Service/[US-02][CORE] Mark Notifications as Read.md`

Validated product decisions:
- Implementation scope: Full stack MVP (Neon + API + UI)
- Realtime approach: Short polling (no SSE/WebSocket in MVP)
- Integration entry points: both direct internal service function and HTTP API route
- "Mark all as read": no confirmation modal

Out of scope (kept aligned to EPIC):
- Email/SMS/mobile push delivery
- Notification preference/mute settings
- Admin broadcast notifications
- Expiry/auto-dismiss rules
- Source filtering and advanced module-specific logic

## 2) Architecture

Recommended approach: service-first architecture.

- Data layer (`Neon/Postgres`): persistent store and indexes for user-scoped queries and unread counters.
- Domain service (`NotificationService`): source of truth for validation, dedupe, persistence, and read-state transitions.
- Transport/API layer (`app/api/notifications/...`): thin adapters calling domain service.
- UI layer (global nav + panel): bell badge, notification list, mark read actions, deep-link navigation.
- Integration layer:
  - internal modules call service functions directly on server flows
  - modules can also publish via HTTP event endpoint using the same contract

Benefits:
- Keeps module-agnostic rule in one place (service)
- Avoids duplicated logic between API and internal module calls
- Preserves clean path for future move to SSE/WebSocket without changing domain rules

## 3) Data Model and Product Rules

### 3.1 Notifications table

`notifications`
- `notification_id uuid primary key`
- `user_id text not null`
- `source text not null`
- `type text not null`
- `title varchar(80) not null`
- `body varchar(120) not null`
- `deep_link_path text not null`
- `reference_id text null`
- `reference_type text null`
- `is_read boolean not null default false`
- `created_at timestamptz not null default now()`
- `read_at timestamptz null`

### 3.2 Indexing

- `idx_notifications_user_created` on (`user_id`, `created_at desc`)
- `idx_notifications_user_unread` partial index on (`user_id`) where `is_read = false`
- `idx_notifications_dedupe_lookup` on (`user_id`, `source`, `type`, `reference_id`, `created_at desc`)
  where `reference_id is not null and reference_type is not null`

### 3.3 Contract and validation

Accepted publish payload (module-provided fields):
- `userId`, `source`, `type`, `title`, `body`, `deepLinkPath`, `referenceId?`, `referenceType?`

Service-generated fields:
- `notificationId`, `isRead=false`, `createdAt`, `readAt=null`

Validation:
- `title` max 80 chars
- `body` max 120 chars
- required fields must be present
- `source/type/referenceType/deepLinkPath` treated as opaque values (not interpreted)

### 3.4 Dedupe and read-state rules

Dedupe:
- Apply only when both `referenceId` and `referenceType` are provided
- Key: `(userId, source, type, referenceId)`
- If existing match is found inside configurable dedupe window, skip new insert and return dedupe response
- If reference fields are absent, no dedupe is applied

Read state:
- One-way transition only (`unread -> read`)
- `markNotificationRead` is idempotent
- No "unmark as read" in MVP

## 4) API Contract and Service Surface

### 4.1 Service methods

- `publishNotification(payload)`
- `listNotifications(userId, options)`
- `getUnreadCount(userId)`
- `markNotificationRead(userId, notificationId)`
- `markAllNotificationsRead(userId)`

### 4.2 HTTP endpoints

- `POST /api/notifications/events`
  - creates notification or returns deduped result
- `GET /api/notifications?limit=...&cursor=...`
  - user-scoped list, newest first
- `GET /api/notifications/unread-count`
  - returns unread badge count
- `PATCH /api/notifications/:notificationId/read`
  - marks one notification as read (idempotent)
- `POST /api/notifications/read-all`
  - marks all unread as read (no confirm requirement in UI)

Auth and privacy:
- all read/write operations are scoped to authenticated user identity
- no cross-user reads or updates

## 5) UI and Polling Behavior (US-01 / US-02)

### 5.1 Bell and panel behavior

- Bell is always visible for authenticated users
- Badge appears only when `unreadCount > 0`
- Panel opens anchored to bell and lists notifications by `createdAt desc`
- Row content: source icon, title, body preview, relative timestamp, unread indicator
- Empty state text:
  - `No notifications yet. We'll let you know when something important happens.`

### 5.2 Read actions

- Clicking row:
  1. mark read
  2. close panel
  3. navigate to `deepLinkPath`
- Row action `Mark as read`:
  - marks single notification read with no navigation
- Header action `Mark all as read`:
  - active only when unread exists
  - hidden/disabled when all read
  - no confirmation dialog

### 5.3 Polling strategy (MVP realtime)

- Bell closed: poll every 10s
- Panel open: poll every 5s
- Revalidate immediately after user actions affecting read state
- Use lightweight optimistic UI for mark-read actions, then reconcile with server response

## 6) Error Handling and Resilience

API behavior:
- `400` invalid payload (missing required fields/limits exceeded)
- `401/403` auth failures
- `404` notification not found or not owned by user (for per-item read)
- `500` database/service error

UI behavior:
- Publish endpoint errors are surfaced to caller module (not to end-user panel by default)
- List/count polling failures keep last successful UI state and retry next interval
- Mark-read failures rollback optimistic read indicator and show non-blocking toast
- Navigation still follows deep link only after successful mark-read attempt; if mark-read fails, keep row unread and surface warning

Data consistency:
- mark-all/read operations run in safe transactional updates
- unread count always derived from persisted `is_read=false` records

## 7) Testing Strategy

### 7.1 Unit tests

- Payload validation boundaries (title/body lengths, required fields)
- Dedupe window behavior:
  - dedupe when key matches within window
  - no dedupe outside window
  - no dedupe when reference fields missing
- Read transitions:
  - unread to read success
  - idempotent read on already-read item
  - mark-all updates only unread rows

### 7.2 API tests

- Auth scoping for list/count/read endpoints
- `POST /events` create vs deduped response behavior
- Pagination and sort order
- Read-all endpoint behavior when zero unread

### 7.3 UI/integration tests

- Bell badge show/hide logic
- Panel list rendering and empty state
- Click row marks read and navigates
- Mark-as-read individual does not navigate
- Mark-all removes unread indicators and hides badge
- Polling updates count/list over time

## 8) Rollout Plan

1. **Persistence foundation**
   - Create notification schema in Neon and indexes
   - Add migration and local schema initialization path

2. **Domain service**
   - Implement `NotificationService` methods and validation/dedupe rules

3. **API layer**
   - Implement notification routes as thin service wrappers
   - Ensure auth scoping and consistent response shapes

4. **UI integration**
   - Add bell badge + panel for seller/partner navigation contexts
   - Wire read actions and polling loops

5. **Module integration starter**
   - Provide direct function usage example
   - Provide event API usage example

6. **Verification and hardening**
   - Run lint/typecheck and core tests
   - Validate AC mappings for US-01/US-02

## 9) Acceptance Mapping (Condensed)

- US-01 AC-01..08 covered by:
  - bell visibility and unread badge logic
  - panel list ordering, row fields, close interactions
  - click-to-read-and-navigate flow
  - realtime updates via polling
  - empty state message

- US-02 AC-01..06 covered by:
  - single-item mark-read action
  - mark-all action without confirmation
  - unread indicator + badge updates
  - no deletion/hiding of read rows
  - no navigation for explicit mark-read actions

## 10) Open Items Deferred (Non-blocking for MVP)

- Source-based filtering in panel
- Long-list pagination strategy tuning
- Optional expiry policy
- Optional unmark-as-read support
