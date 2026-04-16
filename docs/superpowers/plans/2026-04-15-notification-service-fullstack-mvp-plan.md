# Notification Service Fullstack MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Neon-backed, module-agnostic Notification Service that satisfies `US-01` and `US-02` with polling-based realtime updates, direct service integration, and HTTP API integration.

**Architecture:** Add a dedicated notifications domain (`lib/notifications`) as source of truth for validation, dedupe, and read-state transitions; expose thin Next.js route handlers under `app/api/notifications`; integrate a bell + notification center UI into seller/partner navigation with polling for unread count and list updates.

**Tech Stack:** Next.js App Router route handlers, TypeScript, Neon serverless SQL (`@neondatabase/serverless`), shadcn/ui components, Bun test runner, Biome + TypeScript checks.

---

## File Structure Lock-In

### New files
- `lib/notifications/types.ts` — core event payload and stored record types.
- `lib/notifications/validation.ts` — payload validation and normalization helpers.
- `lib/notifications/service.ts` — publish/list/read domain logic, dedupe window.
- `lib/notifications/source-icons.tsx` — source-to-icon mapper for panel rows.
- `app/api/notifications/events/route.ts` — publish endpoint.
- `app/api/notifications/route.ts` — list endpoint.
- `app/api/notifications/unread-count/route.ts` — unread count endpoint.
- `app/api/notifications/read-all/route.ts` — mark all read endpoint.
- `app/api/notifications/[notificationId]/read/route.ts` — mark single read endpoint.
- `components/notifications/notification-center.tsx` — bell + panel UI with polling.
- `components/notifications/notification-item-row.tsx` — single row renderer/actions.
- `lib/notifications/service.test.ts` — unit tests for dedupe/read transitions.
- `lib/notifications/validation.test.ts` — validation boundaries tests.

### Modified files
- `lib/platform/ensure-schema.ts` — add `notifications` table + indexes.
- `components/nav-seller.tsx` — replace link-only bell with notification center component.
- `components/nav-partner.tsx` — replace link-only bell with notification center component.
- `scripts/platform/seed.ts` — seed sample notifications for manual verification.

---

### Task 1: Add Notification Schema in Neon

**Files:**
- Modify: `lib/platform/ensure-schema.ts`
- Test: `lib/notifications/service.test.ts` (schema smoke via real queries later)

- [ ] **Step 1: Write failing test for required notification columns**

```ts
import { describe, expect, test } from "bun:test"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { sql } from "@/lib/db/neon"

describe("notification schema", () => {
  test("creates notifications table with required fields", async () => {
    await ensurePlatformSchema()
    const rows = (await sql`
      select column_name
      from information_schema.columns
      where table_name = 'notifications'
    `) as { column_name: string }[]
    const columnNames = new Set(rows.map((r) => r.column_name))
    expect(columnNames.has("notification_id")).toBe(true)
    expect(columnNames.has("user_id")).toBe(true)
    expect(columnNames.has("is_read")).toBe(true)
    expect(columnNames.has("created_at")).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/notifications/service.test.ts -t "creates notifications table with required fields"`
Expected: FAIL because `notifications` table does not exist yet.

- [ ] **Step 3: Add notification DDL and indexes in schema bootstrap**

```ts
// inside ensurePlatformSchema()
await sql`
  create table if not exists notifications (
    notification_id uuid primary key,
    user_id text not null,
    source text not null,
    type text not null,
    title varchar(80) not null,
    body varchar(120) not null,
    deep_link_path text not null,
    reference_id text,
    reference_type text,
    is_read boolean not null default false,
    created_at timestamptz not null default now(),
    read_at timestamptz
  )
`

await sql`
  create index if not exists idx_notifications_user_created
  on notifications (user_id, created_at desc)
`

await sql`
  create index if not exists idx_notifications_user_unread
  on notifications (user_id)
  where is_read = false
`

await sql`
  create index if not exists idx_notifications_dedupe_lookup
  on notifications (user_id, source, type, reference_id, created_at desc)
  where reference_id is not null and reference_type is not null
`
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test lib/notifications/service.test.ts -t "creates notifications table with required fields"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/platform/ensure-schema.ts lib/notifications/service.test.ts
git commit -m "feat(notification): add Neon notifications schema and indexes"
```

---

### Task 2: Build Domain Types + Validation

