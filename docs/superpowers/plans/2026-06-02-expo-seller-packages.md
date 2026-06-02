# Expo Seller Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Admin-managed seller/exhibitor packages to the expo create/edit flow, with expo-specific public pricing/benefits linked to real subscription packages.

**Architecture:** Add a focused `expo_package_displays` table for per-expo display overrides and keep real subscription packages in existing `packages` / `package_plans` tables. Add pure validation helpers for client/server use, DB helpers for package display persistence, Admin form `Packages` step, and public Expo Detail rendering. Keep package writes inside the expo save transaction by adding an optional transaction callback to existing expo save helpers.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun, Neon SQL helper, Tailwind CSS v4, shadcn/ui primitives, Biome.

---

## Important existing facts

- Existing subscription tables are named `packages` and `package_plans` in `lib/platform/ensure-schema.ts`.
- Existing subscription helpers live in `lib/plan-subscriptions/db.ts`.
- Existing Admin expo create/edit form is `components/tradexpo/expo-form.tsx`.
- Existing Admin form steps are defined in `components/tradexpo/expo-form/constants.ts`.
- Existing expo create/update routes are:
  - `app/api/tradexpo/expos/route.ts`
  - `app/api/tradexpo/expos/[expoId]/route.ts`
- Existing public Expo Detail page is `app/(tradexpo)/expos/[slug]/page.tsx`.
- Do not create new test files unless the user asks.
- Do not use Chrome MCP UI verification by default.
- Do not commit unless the user explicitly asks.

## File structure

Create:

- `lib/tradexpo/expo-package-displays.ts` — pure normalization/validation helpers importable by client and server.
- `lib/tradexpo/db/expo-package-displays.ts` — DB read/write helpers for package display rows and package form workspace.
- `components/tradexpo/expo-form/packages-step.tsx` — Admin form step UI for package cards.

Modify:

- `lib/platform/ensure-schema.ts` — idempotent `expo_package_displays` schema.
- `lib/tradexpo/types.ts` — `ExpoPackageDisplay`, input/workspace types.
- `lib/plan-subscriptions/db.ts` — transaction-safe package helpers used by expo package save flow.
- `lib/tradexpo/db/platform-data.ts` — optional `afterWrite` transaction callback in create/update helpers.
- `app/api/tradexpo/expos/route.ts` — parse/validate/save package payload during create.
- `app/api/tradexpo/expos/[expoId]/route.ts` — parse/validate/save package payload during update.
- `app/(dashboard)/admin/tradexpo/expos/new/page.tsx` — load package workspace for create form.
- `app/(dashboard)/admin/tradexpo/expos/[expoId]/edit/page.tsx` — load initial package displays and package workspace for edit form.
- `components/tradexpo/expo-form/types.ts` — props, step id, package form row types.
- `components/tradexpo/expo-form/constants.ts` — add `packages` step for Admin only.
- `components/tradexpo/expo-form/row-helpers.ts` — package row conversion helpers.
- `components/tradexpo/expo-form.tsx` — package state, validation, payload, step render.
- `app/(tradexpo)/expos/[slug]/page.tsx` — load package displays and render public package section.
- `components/tradexpo/expo-detail/sections.tsx` — add public package pricing section component.

---

### Task 1: Add schema and Tradexpo package types

**Files:**

- Modify: `lib/platform/ensure-schema.ts`
- Modify: `lib/tradexpo/types.ts`

- [ ] **Step 1: Add package display domain types**

In `lib/tradexpo/types.ts`, add this block after `ExpoMarketingContentVersion`:

```ts
export type ExpoPackageDisplaySource = "linked" | "inline_created"

export type ExpoPackageInputMode = "link_existing" | "create_new"

export interface ExpoPackageDisplay {
  id: string
  expoId: string
  packageDefinitionId: string
  source: ExpoPackageDisplaySource
  name: string
  description: string
  price: number
  priceUnit: string
  benefits: string[]
  isFeatured: boolean
  isPublic: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ExpoPackageInput {
  id?: string
  mode: ExpoPackageInputMode
  packageDefinitionId?: string
  name: string
  description?: string
  price: number
  priceUnit: string
  benefits: string[]
  isFeatured: boolean
  isPublic: boolean
  sortOrder: number
  advanced?: {
    planId?: string
    roleCode?: string
  }
}

export interface ExpoPackagePlanOption {
  id: string
  code: string
  name: string
  targetType: "ORGANIZATION" | "EXPO"
  tierRank: number
  isActive: boolean
}

export interface ExpoPackageRoleOption {
  id: string
  name: string
}

export interface ExpoPackageDefinitionOption {
  id: string
  code: string
  name: string
  description: string
  price: number
  priceUnit: string
  imageUrl: string
  isPublic: boolean
  isActive: boolean
  plans: Array<{
    id: string
    planId: string
    planCode: string
    planName: string
    planTargetType: "ORGANIZATION" | "EXPO"
    planIsActive: boolean
    roleCode: string
    roleName: string
    validityType: "DURATION" | "EVENT_BOUND"
    durationMonths: number | null
    expoId: string | null
    expoName: string | null
    expoStatus: string | null
  }>
}

export interface ExpoPackageFormWorkspace {
  packages: ExpoPackageDefinitionOption[]
  plans: ExpoPackagePlanOption[]
  roles: ExpoPackageRoleOption[]
}
```

- [ ] **Step 2: Add idempotent package display schema helper**

In `lib/platform/ensure-schema.ts`, add this function after `ensureExpoMarketingContentSchema()`:

```ts
async function ensureExpoPackageDisplaySchema() {
  await migratePlanSubscriptionsSchema()
  await sql`
    create table if not exists expo_package_displays (
      id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      package_definition_id text not null references packages(id) on delete restrict,
      source text not null check (source in ('linked', 'inline_created')),
      name text not null,
      description text not null default '',
      price numeric(15, 2) not null default 0,
      price_unit text not null default 'VND',
      benefits jsonb not null default '[]'::jsonb,
      is_featured boolean not null default false,
      is_public boolean not null default true,
      sort_order int not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_expo_package_displays_expo
    on expo_package_displays (expo_id, sort_order)
  `
  await sql`
    create index if not exists idx_expo_package_displays_package
    on expo_package_displays (package_definition_id)
  `
  await sql`
    insert into platform_schema_migrations (name)
    values ('expo_package_displays_v1')
    on conflict (name) do update set applied_at = now()
  `
}
```

- [ ] **Step 3: Call package display schema helper in fast path**

In `ensurePlatformSchema()`, inside the `if (appliedNames.has(LATEST_PLATFORM_MIGRATION))` block, add this call after `await ensureExpoMarketingContentSchema()`:

```ts
await ensureExpoPackageDisplaySchema()
```

The block should include:

```ts
await ensurePlatformPaymentConfig()
await ensureCompanyRepresentativeSchema()
await backfillCompanyRepresentatives()
await ensureExpoMarketingContentSchema()
await ensureExpoPackageDisplaySchema()
await ensureTradeCreditSchema()
await ensureAccountProfileSchema()
```

- [ ] **Step 4: Call package display schema helper in full migration path**

Near the end of `migrateExpoManagementSchema()`, directly after the existing `await ensureExpoMarketingContentSchema()`, add:

```ts
await ensureExpoPackageDisplaySchema()
```

- [ ] **Step 5: Run typecheck for schema/type syntax**

Run:

```bash
bun typecheck
```

Expected: TypeScript may fail on later unimplemented references only if a snippet was accidentally pasted into the wrong scope. If only schema/types changed correctly, command exits with code `0` or reports unrelated pre-existing errors. Record exact output for final report.

---

### Task 2: Add pure package display validation helpers

**Files:**

- Create: `lib/tradexpo/expo-package-displays.ts`

- [ ] **Step 1: Create pure validation helper file**

Create `lib/tradexpo/expo-package-displays.ts` with this content:

```ts
import type { ExpoPackageInput } from "@/lib/tradexpo/types"

export const MAX_EXPO_PACKAGES = 6
export const MAX_EXPO_PACKAGE_BENEFITS = 10

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function cleanBenefits(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(cleanText).filter(Boolean).slice(0, MAX_EXPO_PACKAGE_BENEFITS)
}

function cleanMode(value: unknown): ExpoPackageInput["mode"] {
  return value === "create_new" ? "create_new" : "link_existing"
}

function cleanPrice(value: unknown) {
  const price = Number(value ?? 0)
  return Number.isFinite(price) ? price : Number.NaN
}

export function normalizeExpoPackageInputs(input: unknown): ExpoPackageInput[] {
  if (!Array.isArray(input)) return []
  const normalized = input.slice(0, MAX_EXPO_PACKAGES).map((raw, index) => {
    const row = asRecord(raw)
    const advanced = asRecord(row.advanced)
    return {
      id: cleanText(row.id) || undefined,
      mode: cleanMode(row.mode),
      packageDefinitionId: cleanText(row.packageDefinitionId) || undefined,
      name: cleanText(row.name),
      description: cleanText(row.description),
      price: cleanPrice(row.price),
      priceUnit: cleanText(row.priceUnit).toUpperCase() || "VND",
      benefits: cleanBenefits(row.benefits),
      isFeatured: row.isFeatured === true,
      isPublic: row.isPublic !== false,
      sortOrder: index,
      advanced:
        cleanText(advanced.planId) || cleanText(advanced.roleCode)
          ? {
              planId: cleanText(advanced.planId) || undefined,
              roleCode: cleanText(advanced.roleCode) || undefined
            }
          : undefined
    } satisfies ExpoPackageInput
  })

  const featuredIndex = normalized.findIndex((row) => row.isFeatured)
  return normalized.map((row, index) => ({
    ...row,
    isFeatured: featuredIndex >= 0 ? index === featuredIndex : false,
    sortOrder: index
  }))
}

export type ExpoPackageValidationResult =
  | { ok: true; packages: ExpoPackageInput[] }
  | { ok: false; error: string }

export function validateExpoPackageInputs(
  input: unknown
): ExpoPackageValidationResult {
  const packages = normalizeExpoPackageInputs(input)

  if (packages.length > MAX_EXPO_PACKAGES) {
    return { ok: false, error: "Add at most 6 packages." }
  }

  const featuredCount = packages.filter((pkg) => pkg.isFeatured).length
  if (featuredCount > 1) {
    return { ok: false, error: "Only one package can be featured." }
  }

  for (const pkg of packages) {
    if (!pkg.name) {
      return { ok: false, error: "Package name is required." }
    }
    if (!Number.isFinite(pkg.price) || pkg.price < 0) {
      return { ok: false, error: "Package price must be zero or greater." }
    }
    if (!pkg.priceUnit) {
      return { ok: false, error: "Package currency is required." }
    }
    if (pkg.benefits.length === 0) {
      return { ok: false, error: "Add at least one package benefit." }
    }
    if (pkg.mode === "link_existing" && !pkg.packageDefinitionId) {
      return { ok: false, error: "Select an existing package." }
    }
  }

  return { ok: true, packages }
}
```

- [ ] **Step 2: Run typecheck for pure helper**

Run:

```bash
bun typecheck
```

Expected: command exits with code `0` or reports unrelated pre-existing errors. If it reports `Cannot find name` from this new file, fix import/type spelling before continuing.

---

### Task 3: Add transaction-safe subscription package helpers

**Files:**

- Modify: `lib/plan-subscriptions/db.ts`

- [ ] **Step 1: Export package option loader**

Find the existing private function:

```ts
async function getPackageDefinitionOptions() {
```

Change it to:

```ts
export async function getPackageDefinitionOptions() {
```

- [ ] **Step 2: Add package transaction helpers after `createPackageDefinition()`**

In `lib/plan-subscriptions/db.ts`, after `createPackageDefinition()` and before `updatePackageDefinition()`, add:

```ts
export async function createPackageDefinitionInCurrentTransaction(
  userId: string,
  input: PackageDefinitionInput
) {
  const basics = validatePackageBasics(input)
  const plans = await validatePackagePlans(input.plans)
  const packageId = randomUUID()

  await sql`
    insert into packages (
      id,
      code,
      name,
      description,
      price,
      price_unit,
      image_url,
      is_public,
      is_active,
      created_by
    )
    values (
      ${packageId},
      ${basics.code},
      ${basics.name},
      ${basics.description},
      ${basics.price},
      ${basics.priceUnit},
      ${basics.imageUrl || null},
      ${basics.isPublic},
      ${input.isActive !== false},
      ${userId}
    )
  `

  for (const plan of plans) {
    await sql`
      insert into package_plans (
        id,
        package_id,
        plan_id,
        role_code,
        validity_type,
        duration_months,
        expo_id
      )
      values (
        ${randomUUID()},
        ${packageId},
        ${plan.planId},
        ${plan.roleCode},
        ${plan.validityType},
        ${plan.durationMonths},
        ${plan.expoId}
      )
    `
  }

  return packageId
}

export async function ensurePackageExpoPlanInCurrentTransaction(
  packageId: string,
  input: {
    planId: string
    roleCode: string
    expoId: string
  }
) {
  const [plan] = await validatePackagePlans([
    {
      planId: input.planId,
      roleCode: input.roleCode,
      validityType: "EVENT_BOUND",
      expoId: input.expoId,
      durationMonths: null
    }
  ])

  await sql`
    insert into package_plans (
      id,
      package_id,
      plan_id,
      role_code,
      validity_type,
      duration_months,
      expo_id
    )
    values (
      ${randomUUID()},
      ${packageId},
      ${plan.planId},
      ${plan.roleCode},
      ${plan.validityType},
      ${plan.durationMonths},
      ${plan.expoId}
    )
    on conflict (package_id, plan_id, role_code) do nothing
  `

  const rows = (await sql`
    select 1
    from package_plans
    where package_id = ${packageId}
      and plan_id = ${input.planId}
      and role_code = ${input.roleCode}
      and expo_id = ${input.expoId}
    limit 1
  `) as { "?column?": number }[]

  if (rows.length === 0) {
    throw new Error("Selected package plan is already bound to another expo.")
  }
}

```

- [ ] **Step 3: Run typecheck for subscription helpers**

Run:

```bash
bun typecheck
```

Expected: command exits with code `0` or reports no errors in `lib/plan-subscriptions/db.ts`. Fix any `Type '...' is not assignable` from helper signatures before continuing.

---

### Task 4: Add expo package display DB helpers

**Files:**

- Create: `lib/tradexpo/db/expo-package-displays.ts`

- [ ] **Step 1: Create DB helper file**

Create `lib/tradexpo/db/expo-package-displays.ts` with this content:

```ts
import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
import {
  createPackageDefinitionInCurrentTransaction,
  ensurePackageExpoPlanInCurrentTransaction,
  getPackageDefinitionOptions,
  getPackageDefinitionWorkspace
} from "@/lib/plan-subscriptions/db"
import { validateExpoPackageInputs } from "@/lib/tradexpo/expo-package-displays"
import type {
  ExpoPackageDisplay,
  ExpoPackageDisplaySource,
  ExpoPackageFormWorkspace,
  ExpoPackageInput,
  ExpoPackagePlanOption,
  ExpoPackageRoleOption
} from "@/lib/tradexpo/types"

const SELLER_ROLE_IDS = new Set(["seller", "exhibitor"])

type ExpoPackageDisplayRow = {
  id: string
  expo_id: string
  package_definition_id: string
  source: ExpoPackageDisplaySource
  name: string
  description: string
  price: string | number
  price_unit: string
  benefits: unknown
  is_featured: boolean
  is_public: boolean
  sort_order: number
  created_at: string | Date
  updated_at: string | Date
}

function rowToPackageDisplay(row: ExpoPackageDisplayRow): ExpoPackageDisplay {
  return {
    id: row.id,
    expoId: row.expo_id,
    packageDefinitionId: row.package_definition_id,
    source: row.source,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    priceUnit: row.price_unit,
    benefits: Array.isArray(row.benefits)
      ? row.benefits.filter((item): item is string => typeof item === "string")
      : [],
    isFeatured: row.is_featured,
    isPublic: row.is_public,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  }
}

function packageCode(expoId: string, name: string, index: number) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return `expo_${expoId.replace(/[^a-z0-9]+/g, "_").slice(0, 16)}_${normalized || "package"}_${index + 1}_${randomUUID().slice(0, 8)}`
}

function findDefaultExpoPlan(plans: ExpoPackagePlanOption[]) {
  return plans
    .filter((plan) => plan.targetType === "EXPO" && plan.isActive)
    .sort((a, b) => a.tierRank - b.tierRank || a.name.localeCompare(b.name))[0]
}

function findDefaultSellerRole(roles: ExpoPackageRoleOption[]) {
  return (
    roles.find((role) => SELLER_ROLE_IDS.has(role.id)) ??
    roles.find((role) => /seller|exhibitor/i.test(role.name))
  )
}

function resolvePlanRole(
  pkg: ExpoPackageInput,
  workspace: ExpoPackageFormWorkspace
) {
  const advancedPlan = pkg.advanced?.planId
    ? workspace.plans.find((plan) => plan.id === pkg.advanced?.planId)
    : null
  const advancedRole = pkg.advanced?.roleCode
    ? workspace.roles.find((role) => role.id === pkg.advanced?.roleCode)
    : null
  const plan = advancedPlan ?? findDefaultExpoPlan(workspace.plans)
  const role = advancedRole ?? findDefaultSellerRole(workspace.roles)

  if (!plan) throw new Error("Advanced plan must target EXPO.")
  if (plan.targetType !== "EXPO") {
    throw new Error("Advanced plan must target EXPO.")
  }
  if (!role) throw new Error("Inline package requires seller/exhibitor role.")

  return { planId: plan.id, roleCode: role.id }
}

async function packageHasExpoBinding(packageId: string, expoId: string) {
  const rows = (await sql`
    select 1
    from package_plans pp
    inner join plans p on p.id = pp.plan_id
    where pp.package_id = ${packageId}
      and pp.expo_id = ${expoId}
      and pp.validity_type = 'EVENT_BOUND'
      and p.target_type = 'EXPO'
    limit 1
  `) as { "?column?": number }[]
  return rows.length > 0
}

export async function getExpoPackageFormWorkspace(): Promise<ExpoPackageFormWorkspace> {
  const workspace = await getPackageDefinitionWorkspace()
  const options = await getPackageDefinitionOptions()
  return {
    packages: workspace.packages,
    plans: options.plans,
    roles: options.roles
  }
}

export async function listExpoPackageDisplays(
  expoId: string
): Promise<ExpoPackageDisplay[]> {
  const rows = (await sql`
    select *
    from expo_package_displays
    where expo_id = ${expoId}
    order by sort_order asc, created_at asc
  `) as ExpoPackageDisplayRow[]
  return rows.map(rowToPackageDisplay)
}

export async function listPublicExpoPackageDisplays(
  expoId: string
): Promise<ExpoPackageDisplay[]> {
  const rows = (await sql`
    select *
    from expo_package_displays
    where expo_id = ${expoId} and is_public = true
    order by sort_order asc, created_at asc
  `) as ExpoPackageDisplayRow[]
  return rows.map(rowToPackageDisplay)
}

export async function saveExpoPackageDisplays(
  expoId: string,
  input: unknown,
  userId: string
): Promise<void> {
  const parsed = validateExpoPackageInputs(input)
  if (!parsed.ok) throw new Error(parsed.error)

  const workspace = await getExpoPackageFormWorkspace()
  const packageIds = new Set(workspace.packages.map((pkg) => pkg.id))
  const keepIds: string[] = []

  for (const [index, pkg] of parsed.packages.entries()) {
    let packageDefinitionId = pkg.packageDefinitionId
    let source: ExpoPackageDisplaySource = "linked"

    if (pkg.mode === "create_new") {
      const { planId, roleCode } = resolvePlanRole(pkg, workspace)
      packageDefinitionId = await createPackageDefinitionInCurrentTransaction(
        userId,
        {
          code: packageCode(expoId, pkg.name, index),
          name: pkg.name,
          description: pkg.description ?? "",
          price: pkg.price,
          priceUnit: pkg.priceUnit,
          imageUrl: "",
          isPublic: pkg.isPublic,
          isActive: true,
          plans: [
            {
              planId,
              roleCode,
              validityType: "EVENT_BOUND",
              durationMonths: null,
              expoId
            }
          ]
        }
      )
      source = "inline_created"
    } else if (!packageDefinitionId || !packageIds.has(packageDefinitionId)) {
      throw new Error("Selected package does not exist.")
    } else if (!(await packageHasExpoBinding(packageDefinitionId, expoId))) {
      const { planId, roleCode } = resolvePlanRole(pkg, workspace)
      await ensurePackageExpoPlanInCurrentTransaction(packageDefinitionId, {
        planId,
        roleCode,
        expoId
      })
    }

    if (!packageDefinitionId) throw new Error("Selected package does not exist.")

    const displayId = pkg.id ?? `expo-package-${randomUUID()}`
    keepIds.push(displayId)

    await sql`
      insert into expo_package_displays (
        id,
        expo_id,
        package_definition_id,
        source,
        name,
        description,
        price,
        price_unit,
        benefits,
        is_featured,
        is_public,
        sort_order,
        created_at,
        updated_at
      )
      values (
        ${displayId},
        ${expoId},
        ${packageDefinitionId},
        ${source},
        ${pkg.name},
        ${pkg.description ?? ""},
        ${pkg.price},
        ${pkg.priceUnit},
        ${JSON.stringify(pkg.benefits)}::jsonb,
        ${pkg.isFeatured},
        ${pkg.isPublic},
        ${index},
        now(),
        now()
      )
      on conflict (id) do update
      set
        package_definition_id = excluded.package_definition_id,
        source = excluded.source,
        name = excluded.name,
        description = excluded.description,
        price = excluded.price,
        price_unit = excluded.price_unit,
        benefits = excluded.benefits,
        is_featured = excluded.is_featured,
        is_public = excluded.is_public,
        sort_order = excluded.sort_order,
        updated_at = now()
      where expo_package_displays.expo_id = ${expoId}
    `
  }

  if (keepIds.length === 0) {
    await sql`delete from expo_package_displays where expo_id = ${expoId}`
    return
  }

  await sql`
    delete from expo_package_displays
    where expo_id = ${expoId}
      and not (id = any(${keepIds}))
  `
}
```

- [ ] **Step 2: Run typecheck for DB helper**

Run:

```bash
bun typecheck
```

Expected: no errors in `lib/tradexpo/db/expo-package-displays.ts`. Fix import paths and table type casts before continuing.

---

### Task 5: Put package and marketing saves inside expo transactions

**Files:**

- Modify: `lib/tradexpo/db/platform-data.ts`
- Modify: `app/api/tradexpo/expos/route.ts`
- Modify: `app/api/tradexpo/expos/[expoId]/route.ts`

- [ ] **Step 1: Add transaction callback to expo save input**

In `lib/tradexpo/db/platform-data.ts`, extend `CreateExpoWithHallsInput`:

```ts
export type CreateExpoWithHallsInput = {
  name: string
  slug?: string
  description: string
  thumbnailUrl: string
  expoTemplateId: string
  categoryIds: string[]
  schedulePrecision: ExpoSchedulePrecision
  startAt: string | null
  endAt: string | null
  timezone: string
  scheduleMonth: number | null
  scheduleYear: number | null
  ownerUserId: string
  ownerEmail: string
  tenantPartnerOrgId?: string | null
  displayTargetIds?: string[]
  halls: ExpoHallDraft[]
  afterWrite?: (expoId: string) => Promise<void>
}
```

- [ ] **Step 2: Call callback in create helper before commit**

In `createExpoWithHalls()`, after the hall insert loop and before `await sql\`commit\``, add:

```ts
if (input.afterWrite) {
  await input.afterWrite(expoId)
}
```

The end of the transaction block should be:

```ts
for (const hall of input.halls) {
  const hallId = `expo-hall-${randomUUID()}`
  await sql`
    insert into expo_halls (
      id,
      expo_id,
      sort_order,
      hall_name,
      hall_template_id,
      basic_qty,
      professional_qty,
      premium_qty
    )
    values (
      ${hallId},
      ${expoId},
      ${order},
      ${hall.hallName},
      ${hall.hallTemplateId},
      ${hall.basicQty},
      ${hall.professionalQty},
      ${hall.premiumQty}
    )
  `
  order += 1
}

if (input.afterWrite) {
  await input.afterWrite(expoId)
}

await sql`commit`
```

- [ ] **Step 3: Call callback in update helper before commit**

In `updateExpoWithHalls()`, after the hall insert loop and before `await sql\`commit\``, add:

```ts
if (input.afterWrite) {
  await input.afterWrite(expoId)
}
```

- [ ] **Step 4: Update create route imports**

In `app/api/tradexpo/expos/route.ts`, add imports:

```ts
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { saveExpoPackageDisplays } from "@/lib/tradexpo/db/expo-package-displays"
import { validateExpoPackageInputs } from "@/lib/tradexpo/expo-package-displays"
```

- [ ] **Step 5: Parse package payload in create route**

In the create route body type, add:

```ts
packages?: unknown
```

After marketing validation, add:

```ts
const packageResult = validateExpoPackageInputs(body.packages)
if (!packageResult.ok) {
  return NextResponse.json({ error: packageResult.error }, { status: 400 })
}

let userId: string
try {
  userId = await getCurrentUserIdFromRequest()
} catch {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

- [ ] **Step 6: Save packages and marketing inside create transaction**

Replace the existing create call + marketing publish block:

```ts
const result = await createExpoWithHalls({
  name,
  description,
  thumbnailUrl: body.thumbnailUrl?.trim() ?? "",
  expoTemplateId,
  categoryIds,
  schedulePrecision: schedule.schedulePrecision,
  startAt: schedule.startAt,
  endAt: schedule.endAt,
  timezone: schedule.timezone,
  scheduleMonth: schedule.scheduleMonth,
  scheduleYear: schedule.scheduleYear,
  ownerUserId,
  ownerEmail,
  tenantPartnerOrgId: tenantResult.tenantPartnerOrgId,
  displayTargetIds: tenantResult.displayTargetIds,
  halls
})
await publishAdminExpoMarketingContent(
  result.id,
  marketingResult.content,
  null
)
return NextResponse.json({ id: result.id })
```

with:

```ts
const result = await createExpoWithHalls({
  name,
  description,
  thumbnailUrl: body.thumbnailUrl?.trim() ?? "",
  expoTemplateId,
  categoryIds,
  schedulePrecision: schedule.schedulePrecision,
  startAt: schedule.startAt,
  endAt: schedule.endAt,
  timezone: schedule.timezone,
  scheduleMonth: schedule.scheduleMonth,
  scheduleYear: schedule.scheduleYear,
  ownerUserId,
  ownerEmail,
  tenantPartnerOrgId: tenantResult.tenantPartnerOrgId,
  displayTargetIds: tenantResult.displayTargetIds,
  halls,
  afterWrite: async (createdExpoId) => {
    await saveExpoPackageDisplays(
      createdExpoId,
      packageResult.packages,
      userId
    )
    await publishAdminExpoMarketingContent(
      createdExpoId,
      marketingResult.content,
      userId
    )
  }
})
return NextResponse.json({ id: result.id })
```

- [ ] **Step 7: Update edit route imports and body type**

In `app/api/tradexpo/expos/[expoId]/route.ts`, add:

```ts
import { saveExpoPackageDisplays } from "@/lib/tradexpo/db/expo-package-displays"
import { validateExpoPackageInputs } from "@/lib/tradexpo/expo-package-displays"
```

In the body type, add:

```ts
packages?: unknown
```

- [ ] **Step 8: Parse package payload in edit route**

After marketing validation in `PUT`, add:

```ts
const packageResult = validateExpoPackageInputs(body.packages)
if (!packageResult.ok) {
  return NextResponse.json({ error: packageResult.error }, { status: 400 })
}
```

- [ ] **Step 9: Save packages and marketing inside update transaction**

Replace the `await updateExpoWithHalls(...)` and following `await publishAdminExpoMarketingContent(...)` with:

```ts
await updateExpoWithHalls(expoId, {
  name,
  slug: slug || undefined,
  description,
  thumbnailUrl: body.thumbnailUrl?.trim() ?? "",
  expoTemplateId,
  categoryIds,
  schedulePrecision: schedule.schedulePrecision,
  startAt: schedule.startAt,
  endAt: schedule.endAt,
  timezone: schedule.timezone,
  scheduleMonth: schedule.scheduleMonth,
  scheduleYear: schedule.scheduleYear,
  ownerUserId,
  ownerEmail,
  tenantPartnerOrgId: tenantResult.tenantPartnerOrgId,
  displayTargetIds: tenantResult.displayTargetIds,
  halls,
  afterWrite: async (savedExpoId) => {
    await saveExpoPackageDisplays(
      savedExpoId,
      packageResult.packages,
      userId ?? ownerUserId
    )
    await publishAdminExpoMarketingContent(
      savedExpoId,
      marketingResult.content,
      userId
    )
  }
})
return NextResponse.json({ ok: true })
```

- [ ] **Step 10: Run typecheck for transaction and API changes**

Run:

```bash
bun typecheck
```

Expected: no errors in changed API routes or `platform-data.ts`. Fix missing imports and nullable `userId` errors before continuing.

---

### Task 6: Load package workspace into Admin expo form pages

**Files:**

- Modify: `app/(dashboard)/admin/tradexpo/expos/new/page.tsx`
- Modify: `app/(dashboard)/admin/tradexpo/expos/[expoId]/edit/page.tsx`
- Modify: `components/tradexpo/expo-form/types.ts`

- [ ] **Step 1: Add ExpoForm props for packages**

In `components/tradexpo/expo-form/types.ts`, add imports:

```ts
  ExpoPackageDisplay,
  ExpoPackageFormWorkspace,
```

Update `ExpoFormProps` common fields:

```ts
export type ExpoFormProps = {
  categories: ExpoCategory[]
  layoutTemplates: ExpoLayoutTemplate[]
  hallTemplates: HallTemplate[]
  tenantOptions?: ExpoTenantOption[]
  packageWorkspace?: ExpoPackageFormWorkspace
  initialPackages?: ExpoPackageDisplay[]
  cancelHref?: string
  successHref?: string
  submitEndpoint?: string
  editableScope?: "admin" | "partner-content"
  isSuper?: boolean
  initialMarketingContent?: ExpoMarketingContent
} & (
  | { mode: "create" }
  | {
      mode: "edit"
      expoId: string
      initialExpo: Expo
      initialHalls: ExpoHall[]
      initialOwner: OwnerPick | null
    }
)
```

- [ ] **Step 2: Add `packages` step id**

In `components/tradexpo/expo-form/types.ts`, change `ExpoFormStepId` to:

```ts
export type ExpoFormStepId =
  | "general"
  | "schedule"
  | "management"
  | "halls"
  | "packages"
  | "marketing"
```

- [ ] **Step 3: Load workspace on create page**

In `app/(dashboard)/admin/tradexpo/expos/new/page.tsx`, add import:

```ts
import { getExpoPackageFormWorkspace } from "@/lib/tradexpo/db/expo-package-displays"
```

Change data loading to include package workspace:

```ts
const [
  categories,
  layoutTemplates,
  hallTemplates,
  tenantOptions,
  packageWorkspace
] = await Promise.all([
  listExpoCategories(),
  listExpoLayoutTemplates(),
  listHallTemplates(),
  listActiveExpoTenantOptions(),
  getExpoPackageFormWorkspace()
])
```

Pass it into `ExpoForm`:

```tsx
<ExpoForm
  mode="create"
  categories={categories}
  layoutTemplates={layoutTemplates}
  hallTemplates={hallTemplates}
  tenantOptions={tenantOptions}
  packageWorkspace={packageWorkspace}
/>
```

- [ ] **Step 4: Load workspace and initial displays on edit page**

In `app/(dashboard)/admin/tradexpo/expos/[expoId]/edit/page.tsx`, add import:

```ts
import {
  getExpoPackageFormWorkspace,
  listExpoPackageDisplays
} from "@/lib/tradexpo/db/expo-package-displays"
```

Change Promise array to include package data:

```ts
const [
  categories,
  layoutTemplates,
  hallTemplates,
  halls,
  marketingVersion,
  tenantOptions,
  packageWorkspace,
  initialPackages
] = await Promise.all([
  listExpoCategories(),
  listExpoLayoutTemplates(),
  listHallTemplates(),
  listExpoHalls(expoId),
  getLatestExpoMarketingContentForEdit(expoId),
  listActiveExpoTenantOptions(),
  getExpoPackageFormWorkspace(),
  listExpoPackageDisplays(expoId)
])
```

Pass props:

```tsx
<ExpoForm
  mode="edit"
  expoId={expoId}
  initialExpo={expo}
  isSuper={isSuper}
  initialHalls={halls}
  initialOwner={initialOwner}
  categories={categories}
  layoutTemplates={layoutTemplates}
  hallTemplates={hallTemplates}
  tenantOptions={tenantOptions}
  packageWorkspace={packageWorkspace}
  initialPackages={initialPackages}
  initialMarketingContent={marketingVersion?.content}
/>
```

- [ ] **Step 5: Run typecheck for page props**

Run:

```bash
bun typecheck
```

Expected: errors may remain because `ExpoForm` has not consumed package props yet. Continue only if page import paths are valid and `ExpoFormProps` accepts new fields.

---

### Task 7: Add package row helpers and Admin Packages step UI

**Files:**

- Modify: `components/tradexpo/expo-form/row-helpers.ts`
- Modify: `components/tradexpo/expo-form/constants.ts`
- Modify: `components/tradexpo/expo-form/types.ts`
- Create: `components/tradexpo/expo-form/packages-step.tsx`

- [ ] **Step 1: Add package form row type**

In `components/tradexpo/expo-form/types.ts`, add:

```ts
export type ExpoPackageFormRow = {
  key: string
  id?: string
  mode: "link_existing" | "create_new"
  packageDefinitionId?: string
  name: string
  description: string
  price: string
  priceUnit: string
  benefits: string[]
  isFeatured: boolean
  isPublic: boolean
  advanced: {
    planId: string
    roleCode: string
  }
}
```

- [ ] **Step 2: Add package row helper functions**

In `components/tradexpo/expo-form/row-helpers.ts`, update imports:

```ts
import type {
  ExpoHall,
  ExpoMarketingContent,
  ExpoPackageDisplay
} from "@/lib/tradexpo/types"
import type {
  AudienceCardFormRow,
  BenefitCardFormRow,
  ExpoPackageFormRow,
  HallFormRow
} from "./types"
```

Add these functions after `newBenefitCard()`:

```ts
export function packageDisplaysToRows(
  packages: ExpoPackageDisplay[] = []
): ExpoPackageFormRow[] {
  return packages.map((pkg) => ({
    key: pkg.id,
    id: pkg.id,
    mode: "link_existing",
    packageDefinitionId: pkg.packageDefinitionId,
    name: pkg.name,
    description: pkg.description,
    price: String(pkg.price),
    priceUnit: pkg.priceUnit,
    benefits: pkg.benefits.length > 0 ? pkg.benefits : [""],
    isFeatured: pkg.isFeatured,
    isPublic: pkg.isPublic,
    advanced: {
      planId: "",
      roleCode: ""
    }
  }))
}

export function newExpoPackageRow(): ExpoPackageFormRow {
  return {
    key: rowKey("expo-package"),
    mode: "create_new",
    packageDefinitionId: undefined,
    name: "",
    description: "",
    price: "0",
    priceUnit: "VND",
    benefits: [""],
    isFeatured: false,
    isPublic: true,
    advanced: {
      planId: "",
      roleCode: ""
    }
  }
}
```

- [ ] **Step 3: Insert Packages step in constants**

In `components/tradexpo/expo-form/constants.ts`, insert this object between `halls` and `marketing`:

```ts
{
  id: "packages",
  title: "Seller packages",
  description: "Pricing and benefits for exhibitor packages"
},
```

Update `PARTNER_EXPO_FORM_STEPS` to hide packages:

```ts
export const PARTNER_EXPO_FORM_STEPS = ADMIN_EXPO_FORM_STEPS.filter(
  (step) =>
    step.id !== "management" && step.id !== "halls" && step.id !== "packages"
)
```

- [ ] **Step 4: Create PackagesStep component**

Create `components/tradexpo/expo-form/packages-step.tsx` with this content:

```tsx
import { PlusIcon, Trash2Icon } from "lucide-react"
import type * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ExpoPackageFormWorkspace } from "@/lib/tradexpo/types"
import { newExpoPackageRow } from "./row-helpers"
import type { ExpoPackageFormRow } from "./types"

