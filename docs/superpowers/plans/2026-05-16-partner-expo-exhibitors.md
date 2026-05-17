# Partner Expo Exhibitors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add read-only Partner Portal exhibitor visibility for assigned expo detail pages, including overview teaser, full filtered list, and exhibitor drilldown route.

**Architecture:** Use `seller_booth_registrations` as booth participation source of truth. Add scoped partner data helpers in `lib/partner/db.ts`, then render server-fetched data through focused partner components. Keep schema unchanged and verify every list/detail query through active partner assignment checks.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun test, Neon SQL via `lib/db/neon.ts`, shadcn/ui components, Tailwind CSS v4.

---

## File structure

- Modify `lib/partner/db.ts`: add exhibitor types, query helpers, normalization helpers.
- Create `lib/partner/expo-exhibitors.test.ts`: Bun tests for grouping, fallback, aggregates, scope, and detail filtering.
- Modify `app/(dashboard)/partner/expos/[expoId]/page.tsx`: fetch exhibitor workspace and add Exhibitors tab.
- Create `components/partner/partner-expo-exhibitors-overview-card.tsx`: overview teaser with top 5 exhibitors and tab switch callback.
- Create `components/partner/partner-expo-exhibitors-table.tsx`: client-side search/filter table.
- Modify `components/partner/partner-expo-detail-overview.tsx`: accept teaser data and optional `onViewAllExhibitors` callback, render teaser card.
- Create `components/partner/partner-expo-detail-tabs.tsx`: client wrapper owning tab state so Overview CTA can switch to Exhibitors tab.
- Create `components/partner/partner-expo-exhibitor-detail.tsx`: drilldown presentation.
- Create `app/(dashboard)/partner/expos/[expoId]/exhibitors/[exhibitorId]/page.tsx`: detail route with access guard and breadcrumbs.

---

### Task 1: Data helper tests

