# Partner Portal Core US Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement first 8 Partner Portal core user stories with Admin Portal control-plane support, using Arobid users + Partner Organization memberships as source of truth.

**Architecture:** Add canonical Partner Organization governance domain in `lib/partner`, enforce access by membership + capability + scope, then wire Admin Portal pages/APIs and Partner Portal MVP modules to those guards. Keep deferred Partner modules hidden and server-blocked instead of deleting broad legacy code in first pass.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun, Neon SQL helper, shadcn/ui, Biome.

---

## File Structure

- Modify: `lib/platform/ensure-schema.ts` — create/extend Partner governance tables and seed minimal demo records.
- Create: `lib/partner/core.ts` — canonical types, role/capability/module maps, lifecycle constants, pure helpers.
- Create: `lib/partner/core.test.ts` — tests for role/capability/module visibility and mini-site lifecycle.
- Modify: `lib/partner/access.ts` — replace legacy tab/action access with canonical module/action/scope guards.
- Create: `lib/partner/admin.ts` — Admin control-plane data/mutation helpers for organizations, memberships, capabilities, scopes, mini-site review.
- Create: `lib/partner/admin.test.ts` — pure input/lifecycle helper tests for Admin workflows.
- Create: `components/admin/partner/partner-organization-admin.tsx` — Admin Partner Organization management UI.
- Create: `components/admin/partner/partner-mini-site-review.tsx` — Admin mini-site review UI.
- Create: `app/(dashboard)/admin/partners/page.tsx` — Admin Partner control-plane page.
- Create: `app/(dashboard)/admin/partners/[partnerOrgId]/page.tsx` — Admin Partner detail page.
- Create: `app/(dashboard)/admin/partners/[partnerOrgId]/mini-site/page.tsx` — Admin mini-site review page.
- Create: `app/api/admin/partners/route.ts` — Admin create/list Partner Organizations API.
- Create: `app/api/admin/partners/[partnerOrgId]/memberships/route.ts` — Admin invite/list memberships API.
- Create: `app/api/admin/partners/[partnerOrgId]/memberships/[userId]/route.ts` — Admin role/status mutation API.
- Create: `app/api/admin/partners/[partnerOrgId]/capabilities/route.ts` — Admin capability/scope assignment API.
- Create: `app/api/admin/partners/[partnerOrgId]/mini-site/review/route.ts` — Admin publish/reject mini-site API.
- Modify: `components/app-sidebar.tsx` — change Partner portal label/copy away from Expo Owner-only.
- Modify: `components/nav-partner.tsx` — use canonical MVP modules and hide deferred modules.
- Modify: `app/(dashboard)/partner/layout.tsx` — use canonical access and organization display.
- Modify: `app/(dashboard)/partner/site-management/page.tsx` — use `mini_site` module guard.
- Modify: `components/partner/partner-site-management-manager.tsx` — split behavior into draft/save/submit/read-only states using canonical mini-site lifecycle.
- Create: `app/api/partner/mini-site/route.ts` — Partner save/submit mini-site draft API.
- Create: `app/api/partner/mini-site/preview/route.ts` — Partner preview version API.
- Modify: deferred Partner pages under `app/(dashboard)/partner/{bundles,communications,finance,government}/page.tsx` — server-block with notFound or forbidden message.

## Task 1: Canonical Partner core domain

**Files:**
- Create: `lib/partner/core.ts`
- Create: `lib/partner/core.test.ts`

- [ ] **Step 1: Write failing core domain tests**

Create `lib/partner/core.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import {
  canTransitionMiniSiteStatus,
  getPartnerModuleVisibility,
  isPartnerRoleReadOnly,
  normalizePartnerRole,
  type PartnerCapability,
  type PartnerMembershipRole,
  type PartnerModule,
  type PartnerScopeSummary
} from "./core"

describe("partner core domain", () => {
  test("normalizes legacy roles to MVP roles", () => {
    expect(normalizePartnerRole("primary_representative")).toBe("partner_owner")
    expect(normalizePartnerRole("admin")).toBe("partner_admin")
    expect(normalizePartnerRole("operator")).toBe("viewer")
    expect(normalizePartnerRole("viewer")).toBe("viewer")
  })

  test("viewer is read-only", () => {
    expect(isPartnerRoleReadOnly("viewer")).toBe(true)
    expect(isPartnerRoleReadOnly("partner_owner")).toBe(false)
    expect(isPartnerRoleReadOnly("partner_admin")).toBe(false)
  })

  test("module visibility requires capabilities and scope", () => {
    const capabilities: PartnerCapability[] = [
      "overview",
      "mini_site",
      "enterprise_association",
      "expo_programs",
      "tradecredit_reporting",
      "analytics_reporting"
    ]
    const scoped: PartnerScopeSummary = {
      expoIds: ["expo-1"],
      programIds: [],
      companyIds: []
    }
    const visible = getPartnerModuleVisibility({
      organizationModel: "tenant",
      role: "partner_admin",
      capabilities,
      scopes: scoped
    })

    expect(visible.overview).toBe(true)
    expect(visible.mini_site).toBe(true)
    expect(visible.enterprises).toBe(true)
    expect(visible.expo_programs).toBe(true)
    expect(visible.tradecredit_reports).toBe(true)
    expect(visible.analytics_reports).toBe(true)
    expect(visible.bundles).toBe(false)
    expect(visible.communications).toBe(false)
    expect(visible.finance).toBe(false)
    expect(visible.government).toBe(false)
  })

  test("mini-site hidden for non-tenant organizations", () => {
    const visible = getPartnerModuleVisibility({
      organizationModel: "co_host",
      role: "partner_owner",
      capabilities: ["overview", "mini_site"],
      scopes: { expoIds: [], programIds: [], companyIds: [] }
    })

    expect(visible.overview).toBe(true)
    expect(visible.mini_site).toBe(false)
  })

  test("expo programs require assigned scope", () => {
    const visible = getPartnerModuleVisibility({
      organizationModel: "tenant",
      role: "partner_admin",
      capabilities: ["overview", "expo_programs"],
      scopes: { expoIds: [], programIds: [], companyIds: [] }
    })

    expect(visible.expo_programs).toBe(false)
  })

  test("mini-site lifecycle follows review workflow", () => {
    expect(canTransitionMiniSiteStatus("draft", "submitted", "partner_admin")).toBe(true)
    expect(canTransitionMiniSiteStatus("submitted", "published", "partner_admin")).toBe(false)
    expect(canTransitionMiniSiteStatus("submitted", "published", "sys_admin")).toBe(true)
    expect(canTransitionMiniSiteStatus("submitted", "rejected", "sys_admin")).toBe(true)
    expect(canTransitionMiniSiteStatus("rejected", "draft", "partner_owner")).toBe(true)
    expect(canTransitionMiniSiteStatus("published", "draft_update", "partner_admin")).toBe(true)
  })
})
```

- [ ] **Step 2: Run failing tests**

Run: `bun test lib/partner/core.test.ts`