**Files:**
- Create: `lib/notifications/types.ts`
- Create: `lib/notifications/validation.ts`
- Create: `lib/notifications/validation.test.ts`

- [ ] **Step 1: Write failing validation tests for EPIC contract**

```ts
import { describe, expect, test } from "bun:test"
import { parseNotificationEvent } from "@/lib/notifications/validation"

describe("parseNotificationEvent", () => {
  test("accepts valid event payload", () => {
    const payload = parseNotificationEvent({
      userId: "user-1",
      source: "chat",
      type: "message_received",
      title: "New message",
      body: "You have a new message",
      deepLinkPath: "/chat/conversations/abc",
    })
    expect(payload.userId).toBe("user-1")
  })

  test("rejects title longer than 80 chars", () => {
    expect(() =>
      parseNotificationEvent({
        userId: "user-1",
        source: "chat",
        type: "message_received",
        title: "x".repeat(81),
        body: "ok",
        deepLinkPath: "/chat",
      }),
    ).toThrow("title must be <= 80 characters")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/notifications/validation.test.ts`
Expected: FAIL because `parseNotificationEvent` is not implemented.

- [ ] **Step 3: Implement types and parser**

```ts
// lib/notifications/types.ts
export type NotificationEventPayload = {
  userId: string
  source: string
  type: string
  title: string
  body: string
  deepLinkPath: string
  referenceId?: string
  referenceType?: string
}

export type NotificationRecord = NotificationEventPayload & {
  notificationId: string
  isRead: boolean
  createdAt: string
  readAt: string | null
}
```

```ts
// lib/notifications/validation.ts
import type { NotificationEventPayload } from "@/lib/notifications/types"

export function parseNotificationEvent(input: NotificationEventPayload): NotificationEventPayload {
  if (!input.userId || !input.source || !input.type || !input.deepLinkPath) {
    throw new Error("missing required notification fields")
  }
  if (input.title.length > 80) throw new Error("title must be <= 80 characters")
  if (input.body.length > 120) throw new Error("body must be <= 120 characters")
  return input
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test lib/notifications/validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/notifications/types.ts lib/notifications/validation.ts lib/notifications/validation.test.ts
git commit -m "feat(notification): add event contract validation"
```

---

### Task 3: Implement NotificationService (Publish/List/Read/Dedupe)

**Files:**
- Create: `lib/notifications/service.ts`
- Modify: `lib/notifications/service.test.ts`

- [ ] **Step 1: Write failing tests for dedupe and read transitions**

```ts
import { beforeEach, describe, expect, test } from "bun:test"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { publishNotification, listNotifications, markAllNotificationsRead } from "@/lib/notifications/service"

describe("NotificationService", () => {
  beforeEach(async () => {
    await ensurePlatformSchema()
  })

  test("dedupes same reference key inside window", async () => {
    await publishNotification({
      userId: "seller-1",
      source: "chat",
      type: "message_received",
      title: "New message",
      body: "message body",
      deepLinkPath: "/seller/deal-room",
      referenceId: "conv-1",
      referenceType: "Conversation",
    })
    const second = await publishNotification({
      userId: "seller-1",
      source: "chat",
      type: "message_received",
      title: "New message",
      body: "message body",
      deepLinkPath: "/seller/deal-room",
      referenceId: "conv-1",
      referenceType: "Conversation",
    })
    expect(second.deduped).toBe(true)
  })

  test("markAll marks unread notifications as read", async () => {
    await publishNotification({
      userId: "seller-2",
      source: "orders",
      type: "payment_confirmed",
      title: "Payment confirmed",
      body: "Order paid",
      deepLinkPath: "/seller/orders",
    })
    await markAllNotificationsRead("seller-2")
    const list = await listNotifications("seller-2", { limit: 20 })
    expect(list[0]?.isRead).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to confirm failures**

Run: `bun test lib/notifications/service.test.ts`
Expected: FAIL because service methods are missing.

- [ ] **Step 3: Implement minimal service with SQL and dedupe window**

```ts
// lib/notifications/service.ts
import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
import type { NotificationEventPayload, NotificationRecord } from "@/lib/notifications/types"
import { parseNotificationEvent } from "@/lib/notifications/validation"

const DEDUPE_WINDOW_MS = 5 * 60 * 1000