**Files:**
- Create: `lib/partner/expo-exhibitors.test.ts`
- Modify later: `lib/partner/db.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/partner/expo-exhibitors.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  getPartnerExpoExhibitorDetail,
  getPartnerExpoExhibitors
} from "@/lib/partner/db"

const ids = {
  partnerUser: "test-partner-exhibitors-owner",
  outsiderUser: "test-partner-exhibitors-outsider",
  org: "test-partner-exhibitors-org",
  outsiderOrg: "test-partner-exhibitors-outsider-org",
  expo: "test-partner-exhibitors-expo",
  company: "test-partner-exhibitors-company",
  sellerA: "test-partner-exhibitors-seller-a",
  sellerB: "test-partner-exhibitors-seller-b",
  fallbackSeller: "test-partner-exhibitors-seller-fallback",
  regA: "test-partner-exhibitors-reg-a",
  regB: "test-partner-exhibitors-reg-b",
  regFallback: "test-partner-exhibitors-reg-fallback",
  orderA: "test-partner-exhibitors-order-a",
  orderB: "test-partner-exhibitors-order-b",
  orderFallback: "test-partner-exhibitors-order-fallback"
}

async function cleanup() {
  await sql`delete from orders where id like 'test-partner-exhibitors-%'`
  await sql`delete from booth_customizations where registration_id like 'test-partner-exhibitors-%'`
  await sql`delete from seller_booth_registrations where id like 'test-partner-exhibitors-%'`
  await sql`delete from partner_expo_assignments where expo_id like 'test-partner-exhibitors-%'`
  await sql`delete from expos where id like 'test-partner-exhibitors-%'`
  await sql`delete from partner_memberships where user_id like 'test-partner-exhibitors-%'`
  await sql`delete from partner_organizations where id like 'test-partner-exhibitors-%'`
  await sql`delete from users where id like 'test-partner-exhibitors-%'`
  await sql`delete from companies where id like 'test-partner-exhibitors-%'`
}

beforeEach(async () => {
  await ensurePlatformSchema()
  await cleanup()

  await sql`
    insert into users (id, name, email, is_active)
    values
      (${ids.partnerUser}, 'Partner Owner', 'partner-owner@test.local', true),
      (${ids.outsiderUser}, 'Outsider Partner', 'outsider-partner@test.local', true)
  `

  await sql`
    insert into partner_organizations (id, name, model, partner_type, status, primary_user_id)
    values
      (${ids.org}, 'Expo Owner Org', 'turnkey', 'expo_partner', 'active', ${ids.partnerUser}),
      (${ids.outsiderOrg}, 'Outsider Org', 'turnkey', 'expo_partner', 'active', ${ids.outsiderUser})
  `

  await sql`
    insert into partner_memberships (id, partner_org_id, user_id, role, status)
    values
      ('test-partner-exhibitors-membership-a', ${ids.org}, ${ids.partnerUser}, 'partner_owner', 'active'),
      ('test-partner-exhibitors-membership-b', ${ids.outsiderOrg}, ${ids.outsiderUser}, 'partner_owner', 'active')
  `

  await sql`
    insert into expos (id, name, thumbnail_url, owner_email, start_date, end_date, status, category_ids, created_at)
    values (${ids.expo}, 'Partner Exhibitors Expo', '', 'owner@test.local', '2026-06-01', '2026-06-03', 'Live', '{}', now())
  `

  await sql`
    insert into partner_expo_assignments (id, partner_org_id, expo_id, partnership_model)
    values ('test-partner-exhibitors-assignment', ${ids.org}, ${ids.expo}, 'turnkey')
  `

  await sql`
    insert into companies (id, name, tax_id, logo_url, website, address, is_active)
    values (${ids.company}, 'Acme Exhibitor Co', 'TAX-123', '/logo.png', 'https://acme.example', 'Ho Chi Minh City', true)
  `

  await sql`
    insert into users (id, name, email, company_id, phone, website, location, is_active)
    values
      (${ids.sellerA}, 'Seller A', 'seller-a@test.local', ${ids.company}, '0901', 'https://seller-a.example', 'HCMC', true),
      (${ids.sellerB}, 'Seller B', 'seller-b@test.local', ${ids.company}, '0902', 'https://seller-b.example', 'HCMC', true),
      (${ids.fallbackSeller}, 'Fallback Seller', 'fallback@test.local', null, '0903', null, 'Da Nang', true)
  `

  await sql`
    insert into seller_booth_registrations (id, user_id, expo_id, slot_id, booth_template_id, booth_ref, booth_tier, status, purchased_at)
    values
      (${ids.regA}, ${ids.sellerA}, ${ids.expo}, 'A1', null, 'A-01', 'Basic', 'Confirmed', '2026-05-01T00:00:00Z'),
      (${ids.regB}, ${ids.sellerB}, ${ids.expo}, 'B1', null, 'B-01', 'Premium', 'Confirmed', '2026-05-02T00:00:00Z'),
      (${ids.regFallback}, ${ids.fallbackSeller}, ${ids.expo}, 'C1', null, 'C-01', 'Professional', 'Pending', '2026-05-03T00:00:00Z')
  `

  await sql`
    insert into booth_customizations (registration_id, selected_booth_template_id, publish_status, colors, logo_url, image_urls, video_url, products)
    values
      (${ids.regA}, null, 'Published', '{}', '', '[]', '', '[{"id":"p1"},{"id":"p2"}]'),
      (${ids.regB}, null, 'Draft', '{}', '', '[]', '', '[{"id":"p3"}]')
  `

  await sql`
    insert into orders (id, customer_id, customer_name, customer_email, customer_company, order_type, reference_id, expo_name, booth_ref, booth_tier, original_amount, discount_amount, amount, payment_method, status, created_at, updated_at)
    values
      (${ids.orderA}, ${ids.sellerA}, 'Seller A', 'seller-a@test.local', 'Acme Exhibitor Co', 'booth_registration', ${ids.regA}, 'Partner Exhibitors Expo', 'A-01', 'Basic', 1000000, 0, 1000000, 'bank_transfer', 'Paid', now(), now()),
      (${ids.orderB}, ${ids.sellerB}, 'Seller B', 'seller-b@test.local', 'Acme Exhibitor Co', 'booth_registration', 'legacy-ref', 'Partner Exhibitors Expo', 'B-01', 'Premium', 2000000, 500000, 1500000, 'vnpay', 'Pending', now(), now()),
      (${ids.orderFallback}, ${ids.fallbackSeller}, 'Fallback Seller', 'fallback@test.local', 'Fallback Seller', 'booth_registration', ${ids.regFallback}, 'Partner Exhibitors Expo', 'C-01', 'Professional', 3000000, 0, 3000000, 'bank_transfer', 'Pending', now(), now())
  `
})

afterEach(cleanup)

describe("getPartnerExpoExhibitors", () => {
  test("groups multiple booth registrations from the same company", async () => {
    const workspace = await getPartnerExpoExhibitors(ids.partnerUser, ids.expo)

    expect(workspace).not.toBeNull()
    const company = workspace?.exhibitors.find((item) => item.id === ids.company)

    expect(company).toMatchObject({
      id: ids.company,
      displayName: "Acme Exhibitor Co",
      contactEmail: "seller-a@test.local",
      boothCount: 2,
      boothRefs: ["A-01", "B-01"],
      tierMix: { Basic: 1, Professional: 0, Premium: 1 },
      publishedBoothCount: 1,
      productCount: 3,
      paidAmount: 1000000,
      paymentStatus: "Paid"
    })
  })

  test("falls back to seller identity when company is missing", async () => {
    const workspace = await getPartnerExpoExhibitors(ids.partnerUser, ids.expo)

    const fallback = workspace?.exhibitors.find(
      (item) => item.id === ids.fallbackSeller
    )

    expect(fallback).toMatchObject({
      id: ids.fallbackSeller,
      displayName: "Fallback Seller",
      contactEmail: "fallback@test.local",
      boothCount: 1,
      paymentStatus: "Pending"
    })
  })

  test("blocks unassigned partner users", async () => {
    const workspace = await getPartnerExpoExhibitors(ids.outsiderUser, ids.expo)

    expect(workspace).toBeNull()
  })
})

describe("getPartnerExpoExhibitorDetail", () => {
  test("returns registrations and orders for selected exhibitor", async () => {
    const detail = await getPartnerExpoExhibitorDetail(
      ids.partnerUser,
      ids.expo,
      ids.company
    )

    expect(detail?.exhibitor.displayName).toBe("Acme Exhibitor Co")
    expect(detail?.registrations.map((item) => item.id).sort()).toEqual([
      ids.regA,
      ids.regB
    ])
    expect(detail?.orders.map((item) => item.id).sort()).toEqual([
      ids.orderA,
      ids.orderB
    ])
  })

  test("returns null for unassigned partner users", async () => {
    const detail = await getPartnerExpoExhibitorDetail(
      ids.outsiderUser,
      ids.expo,
      ids.company
    )

    expect(detail).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify fail**

Run:

```bash
bun test lib/partner/expo-exhibitors.test.ts
```

Expected: fail because `getPartnerExpoExhibitors` and `getPartnerExpoExhibitorDetail` are not exported from `lib/partner/db.ts`.

- [ ] **Step 3: Commit failing tests**

```bash
git add lib/partner/expo-exhibitors.test.ts
git commit -m "test: cover partner expo exhibitors"
```

---

### Task 2: Partner exhibitor data helpers

**Files:**
- Modify: `lib/partner/db.ts`
- Test: `lib/partner/expo-exhibitors.test.ts`

- [ ] **Step 1: Add exported types near `PartnerExpoOperationsDetail`**

In `lib/partner/db.ts`, after `PartnerExpoOperationsDetail`, add:

```ts
export type PartnerExpoExhibitorPaymentStatus = "Paid" | "Pending" | "No order"