Expected: FAIL with module not found for `./core`.

- [ ] **Step 3: Implement canonical domain helpers**

Create `lib/partner/core.ts`:

```ts
export type PartnerModel = "co_host" | "turnkey" | "tenant"

export type PartnerType =
  | "strategic_partner"
  | "expo_partner"
  | "distribution_partner"
  | "alliance_partner"
  | "government_program_partner"

export type PartnerMembershipRole =
  | "primary_representative"
  | "admin"
  | "operator"
  | "analyst"
  | "partner_owner"
  | "partner_admin"
  | "program_manager"
  | "business_manager"
  | "operations"
  | "finance"
  | "viewer"

export type PartnerMvpRole = "partner_owner" | "partner_admin" | "viewer"
export type MiniSiteActorRole = PartnerMvpRole | "sys_admin"

export type PartnerCapability =
  | "overview"
  | "mini_site"
  | "enterprise_association"
  | "expo_programs"
  | "tradecredit_reporting"
  | "analytics_reporting"

export type PartnerModule =
  | "overview"
  | "mini_site"
  | "enterprises"
  | "expo_programs"
  | "tradecredit_reports"
  | "analytics_reports"
  | "bundles"
  | "communications"
  | "finance"
  | "government"

export type PartnerMiniSiteStatus =
  | "draft"
  | "submitted"
  | "rejected"
  | "published"
  | "draft_update"

export type PartnerScopeSummary = {
  expoIds: string[]
  programIds: string[]
  companyIds: string[]
}

export const partnerMvpCapabilities: PartnerCapability[] = [
  "overview",
  "mini_site",
  "enterprise_association",
  "expo_programs",
  "tradecredit_reporting",
  "analytics_reporting"
]

export const partnerModules: PartnerModule[] = [
  "overview",
  "mini_site",
  "enterprises",
  "expo_programs",
  "tradecredit_reports",
  "analytics_reports",
  "bundles",
  "communications",
  "finance",
  "government"
]

export function normalizePartnerRole(role: PartnerMembershipRole): PartnerMvpRole {
  if (role === "partner_owner" || role === "primary_representative") {
    return "partner_owner"
  }

  if (role === "partner_admin" || role === "admin") {
    return "partner_admin"
  }

  return "viewer"
}

export function isPartnerRoleReadOnly(role: PartnerMvpRole) {
  return role === "viewer"
}

function hasAnyScope(scopes: PartnerScopeSummary) {
  return (
    scopes.expoIds.length > 0 ||
    scopes.programIds.length > 0 ||
    scopes.companyIds.length > 0
  )
}

export function getPartnerModuleVisibility(input: {
  organizationModel: PartnerModel
  role: PartnerMvpRole
  capabilities: PartnerCapability[]
  scopes: PartnerScopeSummary
}): Record<PartnerModule, boolean> {
  const capabilities = new Set(input.capabilities)
  const visible = Object.fromEntries(
    partnerModules.map((module) => [module, false])
  ) as Record<PartnerModule, boolean>

  visible.overview = capabilities.has("overview")
  visible.mini_site =
    input.organizationModel === "tenant" && capabilities.has("mini_site")
  visible.enterprises = capabilities.has("enterprise_association")
  visible.expo_programs =
    capabilities.has("expo_programs") && hasAnyScope(input.scopes)
  visible.tradecredit_reports = capabilities.has("tradecredit_reporting")
  visible.analytics_reports = capabilities.has("analytics_reporting")

  return visible
}

export function canTransitionMiniSiteStatus(
  from: PartnerMiniSiteStatus,
  to: PartnerMiniSiteStatus,
  actorRole: MiniSiteActorRole
) {
  const partnerCanWrite = actorRole === "partner_owner" || actorRole === "partner_admin"
  const adminCanReview = actorRole === "sys_admin"

  if (partnerCanWrite) {
    return (
      (from === "draft" && to === "submitted") ||
      (from === "rejected" && to === "draft") ||
      (from === "published" && to === "draft_update") ||
      (from === "draft_update" && to === "submitted")
    )
  }

  if (adminCanReview) {
    return from === "submitted" && (to === "published" || to === "rejected")
  }

  return false
}
```

- [ ] **Step 4: Run core tests**

Run: `bun test lib/partner/core.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/partner/core.ts lib/partner/core.test.ts
git commit -m "feat: add partner core domain"
```

## Task 2: Partner schema for governance and mini-sites

**Files:**
- Modify: `lib/platform/ensure-schema.ts`

- [ ] **Step 1: Add failing schema assertion test by extending existing test**

Open `lib/platform/ensure-schema.test.ts`. Add these assertions to the test that checks Partner schema SQL output or add a new test using the same helper pattern already in that file:

```ts
expect(sqlText).toContain("create table if not exists partner_capability_assignments")
expect(sqlText).toContain("create table if not exists partner_scope_assignments")
expect(sqlText).toContain("create table if not exists partner_mini_sites")
expect(sqlText).toContain("create table if not exists partner_mini_site_review_events")
expect(sqlText).toContain("check (status in ('draft', 'submitted', 'rejected', 'published', 'draft_update'))")
```

- [ ] **Step 2: Run failing schema test**

Run: `bun test lib/platform/ensure-schema.test.ts`

Expected: FAIL because new table strings are absent.

- [ ] **Step 3: Add schema DDL**

In `lib/platform/ensure-schema.ts`, after current `partner_memberships` table/index DDL, add:

```ts
  await sql`
    create table if not exists partner_capability_assignments (
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      capability text not null,
      granted_by_user_id text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      primary key (partner_org_id, capability)
    )
  `

  await sql`
    do $$ begin
      alter table partner_capability_assignments
      add constraint partner_capability_assignments_capability_ck
      check (capability in (
        'overview',
        'mini_site',
        'enterprise_association',
        'expo_programs',
        'tradecredit_reporting',
        'analytics_reporting'
      ));
    exception when duplicate_object then null;
    end $$;
  `

  await sql`
    create table if not exists partner_scope_assignments (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      scope_type text not null,
      scope_id text not null,
      assigned_by_user_id text references users(id) on delete set null,
      status text not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    do $$ begin
      alter table partner_scope_assignments
      add constraint partner_scope_assignments_scope_type_ck
      check (scope_type in ('expo', 'program', 'company'));
    exception when duplicate_object then null;
    end $$;
  `

  await sql`
    do $$ begin
      alter table partner_scope_assignments
      add constraint partner_scope_assignments_status_ck
      check (status in ('active', 'inactive'));
    exception when duplicate_object then null;
    end $$;
  `

  await sql`
    create unique index if not exists idx_partner_scope_unique_active
    on partner_scope_assignments (partner_org_id, scope_type, scope_id)
    where status = 'active'
  `

  await sql`
    create table if not exists partner_mini_sites (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      version_label text not null,
      status text not null,
      content_json jsonb not null default '{}'::jsonb,
      submitted_by_user_id text references users(id) on delete set null,
      submitted_at timestamptz,
      published_by_user_id text references users(id) on delete set null,
      published_at timestamptz,
      rejected_by_user_id text references users(id) on delete set null,
      rejected_at timestamptz,
      reject_reason text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    do $$ begin
      alter table partner_mini_sites
      add constraint partner_mini_sites_status_ck
      check (status in ('draft', 'submitted', 'rejected', 'published', 'draft_update'));
    exception when duplicate_object then null;
    end $$;
  `

  await sql`
    create unique index if not exists idx_partner_mini_sites_one_published
    on partner_mini_sites (partner_org_id)
    where status = 'published'
  `

  await sql`
    create table if not exists partner_mini_site_review_events (
      id text primary key,
      mini_site_id text not null references partner_mini_sites(id) on delete cascade,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      from_status text,
      to_status text not null,
      actor_user_id text references users(id) on delete set null,
      reason text,
      created_at timestamptz not null default now()
    )
  `
```

- [ ] **Step 4: Seed demo capabilities and scope**

Near existing Partner seed inserts in `lib/platform/ensure-schema.ts`, add idempotent inserts:

```ts
  await sql`
    insert into partner_capability_assignments (
      partner_org_id,
      capability,
      granted_by_user_id
    )
    select
      po.id,
      capability,
      po.primary_user_id
    from partner_organizations po
    cross join unnest(array[
      'overview',
      'mini_site',
      'enterprise_association',
      'expo_programs',
      'tradecredit_reporting',
      'analytics_reporting'
    ]::text[]) as capability
    on conflict (partner_org_id, capability) do nothing
  `

  await sql`
    insert into partner_scope_assignments (
      id,
      partner_org_id,
      scope_type,
      scope_id,
      assigned_by_user_id
    )
    select
      'partner-scope-' || po.id || '-' || e.id,
      po.id,
      'expo',
      e.id,
      po.primary_user_id
    from partner_organizations po
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    on conflict do nothing
  `
```

- [ ] **Step 5: Run schema tests**

Run: `bun test lib/platform/ensure-schema.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add lib/platform/ensure-schema.ts lib/platform/ensure-schema.test.ts
git commit -m "feat: add partner governance schema"
```

## Task 3: Canonical Partner access guard

**Files:**
- Modify: `lib/partner/access.ts`
- Create: `lib/partner/access.test.ts`

- [ ] **Step 1: Write access mapping tests**

Create `lib/partner/access.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { buildPartnerAccess } from "./access"

describe("partner access", () => {
  test("builds MVP module visibility from membership, capabilities, and scopes", () => {
    const access = buildPartnerAccess({
      organization: {
        id: "partner-1",
        name: "Tenant Partner",
        model: "tenant",
        partnerType: "expo_partner",
        status: "active",
        primaryUserId: "user-1",
        membershipRole: "partner_admin"
      },
      capabilities: [
        "overview",
        "mini_site",
        "enterprise_association",
        "expo_programs",
        "tradecredit_reporting",
        "analytics_reporting"
      ],
      scopes: { expoIds: ["expo-1"], programIds: [], companyIds: [] }
    })

    expect(access.role).toBe("partner_admin")
    expect(access.readOnly).toBe(false)
    expect(access.modules.mini_site).toBe(true)
    expect(access.modules.expo_programs).toBe(true)
    expect(access.modules.bundles).toBe(false)
  })

  test("viewer access is read-only", () => {
    const access = buildPartnerAccess({
      organization: {
        id: "partner-1",
        name: "Tenant Partner",
        model: "tenant",
        partnerType: "expo_partner",
        status: "active",
        primaryUserId: "user-1",
        membershipRole: "viewer"
      },
      capabilities: ["overview", "mini_site"],
      scopes: { expoIds: [], programIds: [], companyIds: [] }
    })

    expect(access.role).toBe("viewer")
    expect(access.readOnly).toBe(true)
  })
})
```

- [ ] **Step 2: Run failing access tests**

Run: `bun test lib/partner/access.test.ts`

Expected: FAIL because `buildPartnerAccess` does not exist and shape uses `modules`.

- [ ] **Step 3: Replace access model**

Modify `lib/partner/access.ts` to export canonical shape while keeping aliases needed by current callers:

```ts
import { userHasRole } from "@/lib/auth/rbac"
import {
  getPartnerCapabilities,
  getPartnerScopes,
  getPrimaryPartnerOrganization,
  type PartnerPortalOrganization
} from "@/lib/partner/db"
import {
  getPartnerModuleVisibility,
  isPartnerRoleReadOnly,
  normalizePartnerRole,
  type PartnerCapability,
  type PartnerModule,
  type PartnerMvpRole,
  type PartnerScopeSummary
} from "@/lib/partner/core"

export type PartnerPortalTab = PartnerModule
export type PartnerPortalAction =
  | "mini_site.write"
  | "mini_site.submit"
  | "enterprise.view"
  | "expo.view"
  | "tradecredit.view"
  | "analytics.view"

export type PartnerAccess = {
  organization: PartnerPortalOrganization | null
  role: PartnerMvpRole | null
  capabilities: PartnerCapability[]
  scopes: PartnerScopeSummary
  modules: Record<PartnerModule, boolean>
  tabs: Record<PartnerPortalTab, boolean>
  actions: Record<PartnerPortalAction, boolean>
  readOnly: boolean
}

const emptyScopes: PartnerScopeSummary = {
  expoIds: [],
  programIds: [],
  companyIds: []
}

const emptyModules = getPartnerModuleVisibility({
  organizationModel: "co_host",
  role: "viewer",
  capabilities: [],
  scopes: emptyScopes
})

const emptyActions: Record<PartnerPortalAction, boolean> = {
  "mini_site.write": false,
  "mini_site.submit": false,
  "enterprise.view": false,
  "expo.view": false,
  "tradecredit.view": false,
  "analytics.view": false
}

export function buildPartnerAccess(input: {
  organization: PartnerPortalOrganization
  capabilities: PartnerCapability[]
  scopes: PartnerScopeSummary
}): PartnerAccess {
  const role = normalizePartnerRole(input.organization.membershipRole)
  const modules = getPartnerModuleVisibility({
    organizationModel: input.organization.model,
    role,
    capabilities: input.capabilities,
    scopes: input.scopes
  })
  const readOnly = isPartnerRoleReadOnly(role)

  return {
    organization: input.organization,
    role,
    capabilities: input.capabilities,
    scopes: input.scopes,
    modules,
    tabs: modules,
    actions: {
      "mini_site.write": modules.mini_site && !readOnly,
      "mini_site.submit": modules.mini_site && !readOnly,
      "enterprise.view": modules.enterprises,
      "expo.view": modules.expo_programs,
      "tradecredit.view": modules.tradecredit_reports,
      "analytics.view": modules.analytics_reports
    },
    readOnly
  }
}

export function emptyPartnerAccess(): PartnerAccess {
  return {
    organization: null,
    role: null,
    capabilities: [],
    scopes: emptyScopes,
    modules: emptyModules,
    tabs: emptyModules,
    actions: emptyActions,
    readOnly: true
  }
}

export async function getPartnerAccess(userId: string): Promise<PartnerAccess> {
  const hasPartnerRole = await userHasRole(userId, "partner")
  if (!hasPartnerRole) return emptyPartnerAccess()

  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) return emptyPartnerAccess()

  const [capabilities, scopes] = await Promise.all([
    getPartnerCapabilities(organization.id),
    getPartnerScopes(organization.id)
  ])

  return buildPartnerAccess({ organization, capabilities, scopes })
}

export async function requirePartnerModule(userId: string, module: PartnerModule) {
  const access = await getPartnerAccess(userId)
  if (!access.modules[module]) throw new Error("Forbidden.")
  return access
}

export async function requirePartnerTab(userId: string, tab: PartnerPortalTab) {
  return requirePartnerModule(userId, tab)
}

export async function requirePartnerAction(
  userId: string,
  action: PartnerPortalAction
) {
  const access = await getPartnerAccess(userId)
  if (!access.actions[action]) throw new Error("Forbidden.")
  return access
}

export async function requirePartnerApiAction(action: PartnerPortalAction) {
  const { getCurrentUserIdFromRequest } = await import("@/lib/auth/rbac")
  const userId = await getCurrentUserIdFromRequest()
  await requirePartnerAction(userId, action)
  return userId
}
```

- [ ] **Step 4: Add db helpers used by access**

Modify `lib/partner/db.ts` imports to reuse core types. Add near `getPrimaryPartnerOrganization`:

```ts
export async function getPartnerCapabilities(
  partnerOrgId: string
): Promise<PartnerCapability[]> {
  const rows = (await sql`
    select capability
    from partner_capability_assignments
    where partner_org_id = ${partnerOrgId}
    order by capability asc
  `) as { capability: PartnerCapability }[]

  if (rows.length === 0) return ["overview"]
  return rows.map((row) => row.capability)
}

export async function getPartnerScopes(
  partnerOrgId: string
): Promise<PartnerScopeSummary> {
  const rows = (await sql`
    select scope_type, scope_id
    from partner_scope_assignments
    where partner_org_id = ${partnerOrgId}
      and status = 'active'
    order by created_at asc
  `) as { scope_type: "expo" | "program" | "company"; scope_id: string }[]

  return {
    expoIds: rows
      .filter((row) => row.scope_type === "expo")
      .map((row) => row.scope_id),
    programIds: rows
      .filter((row) => row.scope_type === "program")
      .map((row) => row.scope_id),
    companyIds: rows
      .filter((row) => row.scope_type === "company")
      .map((row) => row.scope_id)
  }
}
```

At top of `lib/partner/db.ts`, import canonical types:

```ts
import type { PartnerCapability, PartnerScopeSummary } from "@/lib/partner/core"
```

- [ ] **Step 5: Run access tests and typecheck targeted files**

Run: `bun test lib/partner/access.test.ts lib/partner/core.test.ts`

Expected: PASS.

Run: `bun typecheck`

Expected: TypeScript errors only if downstream code still expects removed legacy action names. Fix by keeping aliases, not by reintroducing deferred modules.

- [ ] **Step 6: Commit**

Run:

```bash
git add lib/partner/access.ts lib/partner/access.test.ts lib/partner/db.ts
git commit -m "feat: enforce partner capability access"
```

## Task 4: Admin Partner control-plane data layer

**Files:**
- Create: `lib/partner/admin.ts`
- Create: `lib/partner/admin.test.ts`

- [ ] **Step 1: Write Admin helper tests**

Create `lib/partner/admin.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import {
  assertAdminMiniSiteDecision,
  normalizePartnerOrganizationInput,
  normalizePartnerUserInviteInput
} from "./admin"

describe("partner admin helpers", () => {
  test("normalizes organization input", () => {
    expect(
      normalizePartnerOrganizationInput({
        name: "  ASEAN Export Hub  ",
        model: "tenant",
        partnerType: "expo_partner"
      })
    ).toEqual({
      name: "ASEAN Export Hub",
      model: "tenant",
      partnerType: "expo_partner"
    })
  })

  test("rejects empty organization name", () => {
    expect(() =>
      normalizePartnerOrganizationInput({
        name: "   ",
        model: "tenant",
        partnerType: "expo_partner"
      })
    ).toThrow("Partner organization name is required.")
  })

  test("normalizes invite email and role", () => {
    expect(
      normalizePartnerUserInviteInput({ email: " OWNER@EXAMPLE.COM ", role: "partner_owner" })
    ).toEqual({ email: "owner@example.com", role: "partner_owner" })
  })

  test("requires rejection reason", () => {
    expect(() => assertAdminMiniSiteDecision("rejected", " ")).toThrow(
      "Reject reason is required."
    )
    expect(() => assertAdminMiniSiteDecision("published", " ")).not.toThrow()
  })
})
```

- [ ] **Step 2: Run failing Admin tests**

Run: `bun test lib/partner/admin.test.ts`

Expected: FAIL because module does not exist.

- [ ] **Step 3: Create Admin data layer**

Create `lib/partner/admin.ts`:

```ts
import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
import type {
  PartnerCapability,
  PartnerMiniSiteStatus,
  PartnerMvpRole,
  PartnerScopeSummary
} from "@/lib/partner/core"
import type { PartnerModel, PartnerType } from "@/lib/partner/db"

export type PartnerOrganizationInput = {
  name: string
  model: PartnerModel
  partnerType: PartnerType
}

export type PartnerUserInviteInput = {
  email: string
  role: PartnerMvpRole
}

export function normalizePartnerOrganizationInput(input: PartnerOrganizationInput) {
  const name = input.name.trim()
  if (!name) throw new Error("Partner organization name is required.")

  return {
    name,
    model: input.model,
    partnerType: input.partnerType
  }
}

export function normalizePartnerUserInviteInput(input: PartnerUserInviteInput) {
  const email = input.email.trim().toLowerCase()
  if (!email) throw new Error("Email is required.")

  return {
    email,
    role: input.role
  }
}

export function assertAdminMiniSiteDecision(
  decision: "published" | "rejected",
  reason: string | null | undefined
) {
  if (decision === "rejected" && !reason?.trim()) {
    throw new Error("Reject reason is required.")
  }
}

export async function listPartnerOrganizationsForAdmin() {
  return sql`
    select
      po.id,
      po.name,
      po.model,
      po.partner_type,
      po.status,
      po.primary_user_id,
      count(pm.user_id)::int as member_count
    from partner_organizations po
    left join partner_memberships pm on pm.partner_org_id = po.id
    group by po.id
    order by po.created_at desc
  `
}

export async function createPartnerOrganizationForAdmin(
  actorUserId: string,
  input: PartnerOrganizationInput
) {
  const normalized = normalizePartnerOrganizationInput(input)
  const id = `partner-org-${randomUUID()}`

  await sql`
    insert into partner_organizations (
      id,
      name,
      model,
      partner_type,
      status,
      primary_user_id
    )
    values (
      ${id},
      ${normalized.name},
      ${normalized.model},
      ${normalized.partnerType},
      'active',
      ${actorUserId}
    )
  `

  await setPartnerCapabilitiesForAdmin(actorUserId, id, ["overview"])
  return { id }
}

export async function invitePartnerUserForAdmin(
  partnerOrgId: string,
  input: PartnerUserInviteInput
) {
  const normalized = normalizePartnerUserInviteInput(input)
  const rows = (await sql`
    select id
    from users
    where lower(email) = ${normalized.email}
    limit 1
  `) as { id: string }[]

  const user = rows[0]
  if (!user) throw new Error("Arobid user not found.")

  await sql`
    insert into partner_memberships (
      partner_org_id,
      user_id,
      role,
      status
    )
    values (
      ${partnerOrgId},
      ${user.id},
      ${normalized.role},
      'active'
    )
    on conflict (partner_org_id, user_id) do update set
      role = excluded.role,
      status = 'active'
  `

  return { userId: user.id }
}

export async function updatePartnerMembershipForAdmin(input: {
  partnerOrgId: string
  userId: string
  role?: PartnerMvpRole
  status?: "active" | "inactive" | "removed"
}) {
  await sql`
    update partner_memberships
    set
      role = coalesce(${input.role ?? null}, role),
      status = coalesce(${input.status ?? null}, status)
    where partner_org_id = ${input.partnerOrgId}
      and user_id = ${input.userId}
  `
}

export async function setPartnerCapabilitiesForAdmin(
  actorUserId: string,
  partnerOrgId: string,
  capabilities: PartnerCapability[]
) {
  await sql`
    delete from partner_capability_assignments
    where partner_org_id = ${partnerOrgId}
  `

  for (const capability of capabilities) {
    await sql`
      insert into partner_capability_assignments (
        partner_org_id,
        capability,
        granted_by_user_id
      )
      values (${partnerOrgId}, ${capability}, ${actorUserId})
      on conflict (partner_org_id, capability) do nothing
    `
  }
}

export async function setPartnerScopesForAdmin(input: {
  actorUserId: string
  partnerOrgId: string
  scopes: PartnerScopeSummary
}) {
  await sql`
    update partner_scope_assignments
    set status = 'inactive', updated_at = now()
    where partner_org_id = ${input.partnerOrgId}
  `

  const entries = [
    ...input.scopes.expoIds.map((id) => ["expo", id] as const),
    ...input.scopes.programIds.map((id) => ["program", id] as const),
    ...input.scopes.companyIds.map((id) => ["company", id] as const)
  ]

  for (const [scopeType, scopeId] of entries) {
    await sql`
      insert into partner_scope_assignments (
        id,
        partner_org_id,
        scope_type,
        scope_id,
        assigned_by_user_id,
        status
      )
      values (
        ${`partner-scope-${randomUUID()}`},
        ${input.partnerOrgId},
        ${scopeType},
        ${scopeId},
        ${input.actorUserId},
        'active'
      )
      on conflict do nothing
    `
  }
}

export async function decidePartnerMiniSiteForAdmin(input: {
  actorUserId: string
  partnerOrgId: string
  miniSiteId: string
  decision: "published" | "rejected"
  reason?: string | null
}) {
  assertAdminMiniSiteDecision(input.decision, input.reason)
  const rows = (await sql`
    select status
    from partner_mini_sites
    where id = ${input.miniSiteId}
      and partner_org_id = ${input.partnerOrgId}
    limit 1
  `) as { status: PartnerMiniSiteStatus }[]

  const current = rows[0]
  if (!current) throw new Error("Mini-site version not found.")
  if (current.status !== "submitted") {
    throw new Error("Only submitted mini-site versions can be reviewed.")
  }

  if (input.decision === "published") {
    await sql`
      update partner_mini_sites
      set status = 'rejected', updated_at = now()
      where partner_org_id = ${input.partnerOrgId}
        and status = 'published'
    `
  }

  await sql`
    update partner_mini_sites
    set
      status = ${input.decision},
      published_by_user_id = case when ${input.decision} = 'published' then ${input.actorUserId} else published_by_user_id end,
      published_at = case when ${input.decision} = 'published' then now() else published_at end,
      rejected_by_user_id = case when ${input.decision} = 'rejected' then ${input.actorUserId} else rejected_by_user_id end,
      rejected_at = case when ${input.decision} = 'rejected' then now() else rejected_at end,
      reject_reason = case when ${input.decision} = 'rejected' then ${input.reason?.trim() ?? null} else null end,
      updated_at = now()
    where id = ${input.miniSiteId}
      and partner_org_id = ${input.partnerOrgId}
  `

  await sql`
    insert into partner_mini_site_review_events (
      id,
      mini_site_id,
      partner_org_id,
      from_status,
      to_status,
      actor_user_id,
      reason
    )
    values (
      ${`partner-mini-site-review-${randomUUID()}`},
      ${input.miniSiteId},
      ${input.partnerOrgId},
      ${current.status},
      ${input.decision},
      ${input.actorUserId},
      ${input.reason?.trim() ?? null}
    )
  `
}
```

- [ ] **Step 4: Run Admin helper tests**

Run: `bun test lib/partner/admin.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/partner/admin.ts lib/partner/admin.test.ts
git commit -m "feat: add partner admin domain"
```

## Task 5: Admin Partner pages and APIs for US-01, US-04, US-05, US-06

**Files:**
- Create: `components/admin/partner/partner-organization-admin.tsx`
- Create: `app/(dashboard)/admin/partners/page.tsx`
- Create: `app/(dashboard)/admin/partners/[partnerOrgId]/page.tsx`
- Create: `app/api/admin/partners/route.ts`
- Create: `app/api/admin/partners/[partnerOrgId]/memberships/route.ts`
- Create: `app/api/admin/partners/[partnerOrgId]/memberships/[userId]/route.ts`
- Create: `app/api/admin/partners/[partnerOrgId]/capabilities/route.ts`

- [ ] **Step 1: Create Admin API routes**

Create `app/api/admin/partners/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, requireRole } from "@/lib/auth/rbac"
import {
  createPartnerOrganizationForAdmin,
  listPartnerOrganizationsForAdmin
} from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function GET() {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const organizations = await listPartnerOrganizationsForAdmin()
  return NextResponse.json({ organizations })
}

export async function POST(request: Request) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const actorUserId = await getCurrentUserIdFromRequest()
  const body = await request.json()
  const result = await createPartnerOrganizationForAdmin(actorUserId, {
    name: String(body.name ?? ""),
    model: body.model,
    partnerType: body.partnerType
  })
  return NextResponse.json(result)
}
```

Create `app/api/admin/partners/[partnerOrgId]/memberships/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/rbac"
import { invitePartnerUserForAdmin } from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ partnerOrgId: string }> }
) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { partnerOrgId } = await params
  const body = await request.json()
  const result = await invitePartnerUserForAdmin(partnerOrgId, {
    email: String(body.email ?? ""),
    role: body.role
  })
  return NextResponse.json(result)
}
```

Create `app/api/admin/partners/[partnerOrgId]/memberships/[userId]/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/rbac"
import { updatePartnerMembershipForAdmin } from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partnerOrgId: string; userId: string }> }
) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { partnerOrgId, userId } = await params
  const body = await request.json()
  await updatePartnerMembershipForAdmin({
    partnerOrgId,
    userId,
    role: body.role,
    status: body.status
  })
  return NextResponse.json({ ok: true })
}
```

Create `app/api/admin/partners/[partnerOrgId]/capabilities/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, requireRole } from "@/lib/auth/rbac"
import {
  setPartnerCapabilitiesForAdmin,
  setPartnerScopesForAdmin
} from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ partnerOrgId: string }> }
) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const actorUserId = await getCurrentUserIdFromRequest()
  const { partnerOrgId } = await params
  const body = await request.json()

  await setPartnerCapabilitiesForAdmin(
    actorUserId,
    partnerOrgId,
    body.capabilities ?? []
  )
  await setPartnerScopesForAdmin({
    actorUserId,
    partnerOrgId,
    scopes: body.scopes ?? { expoIds: [], programIds: [], companyIds: [] }
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create Admin UI component**

Create `components/admin/partner/partner-organization-admin.tsx`:

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PartnerOrganizationRow = {
  id: string
  name: string
  model: string
  partner_type: string
  status: string
  member_count: number
}

export function PartnerOrganizationAdmin({
  organizations
}: {
  organizations: PartnerOrganizationRow[]
}) {
  const [name, setName] = useState("")
  const [model, setModel] = useState("tenant")
  const [partnerType, setPartnerType] = useState("expo_partner")
  const [isSaving, setIsSaving] = useState(false)

  async function createOrganization() {
    setIsSaving(true)
    try {
      await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, model, partnerType })
      })
      window.location.reload()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create Partner Organization</CardTitle>
          <CardDescription>
            Create Arobid-governed partner organizations. Users are attached through memberships.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partner-name">Name</Label>
            <Input
              id="partner-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ASEAN Export Hub"
            />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="co_host">Co-host</SelectItem>
                <SelectItem value="turnkey">Turnkey</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Partner type</Label>
            <Select value={partnerType} onValueChange={setPartnerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expo_partner">Expo partner</SelectItem>
                <SelectItem value="strategic_partner">Strategic partner</SelectItem>
                <SelectItem value="distribution_partner">Distribution partner</SelectItem>
                <SelectItem value="alliance_partner">Alliance partner</SelectItem>
                <SelectItem value="government_program_partner">Government program partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createOrganization} disabled={isSaving || !name.trim()}>
            {isSaving ? "Creating..." : "Create organization"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partner Organizations</CardTitle>
          <CardDescription>Control-plane records for Partner Portal access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {organizations.map((organization) => (
            <a
              key={organization.id}
              href={`/admin/partners/${organization.id}`}
              className="block rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{organization.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {organization.model} · {organization.partner_type} · {organization.member_count} members
                  </div>
                </div>
                <div className="rounded-full bg-muted px-2 py-1 text-xs">{organization.status}</div>
              </div>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create Admin pages**

Create `app/(dashboard)/admin/partners/page.tsx`:

```tsx
import { PartnerOrganizationAdmin } from "@/components/admin/partner/partner-organization-admin"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { listPartnerOrganizationsForAdmin } from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function AdminPartnersPage() {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const organizations = await listPartnerOrganizationsForAdmin()

  return (
    <DashboardShell
      title="Partner Organizations"
      description="Create and govern Partner Portal organizations, memberships, capabilities, and scopes."
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Partners" }]}
    >
      <PartnerOrganizationAdmin organizations={organizations as never} />
    </DashboardShell>
  )
}
```

Create `app/(dashboard)/admin/partners/[partnerOrgId]/page.tsx`:

```tsx
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function AdminPartnerDetailPage({
  params
}: {
  params: Promise<{ partnerOrgId: string }>
}) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { partnerOrgId } = await params

  return (
    <DashboardShell
      title="Partner Organization Detail"
      description="Manage users, roles, capabilities, and assigned scope for this Partner Organization."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Partners", href: "/admin/partners" },
        { label: partnerOrgId }
      ]}
    >
      <div className="rounded-lg border p-6 text-muted-foreground text-sm">
        Membership and capability editor uses admin APIs from this page. Detailed table wiring comes after domain guard is stable.
      </div>
    </DashboardShell>
  )
}
```

- [ ] **Step 4: Typecheck**

Run: `bun typecheck`

Expected: PASS after resolving import formatting/type issues.

- [ ] **Step 5: Commit**

Run:

```bash
git add components/admin/partner/partner-organization-admin.tsx app/'(dashboard)'/admin/partners app/api/admin/partners
git commit -m "feat: add admin partner control plane"
```

## Task 6: Partner mini-site draft/preview/submit for US-07 and US-08

**Files:**
- Create: `app/api/partner/mini-site/route.ts`
- Create: `app/api/partner/mini-site/preview/route.ts`
- Modify: `lib/partner/db.ts`
- Modify: `app/(dashboard)/partner/site-management/page.tsx`
- Modify: `components/partner/partner-site-management-manager.tsx`

- [ ] **Step 1: Add mini-site db helpers**

Add to `lib/partner/db.ts`:

```ts
import { randomUUID } from "node:crypto"
import { canTransitionMiniSiteStatus, type PartnerMiniSiteStatus } from "@/lib/partner/core"