type PackagesStepProps = {
  packages: ExpoPackageFormRow[]
  packageWorkspace?: ExpoPackageFormWorkspace
  onPackagesChange: React.Dispatch<React.SetStateAction<ExpoPackageFormRow[]>>
  onUpdatePackage: (index: number, patch: Partial<ExpoPackageFormRow>) => void
  onUpdatePackageBenefit: (
    packageIndex: number,
    benefitIndex: number,
    value: string
  ) => void
}

export function PackagesStep({
  packages,
  packageWorkspace,
  onPackagesChange,
  onUpdatePackage,
  onUpdatePackageBenefit
}: PackagesStepProps) {
  const packageOptions = packageWorkspace?.packages ?? []
  const expoPlans = (packageWorkspace?.plans ?? []).filter(
    (plan) => plan.targetType === "EXPO" && plan.isActive
  )
  const roles = packageWorkspace?.roles ?? []

  function applyExistingPackage(index: number, packageId: string) {
    const selected = packageOptions.find((pkg) => pkg.id === packageId)
    if (!selected) {
      onUpdatePackage(index, { packageDefinitionId: packageId })
      return
    }
    onUpdatePackage(index, {
      packageDefinitionId: selected.id,
      name: selected.name,
      description: selected.description,
      price: String(selected.price),
      priceUnit: selected.priceUnit,
      benefits: selected.description ? [selected.description] : [""],
      isPublic: selected.isPublic
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl leading-none">Seller packages</h2>
        <p className="text-muted-foreground text-sm">
          Configure exhibitor packages shown on Expo Detail. Each package links
          to subscription package data for future checkout flows.
        </p>
      </div>

      <div className="space-y-3">
        {packages.map((pkg, packageIndex) => (
          <section key={pkg.key} className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-medium text-sm">
                  Package {packageIndex + 1}
                </h3>
                <p className="text-muted-foreground text-xs">
                  Link an existing package or create a new event-bound seller
                  package for this expo.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  onPackagesChange((prev) =>
                    prev.filter((_, index) => index !== packageIndex)
                  )
                }
              >
                <Trash2Icon />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Mode</Label>
                <Select
                  value={pkg.mode}
                  onValueChange={(value) =>
                    onUpdatePackage(packageIndex, {
                      mode: value as ExpoPackageFormRow["mode"],
                      packageDefinitionId:
                        value === "create_new"
                          ? undefined
                          : pkg.packageDefinitionId
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link_existing">
                      Link existing package
                    </SelectItem>
                    <SelectItem value="create_new">Create new package</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pkg.mode === "link_existing" ? (
                <div className="grid gap-2">
                  <Label>Existing package</Label>
                  <Select
                    value={pkg.packageDefinitionId ?? ""}
                    onValueChange={(value) =>
                      applyExistingPackage(packageIndex, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packageOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Package name</Label>
                <Input
                  value={pkg.name}
                  onChange={(event) =>
                    onUpdatePackage(packageIndex, { name: event.target.value })
                  }
                  placeholder="Premium Exhibitor Package"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <div className="grid gap-2">
                  <Label>Price</Label>
                  <Input
                    min={0}
                    type="number"
                    value={pkg.price}
                    onChange={(event) =>
                      onUpdatePackage(packageIndex, { price: event.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Input
                    value={pkg.priceUnit}
                    onChange={(event) =>
                      onUpdatePackage(packageIndex, {
                        priceUnit: event.target.value
                      })
                    }
                    placeholder="VND"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={pkg.description}
                onChange={(event) =>
                  onUpdatePackage(packageIndex, {
                    description: event.target.value
                  })
                }
                rows={2}
                placeholder="Short package description shown on Expo Detail."
              />
            </div>

            <div className="space-y-2">
              <Label>Benefits</Label>
              {pkg.benefits.map((benefit, benefitIndex) => (
                <div key={`${pkg.key}-benefit-${benefitIndex}`} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={(event) =>
                      onUpdatePackageBenefit(
                        packageIndex,
                        benefitIndex,
                        event.target.value
                      )
                    }
                    placeholder="Benefit item"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pkg.benefits.length <= 1}
                    onClick={() =>
                      onUpdatePackage(packageIndex, {
                        benefits: pkg.benefits.filter(
                          (_, index) => index !== benefitIndex
                        )
                      })
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pkg.benefits.length >= 10}
                onClick={() =>
                  onUpdatePackage(packageIndex, {
                    benefits: [...pkg.benefits, ""]
                  })
                }
              >
                <PlusIcon className="mr-1 size-4" />
                Add benefit
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={pkg.isFeatured}
                  onCheckedChange={(value) =>
                    onUpdatePackage(packageIndex, {
                      isFeatured: Boolean(value)
                    })
                  }
                />
                Featured package
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={pkg.isPublic}
                  onCheckedChange={(value) =>
                    onUpdatePackage(packageIndex, {
                      isPublic: Boolean(value)
                    })
                  }
                />
                Show on public Expo Detail
              </label>
            </div>

            <div className="grid gap-3 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Advanced EXPO plan</Label>
                <Select
                  value={pkg.advanced.planId}
                  onValueChange={(value) =>
                    onUpdatePackage(packageIndex, {
                      advanced: { ...pkg.advanced, planId: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto default" />
                  </SelectTrigger>
                  <SelectContent>
                    {expoPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Advanced role</Label>
                <Select
                  value={pkg.advanced.roleCode}
                  onValueChange={(value) =>
                    onUpdatePackage(packageIndex, {
                      advanced: { ...pkg.advanced, roleCode: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto seller/exhibitor" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={packages.length >= 6}
          onClick={() =>
            onPackagesChange((prev) => [...prev, newExpoPackageRow()])
          }
        >
          <PlusIcon className="mr-1 size-4" />
          Add seller package
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run typecheck for component syntax**

Run:

```bash
bun typecheck
```

Expected: may fail until `ExpoForm` uses `PackagesStep`, but `packages-step.tsx` should not have local JSX/type errors.

---

### Task 8: Wire Packages step into ExpoForm state and payload

**Files:**

- Modify: `components/tradexpo/expo-form.tsx`

- [ ] **Step 1: Add imports**

In `components/tradexpo/expo-form.tsx`, add imports:

```ts
import { validateExpoPackageInputs } from "@/lib/tradexpo/expo-package-displays"
import { PackagesStep } from "./expo-form/packages-step"
```

Extend row-helper import:

```ts
  newExpoPackageRow,
  packageDisplaysToRows
```

Extend type import:

```ts
  ExpoPackageFormRow,
```

- [ ] **Step 2: Add packages state after halls state**

After:

```ts
const [halls, setHalls] = React.useState<HallFormRow[]>(() =>
  isEdit ? hallsToRows(props.initialHalls) : [newHallRow(0)]
)
```

add:

```ts
const [expoPackages, setExpoPackages] = React.useState<ExpoPackageFormRow[]>(
  () =>
    isEdit
      ? packageDisplaysToRows(props.initialPackages)
      : [newExpoPackageRow()]
)
```

- [ ] **Step 3: Add package update helpers after benefit helpers**

Add:

```ts
function updateExpoPackage(
  index: number,
  patch: Partial<ExpoPackageFormRow>
) {
  setExpoPackages((prev) =>
    prev.map((pkg, i) => {
      if (i !== index) {
        return patch.isFeatured ? { ...pkg, isFeatured: false } : pkg
      }
      return { ...pkg, ...patch }
    })
  )
}

function updateExpoPackageBenefit(
  packageIndex: number,
  benefitIndex: number,
  value: string
) {
  setExpoPackages((prev) =>
    prev.map((pkg, i) =>
      i === packageIndex
        ? {
            ...pkg,
            benefits: pkg.benefits.map((benefit, j) =>
              j === benefitIndex ? value : benefit
            )
          }
        : pkg
    )
  )
}

function buildExpoPackages() {
  return expoPackages.map((pkg, index) => ({
    id: pkg.id,
    mode: pkg.mode,
    packageDefinitionId: pkg.packageDefinitionId,
    name: pkg.name,
    description: pkg.description,
    price: Number(pkg.price),
    priceUnit: pkg.priceUnit,
    benefits: pkg.benefits,
    isFeatured: pkg.isFeatured,
    isPublic: pkg.isPublic,
    sortOrder: index,
    advanced: {
      planId: pkg.advanced.planId || undefined,
      roleCode: pkg.advanced.roleCode || undefined
    }
  }))
}
```

- [ ] **Step 4: Validate packages in submit handler**

In `onSubmit`, after marketing validation, add:

```ts
const packages = isPartnerContentEdit ? [] : buildExpoPackages()
const packageResult = validateExpoPackageInputs(packages)
if (!packageResult.ok) {
  setError(packageResult.error)
  return
}
```

- [ ] **Step 5: Add packages to payload**

In `payload`, add:

```ts
packages: packageResult.packages,
```

The payload block should include:

```ts
marketingContent,
packages: packageResult.packages,
halls: halls.map((h) => ({
```

- [ ] **Step 6: Render PackagesStep**

Before the Marketing step render, add:

```tsx
{!isPartnerContentEdit && activeStep.id === "packages" ? (
  <PackagesStep
    packages={expoPackages}
    packageWorkspace={props.packageWorkspace}
    onPackagesChange={setExpoPackages}
    onUpdatePackage={updateExpoPackage}
    onUpdatePackageBenefit={updateExpoPackageBenefit}
  />
) : null}
```

- [ ] **Step 7: Run typecheck for full form wiring**

Run:

```bash
bun typecheck
```

Expected: no errors from `ExpoForm`, `types.ts`, `constants.ts`, or `packages-step.tsx`. Fix any missing imports or `undefined` prop issues before public rendering work.

---

### Task 9: Render package section on public Expo Detail

**Files:**

- Modify: `components/tradexpo/expo-detail/sections.tsx`
- Modify: `app/(tradexpo)/expos/[slug]/page.tsx`

- [ ] **Step 1: Import package display type in sections**

In `components/tradexpo/expo-detail/sections.tsx`, extend type imports:

```ts
  ExpoPackageDisplay,
```

- [ ] **Step 2: Add currency formatter and Packages section**

In `sections.tsx`, after `ParticipantValues()` and before `BoothTier()`, add:

```tsx
function formatPackagePrice(price: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: currency === "VND" ? 0 : 2
  }).format(price)
}

export function SellerPackages({
  packages,
  isAuthenticated
}: {
  packages: ExpoPackageDisplay[]
  isAuthenticated: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const visiblePackages = packages
    .filter((pkg) => pkg.isPublic)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (visiblePackages.length === 0) return null

  function handleChoosePackage(packageDefinitionId: string) {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }
    router.push(`/plan-subscriptions/packages/${packageDefinitionId}`)
  }

  return (
    <section className="bg-white px-4 py-16 md:px-20">
      <div className="container mx-auto">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-semibold text-[32px] leading-10">
            Seller packages
          </h2>
          <p className="mt-2 text-foreground">
            Choose an exhibitor package tailored to your expo participation goals.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {visiblePackages.map((pkg) => (
            <article
              key={pkg.id}
              className={cn(
                "flex flex-col rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm",
                pkg.isFeatured && "border-legend shadow-lg ring-2 ring-legend/15"
              )}
            >
              {pkg.isFeatured ? (
                <span className="mb-4 w-fit rounded-full bg-legend/10 px-3 py-1 font-medium text-legend text-xs">
                  Featured
                </span>
              ) : null}
              <h3 className="font-semibold text-xl leading-7">{pkg.name}</h3>
              {pkg.description ? (
                <p className="mt-2 text-muted-foreground text-sm leading-5">
                  {pkg.description}
                </p>
              ) : null}
              <p className="mt-6 font-semibold text-3xl leading-9">
                {formatPackagePrice(pkg.price, pkg.priceUnit)}
              </p>
              <ul className="mt-6 flex-1 space-y-3 border-[#e5e7eb] border-t pt-5">
                {pkg.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-3 text-sm leading-5">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-[#16a34a]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                className="mt-6"
                onClick={() => handleChoosePackage(pkg.packageDefinitionId)}
              >
                Choose package
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Load package displays in public page**

In `app/(tradexpo)/expos/[slug]/page.tsx`, add import:

```ts
import { listPublicExpoPackageDisplays } from "@/lib/tradexpo/db/expo-package-displays"
```

Extend section import:

```ts
  SellerPackages,
```

Update Promise array:

```ts
const [
  exhibitors,
  heroStats,
  wishlistedExpoIds,
  productCount,
  publishedMarketing,
  expoCategories,
  sellerPackages
] = await Promise.all([
  listExpoDetailExhibitorsByName(expo.name, { userId }),
  getExpoHeroStatsByExpo({ id: expo.id, name: expo.name }),
  userId ? listWishlistedTargetIds(userId, "expo") : new Set<string>(),
  countExpoDetailProducts(expo.id),
  getPublishedExpoMarketingContent(expo.id),
  listExpoCategoriesByIds(expo.categoryIds),
  listPublicExpoPackageDisplays(expo.id)
])
```

Render after `ParticipantValues` and before `BoothTier`:

```tsx
<SellerPackages packages={sellerPackages} isAuthenticated={!!userId} />
```

- [ ] **Step 4: Run typecheck for public rendering**

Run:

```bash
bun typecheck
```

Expected: no errors from public page or sections. Keep the `Choose package` target as `/plan-subscriptions/packages/${packageDefinitionId}` because this plan only wires the package definition target for future checkout/subscription behavior.

---

### Task 10: Run formatter/linter and fix Biome output

**Files:**

- Modify only files touched by Tasks 1-9.

- [ ] **Step 1: Run Biome check with write fixes**

Run:

```bash
bun check
```

Expected: Biome formats files, organizes imports, and exits with code `0` or prints actionable issues. Capture exact output.

- [ ] **Step 2: Run final typecheck**

Run:

```bash
bun typecheck
```

Expected: exits with code `0`. If it fails, fix all errors introduced by this feature. If unrelated pre-existing errors appear, record file paths and messages in final report.

- [ ] **Step 3: Inspect git diff**

Run:

```bash
git diff --stat
git diff -- docs/superpowers/specs/2026-06-02-expo-seller-packages-design.md docs/superpowers/plans/2026-06-02-expo-seller-packages.md
```

Expected: stat shows feature files only. The plan/spec diff confirms docs were added/updated intentionally. Do not commit.

---

## Self-review against spec

Spec coverage:

- Admin Packages step: Task 7 and Task 8.
- Link existing package: Task 7 UI and Task 4 DB validation/binding.
- Create inline package: Task 4 and Task 5.
- Event-bound seller/exhibitor defaults with Advanced override: Task 4 and Task 7.
- Public package display: Task 9.
- Linked real subscription package: Task 3 and Task 4.
- Backend validation: Task 2 and Task 4.
- Shared DB/idempotent schema: Task 1.
- Avoid partial saves: Task 5 transaction callback.
- No partner package edits: Task 8 sends `[]` for partner-content scope and Admin-only step hidden.
- No new test files: all verification uses `bun typecheck` and `bun check` only.
- No Chrome MCP UI verification: no browser verification steps included.
- No commit: plan has no commit steps.

Placeholder scan:

- No `TBD`.
- No `TODO`.
- No incomplete test instructions.
- No commit instruction.

Type consistency:

- Form row fields map to `ExpoPackageInput` fields through `buildExpoPackages()`.
- DB row fields map to `ExpoPackageDisplay`.
- Subscription table names use actual repo tables: `packages`, `package_plans`, `plans`, `roles`.
