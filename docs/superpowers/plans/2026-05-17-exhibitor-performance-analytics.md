# Exhibitor Performance Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track real exhibitor engagement events and show performance metrics on Partner Portal exhibitor detail pages.

**Architecture:** Add append-only analytics event tables through `ensurePlatformSchema()`, expose small insert helpers and API endpoints, wire current public expo components to fire events without blocking UX, then aggregate metrics in `getPartnerExpoExhibitorDetail()`. Wishlist metrics reuse `user_wishlist_items` and are joined through product IDs already shown in booth/customization data.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun test, Neon SQL via `lib/db/neon.ts`, shadcn/ui, Tailwind CSS v4.

---

## File structure

- Modify `lib/platform/ensure-schema.ts`: create analytics event tables and indexes.
- Modify `lib/partner/db.ts`: add performance types and aggregation in `getPartnerExpoExhibitorDetail()`.
- Create `lib/tradexpo/analytics.ts`: server helpers for inserting tracking events and validating payloads.
- Create API routes under `app/api/tradexpo/analytics/*/route.ts`: profile view, product view, product chat, RFQ.
- Modify `app/(tradexpo)/expos/[slug]/page.tsx`: pass `expoId` into `ExhibitorsSection`.
- Modify `components/tradexpo/expo-detail/exhibitors-section.tsx`: pass `expoId` to cards and track product chat.
- Modify `components/tradexpo/expo-detail/exhibitor-card.tsx`: track profile/product views and pass analytics context to product dialog.
- Modify `components/tradexpo/expo-detail/exhibitor-product-detail-dialog.tsx`: track product views, product chat, and RFQ submit.
- Modify `components/tradexpo/expo-detail/exhibitor-rfq-dialog.tsx`: expose submit callback if needed.
- Modify `components/partner/partner-expo-exhibitor-detail.tsx`: render Performance card.
- Modify `lib/partner/expo-exhibitors.test.ts`: extend existing detail tests with analytics rows.

---

### Task 1: Analytics schema

**Files:**
- Modify: `lib/platform/ensure-schema.ts`

- [ ] **Step 1: Add tables after wishlist tables in `ensurePlatformSchema()`**

Add after the `user_wishlist_items` migration/index block:

```ts
  await sql`
    create table if not exists expo_exhibitor_profile_visits (
      id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      exhibitor_id text not null,
      visitor_user_id text references users(id) on delete set null,
      visitor_key text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_expo_exhibitor_profile_visits_lookup
    on expo_exhibitor_profile_visits (expo_id, exhibitor_id, created_at desc)
  `

  await sql`
    create table if not exists expo_exhibitor_product_views (
      id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      exhibitor_id text not null,
      product_id text not null,
      visitor_user_id text references users(id) on delete set null,
      visitor_key text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_expo_exhibitor_product_views_lookup
    on expo_exhibitor_product_views (expo_id, exhibitor_id, product_id, created_at desc)
  `

  await sql`
    create table if not exists expo_exhibitor_product_chat_events (
      id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      exhibitor_id text not null,
      product_id text,
      conversation_id text,
      visitor_user_id text references users(id) on delete set null,
      visitor_key text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_expo_exhibitor_product_chat_events_lookup
    on expo_exhibitor_product_chat_events (expo_id, exhibitor_id, product_id, created_at desc)
  `

  await sql`
    create table if not exists expo_exhibitor_rfq_events (
      id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      exhibitor_id text not null,
      product_id text,
      requester_user_id text references users(id) on delete set null,
      requester_key text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_expo_exhibitor_rfq_events_lookup
    on expo_exhibitor_rfq_events (expo_id, exhibitor_id, product_id, created_at desc)
  `
```

- [ ] **Step 2: Run typecheck**

```bash
bun typecheck
```

Expected: pass.

---

### Task 2: Tracking helper and API routes

**Files:**
- Create: `lib/tradexpo/analytics.ts`
- Create: `app/api/tradexpo/analytics/profile-view/route.ts`
- Create: `app/api/tradexpo/analytics/product-view/route.ts`
- Create: `app/api/tradexpo/analytics/product-chat/route.ts`
- Create: `app/api/tradexpo/analytics/rfq/route.ts`

- [ ] **Step 1: Create analytics helper**

Create `lib/tradexpo/analytics.ts`:

```ts
import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"

export type ExpoAnalyticsPayload = {
  expoId: string
  exhibitorId: string
  productId?: string | null
  conversationId?: string | null
  visitorKey?: string | null
  requesterKey?: string | null
  userId?: string | null
}

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export function parseExpoAnalyticsPayload(value: unknown): ExpoAnalyticsPayload {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid analytics payload.")
  }

  const record = value as Record<string, unknown>
  const expoId = cleanText(record.expoId)
  const exhibitorId = cleanText(record.exhibitorId)

  if (!expoId || !exhibitorId) {
    throw new Error("expoId and exhibitorId are required.")
  }

  return {
    expoId,
    exhibitorId,
    productId: cleanText(record.productId),
    conversationId: cleanText(record.conversationId),
    visitorKey: cleanText(record.visitorKey),
    requesterKey: cleanText(record.requesterKey)
  }
}

export async function recordExpoProfileView(input: ExpoAnalyticsPayload) {
  await sql`
    insert into expo_exhibitor_profile_visits (
      id, expo_id, exhibitor_id, visitor_user_id, visitor_key
    ) values (
      ${`expo-profile-visit-${randomUUID()}`},
      ${input.expoId},
      ${input.exhibitorId},
      ${input.userId ?? null},
      ${input.visitorKey ?? null}
    )
  `
}

export async function recordExpoProductView(input: ExpoAnalyticsPayload) {
  if (!input.productId) throw new Error("productId is required.")
  await sql`
    insert into expo_exhibitor_product_views (
      id, expo_id, exhibitor_id, product_id, visitor_user_id, visitor_key
    ) values (
      ${`expo-product-view-${randomUUID()}`},
      ${input.expoId},
      ${input.exhibitorId},
      ${input.productId},
      ${input.userId ?? null},
      ${input.visitorKey ?? null}
    )
  `
}

export async function recordExpoProductChat(input: ExpoAnalyticsPayload) {
  await sql`
    insert into expo_exhibitor_product_chat_events (
      id, expo_id, exhibitor_id, product_id, conversation_id, visitor_user_id, visitor_key
    ) values (
      ${`expo-product-chat-${randomUUID()}`},
      ${input.expoId},
      ${input.exhibitorId},
      ${input.productId ?? null},
      ${input.conversationId ?? null},
      ${input.userId ?? null},
      ${input.visitorKey ?? null}
    )
  `
}

export async function recordExpoRfq(input: ExpoAnalyticsPayload) {
  await sql`
    insert into expo_exhibitor_rfq_events (
      id, expo_id, exhibitor_id, product_id, requester_user_id, requester_key
    ) values (
      ${`expo-rfq-${randomUUID()}`},
      ${input.expoId},
      ${input.exhibitorId},
      ${input.productId ?? null},
      ${input.userId ?? null},
      ${input.requesterKey ?? input.visitorKey ?? null}
    )
  `
}
```

- [ ] **Step 2: Create route factory pattern manually per endpoint**

Create `app/api/tradexpo/analytics/profile-view/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getCurrentSessionUserId } from "@/lib/auth/session"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  parseExpoAnalyticsPayload,
  recordExpoProfileView
} from "@/lib/tradexpo/analytics"

export async function POST(request: Request) {
  try {
    await ensurePlatformSchema()
    const userId = await getCurrentSessionUserId()
    const payload = parseExpoAnalyticsPayload(await request.json())
    await recordExpoProfileView({ ...payload, userId })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tracking failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
```

Create `app/api/tradexpo/analytics/product-view/route.ts` with same shape but call `recordExpoProductView`.

Create `app/api/tradexpo/analytics/product-chat/route.ts` with same shape but call `recordExpoProductChat`.

Create `app/api/tradexpo/analytics/rfq/route.ts` with same shape but call `recordExpoRfq`.

- [ ] **Step 3: Run typecheck**

```bash
bun typecheck
```

Expected: pass.

---

### Task 3: Partner detail aggregation

**Files:**
- Modify: `lib/partner/db.ts`
- Modify: `lib/partner/expo-exhibitors.test.ts`

- [ ] **Step 1: Add performance types**

Near `PartnerExpoExhibitorDetail`, add:

```ts
export type PartnerExpoExhibitorPerformanceProduct = {
  productId: string
  productName: string
  count: number
}

export type PartnerExpoExhibitorPerformance = {
  rfqCount: number
  chatCount: number
  eProfileVisits: number
  topViewedProduct: PartnerExpoExhibitorPerformanceProduct | null
  topChattedProduct: PartnerExpoExhibitorPerformanceProduct | null
  topWishlistedProduct: PartnerExpoExhibitorPerformanceProduct | null
}
```

Update `PartnerExpoExhibitorDetail`:

```ts
export type PartnerExpoExhibitorDetail = {
  exhibitor: PartnerExpoExhibitorListItem
  registrations: PartnerExpoExhibitorRegistration[]
  orders: PartnerExpoExhibitorOrder[]
  performance: PartnerExpoExhibitorPerformance
}
```

- [ ] **Step 2: Add expo window and product label helpers**

Before `getPartnerExpoExhibitorDetail`, add:

```ts
function productNameExpression(alias: string) {
  return `coalesce(nullif(${alias}.name, ''), ${alias}.id)`
}
```

Do not interpolate this function into SQL. Instead inline `coalesce(nullif(cp.name, ''), event.product_id)` in SQL queries below.

- [ ] **Step 3: Aggregate performance inside `getPartnerExpoExhibitorDetail`**

After `orderRows`, add:

```ts
  const performanceRows = (await sql`
    with expo_window as (
      select
        coalesce(start_at, start_date::timestamptz) as starts_at,
        coalesce(end_at, (end_date::date + interval '1 day')::timestamptz) as ends_at
      from expos
      where id = ${expoId}
    ),
    selected_products as (
      select distinct product_id
      from (
        select jsonb_array_elements(coalesce(bc.products, '[]'::jsonb))->>'id' as product_id
        from seller_booth_registrations sbr
        inner join users u on u.id = sbr.user_id
        left join booth_customizations bc on bc.registration_id = sbr.id
        where sbr.expo_id = ${expoId}
          and coalesce(u.company_id, u.id) = ${exhibitorId}
      ) products
      where product_id is not null and product_id <> ''
    ),
    profile_stats as (
      select count(*)::int as eprofile_visits
      from expo_exhibitor_profile_visits event
      cross join expo_window ew
      where event.expo_id = ${expoId}
        and event.exhibitor_id = ${exhibitorId}
        and event.created_at >= ew.starts_at
        and event.created_at < ew.ends_at
    ),
    rfq_stats as (
      select count(*)::int as rfq_count
      from expo_exhibitor_rfq_events event
      cross join expo_window ew
      where event.expo_id = ${expoId}
        and event.exhibitor_id = ${exhibitorId}
        and event.created_at >= ew.starts_at
        and event.created_at < ew.ends_at
    ),
    chat_stats as (
      select count(*)::int as chat_count
      from expo_exhibitor_product_chat_events event
      cross join expo_window ew
      where event.expo_id = ${expoId}
        and event.exhibitor_id = ${exhibitorId}
        and event.created_at >= ew.starts_at
        and event.created_at < ew.ends_at
    )
    select
      coalesce((select eprofile_visits from profile_stats), 0)::int as eprofile_visits,
      coalesce((select rfq_count from rfq_stats), 0)::int as rfq_count,
      coalesce((select chat_count from chat_stats), 0)::int as chat_count
  `) as { eprofile_visits: number | string; rfq_count: number | string; chat_count: number | string }[]

  const topViewedRows = (await sql`
    with expo_window as (
      select coalesce(start_at, start_date::timestamptz) as starts_at,
             coalesce(end_at, (end_date::date + interval '1 day')::timestamptz) as ends_at
      from expos where id = ${expoId}
    )
    select event.product_id, coalesce(nullif(cp.name, ''), event.product_id) as product_name, count(*)::int as value
    from expo_exhibitor_product_views event
    cross join expo_window ew
    left join company_products cp on cp.id = event.product_id
    where event.expo_id = ${expoId}
      and event.exhibitor_id = ${exhibitorId}
      and event.created_at >= ew.starts_at
      and event.created_at < ew.ends_at
    group by event.product_id, cp.name
    order by value desc, product_name asc
    limit 1
  `) as { product_id: string; product_name: string; value: number | string }[]

  const topChattedRows = (await sql`
    with expo_window as (
      select coalesce(start_at, start_date::timestamptz) as starts_at,
             coalesce(end_at, (end_date::date + interval '1 day')::timestamptz) as ends_at
      from expos where id = ${expoId}
    )
    select event.product_id, coalesce(nullif(cp.name, ''), event.product_id) as product_name, count(*)::int as value
    from expo_exhibitor_product_chat_events event
    cross join expo_window ew
    left join company_products cp on cp.id = event.product_id
    where event.expo_id = ${expoId}
      and event.exhibitor_id = ${exhibitorId}
      and event.product_id is not null
      and event.created_at >= ew.starts_at
      and event.created_at < ew.ends_at
    group by event.product_id, cp.name
    order by value desc, product_name asc
    limit 1
  `) as { product_id: string; product_name: string; value: number | string }[]

  const topWishlistedRows = (await sql`
    with expo_window as (
      select coalesce(start_at, start_date::timestamptz) as starts_at,
             coalesce(end_at, (end_date::date + interval '1 day')::timestamptz) as ends_at
      from expos where id = ${expoId}
    ),
    selected_products as (
      select distinct product_id
      from (
        select jsonb_array_elements(coalesce(bc.products, '[]'::jsonb))->>'id' as product_id
        from seller_booth_registrations sbr
        inner join users u on u.id = sbr.user_id
        left join booth_customizations bc on bc.registration_id = sbr.id
        where sbr.expo_id = ${expoId}
          and coalesce(u.company_id, u.id) = ${exhibitorId}
      ) products
      where product_id is not null and product_id <> ''
    )
    select wi.target_id as product_id, coalesce(nullif(cp.name, ''), wi.target_id) as product_name, count(*)::int as value
    from user_wishlist_items wi
    inner join selected_products sp on sp.product_id = wi.target_id
    cross join expo_window ew
    left join company_products cp on cp.id = wi.target_id
    where wi.target_type = 'product'
      and wi.created_at >= ew.starts_at
      and wi.created_at < ew.ends_at
    group by wi.target_id, cp.name
    order by value desc, product_name asc
    limit 1
  `) as { product_id: string; product_name: string; value: number | string }[]
```

Add helper inside function before return:

```ts
  const toPerformanceProduct = (row?: {
    product_id: string
    product_name: string
    value: number | string
  }): PartnerExpoExhibitorPerformanceProduct | null =>
    row
      ? {
          productId: row.product_id,
          productName: row.product_name,
          count: toNumber(row.value)
        }
      : null
```

Add `performance` to return:

```ts
    performance: {
      rfqCount: toNumber(performanceRows[0]?.rfq_count),
      chatCount: toNumber(performanceRows[0]?.chat_count),
      eProfileVisits: toNumber(performanceRows[0]?.eprofile_visits),
      topViewedProduct: toPerformanceProduct(topViewedRows[0]),
      topChattedProduct: toPerformanceProduct(topChattedRows[0]),
      topWishlistedProduct: toPerformanceProduct(topWishlistedRows[0])
    }
```

- [ ] **Step 4: Extend tests**

In `lib/partner/expo-exhibitors.test.ts`, after existing seed orders insert, insert analytics events:

```ts
  await sql`
    insert into expo_exhibitor_profile_visits (id, expo_id, exhibitor_id, visitor_key, created_at)
    values
      ('test-partner-exhibitors-profile-1', ${ids.expo}, ${ids.company}, 'visitor-a', '2026-06-01T10:00:00Z'),
      ('test-partner-exhibitors-profile-2', ${ids.expo}, ${ids.company}, 'visitor-b', '2026-06-02T10:00:00Z'),
      ('test-partner-exhibitors-profile-outside', ${ids.expo}, ${ids.company}, 'visitor-c', '2026-07-01T10:00:00Z')
  `
  await sql`
    insert into expo_exhibitor_product_views (id, expo_id, exhibitor_id, product_id, visitor_key, created_at)
    values
      ('test-partner-exhibitors-view-1', ${ids.expo}, ${ids.company}, 'p1', 'visitor-a', '2026-06-01T10:00:00Z'),
      ('test-partner-exhibitors-view-2', ${ids.expo}, ${ids.company}, 'p1', 'visitor-b', '2026-06-01T11:00:00Z'),
      ('test-partner-exhibitors-view-3', ${ids.expo}, ${ids.company}, 'p3', 'visitor-c', '2026-06-01T12:00:00Z')
  `
  await sql`
    insert into expo_exhibitor_product_chat_events (id, expo_id, exhibitor_id, product_id, visitor_key, created_at)
    values
      ('test-partner-exhibitors-chat-1', ${ids.expo}, ${ids.company}, 'p3', 'visitor-a', '2026-06-01T10:00:00Z'),
      ('test-partner-exhibitors-chat-2', ${ids.expo}, ${ids.company}, 'p3', 'visitor-b', '2026-06-01T11:00:00Z')
  `
  await sql`
    insert into expo_exhibitor_rfq_events (id, expo_id, exhibitor_id, product_id, requester_key, created_at)
    values ('test-partner-exhibitors-rfq-1', ${ids.expo}, ${ids.company}, 'p1', 'buyer-a', '2026-06-02T10:00:00Z')
  `
  await sql`
    insert into user_wishlist_items (user_id, target_type, target_id, created_at)
    values
      ('test-partner-exhibitors-wishlist-user-a', 'product', 'p1', '2026-06-01T10:00:00Z'),
      ('test-partner-exhibitors-wishlist-user-b', 'product', 'p1', '2026-06-02T10:00:00Z'),
      ('test-partner-exhibitors-wishlist-user-c', 'product', 'p3', '2026-06-02T10:00:00Z')
    on conflict do nothing
  `
```

Also update cleanup to delete these `test-partner-exhibitors-%` rows.

In detail test, add:

```ts
    expect(detail?.performance).toEqual({
      rfqCount: 1,
      chatCount: 2,
      eProfileVisits: 2,
      topViewedProduct: { productId: "p1", productName: "p1", count: 2 },
      topChattedProduct: { productId: "p3", productName: "p3", count: 2 },
      topWishlistedProduct: { productId: "p1", productName: "p1", count: 2 }
    })
```

- [ ] **Step 5: Run tests/typecheck**

```bash
bun test lib/partner/expo-exhibitors.test.ts
bun typecheck
```

Expected: targeted test passes when `DATABASE_URL` is configured; typecheck passes.

---

### Task 4: UI performance card

**Files:**
- Modify: `components/partner/partner-expo-exhibitor-detail.tsx`

- [ ] **Step 1: Add performance helpers**

Add after `safeExternalHref`:

```tsx
function formatTopProduct(
  product: PartnerExpoExhibitorDetail["performance"]["topViewedProduct"]
) {
  return product ? `${product.productName} (${numberFormat.format(product.count)})` : "No data yet"
}
```

- [ ] **Step 2: Render Performance card**

After company profile card and before booth registrations section, add:

```tsx
      <Card>
        <CardHeader>
          <CardTitle>Performance during expo</CardTitle>
          <CardDescription>
            Real engagement captured between expo start and end.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <PerformanceMetric
            label="RFQs received"
            value={numberFormat.format(detail.performance.rfqCount)}
          />
          <PerformanceMetric
            label="Chat events received"
            value={numberFormat.format(detail.performance.chatCount)}
          />
          <PerformanceMetric
            label="eProfile visits"
            value={numberFormat.format(detail.performance.eProfileVisits)}
          />
          <PerformanceMetric
            label="Most viewed product"
            value={formatTopProduct(detail.performance.topViewedProduct)}
          />
          <PerformanceMetric
            label="Most chatted product"
            value={formatTopProduct(detail.performance.topChattedProduct)}
          />
          <PerformanceMetric
            label="Most wishlisted product"
            value={formatTopProduct(detail.performance.topWishlistedProduct)}
          />
        </CardContent>
      </Card>
```

Add helper near `ReadinessRow`:

```tsx
function PerformanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/50 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-sm">{value}</p>
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck**

```bash
bun typecheck
```

Expected: pass.

---

### Task 5: Public expo tracking client wiring

**Files:**
- Modify: `app/(tradexpo)/expos/[slug]/page.tsx`
- Modify: `components/tradexpo/expo-detail/exhibitors-section.tsx`
- Modify: `components/tradexpo/expo-detail/exhibitor-card.tsx`
- Modify: `components/tradexpo/expo-detail/exhibitor-product-detail-dialog.tsx`
- Modify: `components/tradexpo/expo-detail/exhibitor-rfq-dialog.tsx`

- [ ] **Step 1: Add non-blocking client helper**

In `components/tradexpo/expo-detail/exhibitor-card.tsx`, add local helper:

```ts
function getVisitorKey() {
  const key = "arobid-expo-visitor-key"
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const next = crypto.randomUUID()
  window.localStorage.setItem(key, next)
  return next
}

function trackExpoAnalytics(path: string, body: Record<string, string | null>) {
  fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, visitorKey: getVisitorKey() })
  }).catch(() => undefined)
}
```

- [ ] **Step 2: Pass `expoId` through public page/section/card**

In `app/(tradexpo)/expos/[slug]/page.tsx`, add prop:

```tsx
<ExhibitorsSection
  expoId={expo.id}
  expoName={expo.name}
  initialExhibitors={exhibitors}
  isAuthenticated={!!userId}