export type PartnerMiniSiteVersion = {
  id: string
  partnerOrgId: string
  versionLabel: string
  status: PartnerMiniSiteStatus
  content: Record<string, unknown>
  rejectReason: string | null
  submittedAt: string | null
  publishedAt: string | null
  updatedAt: string
}

export async function listPartnerMiniSiteVersions(
  userId: string
): Promise<PartnerMiniSiteVersion[]> {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    select
      id,
      partner_org_id,
      version_label,
      status,
      content_json,
      reject_reason,
      submitted_at,
      published_at,
      updated_at
    from partner_mini_sites
    where partner_org_id = ${organization.id}
    order by updated_at desc
  `) as {
    id: string
    partner_org_id: string
    version_label: string
    status: PartnerMiniSiteStatus
    content_json: Record<string, unknown>
    reject_reason: string | null
    submitted_at: string | Date | null
    published_at: string | Date | null
    updated_at: string | Date
  }[]

  return rows.map((row) => ({
    id: row.id,
    partnerOrgId: row.partner_org_id,
    versionLabel: row.version_label,
    status: row.status,
    content: row.content_json,
    rejectReason: row.reject_reason,
    submittedAt: row.submitted_at ? toIso(row.submitted_at) : null,
    publishedAt: row.published_at ? toIso(row.published_at) : null,
    updatedAt: toIso(row.updated_at)
  }))
}

export async function savePartnerMiniSiteDraft(
  userId: string,
  content: Record<string, unknown>
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const existingRows = (await sql`
    select id, status
    from partner_mini_sites
    where partner_org_id = ${organization.id}
      and status in ('draft', 'draft_update', 'rejected')
    order by updated_at desc
    limit 1
  `) as { id: string; status: PartnerMiniSiteStatus }[]

  const existing = existingRows[0]
  if (existing) {
    const nextStatus = existing.status === "rejected" ? "draft" : existing.status
    await sql`
      update partner_mini_sites
      set
        status = ${nextStatus},
        content_json = ${JSON.stringify(content)}::jsonb,
        updated_at = now()
      where id = ${existing.id}
    `
    return { id: existing.id }
  }

  const publishedRows = (await sql`
    select id
    from partner_mini_sites
    where partner_org_id = ${organization.id}
      and status = 'published'
    limit 1
  `) as { id: string }[]

  const status: PartnerMiniSiteStatus = publishedRows[0] ? "draft_update" : "draft"
  const id = `partner-mini-site-${randomUUID()}`
  await sql`
    insert into partner_mini_sites (
      id,
      partner_org_id,
      version_label,
      status,
      content_json
    )
    values (
      ${id},
      ${organization.id},
      ${status === "draft_update" ? "Draft update" : "Initial draft"},
      ${status},
      ${JSON.stringify(content)}::jsonb
    )
  `
  return { id }
}

export async function submitPartnerMiniSiteDraft(userId: string, miniSiteId: string) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    select status
    from partner_mini_sites
    where id = ${miniSiteId}
      and partner_org_id = ${organization.id}
    limit 1
  `) as { status: PartnerMiniSiteStatus }[]

  const current = rows[0]
  if (!current) throw new Error("Mini-site version not found.")
  if (!canTransitionMiniSiteStatus(current.status, "submitted", normalizePartnerRole(organization.membershipRole))) {
    throw new Error("Mini-site version cannot be submitted from current status.")
  }

  await sql`
    update partner_mini_sites
    set
      status = 'submitted',
      submitted_by_user_id = ${userId},
      submitted_at = now(),
      updated_at = now()
    where id = ${miniSiteId}
      and partner_org_id = ${organization.id}
  `
}
```

Also import `normalizePartnerRole` from `@/lib/partner/core` in same import.

- [ ] **Step 2: Create Partner mini-site APIs**

Create `app/api/partner/mini-site/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  listPartnerMiniSiteVersions,
  savePartnerMiniSiteDraft,
  submitPartnerMiniSiteDraft
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function GET() {
  await ensurePlatformSchema()
  const userId = await requirePartnerApiAction("mini_site.write")
  const versions = await listPartnerMiniSiteVersions(userId)
  return NextResponse.json({ versions })
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  const userId = await requirePartnerApiAction("mini_site.write")
  const body = await request.json()
  const result = await savePartnerMiniSiteDraft(userId, body.content ?? {})
  return NextResponse.json(result)
}