export type PartnerExpoExhibitorTierMix = {
  Basic: number
  Professional: number
  Premium: number
}

export type PartnerExpoExhibitorListItem = {
  id: string
  displayName: string
  contactName: string | null
  contactEmail: string | null
  phone: string | null
  website: string | null
  address: string | null
  industry: string | null
  taxId: string | null
  logoUrl: string | null
  boothCount: number
  boothRefs: string[]
  tierMix: PartnerExpoExhibitorTierMix
  registrationStatuses: string[]
  publishedBoothCount: number
  productCount: number
  paidAmount: number
  paymentStatus: PartnerExpoExhibitorPaymentStatus
  latestPurchasedAt: string | null
}

export type PartnerExpoExhibitorsWorkspace = {
  summary: {
    exhibitorCount: number
    boothCount: number
    publishedBoothCount: number
    paidAmount: number
  }
  exhibitors: PartnerExpoExhibitorListItem[]
  topExhibitors: PartnerExpoExhibitorListItem[]
}

export type PartnerExpoExhibitorRegistration = {
  id: string
  boothRef: string
  boothTier: string
  status: string
  publishStatus: string | null
  productCount: number
  purchasedAt: string
}

export type PartnerExpoExhibitorOrder = {
  id: string
  registrationId: string | null
  boothRef: string | null
  boothTier: string | null
  paymentMethod: string
  status: string
  originalAmount: number
  discountAmount: number
  amount: number
  createdAt: string
  updatedAt: string
}

export type PartnerExpoExhibitorDetail = {
  exhibitor: PartnerExpoExhibitorListItem
  registrations: PartnerExpoExhibitorRegistration[]
  orders: PartnerExpoExhibitorOrder[]
}
```

- [ ] **Step 2: Add helper functions before `getPartnerExpoOperationsDetail`**

Add:

```ts
async function getAssignedPartnerExpoName(userId: string, expoId: string) {
  const rows = (await sql`
    select e.id, e.name
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    where pm.user_id = ${userId}
      and e.id = ${expoId}
      and pm.status = 'active'
      and po.status = 'active'
    limit 1
  `) as { id: string; name: string }[]

  return rows[0] ?? null
}

function normalizePartnerBoothTier(tier: string | null): keyof PartnerExpoExhibitorTierMix {
  if (tier && ["pro", "professional"].includes(tier.toLowerCase())) {
    return "Professional"
  }
  if (tier?.toLowerCase() === "premium") return "Premium"
  return "Basic"
}