export async function publishNotification(payload: NotificationEventPayload): Promise<{ deduped: boolean; notificationId?: string }> {
  const parsed = parseNotificationEvent(payload)
  if (parsed.referenceId && parsed.referenceType) {
    const rows = (await sql`
      select notification_id
      from notifications
      where user_id = ${parsed.userId}
        and source = ${parsed.source}
        and type = ${parsed.type}
        and reference_id = ${parsed.referenceId}
        and created_at >= now() - (${DEDUPE_WINDOW_MS} || ' milliseconds')::interval
      order by created_at desc
      limit 1
    `) as { notification_id: string }[]
    if (rows[0]) return { deduped: true, notificationId: rows[0].notification_id }
  }

  const notificationId = randomUUID()
  await sql`
    insert into notifications (
      notification_id, user_id, source, type, title, body, deep_link_path,
      reference_id, reference_type, is_read, created_at, read_at
    ) values (
      ${notificationId}, ${parsed.userId}, ${parsed.source}, ${parsed.type}, ${parsed.title},
      ${parsed.body}, ${parsed.deepLinkPath}, ${parsed.referenceId ?? null}, ${parsed.referenceType ?? null},
      false, now(), null
    )
  `
  return { deduped: false, notificationId }
}

export async function listNotifications(userId: string, opts: { limit: number }): Promise<NotificationRecord[]> { /* full implementation in task */ return [] }
export async function getUnreadCount(userId: string): Promise<number> { /* full implementation in task */ return 0 }
export async function markNotificationRead(userId: string, notificationId: string): Promise<void> { /* full implementation in task */ }
export async function markAllNotificationsRead(userId: string): Promise<void> { /* full implementation in task */ }
```

- [ ] **Step 4: Complete list/count/read methods and rerun tests**

Run: `bun test lib/notifications/service.test.ts`
Expected: PASS for dedupe and read flows.

- [ ] **Step 5: Commit**

```bash
git add lib/notifications/service.ts lib/notifications/service.test.ts
git commit -m "feat(notification): implement service publish/list/read and dedupe"
```

---

### Task 4: Add Notification API Routes (Thin Adapters)

**Files:**
- Create: `app/api/notifications/events/route.ts`
- Create: `app/api/notifications/route.ts`
- Create: `app/api/notifications/unread-count/route.ts`
- Create: `app/api/notifications/read-all/route.ts`
- Create: `app/api/notifications/[notificationId]/read/route.ts`

- [ ] **Step 1: Write failing API tests (or route-level smoke tests)**

```ts
import { describe, expect, test } from "bun:test"

describe("notification routes", () => {
  test("events route returns 201 for created notifications", async () => {
    const res = await fetch("http://localhost:3000/api/notifications/events", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "seller-1" },
      body: JSON.stringify({
        userId: "seller-1",
        source: "chat",
        type: "message_received",
        title: "New message",
        body: "body",
        deepLinkPath: "/seller/deal-room",
      }),
    })
    expect([200, 201]).toContain(res.status)
  })
})
```

- [ ] **Step 2: Run tests to verify endpoint absence**

Run: `bun test lib/notifications/api.test.ts`
Expected: FAIL (route file missing / request failing).

- [ ] **Step 3: Implement routes as service wrappers**

```ts
// app/api/notifications/events/route.ts
import { NextResponse } from "next/server"
import { publishNotification } from "@/lib/notifications/service"

export async function POST(req: Request) {
  const payload = await req.json()
  const result = await publishNotification(payload)
  return NextResponse.json(result, { status: result.deduped ? 200 : 201 })
}
```

```ts
// app/api/notifications/[notificationId]/read/route.ts
import { NextResponse } from "next/server"
import { markNotificationRead } from "@/lib/notifications/service"

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const { notificationId } = await params
  const userId = "seller-1" // replace with auth session user id hook
  await markNotificationRead(userId, notificationId)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Verify route handlers typecheck and run smoke checks**

Run:
- `bun run typecheck`
- `bun run dev` then manual `curl` for each endpoint.

Expected:
- typecheck PASS
- endpoints return expected status codes and shapes.

- [ ] **Step 5: Commit**

```bash
git add app/api/notifications lib/notifications
git commit -m "feat(notification): add notification API route handlers"
```

---

### Task 5: Build Notification Bell + Center UI with Polling