export async function PUT(request: Request) {
  await ensurePlatformSchema()
  const userId = await getCurrentUserIdFromRequest()
  await requirePartnerApiAction("mini_site.submit")
  const body = await request.json()
  await submitPartnerMiniSiteDraft(userId, String(body.miniSiteId ?? ""))
  return NextResponse.json({ ok: true })
}
```

Create `app/api/partner/mini-site/preview/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { listPartnerMiniSiteVersions } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function GET(request: Request) {
  await ensurePlatformSchema()
  const userId = await requirePartnerApiAction("mini_site.write")
  const url = new URL(request.url)
  const versionId = url.searchParams.get("versionId")
  const versions = await listPartnerMiniSiteVersions(userId)
  const version = versionId
    ? versions.find((item) => item.id === versionId)
    : versions[0]

  if (!version) {
    return NextResponse.json({ version: null })
  }

  return NextResponse.json({ version })
}
```

- [ ] **Step 3: Update Partner site management page guard**

Modify `app/(dashboard)/partner/site-management/page.tsx`:

```ts
const access = await requirePartnerModule(userId, "mini_site")
```

and import `requirePartnerModule` instead of `requirePartnerTab`.

- [ ] **Step 4: Wire basic manager states**

In `components/partner/partner-site-management-manager.tsx`, keep existing preview UI. Add props usage:

```tsx
const isReadOnly = access.readOnly
```

Disable save/submit buttons when `isReadOnly` is true. Add visible status label text near header:

```tsx
<div className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
  Preview is Partner Portal-only. Published public mini-site remains controlled by Admin review.