function resolvePartnerPaymentStatus(input: {
  paidOrderCount: number
  orderCount: number
}): PartnerExpoExhibitorPaymentStatus {
  if (input.paidOrderCount > 0) return "Paid"
  if (input.orderCount > 0) return "Pending"
  return "No order"
}
```

- [ ] **Step 3: Add list helper**

Add before `getPartnerExpoOperationsDetail`:

```ts
export async function getPartnerExpoExhibitors(
  userId: string,
  expoId: string
): Promise<PartnerExpoExhibitorsWorkspace | null> {
  const assigned = await getAssignedPartnerExpoName(userId, expoId)
  if (!assigned) return null

  const rows = (await sql`
    with registration_rows as (
      select
        sbr.id,
        sbr.user_id,
        sbr.booth_ref,
        sbr.booth_tier,
        sbr.status,
        sbr.purchased_at,
        u.name as user_name,
        u.email as user_email,
        u.phone,
        u.website as user_website,
        u.location,
        u.company_id,
        u.industry,
        c.name as company_name,
        c.tax_id,
        c.logo_url,
        c.website as company_website,
        c.address as company_address,
        bc.publish_status,
        coalesce(jsonb_array_length(coalesce(bc.products, '[]'::jsonb)), 0)::int as product_count
      from seller_booth_registrations sbr
      inner join users u on u.id = sbr.user_id
      left join companies c on c.id = u.company_id
      left join booth_customizations bc on bc.registration_id = sbr.id
      where sbr.expo_id = ${expoId}
    ),
    matched_orders as (
      select distinct on (o.id, rr.id)
        rr.id as registration_id,
        o.id,
        o.status,
        o.amount
      from registration_rows rr
      inner join orders o on
        o.reference_id = rr.id
        or (
          o.expo_name = ${assigned.name}
          and o.booth_ref = rr.booth_ref
        )
      where o.order_type = 'booth_registration'
    )
    select
      coalesce(rr.company_id, rr.user_id) as exhibitor_id,
      coalesce(max(rr.company_name), max(rr.user_name), max(rr.user_email)) as display_name,
      min(rr.user_name) as contact_name,
      min(rr.user_email) as contact_email,
      min(rr.phone) as phone,
      coalesce(max(rr.company_website), max(rr.user_website)) as website,
      coalesce(max(rr.company_address), max(rr.location)) as address,
      max(rr.industry) as industry,
      max(rr.tax_id) as tax_id,
      max(rr.logo_url) as logo_url,
      count(distinct rr.id)::int as booth_count,
      array_agg(distinct rr.booth_ref order by rr.booth_ref) as booth_refs,
      count(distinct rr.id) filter (where lower(rr.booth_tier) not in ('pro', 'professional', 'premium'))::int as basic_count,
      count(distinct rr.id) filter (where lower(rr.booth_tier) in ('pro', 'professional'))::int as professional_count,
      count(distinct rr.id) filter (where lower(rr.booth_tier) = 'premium')::int as premium_count,
      array_agg(distinct rr.status order by rr.status) as registration_statuses,
      count(distinct rr.id) filter (where rr.publish_status = 'Published')::int as published_booth_count,
      coalesce(sum(rr.product_count), 0)::int as product_count,
      coalesce(sum(mo.amount) filter (where mo.status = 'Paid'), 0)::numeric as paid_amount,
      count(distinct mo.id)::int as order_count,
      count(distinct mo.id) filter (where mo.status = 'Paid')::int as paid_order_count,
      max(rr.purchased_at) as latest_purchased_at
    from registration_rows rr
    left join matched_orders mo on mo.registration_id = rr.id
    group by coalesce(rr.company_id, rr.user_id)
    order by booth_count desc, paid_amount desc, display_name asc
  `) as {
    exhibitor_id: string
    display_name: string
    contact_name: string | null
    contact_email: string | null
    phone: string | null
    website: string | null
    address: string | null
    industry: string | null
    tax_id: string | null
    logo_url: string | null
    booth_count: number | string
    booth_refs: string[]
    basic_count: number | string
    professional_count: number | string
    premium_count: number | string
    registration_statuses: string[]
    published_booth_count: number | string
    product_count: number | string
    paid_amount: number | string
    order_count: number | string
    paid_order_count: number | string
    latest_purchased_at: string | Date | null
  }[]

  const exhibitors = rows.map((row) => ({
    id: row.exhibitor_id,
    displayName: row.display_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    phone: row.phone,
    website: row.website,
    address: row.address,
    industry: row.industry,
    taxId: row.tax_id,
    logoUrl: row.logo_url,
    boothCount: toNumber(row.booth_count),
    boothRefs: row.booth_refs,
    tierMix: {
      Basic: toNumber(row.basic_count),
      Professional: toNumber(row.professional_count),
      Premium: toNumber(row.premium_count)
    },
    registrationStatuses: row.registration_statuses,
    publishedBoothCount: toNumber(row.published_booth_count),
    productCount: toNumber(row.product_count),
    paidAmount: toNumber(row.paid_amount),
    paymentStatus: resolvePartnerPaymentStatus({
      paidOrderCount: toNumber(row.paid_order_count),
      orderCount: toNumber(row.order_count)
    }),
    latestPurchasedAt: row.latest_purchased_at
      ? toIso(row.latest_purchased_at)
      : null
  }))

  return {
    summary: {
      exhibitorCount: exhibitors.length,
      boothCount: exhibitors.reduce((sum, item) => sum + item.boothCount, 0),
      publishedBoothCount: exhibitors.reduce(
        (sum, item) => sum + item.publishedBoothCount,
        0
      ),
      paidAmount: exhibitors.reduce((sum, item) => sum + item.paidAmount, 0)
    },
    exhibitors,
    topExhibitors: exhibitors.slice(0, 5)
  }
}
```

- [ ] **Step 4: Add detail helper**

Add after `getPartnerExpoExhibitors`:

```ts
export async function getPartnerExpoExhibitorDetail(
  userId: string,
  expoId: string,
  exhibitorId: string
): Promise<PartnerExpoExhibitorDetail | null> {
  const workspace = await getPartnerExpoExhibitors(userId, expoId)
  if (!workspace) return null

  const exhibitor = workspace.exhibitors.find((item) => item.id === exhibitorId)
  if (!exhibitor) return null

  const assigned = await getAssignedPartnerExpoName(userId, expoId)
  if (!assigned) return null

  const registrationRows = (await sql`
    select
      sbr.id,
      sbr.booth_ref,
      sbr.booth_tier,
      sbr.status,
      sbr.purchased_at,
      bc.publish_status,
      coalesce(jsonb_array_length(coalesce(bc.products, '[]'::jsonb)), 0)::int as product_count
    from seller_booth_registrations sbr
    inner join users u on u.id = sbr.user_id
    left join booth_customizations bc on bc.registration_id = sbr.id
    where sbr.expo_id = ${expoId}
      and coalesce(u.company_id, u.id) = ${exhibitorId}
    order by sbr.purchased_at desc
  `) as {
    id: string
    booth_ref: string
    booth_tier: string
    status: string
    purchased_at: string | Date
    publish_status: string | null
    product_count: number | string
  }[]

  const orderRows = (await sql`
    with selected_registrations as (
      select sbr.id, sbr.booth_ref
      from seller_booth_registrations sbr
      inner join users u on u.id = sbr.user_id
      where sbr.expo_id = ${expoId}
        and coalesce(u.company_id, u.id) = ${exhibitorId}
    )
    select distinct on (o.id)
      o.id,
      sr.id as registration_id,
      o.booth_ref,
      o.booth_tier,
      o.payment_method,
      o.status,
      o.original_amount,
      o.discount_amount,
      o.amount,
      o.created_at,
      o.updated_at
    from selected_registrations sr
    inner join orders o on
      o.reference_id = sr.id
      or (
        o.expo_name = ${assigned.name}
        and o.booth_ref = sr.booth_ref
      )
    where o.order_type = 'booth_registration'
    order by o.id, o.created_at desc
  `) as {
    id: string
    registration_id: string | null
    booth_ref: string | null
    booth_tier: string | null
    payment_method: string
    status: string
    original_amount: number | string
    discount_amount: number | string
    amount: number | string
    created_at: string | Date
    updated_at: string | Date
  }[]

  return {
    exhibitor,
    registrations: registrationRows.map((row) => ({
      id: row.id,
      boothRef: row.booth_ref,
      boothTier: normalizePartnerBoothTier(row.booth_tier),
      status: row.status,
      publishStatus: row.publish_status,
      productCount: toNumber(row.product_count),
      purchasedAt: toIso(row.purchased_at)
    })),
    orders: orderRows.map((row) => ({
      id: row.id,
      registrationId: row.registration_id,
      boothRef: row.booth_ref,
      boothTier: row.booth_tier,
      paymentMethod: row.payment_method,
      status: row.status,
      originalAmount: toNumber(row.original_amount),
      discountAmount: toNumber(row.discount_amount),
      amount: toNumber(row.amount),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at)
    }))
  }
}
```

- [ ] **Step 5: Run targeted tests**

Run:

```bash
bun test lib/partner/expo-exhibitors.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit data helpers**