**Files:**
- Create: `components/notifications/notification-center.tsx`
- Create: `components/notifications/notification-item-row.tsx`
- Create: `lib/notifications/source-icons.tsx`
- Modify: `components/nav-seller.tsx`
- Modify: `components/nav-partner.tsx`

- [ ] **Step 1: Write failing component behavior tests (or interaction checklist)**

```tsx
// pseudo-test outline (if using testing libs later)
// 1) unreadCount > 0 shows badge
// 2) clicking bell opens panel and fetches list
// 3) clicking "Mark all as read" clears indicators without navigation
```

- [ ] **Step 2: Run checks to capture baseline failing state**

Run:
- `bun run typecheck`
- manual verification: seller/partner nav only has bell link and no panel.

Expected: no notification center interaction yet.

- [ ] **Step 3: Implement notification center component with polling**

```tsx
"use client"

import { BellIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function NotificationCenter({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const intervalMs = open ? 5000 : 10000
    const timer = setInterval(async () => {
      const res = await fetch("/api/notifications/unread-count")
      const data = await res.json()
      setUnreadCount(data.unreadCount)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [open])

  return (
    <Button variant="ghost" onClick={() => setOpen((v) => !v)}>
      <BellIcon />
      {unreadCount > 0 ? <span>{unreadCount}</span> : null}
    </Button>
  )
}
```

- [ ] **Step 4: Replace nav bell links with notification center component**

```tsx
// components/nav-seller.tsx and components/nav-partner.tsx
import { NotificationCenter } from "@/components/notifications/notification-center"

// in menu:
<NotificationCenter userId="seller-1" />
```

- [ ] **Step 5: Verify UX acceptance**

Run:
- `bun run dev`
- manual check:
  - bell badge shows/hides
  - panel opens/closes
  - row click marks read + navigates
  - "Mark as read" and "Mark all as read" do not navigate
  - empty state text matches spec

Expected: all AC behavior observable in UI.

- [ ] **Step 6: Commit**

```bash
git add components/notifications components/nav-seller.tsx components/nav-partner.tsx lib/notifications/source-icons.tsx
git commit -m "feat(notification): add bell, center panel, and polling updates"
```

---

### Task 6: Seed Data, Verify End-to-End, and Stabilize

**Files:**
- Modify: `scripts/platform/seed.ts`
- Modify: `README.md` (optional usage section if needed)

- [ ] **Step 1: Add sample seed notifications for seller and partner**

```ts
await sql`
  insert into notifications (
    notification_id, user_id, source, type, title, body, deep_link_path, is_read, created_at
  ) values
    (gen_random_uuid(), 'seller-1', 'chat', 'message_received', 'New inquiry', 'You have a new message', '/seller/deal-room', false, now()),
    (gen_random_uuid(), 'partner-1', 'tradexpo', 'expo_updated', 'Expo updated', 'Your expo draft was updated', '/partner/expos', false, now())
`
```

- [ ] **Step 2: Run full verification commands**

Run:
- `bun run check`
- `bun run typecheck`
- `bun test lib/notifications/*.test.ts`

Expected:
- all commands pass.

- [ ] **Step 3: Execute end-to-end manual flow checklist**

Run manual flow:
1. Seed platform.
2. Open seller nav, verify unread badge.
3. Open panel, mark one read, confirm decrement.
4. Mark all read, confirm badge disappears.
5. Publish event via `POST /api/notifications/events`, wait one poll interval, confirm badge increments.

Expected: behavior matches US-01 and US-02 ACs.

- [ ] **Step 4: Commit**

```bash
git add scripts/platform/seed.ts README.md
git commit -m "chore(notification): add seed data and verify end-to-end flow"
```

---

## Final Verification Gate

- [ ] Run: `bun run check && bun run typecheck && bun test lib/notifications/*.test.ts`
- [ ] Confirm no regressions in existing `app/api/tradexpo/notifications` behavior.
- [ ] Confirm no unresolved TODO/TBD text in new notification files.

## Notes for Implementation Agent

- Keep Notification Service module-agnostic: do not interpret `source`, `type`, `referenceType`, or `deepLinkPath`.
- Use one-way read state only; never introduce unmark-read in MVP.
- Keep API handlers thin; business logic stays in `lib/notifications/service.ts`.
- Prefer small focused helper functions; avoid adding logic to nav components directly.