/>
```

In `components/tradexpo/expo-detail/exhibitors-section.tsx`, update props type and signature to include `expoId: string`, then pass to `ExhibitorCard`:

```tsx
<ExhibitorCard
  key={exhibitor.id}
  expoId={expoId}
  exhibitor={exhibitor}
  isAuthenticated={isAuthenticated}
  onChatClick={(product) => handleChatClick(exhibitor, product)}
/>
```

In `components/tradexpo/expo-detail/exhibitor-card.tsx`, add `expoId` prop.

- [ ] **Step 3: Track profile and product views**

In `ExhibitorCard`, fire profile view when card mounts:

```tsx
useEffect(() => {
  trackExpoAnalytics("/api/tradexpo/analytics/profile-view", {
    expoId,
    exhibitorId: exhibitor.id
  })
}, [expoId, exhibitor.id])
```

In product thumbnail click:

```tsx
onClick={() => {
  trackExpoAnalytics("/api/tradexpo/analytics/product-view", {
    expoId,
    exhibitorId: exhibitor.id,
    productId: item.id
  })
  setSelectedProduct(item)
}}
```

- [ ] **Step 4: Track product chat and pass analytics context to dialog**

In `ExhibitorCard` `onChatNow`:

```tsx
onChatNow={(product) => {
  trackExpoAnalytics("/api/tradexpo/analytics/product-chat", {
    expoId,
    exhibitorId: exhibitor.id,
    productId: product.id
  })
  onChatClick?.(product)
}}
```

Also track exhibitor-level chat in `ExhibitorCardActions` click wrapper:

```tsx
onChatClick={() => {
  trackExpoAnalytics("/api/tradexpo/analytics/product-chat", {
    expoId,
    exhibitorId: exhibitor.id,
    productId: null
  })
  onChatClick?.(null)
}}
```

Pass `expoId` and `exhibitorId` to `ExhibitorProductDetailDialog`.

- [ ] **Step 5: Track RFQ submit**

In `ExhibitorProductDetailDialog`, add props `expoId`, `exhibitorId`, and helper call when RFQ dialog reports submit success. If `ExhibitorRfqDialog` lacks success callback, add optional prop:

```tsx
onSubmitted?: (product: ProductItem) => void
```

Call it after existing submit success. In parent dialog, call:

```tsx
trackExpoAnalytics("/api/tradexpo/analytics/rfq", {
  expoId,
  exhibitorId,
  productId: selectedProduct.id
})
```

- [ ] **Step 6: Run typecheck**

```bash
bun typecheck
```

Expected: pass.

---

### Task 6: Verification

**Files:**
- No planned changes unless failures reveal bugs.

- [ ] **Step 1: Run schema/type checks**

```bash
bun typecheck
```

Expected: pass.

- [ ] **Step 2: Run targeted DB test**

```bash
bun test lib/partner/expo-exhibitors.test.ts
```

Expected: pass when `DATABASE_URL` is configured. If blocked by missing `DATABASE_URL`, report exact blocker and do not claim DB test pass.

- [ ] **Step 3: Browser smoke test**

Start or use existing dev server:

```bash
bun dev
```

Manual/Chrome path:

1. Open public expo page.
2. Open exhibitor card/product dialog.
3. Click product, chat, RFQ.
4. Open Partner Portal exhibitor detail.
5. Verify Performance during expo card renders and no runtime errors.

Expected: UI loads; tracking failures never block user action.

---

## Self-review

- Spec coverage: schema, APIs, public wiring, partner aggregation, UI card, tests, and verification covered.
- Placeholder scan: no TBD/TODO/fill-in instructions.
- Type consistency: performance type names match UI and DB plan; API payload names match client tracking calls.
- Known risk: actual `ExhibitorRfqDialog` implementation may require adapting success callback insertion point; plan scopes that change explicitly.