```bash
git add lib/partner/db.ts lib/partner/expo-exhibitors.test.ts
git commit -m "feat: add partner expo exhibitor data"
```

---

### Task 3: Overview teaser component

**Files:**
- Create: `components/partner/partner-expo-exhibitors-overview-card.tsx`
- Modify later: `components/partner/partner-expo-detail-overview.tsx`

- [ ] **Step 1: Create overview card component**

Create `components/partner/partner-expo-exhibitors-overview-card.tsx`:

```tsx
import { ArrowRightIcon, Building2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import type { PartnerExpoExhibitorsWorkspace } from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

export function PartnerExpoExhibitorsOverviewCard({
  workspace,
  onViewAll
}: {
  workspace: PartnerExpoExhibitorsWorkspace
  onViewAll?: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Top Exhibitors</CardTitle>
            <CardDescription>
              {numberFormat.format(workspace.summary.exhibitorCount)} exhibitors ·{" "}
              {numberFormat.format(workspace.summary.boothCount)} booths ·{" "}
              {currencyFormat.format(workspace.summary.paidAmount)} paid
            </CardDescription>
          </div>
          {onViewAll ? (
            <Button size="sm" variant="outline" onClick={onViewAll}>
              View all
              <ArrowRightIcon />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {workspace.topExhibitors.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
            No exhibitors yet.
          </div>
        ) : (
          workspace.topExhibitors.map((exhibitor) => (
            <div
              key={exhibitor.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building2Icon className="h-4 w-4 text-muted-foreground" />
                  <p className="truncate font-medium text-sm">
                    {exhibitor.displayName}
                  </p>
                </div>
                <p className="truncate text-muted-foreground text-xs">
                  {exhibitor.contactEmail ?? "No contact email"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">
                  {numberFormat.format(exhibitor.boothCount)} booths
                </Badge>
                <span className="font-mono text-muted-foreground text-xs tabular-nums">
                  {currencyFormat.format(exhibitor.paidAmount)}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit overview component**

```bash
git add components/partner/partner-expo-exhibitors-overview-card.tsx
git commit -m "feat: add expo exhibitors overview card"
```

---

### Task 4: Exhibitors table component

**Files:**
- Create: `components/partner/partner-expo-exhibitors-table.tsx`

- [ ] **Step 1: Create client table component**

Create `components/partner/partner-expo-exhibitors-table.tsx`:

```tsx
"use client"