</div>
```

- [ ] **Step 5: Run tests and typecheck**

Run: `bun test lib/partner/core.test.ts lib/partner/access.test.ts`

Expected: PASS.

Run: `bun typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add app/api/partner/mini-site app/'(dashboard)'/partner/site-management/page.tsx components/partner/partner-site-management-manager.tsx lib/partner/db.ts
git commit -m "feat: add partner mini-site workflow"
```

## Task 7: Admin mini-site review for US-08 moderation side

**Files:**
- Create: `components/admin/partner/partner-mini-site-review.tsx`
- Create: `app/(dashboard)/admin/partners/[partnerOrgId]/mini-site/page.tsx`
- Create: `app/api/admin/partners/[partnerOrgId]/mini-site/review/route.ts`
- Modify: `lib/partner/admin.ts`

- [ ] **Step 1: Add Admin list helper**

Add to `lib/partner/admin.ts`:

```ts
export async function listPartnerMiniSitesForAdmin(partnerOrgId: string) {
  return sql`
    select
      id,
      version_label,
      status,
      content_json,
      reject_reason,
      submitted_at,
      published_at,
      updated_at
    from partner_mini_sites
    where partner_org_id = ${partnerOrgId}
    order by updated_at desc
  `
}
```

- [ ] **Step 2: Create review API**

Create `app/api/admin/partners/[partnerOrgId]/mini-site/review/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, requireRole } from "@/lib/auth/rbac"
import { decidePartnerMiniSiteForAdmin } from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ partnerOrgId: string }> }
) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const actorUserId = await getCurrentUserIdFromRequest()
  const { partnerOrgId } = await params
  const body = await request.json()

  await decidePartnerMiniSiteForAdmin({
    actorUserId,
    partnerOrgId,
    miniSiteId: String(body.miniSiteId ?? ""),
    decision: body.decision,
    reason: body.reason
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create review component**

Create `components/admin/partner/partner-mini-site-review.tsx`:

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type MiniSiteRow = {
  id: string
  version_label: string
  status: string
  reject_reason: string | null
  updated_at: string
}

export function PartnerMiniSiteReview({
  partnerOrgId,
  versions
}: {
  partnerOrgId: string
  versions: MiniSiteRow[]
}) {
  const [reasonById, setReasonById] = useState<Record<string, string>>({})

  async function review(miniSiteId: string, decision: "published" | "rejected") {
    await fetch(`/api/admin/partners/${partnerOrgId}/mini-site/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        miniSiteId,
        decision,
        reason: reasonById[miniSiteId] ?? ""
      })
    })
    window.location.reload()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mini-site Review</CardTitle>
        <CardDescription>
          Publish or reject submitted Tenant mini-site versions. Partners cannot self-publish.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {versions.map((version) => (
          <div key={version.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{version.version_label}</div>
                <div className="text-muted-foreground text-sm">
                  {version.status} · {new Date(version.updated_at).toLocaleString()}
                </div>
                {version.reject_reason ? (
                  <div className="mt-2 text-destructive text-sm">{version.reject_reason}</div>
                ) : null}
              </div>
              {version.status === "submitted" ? (
                <div className="flex min-w-80 items-center gap-2">
                  <Input
                    placeholder="Reject reason"
                    value={reasonById[version.id] ?? ""}
                    onChange={(event) =>
                      setReasonById((current) => ({
                        ...current,
                        [version.id]: event.target.value
                      }))
                    }
                  />
                  <Button variant="outline" onClick={() => review(version.id, "rejected")}>Reject</Button>
                  <Button onClick={() => review(version.id, "published")}>Publish</Button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create review page**

Create `app/(dashboard)/admin/partners/[partnerOrgId]/mini-site/page.tsx`:

```tsx
import { PartnerMiniSiteReview } from "@/components/admin/partner/partner-mini-site-review"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { listPartnerMiniSitesForAdmin } from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function AdminPartnerMiniSitePage({
  params
}: {
  params: Promise<{ partnerOrgId: string }>
}) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { partnerOrgId } = await params
  const versions = await listPartnerMiniSitesForAdmin(partnerOrgId)

  return (
    <DashboardShell
      title="Partner Mini-site Review"
      description="Review submitted Tenant mini-site versions before they become public."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Partners", href: "/admin/partners" },
        { label: partnerOrgId, href: `/admin/partners/${partnerOrgId}` },
        { label: "Mini-site Review" }
      ]}
    >
      <PartnerMiniSiteReview partnerOrgId={partnerOrgId} versions={versions as never} />
    </DashboardShell>
  )
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `bun test lib/partner/admin.test.ts lib/partner/core.test.ts`

Expected: PASS.

Run: `bun typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add components/admin/partner/partner-mini-site-review.tsx app/'(dashboard)'/admin/partners/'[partnerOrgId]'/mini-site app/api/admin/partners/'[partnerOrgId]'/mini-site lib/partner/admin.ts
git commit -m "feat: add admin mini-site review"
```

## Task 8: Partner sidebar and deferred module blocking for US-02 and US-03

**Files:**
- Modify: `components/app-sidebar.tsx`
- Modify: `components/nav-partner.tsx`
- Modify: `app/(dashboard)/partner/layout.tsx`
- Modify: `app/(dashboard)/partner/bundles/page.tsx`
- Modify: `app/(dashboard)/partner/communications/page.tsx`
- Modify: `app/(dashboard)/partner/finance/page.tsx`
- Modify: `app/(dashboard)/partner/government/page.tsx`

- [ ] **Step 1: Update portal copy**

Modify `components/app-sidebar.tsx` portal entry:

```ts
{
  name: "Partner Portal",
  logo: <HandshakeIcon />,
  plan: "Partner Workspace",
  url: "/partner"
}
```

- [ ] **Step 2: Update Partner navigation to canonical modules**

Modify `components/nav-partner.tsx` links to:

```tsx
const partnerLinks = [
  {
    name: "Mini-site",
    url: "/partner/site-management",
    module: "mini_site",
    icon: <PaletteIcon />
  },
  {
    name: "Enterprises & Members",
    url: "/partner/enterprises",
    module: "enterprises",
    icon: <UsersIcon />
  },
  {
    name: "Expo Programs",
    url: "/partner/expos",
    module: "expo_programs",
    icon: <ApertureIcon />
  },
  {
    name: "Quota & TradeCredit Reports",
    url: "/partner/quota",
    module: "tradecredit_reports",
    icon: <WalletCardsIcon />
  },
  {
    name: "Analytics & Reports",
    url: "/partner/analytics",
    module: "analytics_reports",
    icon: <PieChartIcon />
  }
] satisfies {
  name: string
  url: string
  module: PartnerModule
  icon: JSX.Element
}[]
```

Update imports to remove `BoxesIcon`, `Building2Icon`, `LandmarkIcon`, `MessageSquareIcon`, and use `PartnerModule` from `@/lib/partner/core`.

Filter with:

```tsx
const links = partnerLinks.filter((item) => access?.modules[item.module] ?? false)
```

- [ ] **Step 3: Keep layout canonical access**

In `app/(dashboard)/partner/layout.tsx`, no behavior change required if `getPartnerAccess` still returns `PartnerAccess`. Verify `AppSidebar` gets canonical access.

- [ ] **Step 4: Server-block deferred pages**

Replace content in each deferred page with:

```tsx
import { notFound } from "next/navigation"

export default function DeferredPartnerModulePage() {
  notFound()
}
```

Apply to:

- `app/(dashboard)/partner/bundles/page.tsx`
- `app/(dashboard)/partner/communications/page.tsx`
- `app/(dashboard)/partner/finance/page.tsx`
- `app/(dashboard)/partner/government/page.tsx`

- [ ] **Step 5: Run typecheck**

Run: `bun typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add components/app-sidebar.tsx components/nav-partner.tsx app/'(dashboard)'/partner/bundles/page.tsx app/'(dashboard)'/partner/communications/page.tsx app/'(dashboard)'/partner/finance/page.tsx app/'(dashboard)'/partner/government/page.tsx
git commit -m "feat: scope partner portal navigation"
```

## Task 9: End-to-end verification

**Files:**
- No new files unless fixes are required.

- [ ] **Step 1: Run focused tests**

Run:

```bash
bun test lib/partner/core.test.ts lib/partner/access.test.ts lib/partner/admin.test.ts lib/platform/ensure-schema.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `bun typecheck`

Expected: PASS.

- [ ] **Step 3: Run lint/format fix**

Run: `bun check`

Expected: completes with no remaining errors.

- [ ] **Step 4: Start dev server**

Run: `bun dev`

Expected: Next.js dev server starts on configured port.

- [ ] **Step 5: Browser smoke test**

Open browser and verify:

- `/admin/partners` loads for sys_admin.
- Partner Organization create form appears.
- `/partner` loads with Partner Workspace label.
- Partner sidebar only shows MVP modules based on capabilities.
- `/partner/bundles`, `/partner/communications`, `/partner/finance`, `/partner/government` return 404.
- `/partner/site-management` shows preview note and respects read-only state.
- `/admin/partners/<partnerOrgId>/mini-site` lists submitted versions when test data exists.

- [ ] **Step 6: Final commit for verification fixes**

If verification required fixes, run:

```bash
git status --short
git add docs/superpowers/plans/2026-05-17-partner-portal-core-us-rewrite.md
git commit -m "fix: stabilize partner portal rewrite"
```

If verification fixes touched code, replace the `git add` file list with the exact changed code files shown by `git status --short`. If no fixes, do not create empty commit.