import { SearchIcon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { PartnerExpoExhibitorsWorkspace } from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

function formatDate(iso: string | null) {
  if (!iso) return "No purchase date"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

export function PartnerExpoExhibitorsTable({
  expoId,
  workspace
}: {
  expoId: string
  workspace: PartnerExpoExhibitorsWorkspace
}) {
  const [query, setQuery] = useState("")
  const [tier, setTier] = useState("all")
  const [registrationStatus, setRegistrationStatus] = useState("all")
  const [paymentStatus, setPaymentStatus] = useState("all")

  const registrationStatusOptions = useMemo(() => {
    return Array.from(
      new Set(workspace.exhibitors.flatMap((item) => item.registrationStatuses))
    ).sort()
  }, [workspace.exhibitors])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return workspace.exhibitors.filter((exhibitor) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          exhibitor.displayName,
          exhibitor.contactName,
          exhibitor.contactEmail,
          exhibitor.website,
          exhibitor.address
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery))

      const matchesTier =
        tier === "all" ||
        exhibitor.tierMix[tier as keyof typeof exhibitor.tierMix] > 0

      const matchesRegistrationStatus =
        registrationStatus === "all" ||
        exhibitor.registrationStatuses.includes(registrationStatus)

      const matchesPaymentStatus =
        paymentStatus === "all" || exhibitor.paymentStatus === paymentStatus

      return (
        matchesQuery &&
        matchesTier &&
        matchesRegistrationStatus &&
        matchesPaymentStatus
      )
    })
  }, [paymentStatus, query, registrationStatus, tier, workspace.exhibitors])

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Exhibitors" value={workspace.summary.exhibitorCount} />
        <MetricCard title="Booths purchased" value={workspace.summary.boothCount} />
        <MetricCard
          title="Published booths"
          value={workspace.summary.publishedBoothCount}
        />
        <MetricCard
          title="Paid revenue"
          value={currencyFormat.format(workspace.summary.paidAmount)}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Exhibitors</CardTitle>
          <CardDescription>
            Businesses participating in this expo and their commercial status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company or contact"
                className="pl-9"
              />
            </div>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={registrationStatus}
              onValueChange={setRegistrationStatus}
            >
              <SelectTrigger><SelectValue placeholder="Registration" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All registrations</SelectItem>
                {registrationStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="No order">No order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {workspace.exhibitors.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
              No booth registrations for this expo yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Booths</TableHead>
                  <TableHead>Booth refs</TableHead>
                  <TableHead>Tier mix</TableHead>
                  <TableHead>Publish</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Latest purchase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((exhibitor) => (
                  <TableRow key={exhibitor.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/partner/expos/${expoId}/exhibitors/${exhibitor.id}`}
                        className="hover:underline"
                      >
                        {exhibitor.displayName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{exhibitor.contactName}</div>
                      <div className="text-muted-foreground text-xs">
                        {exhibitor.contactEmail}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(exhibitor.boothCount)}
                    </TableCell>
                    <TableCell className="max-w-44 truncate">
                      {exhibitor.boothRefs.join(", ")}
                    </TableCell>
                    <TableCell>
                      B {exhibitor.tierMix.Basic} · P {exhibitor.tierMix.Professional} · Pr {exhibitor.tierMix.Premium}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {numberFormat.format(exhibitor.publishedBoothCount)} / {numberFormat.format(exhibitor.boothCount)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          exhibitor.paymentStatus === "Paid"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {exhibitor.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {currencyFormat.format(exhibitor.paidAmount)}
                    </TableCell>
                    <TableCell>{formatDate(exhibitor.latestPurchasedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {typeof value === "number" ? numberFormat.format(value) : value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
```

- [ ] **Step 2: Commit table component**

```bash
git add components/partner/partner-expo-exhibitors-table.tsx
git commit -m "feat: add partner expo exhibitors table"
```

---

### Task 5: Wire tab state and overview teaser

**Files:**
- Create: `components/partner/partner-expo-detail-tabs.tsx`
- Modify: `components/partner/partner-expo-detail-overview.tsx`
- Modify: `app/(dashboard)/partner/expos/[expoId]/page.tsx`

- [ ] **Step 1: Modify overview component props and render teaser**

In `components/partner/partner-expo-detail-overview.tsx`, add imports:

```tsx
import type { PartnerExpoExhibitorsWorkspace } from "@/lib/partner/db"
import { PartnerExpoExhibitorsOverviewCard } from "./partner-expo-exhibitors-overview-card"
```

Update component signature:

```tsx
export function PartnerExpoDetailOverview({
  assignedExpo,
  operations,
  exhibitorsWorkspace,
  onViewAllExhibitors
}: {
  assignedExpo: PartnerAssignedExpo
  operations: PartnerExpoOperationsDetail
  exhibitorsWorkspace: PartnerExpoExhibitorsWorkspace
  onViewAllExhibitors?: () => void
}) {
```

In the section beginning `<section className="grid gap-4 xl:grid-cols-3">`, change first card class from `xl:col-span-2` to `xl:col-span-1`, then insert overview card after Operational Snapshot card:

```tsx
<PartnerExpoExhibitorsOverviewCard
  workspace={exhibitorsWorkspace}
  onViewAll={onViewAllExhibitors}
/>
```

- [ ] **Step 2: Create tab client wrapper**

Create `components/partner/partner-expo-detail-tabs.tsx`:

```tsx
"use client"

import { GoLIVEManager } from "@/components/tradexpo/golive-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  PartnerAssignedExpo,
  PartnerExpoExhibitorsWorkspace,
  PartnerExpoOperationsDetail
} from "@/lib/partner/db"
import type {
  GoLIVEEvent,
  StreamSession
} from "@/lib/tradexpo/db/platform-data"
import { PartnerExpoDetailOverview } from "./partner-expo-detail-overview"
import { PartnerExpoExhibitorsTable } from "./partner-expo-exhibitors-table"

export function PartnerExpoDetailTabs({
  expoId,
  assignedExpo,
  operations,
  exhibitorsWorkspace,
  initialGoLIVEEvents,
  initialStreamSessions
}: {
  expoId: string
  assignedExpo: PartnerAssignedExpo
  operations: PartnerExpoOperationsDetail
  exhibitorsWorkspace: PartnerExpoExhibitorsWorkspace
  initialGoLIVEEvents: GoLIVEEvent[]
  initialStreamSessions: StreamSession[]
}) {
  return (
    <Tabs defaultValue="overview" className="gap-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="golive">GoLIVE</TabsTrigger>
        <TabsTrigger value="exhibitors">Exhibitors</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <PartnerExpoDetailOverview
          assignedExpo={assignedExpo}
          operations={operations}
          exhibitorsWorkspace={exhibitorsWorkspace}
          onViewAllExhibitors={() => {
            const trigger = document.querySelector<HTMLButtonElement>(
              '[data-value="exhibitors"]'
            )
            trigger?.click()
          }}
        />
      </TabsContent>

      <TabsContent value="golive">
        <GoLIVEManager
          expoId={expoId}
          initialGoLIVEEvents={initialGoLIVEEvents}
          initialStreamSessions={initialStreamSessions}
        />
      </TabsContent>

      <TabsContent value="exhibitors">
        <PartnerExpoExhibitorsTable
          expoId={expoId}
          workspace={exhibitorsWorkspace}
        />
      </TabsContent>
    </Tabs>
  )
}
```

- [ ] **Step 3: Wire page to new wrapper**

In `app/(dashboard)/partner/expos/[expoId]/page.tsx`:

Remove imports:

```tsx
import { PartnerExpoDetailOverview } from "@/components/partner/partner-expo-detail-overview"
import { GoLIVEManager } from "@/components/tradexpo/golive-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
```

Add imports:

```tsx
import { PartnerExpoDetailTabs } from "@/components/partner/partner-expo-detail-tabs"
```

Add `getPartnerExpoExhibitors` to partner db import.

Change parallel fetch:

```tsx
const [operations, exhibitorsWorkspace, initialGoLIVEEvents, initialStreamSessions] =
  await Promise.all([
    getPartnerExpoOperationsDetail(userId, expoId),
    getPartnerExpoExhibitors(userId, expoId),
    listGoLIVEEvents(),
    listStreamSessions()
  ])

if (!operations || !exhibitorsWorkspace) notFound()
```

Replace existing `<Tabs>` block with:

```tsx
<PartnerExpoDetailTabs
  expoId={expoId}
  assignedExpo={assignedExpo}
  operations={operations}
  exhibitorsWorkspace={exhibitorsWorkspace}
  initialGoLIVEEvents={initialGoLIVEEvents}
  initialStreamSessions={initialStreamSessions}
/>
```

- [ ] **Step 4: Run typecheck**

```bash
bun typecheck
```

Expected: pass. If types fail for `GoLIVEEvent` or `StreamSession`, inspect exports in `lib/tradexpo/db/platform-data.ts` and import the actual exported type names.

- [ ] **Step 5: Commit tab wiring**

```bash
git add app/(dashboard)/partner/expos/[expoId]/page.tsx components/partner/partner-expo-detail-overview.tsx components/partner/partner-expo-detail-tabs.tsx
git commit -m "feat: show expo exhibitors in partner detail"
```

---

### Task 6: Exhibitor detail route and component

**Files:**
- Create: `components/partner/partner-expo-exhibitor-detail.tsx`
- Create: `app/(dashboard)/partner/expos/[expoId]/exhibitors/[exhibitorId]/page.tsx`

- [ ] **Step 1: Create detail component**

Create `components/partner/partner-expo-exhibitor-detail.tsx`:

```tsx
import { Building2Icon, ExternalLinkIcon, MailIcon, PhoneIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { PartnerExpoExhibitorDetail } from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function PartnerExpoExhibitorDetailView({
  detail
}: {
  detail: PartnerExpoExhibitorDetail
}) {
  const { exhibitor, registrations, orders } = detail

  return (
    <div className="space-y-4 px-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {exhibitor.logoUrl ? (
              <Image
                src={exhibitor.logoUrl}
                alt={exhibitor.displayName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2Icon className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h2 className="font-semibold text-2xl">{exhibitor.displayName}</h2>
              <p className="text-muted-foreground text-sm">
                {exhibitor.address ?? "No address"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {numberFormat.format(exhibitor.boothCount)} booths
              </Badge>
              <Badge variant="secondary">
                {numberFormat.format(exhibitor.productCount)} products
              </Badge>
              <Badge>{exhibitor.paymentStatus}</Badge>
            </div>
            <div className="grid gap-2 text-sm md:grid-cols-3">
              <Info label="Contact" value={exhibitor.contactName} />
              <Info label="Email" value={exhibitor.contactEmail} icon={<MailIcon />} />
              <Info label="Phone" value={exhibitor.phone} icon={<PhoneIcon />} />
              <Info label="Industry" value={exhibitor.industry} />
              <Info label="Tax ID" value={exhibitor.taxId} />
              <Info label="Paid amount" value={currencyFormat.format(exhibitor.paidAmount)} />
            </div>
          </div>
          {exhibitor.website ? (
            <Button asChild variant="outline" size="sm">
              <Link href={exhibitor.website} target="_blank" rel="noreferrer">
                Website
                <ExternalLinkIcon />
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Booth Registrations</CardTitle>
            <CardDescription>Purchased booths and publish readiness.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booth</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publish</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Purchased</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.boothRef}</TableCell>
                    <TableCell>{registration.boothTier}</TableCell>
                    <TableCell>{registration.status}</TableCell>
                    <TableCell>{registration.publishStatus ?? "No customization"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(registration.productCount)}
                    </TableCell>
                    <TableCell>{formatDateTime(registration.purchasedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Readiness</CardTitle>
            <CardDescription>Content and payment rollup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ReadinessRow label="Published booths" value={`${exhibitor.publishedBoothCount} / ${exhibitor.boothCount}`} />
            <ReadinessRow label="Products listed" value={numberFormat.format(exhibitor.productCount)} />
            <ReadinessRow label="Payment" value={exhibitor.paymentStatus} />
            <ReadinessRow label="Paid amount" value={currencyFormat.format(exhibitor.paidAmount)} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Commercial records matched to this exhibitor's booths.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
              No matched booth orders.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Booth</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell>{order.boothRef ?? "-"}</TableCell>
                    <TableCell>{order.paymentMethod}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell className="text-right tabular-nums">{currencyFormat.format(order.originalAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currencyFormat.format(order.discountAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currencyFormat.format(order.amount)}</TableCell>
                    <TableCell>{formatDateTime(order.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Info({
  label,
  value,
  icon
}: {
  label: string
  value: string | null
  icon?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="flex items-center gap-1 truncate font-medium">
        {icon ? <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span> : null}
        {value || "-"}
      </p>
    </div>
  )
}

function ReadinessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
```

- [ ] **Step 2: Create detail route**

Create `app/(dashboard)/partner/expos/[expoId]/exhibitors/[exhibitorId]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { PartnerExpoExhibitorDetailView } from "@/components/partner/partner-expo-exhibitor-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import {
  getPartnerAssignedExpo,
  getPartnerExpoExhibitorDetail
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerExpoExhibitorDetailPage({
  params
}: {
  params: Promise<{ expoId: string; exhibitorId: string }>
}) {
  const { expoId, exhibitorId } = await params
  await ensurePlatformSchema()
  const userId = await requireRole("partner")

  const [assignedExpo, detail] = await Promise.all([
    getPartnerAssignedExpo(userId, expoId),
    getPartnerExpoExhibitorDetail(userId, expoId, exhibitorId)
  ])

  if (!assignedExpo || !detail) notFound()

  return (
    <DashboardShell
      title={detail.exhibitor.displayName}
      description={`Exhibitor details for ${assignedExpo.expo.name}`}
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Expo Programs", href: "/partner/expos" },
        { label: assignedExpo.expo.name, href: `/partner/expos/${expoId}` },
        { label: detail.exhibitor.displayName }
      ]}
      showBackButton
    >
      <PartnerExpoExhibitorDetailView detail={detail} />
    </DashboardShell>
  )
}
```

- [ ] **Step 3: Run typecheck**

```bash
bun typecheck
```

Expected: pass.

- [ ] **Step 4: Commit detail route**

```bash
git add components/partner/partner-expo-exhibitor-detail.tsx app/(dashboard)/partner/expos/[expoId]/exhibitors/[exhibitorId]/page.tsx
git commit -m "feat: add partner exhibitor detail page"
```

---

### Task 7: Full verification and browser smoke test

**Files:**
- No planned file changes unless verification reveals bugs.

- [ ] **Step 1: Run targeted tests**

```bash
bun test lib/partner/expo-exhibitors.test.ts
```

Expected: pass.

- [ ] **Step 2: Run typecheck**

```bash
bun typecheck
```

Expected: pass.

- [ ] **Step 3: Start dev server**

```bash
bun dev
```

Expected: Next.js starts on `NEXT_PUBLIC_PORT` or `1995` per project config.

- [ ] **Step 4: Browser smoke test**

Use Chrome DevTools MCP or browser manually:

1. Open Partner Portal expo detail page for an assigned expo.
2. Confirm Overview shows “Top Exhibitors”.
3. Click “View all”; confirm Exhibitors tab opens.
4. Search by company/contact; confirm table filters.
5. Filter payment status `Paid`; confirm rows update.
6. Click exhibitor row; confirm detail route loads.
7. Confirm detail route shows company profile, booth registrations, orders, and readiness.

- [ ] **Step 5: Fix any verification bugs**

If browser or tests reveal bugs, make minimal fixes in touched files only. Re-run the failed command plus `bun typecheck`.

- [ ] **Step 6: Final status**

Report exact commands run and results. Do not claim browser verification if it was skipped.

---

## Self-review

- Spec coverage: plan covers existing-schema query helpers, partner access guard, overview teaser, Exhibitors tab, detail route, empty states, missing company fallback, payment rules, targeted tests, typecheck, and browser smoke test.
- Placeholder scan: no TBD/TODO/fill-in instructions. Each code-writing step includes concrete code.
- Type consistency: exported type names used by components match Task 2 definitions. Route/helper names match spec.
