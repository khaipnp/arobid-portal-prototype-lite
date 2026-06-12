# Badge Database Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static Internal/External badge management with database-backed `levelType + level` badge catalog, display rankings, and strict FK assignment tables.

**Architecture:** Badge seed data moves into `lib/badges`, schema creation is isolated in `lib/badges/schema.ts`, and runtime DB operations live in `lib/badges/db.ts`. Admin API routes expose catalog and ranking persistence, while `BadgeManagementConfig` becomes a DB-backed client component initialized by the admin page.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Neon Postgres via `@neondatabase/serverless`, Bun, shadcn/ui, Biome.

**Project rule:** Do not commit unless the user explicitly asks. Each task ends with a diff/status checkpoint instead of a commit step.

---

## File structure

- Create: `lib/badges/schema.ts` — creates badge DB tables and indexes.
- Create: `lib/badges/db.ts` — badge DB types, row mappers, seed helpers, catalog CRUD, ranking save.
- Move: `components/badges/badge-management-data.ts` → `lib/badges/seed-data.ts` — static seed/catalog source for first DB seed.
- Recreate: `components/badges/badge-management-data.ts` — compatibility re-export from `lib/badges/seed-data`.
- Modify: `lib/platform/ensure-schema.ts` — calls `ensureBadgeSchema()` in both fast and normal schema paths.
- Create: `app/api/admin/badges/route.ts` — list workspace and create badge.
- Create: `app/api/admin/badges/[badgeId]/route.ts` — update and archive badge.
- Create: `app/api/admin/badge-display-contexts/route.ts` — list display contexts via workspace response.
- Create: `app/api/admin/badge-display-contexts/[contextId]/rankings/route.ts` — save context ranking.
- Modify: `app/(dashboard)/admin/settings/badge-management/page.tsx` — load initial workspace server-side.
- Modify: `components/badges/badge-management-config.tsx` — use DB workspace, replace origin UI with level type/level UI, call API for changes.
- Update: `.ui-design/components/badge-management-external-table.json` — rename tracking purpose from external table to catalog table.

No new test files unless the user asks. Verification uses scoped Biome, TypeScript, schema dry/smoke commands, and API smoke when DB write approval is granted.

---

## Task 1: Move badge seed data into `lib/badges`

**Files:**
- Create directory: `lib/badges/`
- Move: `components/badges/badge-management-data.ts` → `lib/badges/seed-data.ts`
- Create: `components/badges/badge-management-data.ts`
- Modify: `lib/badges/seed-data.ts`

- [ ] **Step 1: Move current seed file into lib**

Run:

```bash
rtk mkdir -p lib/badges
rtk git mv components/badges/badge-management-data.ts lib/badges/seed-data.ts
```

Expected: file moves; `rtk git status --short` shows rename or delete/create pair.

- [ ] **Step 2: Recreate compatibility re-export**

Write `components/badges/badge-management-data.ts`:

```ts
export * from "@/lib/badges/seed-data"
```

Expected: existing imports from `./badge-management-data` still resolve.

- [ ] **Step 3: Replace origin-based seed types with level-based types**

In `lib/badges/seed-data.ts`, replace the type section at the top with:

```ts
export type BadgeLevelTypeId = "trust" | "membership" | (string & {})
export type BadgeStatus = "draft" | "active" | "archived"
export type DisplayTarget = "Supplier" | "Product" | "RFQ" | "TradeXpo"

export type BadgeLevelType = {
  id: BadgeLevelTypeId
  name: string
  description: string
  minLevel: number
  maxLevel: number
  sortOrder: number
  isActive: boolean
}

export type BadgeDefinition = {
  id: string
  module: string
  name: string
  levelTypeId: BadgeLevelTypeId
  level: number
  status: BadgeStatus
  group: string
  condition: string
  whereItAppears: string
  designLink?: string
  sortOrder?: number
}

export type BadgeRankingConfig = {
  badgeId: string
  active: boolean
  priority: number
}

export type DisplayContext = {
  id: string
  title: string
  target: DisplayTarget
  surface: string
  ranking: BadgeRankingConfig[]
}

export type EntityPreview = {
  name: string
  eligibleBadgeIds: string[]
}

export type BadgeDraft = {
  name: string
  module: string
  group: string
  levelTypeId: BadgeLevelTypeId
  level: number
  condition: string
  whereItAppears: string
  designLink: string
}

export const badgeLevelTypes: BadgeLevelType[] = [
  {
    id: "trust",
    name: "Trust",
    description: "Reliability, verification, certification, and compliance badges.",
    minLevel: 1,
    maxLevel: 5,
    sortOrder: 1,
    isActive: true
  },
  {
    id: "membership",
    name: "Membership",
    description: "Supplier or platform membership tier badges.",
    minLevel: 1,
    maxLevel: 5,
    sortOrder: 2,
    isActive: true
  }
]

export const emptyBadgeDraft: BadgeDraft = {
  name: "",
  module: "",
  group: "Certificate",
  levelTypeId: "trust",
  level: 1,
  condition: "",
  whereItAppears: "",
  designLink: ""
}
```

- [ ] **Step 4: Remove old origin literals from seed rows**

Run:

```bash
rtk proxy perl -0pi -e 's/\n    origin: "Internal Badge",//g; s/\n      origin: "External Badge" as const,//g' lib/badges/seed-data.ts
```

Expected: `rtk grep 'origin:' lib/badges/seed-data.ts` returns zero matches.

- [ ] **Step 5: Add seed level helpers above `initialBadgeDefinitions`**

Add this block above `export const initialBadgeDefinitions`:

```ts
type BadgeSeedRow = Omit<
  BadgeDefinition,
  "levelTypeId" | "level" | "status" | "sortOrder"
>

const membershipLevelsByName: Record<string, number> = {
  Silver: 1,
  Gold: 2,
  Pioneer: 3,
  Diamond: 4
}

function getSeedBadgeLevel(badge: BadgeSeedRow) {
  const membershipLevel = membershipLevelsByName[badge.name]
  if (membershipLevel) {
    return {
      levelTypeId: "membership" as const,
      level: membershipLevel
    }
  }

  return {
    levelTypeId: "trust" as const,
    level: 1
  }
}
```

Then change:

```ts
const internalBadgeSeedRows: BadgeDefinition[] = [
```

to:

```ts
const internalBadgeSeedRows: BadgeSeedRow[] = [
```

- [ ] **Step 6: Replace `initialBadgeDefinitions` construction**

Replace `initialBadgeDefinitions` with:

```ts
export const initialBadgeDefinitions: BadgeDefinition[] = [
  ...internalBadgeSeedRows.map((badge, index) => ({
    ...badge,
    ...getSeedBadgeLevel(badge),
    status: "active" as const,
    sortOrder: index + 1
  })),
  ...externalBadgeGroupRows.flatMap((group, groupIndex) =>
    group.names.map((name, nameIndex) => ({
      id: makeExternalBadgeId(group.module, name),
      module: group.module,
      name,
      levelTypeId: "trust" as const,
      level: 1,
      status: "active" as const,
      group: group.group,
      condition:
        "Badge eligibility and verification rule must be configured by Admin Portal.",
      whereItAppears: group.whereItAppears,
      sortOrder: internalBadgeSeedRows.length + groupIndex * 100 + nameIndex + 1
    }))
  )
]
```

- [ ] **Step 7: Rename draft exports in downstream imports**

Run:

```bash
rtk grep 'ExternalBadgeDraft\|emptyExternalBadgeDraft' components lib app
```

Expected before implementation: matches in `components/badges/badge-management-config.tsx`.

During UI task, replace those with `BadgeDraft` and `emptyBadgeDraft`.

- [ ] **Step 8: Check seed file type syntax**

Run:

```bash
rtk bunx biome check --write lib/badges/seed-data.ts components/badges/badge-management-data.ts
```

Expected: exit 0 for these files.

- [ ] **Step 9: Checkpoint diff**

Run:

```bash
rtk git diff --stat -- lib/badges/seed-data.ts components/badges/badge-management-data.ts
```

Expected: seed file moved/updated and compatibility re-export created.

---

## Task 2: Add badge schema creation

**Files:**
- Create: `lib/badges/schema.ts`
- Modify: `lib/platform/ensure-schema.ts`

- [ ] **Step 1: Create `lib/badges/schema.ts`**

Write full file:

```ts
import { sql } from "@/lib/db/neon"

export async function ensureBadgeSchema() {
  await sql`
    create table if not exists badge_level_types (
      id text primary key,
      name text not null,
      description text not null default '',
      min_level int not null default 1,
      max_level int not null default 5,
      sort_order int not null default 0,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      check (min_level >= 1),
      check (max_level <= 5),
      check (min_level <= max_level)
    )
  `

  await sql`
    create table if not exists badges (
      id text primary key,
      name text not null,
      module text not null,
      group_name text not null,
      level_type_id text not null references badge_level_types(id) on delete restrict,
      level int not null check (level between 1 and 5),
      condition text not null default '',
      where_it_appears text not null default '',
      design_link text,
      status text not null default 'active' check (status in ('draft', 'active', 'archived')),
      sort_order int not null default 0,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    create index if not exists idx_badges_level_type
    on badges (level_type_id, level, sort_order)
  `

  await sql`
    create index if not exists idx_badges_status
    on badges (status, sort_order)
  `

  await sql`
    create table if not exists badge_display_contexts (
      id text primary key,
      title text not null,
      target text not null check (target in ('Supplier', 'Product', 'RFQ', 'TradeXpo')),
      surface text not null,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists badge_display_rankings (
      context_id text not null references badge_display_contexts(id) on delete cascade,
      badge_id text not null references badges(id) on delete cascade,
      active boolean not null default true,
      priority int not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (context_id, badge_id)
    )
  `

  await sql`
    create index if not exists idx_badge_display_rankings_context_priority
    on badge_display_rankings (context_id, priority)
  `

  await sql`
    create index if not exists idx_badge_display_rankings_badge
    on badge_display_rankings (badge_id)
  `

  await sql`
    create table if not exists company_badges (
      company_id text not null references companies(id) on delete cascade,
      badge_id text not null references badges(id) on delete cascade,
      status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'expired')),
      evidence_url text,
      issued_at timestamptz,
      expires_at timestamptz,
      verified_at timestamptz,
      verified_by text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (company_id, badge_id)
    )
  `

  await sql`
    create index if not exists idx_company_badges_badge
    on company_badges (badge_id)
  `

  await sql`
    create table if not exists company_product_badges (
      product_id text not null references company_products(id) on delete cascade,
      badge_id text not null references badges(id) on delete cascade,
      status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'expired')),
      evidence_url text,
      issued_at timestamptz,
      expires_at timestamptz,
      verified_at timestamptz,
      verified_by text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (product_id, badge_id)
    )
  `

  await sql`
    create index if not exists idx_company_product_badges_badge
    on company_product_badges (badge_id)
  `

  await sql`
    create table if not exists expo_badges (
      expo_id text not null references expos(id) on delete cascade,
      badge_id text not null references badges(id) on delete cascade,
      status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'expired')),
      evidence_url text,
      issued_at timestamptz,
      expires_at timestamptz,
      verified_at timestamptz,
      verified_by text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (expo_id, badge_id)
    )
  `

  await sql`
    create index if not exists idx_expo_badges_badge
    on expo_badges (badge_id)
  `
}
```

- [ ] **Step 2: Import schema helper in `lib/platform/ensure-schema.ts`**

Add near existing imports:

```ts
import { ensureBadgeSchema } from "@/lib/badges/schema"
```

- [ ] **Step 3: Call helper in fast path**

Inside `if (appliedNames.has(LATEST_PLATFORM_MIGRATION))`, after `await ensureAccountProfileSchema()`, add:

```ts
      await ensureBadgeSchema()
```

- [ ] **Step 4: Call helper in normal path after `users` and auth tables exist**

After auth session indexes are created (`idx_auth_sessions_user_id`, `idx_auth_sessions_expires_at`) and before UUID normalization migration logic, add:

```ts
  await ensureBadgeSchema()
```

This placement is required because assignment tables reference `companies`, `company_products`, `expos`, and `users`.

- [ ] **Step 5: Format schema files**

Run:

```bash
rtk bunx biome check --write lib/badges/schema.ts lib/platform/ensure-schema.ts
```

Expected: exit 0 for scoped files.

- [ ] **Step 6: Checkpoint diff**

Run:

```bash
rtk git diff --stat -- lib/badges/schema.ts lib/platform/ensure-schema.ts
```

Expected: new schema file and ensure-schema import/calls.

---

## Task 3: Add badge DB service layer

**Files:**
- Create: `lib/badges/db.ts`

- [ ] **Step 1: Create service file with types, mappers, seed, CRUD, ranking save**

Write `lib/badges/db.ts`:

```ts
import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
import {
  badgeLevelTypes as seedBadgeLevelTypes,
  displayContexts as seedDisplayContexts,
  initialBadgeDefinitions,
  makeExternalBadgeId,
  type BadgeDefinition,
  type BadgeDraft,
  type BadgeLevelType,
  type BadgeLevelTypeId,
  type BadgeRankingConfig,
  type BadgeStatus,
  type DisplayContext,
  type DisplayTarget
} from "@/lib/badges/seed-data"
import { ensureBadgeSchema } from "@/lib/badges/schema"

export type BadgeManagementWorkspace = {
  levelTypes: BadgeLevelType[]
  badges: BadgeDefinition[]
  displayContexts: DisplayContext[]
}

type BadgeRow = {
  id: string
  name: string
  module: string
  group_name: string
  level_type_id: BadgeLevelTypeId
  level: number | string
  condition: string
  where_it_appears: string
  design_link: string | null
  status: BadgeStatus
  sort_order: number | string
}

type BadgeLevelTypeRow = {
  id: BadgeLevelTypeId
  name: string
  description: string
  min_level: number | string
  max_level: number | string
  sort_order: number | string
  is_active: boolean
}

type DisplayContextRow = {
  id: string
  title: string
  target: DisplayTarget
  surface: string
  ranking: BadgeRankingConfig[] | string | null
}

function toNumber(value: number | string) {
  return Number(value) || 0
}

function mapBadgeLevelType(row: BadgeLevelTypeRow): BadgeLevelType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    minLevel: toNumber(row.min_level),
    maxLevel: toNumber(row.max_level),
    sortOrder: toNumber(row.sort_order),
    isActive: row.is_active
  }
}

function mapBadge(row: BadgeRow): BadgeDefinition {
  return {
    id: row.id,
    name: row.name,
    module: row.module,
    group: row.group_name,
    levelTypeId: row.level_type_id,
    level: toNumber(row.level),
    condition: row.condition,
    whereItAppears: row.where_it_appears,
    designLink: row.design_link ?? undefined,
    status: row.status,
    sortOrder: toNumber(row.sort_order)
  }
}

function parseRanking(value: DisplayContextRow["ranking"]): BadgeRankingConfig[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value) as BadgeRankingConfig[]
    return Array.isArray(parsed) ? parsed : []
  } catch (_error) {
    return []
  }
}

function mapDisplayContext(row: DisplayContextRow): DisplayContext {
  return {
    id: row.id,
    title: row.title,
    target: row.target,
    surface: row.surface,
    ranking: parseRanking(row.ranking)
  }
}

function makeBadgeId(module: string, name: string) {
  return makeExternalBadgeId(module || "Badge", name || `Custom ${randomUUID()}`)
}

async function getLevelType(levelTypeId: string) {
  const rows = (await sql`
    select id, min_level, max_level
    from badge_level_types
    where id = ${levelTypeId}
    limit 1
  `) as { id: string; min_level: number | string; max_level: number | string }[]

  return rows[0]
}

async function assertLevelInput(levelTypeId: string, level: number) {
  const levelType = await getLevelType(levelTypeId)
  if (!levelType) throw new Error("Level type not found.")

  const minLevel = toNumber(levelType.min_level)
  const maxLevel = toNumber(levelType.max_level)
  if (level < minLevel || level > maxLevel) {
    throw new Error(`Level must be between ${minLevel} and ${maxLevel}.`)
  }
}

function normalizeBadgeInput(input: BadgeDraft) {
  const name = input.name.trim()
  if (!name) throw new Error("Badge name is required.")

  return {
    name,
    module: input.module.trim() || "General",
    group: input.group.trim() || "General",
    levelTypeId: input.levelTypeId || "trust",
    level: Math.trunc(Number(input.level) || 1),
    condition: input.condition.trim(),
    whereItAppears: input.whereItAppears.trim(),
    designLink: input.designLink.trim() || null
  }
}

export async function seedBadgeManagementData() {
  await ensureBadgeSchema()

  for (const levelType of seedBadgeLevelTypes) {
    await sql`
      insert into badge_level_types (
        id,
        name,
        description,
        min_level,
        max_level,
        sort_order,
        is_active,
        updated_at
      )
      values (
        ${levelType.id},
        ${levelType.name},
        ${levelType.description},
        ${levelType.minLevel},
        ${levelType.maxLevel},
        ${levelType.sortOrder},
        ${levelType.isActive},
        now()
      )
      on conflict (id) do update set
        name = excluded.name,
        description = excluded.description,
        min_level = excluded.min_level,
        max_level = excluded.max_level,
        sort_order = excluded.sort_order,
        is_active = excluded.is_active,
        updated_at = now()
    `
  }

  for (const badge of initialBadgeDefinitions) {
    await sql`
      insert into badges (
        id,
        name,
        module,
        group_name,
        level_type_id,
        level,
        condition,
        where_it_appears,
        design_link,
        status,
        sort_order,
        updated_at
      )
      values (
        ${badge.id},
        ${badge.name},
        ${badge.module},
        ${badge.group},
        ${badge.levelTypeId},
        ${badge.level},
        ${badge.condition},
        ${badge.whereItAppears},
        ${badge.designLink ?? null},
        ${badge.status},
        ${badge.sortOrder ?? 0},
        now()
      )
      on conflict (id) do update set
        name = excluded.name,
        module = excluded.module,
        group_name = excluded.group_name,
        level_type_id = excluded.level_type_id,
        level = excluded.level,
        condition = excluded.condition,
        where_it_appears = excluded.where_it_appears,
        design_link = excluded.design_link,
        sort_order = excluded.sort_order,
        updated_at = now()
    `
  }

  for (const context of seedDisplayContexts) {
    await sql`
      insert into badge_display_contexts (
        id,
        title,
        target,
        surface,
        updated_at
      )
      values (
        ${context.id},
        ${context.title},
        ${context.target},
        ${context.surface},
        now()
      )
      on conflict (id) do update set
        title = excluded.title,
        target = excluded.target,
        surface = excluded.surface,
        updated_at = now()
    `

    for (const item of context.ranking) {
      await sql`
        insert into badge_display_rankings (
          context_id,
          badge_id,
          active,
          priority,
          updated_at
        )
        values (
          ${context.id},
          ${item.badgeId},
          ${item.active},
          ${item.priority},
          now()
        )
        on conflict (context_id, badge_id) do update set
          active = excluded.active,
          priority = excluded.priority,
          updated_at = now()
      `
    }
  }

  await sql`
    insert into platform_schema_migrations (name)
    values ('badge_management_seed_v1')
    on conflict (name) do update set applied_at = now()
  `
}

async function ensureBadgeSeeded() {
  await ensureBadgeSchema()

  const rows = (await sql`
    select 1
    from platform_schema_migrations
    where name = 'badge_management_seed_v1'
    limit 1
  `) as { "?column?": number }[]

  if (rows.length === 0) {
    await seedBadgeManagementData()
  }
}

export async function getBadgeManagementWorkspace(): Promise<BadgeManagementWorkspace> {
  await ensureBadgeSeeded()

  const [levelTypeRows, badgeRows, contextRows] = await Promise.all([
    sql`
      select id, name, description, min_level, max_level, sort_order, is_active
      from badge_level_types
      order by sort_order asc, name asc
    `,
    sql`
      select
        id,
        name,
        module,
        group_name,
        level_type_id,
        level,
        condition,
        where_it_appears,
        design_link,
        status,
        sort_order
      from badges
      where status <> 'archived'
      order by sort_order asc, name asc
    `,
    sql`
      select
        context.id,
        context.title,
        context.target,
        context.surface,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'badgeId', ranking.badge_id,
              'active', ranking.active,
              'priority', ranking.priority
            )
            order by ranking.priority asc
          ) filter (where ranking.badge_id is not null),
          '[]'::jsonb
        ) as ranking
      from badge_display_contexts context
      left join badge_display_rankings ranking
        on ranking.context_id = context.id
      where context.is_active = true
      group by context.id
      order by context.created_at asc, context.title asc
    `
  ])

  return {
    levelTypes: (levelTypeRows as BadgeLevelTypeRow[]).map(mapBadgeLevelType),
    badges: (badgeRows as BadgeRow[]).map(mapBadge),
    displayContexts: (contextRows as DisplayContextRow[]).map(mapDisplayContext)
  }
}

export async function createBadge(input: BadgeDraft) {
  await ensureBadgeSeeded()
  const normalized = normalizeBadgeInput(input)
  await assertLevelInput(normalized.levelTypeId, normalized.level)

  let id = makeBadgeId(normalized.module, normalized.name)
  let suffix = 2
  while (true) {
    const existingRows = (await sql`
      select 1 from badges where id = ${id} limit 1
    `) as { "?column?": number }[]
    if (existingRows.length === 0) break
    id = `${makeBadgeId(normalized.module, normalized.name)}-${suffix}`
    suffix += 1
  }

  const rows = (await sql`
    insert into badges (
      id,
      name,
      module,
      group_name,
      level_type_id,
      level,
      condition,
      where_it_appears,
      design_link,
      status,
      sort_order
    )
    values (
      ${id},
      ${normalized.name},
      ${normalized.module},
      ${normalized.group},
      ${normalized.levelTypeId},
      ${normalized.level},
      ${normalized.condition},
      ${normalized.whereItAppears},
      ${normalized.designLink},
      'active',
      9999
    )
    returning
      id,
      name,
      module,
      group_name,
      level_type_id,
      level,
      condition,
      where_it_appears,
      design_link,
      status,
      sort_order
  `) as BadgeRow[]

  return mapBadge(rows[0])
}

export async function updateBadge(badgeId: string, input: BadgeDraft) {
  await ensureBadgeSeeded()
  const normalized = normalizeBadgeInput(input)
  await assertLevelInput(normalized.levelTypeId, normalized.level)

  const rows = (await sql`
    update badges
    set
      name = ${normalized.name},
      module = ${normalized.module},
      group_name = ${normalized.group},
      level_type_id = ${normalized.levelTypeId},
      level = ${normalized.level},
      condition = ${normalized.condition},
      where_it_appears = ${normalized.whereItAppears},
      design_link = ${normalized.designLink},
      updated_at = now()
    where id = ${badgeId}
      and status <> 'archived'
    returning
      id,
      name,
      module,
      group_name,
      level_type_id,
      level,
      condition,
      where_it_appears,
      design_link,
      status,
      sort_order
  `) as BadgeRow[]

  const row = rows[0]
  if (!row) throw new Error("Badge not found.")
  return mapBadge(row)
}

export async function archiveBadge(badgeId: string) {
  await ensureBadgeSeeded()
  const rows = (await sql`
    update badges
    set status = 'archived', updated_at = now()
    where id = ${badgeId}
      and status <> 'archived'
    returning id
  `) as { id: string }[]

  if (rows.length === 0) throw new Error("Badge not found.")
}

export async function updateBadgeDisplayRanking(
  contextId: string,
  ranking: BadgeRankingConfig[]
) {
  await ensureBadgeSeeded()

  const contextRows = (await sql`
    select 1 from badge_display_contexts where id = ${contextId} limit 1
  `) as { "?column?": number }[]
  if (contextRows.length === 0) throw new Error("Display context not found.")

  await sql`
    delete from badge_display_rankings
    where context_id = ${contextId}
  `

  for (const [index, item] of ranking.entries()) {
    const badgeRows = (await sql`
      select 1
      from badges
      where id = ${item.badgeId}
        and status <> 'archived'
      limit 1
    `) as { "?column?": number }[]
    if (badgeRows.length === 0) throw new Error(`Badge not found: ${item.badgeId}`)

    await sql`
      insert into badge_display_rankings (
        context_id,
        badge_id,
        active,
        priority,
        updated_at
      )
      values (
        ${contextId},
        ${item.badgeId},
        ${Boolean(item.active)},
        ${index + 1},
        now()
      )
    `
  }

  return getBadgeManagementWorkspace()
}
```

- [ ] **Step 2: Format service file**

Run:

```bash
rtk bunx biome check --write lib/badges/db.ts
```

Expected: exit 0 for this file.

- [ ] **Step 3: Checkpoint diff**

Run:

```bash
rtk git diff --stat -- lib/badges/db.ts
```

Expected: new DB service file.

---

## Task 4: Add admin badge API routes

**Files:**
- Create: `app/api/admin/badges/route.ts`
- Create: `app/api/admin/badges/[badgeId]/route.ts`
- Create: `app/api/admin/badge-display-contexts/route.ts`
- Create: `app/api/admin/badge-display-contexts/[contextId]/rankings/route.ts`

- [ ] **Step 1: Create badge list/create route**

Write `app/api/admin/badges/route.ts`:

```ts
import { NextResponse } from "next/server"
import {
  createBadge,
  getBadgeManagementWorkspace
} from "@/lib/badges/db"
import type { BadgeDraft } from "@/lib/badges/seed-data"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Badge request failed."
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET() {
  await ensurePlatformSchema()
  try {
    const workspace = await getBadgeManagementWorkspace()
    return NextResponse.json(workspace)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const body = (await request.json()) as BadgeDraft
    const badge = await createBadge(body)
    return NextResponse.json({ badge }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
```

- [ ] **Step 2: Create badge update/archive route**

Write `app/api/admin/badges/[badgeId]/route.ts`:

```ts
import { NextResponse } from "next/server"
import { archiveBadge, updateBadge } from "@/lib/badges/db"
import type { BadgeDraft } from "@/lib/badges/seed-data"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Badge request failed."
  const status = message === "Badge not found." ? 404 : 400
  return NextResponse.json({ error: message }, { status })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const { badgeId } = await params
    const body = (await request.json()) as BadgeDraft
    const badge = await updateBadge(decodeURIComponent(badgeId), body)
    return NextResponse.json({ badge })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const { badgeId } = await params
    await archiveBadge(decodeURIComponent(badgeId))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
```

- [ ] **Step 3: Create display contexts route**

Write `app/api/admin/badge-display-contexts/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getBadgeManagementWorkspace } from "@/lib/badges/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function GET() {
  await ensurePlatformSchema()
  try {
    const workspace = await getBadgeManagementWorkspace()
    return NextResponse.json({ displayContexts: workspace.displayContexts })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Display context request failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
```

- [ ] **Step 4: Create ranking save route**

Write `app/api/admin/badge-display-contexts/[contextId]/rankings/route.ts`:

```ts
import { NextResponse } from "next/server"
import { updateBadgeDisplayRanking } from "@/lib/badges/db"
import type { BadgeRankingConfig } from "@/lib/badges/seed-data"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const { contextId } = await params
    const body = (await request.json()) as { ranking?: BadgeRankingConfig[] }
    const workspace = await updateBadgeDisplayRanking(
      decodeURIComponent(contextId),
      body.ranking ?? []
    )
    return NextResponse.json(workspace)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ranking save failed."
    const status = message === "Display context not found." ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
```

- [ ] **Step 5: Format API files**

Run:

```bash
rtk bunx biome check --write app/api/admin/badges/route.ts app/api/admin/badges/[badgeId]/route.ts app/api/admin/badge-display-contexts/route.ts app/api/admin/badge-display-contexts/[contextId]/rankings/route.ts
```

Expected: exit 0 for scoped files.

- [ ] **Step 6: Checkpoint diff**

Run:

```bash
rtk git diff --stat -- app/api/admin/badges app/api/admin/badge-display-contexts
```

Expected: four new API route files.

---

## Task 5: Load badge workspace in admin page

**Files:**
- Modify: `app/(dashboard)/admin/settings/badge-management/page.tsx`

- [ ] **Step 1: Replace page with server-loaded workspace**

Replace full file with:

```tsx
import { BadgeManagementConfig } from "@/components/badges/badge-management-config"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getBadgeManagementWorkspace } from "@/lib/badges/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export default async function AdminBadgeManagementPage() {
  await ensurePlatformSchema()
  const workspace = await getBadgeManagementWorkspace()

  return (
    <DashboardShell
      title="Badge Management"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Settings" },
        { label: "Badge Management" }
      ]}
    >
      <BadgeManagementConfig initialWorkspace={workspace} />
    </DashboardShell>
  )
}
```

- [ ] **Step 2: Format page**

Run:

```bash
rtk bunx biome check --write 'app/(dashboard)/admin/settings/badge-management/page.tsx'
```

Expected: exit 0 for page file.

- [ ] **Step 3: Checkpoint diff**

Run:

```bash
rtk git diff --stat -- 'app/(dashboard)/admin/settings/badge-management/page.tsx'
```

Expected: admin page imports badge DB workspace and passes `initialWorkspace`.

---

## Task 6: Convert `BadgeManagementConfig` to level-based workspace state

**Files:**
- Modify: `components/badges/badge-management-config.tsx`

- [ ] **Step 1: Update imports from seed data**

Replace imported seed types/values with:

```ts
  BADGE_CATALOG_PAGE_SIZE,
  type BadgeDefinition,
  type BadgeDraft,
  type BadgeLevelType,
  type BadgeRankingConfig,
  type DisplayContext,
  type DisplayTarget,
  emptyBadgeDraft,
  makeExternalBadgeId,
  previewByContext,
  productPreviewThumbs
```

Add DB workspace type import:

```ts
import type { BadgeManagementWorkspace } from "@/lib/badges/db"
```

Remove `BadgeOrigin`, `displayContexts`, `emptyExternalBadgeDraft`, and `initialBadgeDefinitions` imports from this component.

- [ ] **Step 2: Replace origin helper with level helpers**

Remove `originVariant()`.

Add these helpers near `targetTone()`:

```ts
function levelTone(level: number) {
  if (level >= 5) return "border-purple-200 bg-purple-50 text-purple-700"
  if (level === 4) return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
  if (level === 3) return "border-sky-200 bg-sky-50 text-sky-700"
  if (level === 2) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function getLevelTypeName(
  levelTypes: BadgeLevelType[],
  levelTypeId: string
) {
  return levelTypes.find((levelType) => levelType.id === levelTypeId)?.name ?? levelTypeId
}
```

- [ ] **Step 3: Change hook signature and initial state**

Change:

```ts
function useBadgeManagementState() {
```

to:

```ts
function useBadgeManagementState(initialWorkspace: BadgeManagementWorkspace) {
```

Replace initial catalog/display state with:

```ts
  const [levelTypes] = useState(initialWorkspace.levelTypes)
  const [catalogBadges, setCatalogBadges] = useState(initialWorkspace.badges)
  const [displayContexts, setDisplayContexts] = useState(
    initialWorkspace.displayContexts
  )
  const [rankingsByContext, setRankingsByContext] = useState(
    () =>
      Object.fromEntries(
        initialWorkspace.displayContexts.map((context) => [
          context.id,
          context.ranking
        ])
      ) as Record<string, BadgeRankingConfig[]>
  )
```

Change selected context initial value to:

```ts
  const [selectedContextId, setSelectedContextId] = useState(
    initialWorkspace.displayContexts[0]?.id ?? ""
  )
```

- [ ] **Step 4: Replace external-specific filter state names**

Rename state variables:

```ts
externalBadgeQuery -> badgeCatalogQuery
externalModuleFilter -> badgeModuleFilter
externalGroupFilter -> badgeGroupFilter
externalBadgePage -> badgeCatalogPage
externalBadgeDraft -> badgeDraft
setExternalBadgeQuery -> setBadgeCatalogQuery
setExternalModuleFilter -> setBadgeModuleFilter
setExternalGroupFilter -> setBadgeGroupFilter
setExternalBadgePage -> setBadgeCatalogPage
setExternalBadgeDraft -> setBadgeDraft
```

Use this initial draft state:

```ts
  const [badgeDraft, setBadgeDraft] = useState(emptyBadgeDraft)
```

- [ ] **Step 5: Replace external-only derived data with all active badges**

Replace `externalBadgeDefinitions`, modules, groups, filtered/paginated values with:

```ts
  const badgeCatalogDefinitions = useMemo(
    () => catalogBadges.filter((badge) => badge.status !== "archived"),
    [catalogBadges]
  )
  const badgeModules = useMemo(
    () => [...new Set(badgeCatalogDefinitions.map((badge) => badge.module))],
    [badgeCatalogDefinitions]
  )
  const badgeGroups = useMemo(
    () => [...new Set(badgeCatalogDefinitions.map((badge) => badge.group))],
    [badgeCatalogDefinitions]
  )
  const filteredBadgeCatalogDefinitions = useMemo(() => {
    const query = badgeCatalogQuery.trim().toLowerCase()

    return badgeCatalogDefinitions.filter((badge) => {
      const levelTypeName = getLevelTypeName(levelTypes, badge.levelTypeId)
      const matchesQuery = query
        ? [
            badge.id,
            badge.name,
            badge.module,
            badge.group,
            badge.whereItAppears,
            badge.levelTypeId,
            levelTypeName,
            `level ${badge.level}`
          ].some((value) => value.toLowerCase().includes(query))
        : true
      const matchesModule =
        badgeModuleFilter === "all" || badge.module === badgeModuleFilter
      const matchesGroup =
        badgeGroupFilter === "all" || badge.group === badgeGroupFilter

      return matchesQuery && matchesModule && matchesGroup
    })
  }, [
    badgeCatalogDefinitions,
    badgeCatalogQuery,
    badgeGroupFilter,
    badgeModuleFilter,
    levelTypes
  ])
  const totalBadgeCatalogPages = Math.max(
    1,
    Math.ceil(filteredBadgeCatalogDefinitions.length / BADGE_CATALOG_PAGE_SIZE)
  )
  const paginatedBadgeCatalogDefinitions = useMemo(() => {
    const start = (badgeCatalogPage - 1) * BADGE_CATALOG_PAGE_SIZE
    return filteredBadgeCatalogDefinitions.slice(
      start,
      start + BADGE_CATALOG_PAGE_SIZE
    )
  }, [badgeCatalogPage, filteredBadgeCatalogDefinitions])
```

Update page reset helper:

```ts
  function resetBadgeCatalogPage() {
    setBadgeCatalogPage(1)
  }
```

- [ ] **Step 6: Add API helper inside component file**

Add below helper functions:

```ts
async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error || fallback
  } catch (_error) {
    return fallback
  }
}
```

- [ ] **Step 7: Change create external badge to create badge via API**

Replace `createExternalBadge()` with:

```ts
  async function createBadgeFromDraft() {
    const name = badgeDraft.name.trim()
    if (!name) return

    const response = await fetch("/api/admin/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badgeDraft)
    })

    if (!response.ok) {
      throw new Error(await readApiError(response, "Create badge failed."))
    }

    const body = (await response.json()) as { badge: BadgeDefinition }
    setCatalogBadges((current) => [...current, body.badge])
    setCatalogQuery("")
    setBadgeCatalogQuery("")
    setBadgeDraft(emptyBadgeDraft)
    setIsAddExternalBadgeOpen(false)
  }
```

Keep dialog state name `isAddExternalBadgeOpen` for this task to reduce churn. Rename it in Task 7.

- [ ] **Step 8: Add publish ranking API call**

Replace `publishContext()` with:

```ts
  async function publishContext() {
    const response = await fetch(
      `/api/admin/badge-display-contexts/${encodeURIComponent(selectedContext.id)}/rankings`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranking: sortedRanking })
      }
    )

    if (!response.ok) {
      throw new Error(await readApiError(response, "Publish ranking failed."))
    }

    const workspace = (await response.json()) as BadgeManagementWorkspace
    setCatalogBadges(workspace.badges)
    setDisplayContexts(workspace.displayContexts)
    setRankingsByContext(
      Object.fromEntries(
        workspace.displayContexts.map((context) => [context.id, context.ranking])
      ) as Record<string, BadgeRankingConfig[]>
    )
    setPublishedAtByContext((current) => ({
      ...current,
      [selectedContext.id]: new Date().toISOString()
    }))
  }
```

- [ ] **Step 9: Update returned hook object**

Ensure returned object includes:

```ts
    levelTypes,
    displayContexts,
    badgeCatalogDefinitions,
    badgeModules,
    badgeGroups,
    filteredBadgeCatalogDefinitions,
    totalBadgeCatalogPages,
    paginatedBadgeCatalogDefinitions,
    badgeCatalogQuery,
    setBadgeCatalogQuery,
    badgeModuleFilter,
    setBadgeModuleFilter,
    badgeGroupFilter,
    setBadgeGroupFilter,
    badgeCatalogPage,
    setBadgeCatalogPage,
    resetBadgeCatalogPage,
    badgeDraft,
    updateBadgeDraft,
    createBadgeFromDraft,
```

Add draft updater:

```ts
  function updateBadgeDraft(patch: Partial<BadgeDraft>) {
    setBadgeDraft((current) => ({ ...current, ...patch }))
  }
```

- [ ] **Step 10: Update component signature**

Change:

```ts
export function BadgeManagementConfig() {
```

to:

```ts
export function BadgeManagementConfig({
  initialWorkspace
}: {
  initialWorkspace: BadgeManagementWorkspace
}) {
```

Change hook call:

```ts
  } = useBadgeManagementState(initialWorkspace)
```

- [ ] **Step 11: Format component**

Run:

```bash
rtk bunx biome check --write components/badges/badge-management-config.tsx
```

Expected: exit 0 for this file. If TypeScript errors appear later, fix them in Task 7.

- [ ] **Step 12: Checkpoint diff**

Run:

```bash
rtk git diff --stat -- components/badges/badge-management-config.tsx
```

Expected: component now accepts `initialWorkspace` and uses level-based state names.

---

## Task 7: Update Badge Management UI labels, tables, and form fields

**Files:**
- Modify: `components/badges/badge-management-config.tsx`
- Modify: `.ui-design/components/badge-management-external-table.json`

- [ ] **Step 1: Rename dialog/control state labels in UI text**

In `components/badges/badge-management-config.tsx`, update visible copy:

```txt
Badge Type -> Level
External Badge Management -> Badge Catalog Management
Add External Badge -> Add Badge
External Badge -> Badge
Need verification rule -> Needs verification rule
```

Keep state variable names if changing them creates broad churn; visible UI text is the priority.

- [ ] **Step 2: Update Badge Inventory table columns**

In the context ranking table, replace the `Badge Type` column with `Level`:

```tsx
<TableHead className="w-[180px]">Level</TableHead>
```

Replace old origin badge cell with:

```tsx
<TableCell>
  <Badge variant="outline" className={cn("border", levelTone(badge.level))}>
    {getLevelTypeName(levelTypes, badge.levelTypeId)} L{badge.level}
  </Badge>
</TableCell>
```

- [ ] **Step 3: Update catalog management table**

In the catalog table section, use these headers:

```tsx
<TableHead className="w-[240px]">Badge</TableHead>
<TableHead className="w-[160px]">Module</TableHead>
<TableHead className="w-[260px]">Group</TableHead>
<TableHead className="w-[180px]">Level</TableHead>
<TableHead>Where it appears</TableHead>
<TableHead className="w-[150px] text-center">Status</TableHead>
```

Use this level cell:

```tsx
<TableCell>
  <Badge variant="outline" className={cn("border", levelTone(badge.level))}>
    {getLevelTypeName(levelTypes, badge.levelTypeId)} L{badge.level}
  </Badge>
</TableCell>
```

- [ ] **Step 4: Update catalog filters to all badges**

Use `badgeModules` and `badgeGroups` in filter selects:

```tsx
{badgeModules.map((module) => (
  <SelectItem key={module} value={module}>
    {module}
  </SelectItem>
))}
```

```tsx
{badgeGroups.map((group) => (
  <SelectItem key={group} value={group}>
    {group}
  </SelectItem>
))}
```

Use `paginatedBadgeCatalogDefinitions` in table mapping.

- [ ] **Step 5: Update add badge dialog fields**

In add badge dialog, replace old 2-column input grid with:

```tsx
<div className="grid gap-3 sm:grid-cols-2">
  <Input
    value={badgeDraft.name}
    onChange={(event) => updateBadgeDraft({ name: event.target.value })}
    placeholder="Badge name"
  />
  <Input
    value={badgeDraft.module}
    onChange={(event) => updateBadgeDraft({ module: event.target.value })}
    placeholder="Module"
  />
  <Input
    value={badgeDraft.group}
    onChange={(event) => updateBadgeDraft({ group: event.target.value })}
    placeholder="Group"
  />
  <Select
    value={badgeDraft.levelTypeId}
    onValueChange={(levelTypeId) =>
      updateBadgeDraft({ levelTypeId: levelTypeId as BadgeDraft["levelTypeId"] })
    }
  >
    <SelectTrigger className="bg-white">
      <SelectValue placeholder="Level type" />
    </SelectTrigger>
    <SelectContent>
      {levelTypes.map((levelType) => (
        <SelectItem key={levelType.id} value={levelType.id}>
          {levelType.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <Select
    value={String(badgeDraft.level)}
    onValueChange={(level) => updateBadgeDraft({ level: Number(level) })}
  >
    <SelectTrigger className="bg-white">
      <SelectValue placeholder="Level" />
    </SelectTrigger>
    <SelectContent>
      {[1, 2, 3, 4, 5].map((level) => (
        <SelectItem key={level} value={String(level)}>
          Level {level}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <Input
    value={badgeDraft.designLink}
    onChange={(event) => updateBadgeDraft({ designLink: event.target.value })}
    placeholder="Design link"
  />
</div>
<Input
  value={badgeDraft.whereItAppears}
  onChange={(event) => updateBadgeDraft({ whereItAppears: event.target.value })}
  placeholder="Where it appears"
/>
<Input
  value={badgeDraft.condition}
  onChange={(event) => updateBadgeDraft({ condition: event.target.value })}
  placeholder="Condition / verification note"
/>
```

Change submit handler:

```tsx
<Button
  type="button"
  onClick={() => void createBadgeFromDraft()}
  disabled={!badgeDraft.name.trim()}
>
  Add Badge
</Button>
```

- [ ] **Step 6: Update catalog reference table**

In `Badge Catalog Reference`, replace old origin column with level column:

```tsx
<TableHead className="w-[150px]">Level</TableHead>
```

Use:

```tsx
<TableCell>
  <Badge variant="outline" className={cn("border", levelTone(badge.level))}>
    {getLevelTypeName(levelTypes, badge.levelTypeId)} L{badge.level}
  </Badge>
</TableCell>
```

Remove all `originVariant(...)` usage.

- [ ] **Step 7: Update UI tracking file**

Write `.ui-design/components/badge-management-external-table.json`:

```json
{
  "name": "BadgeManagementCatalogTable",
  "created_at": "2026-06-12T00:00:00.000Z",
  "purpose": "Database-backed badge catalog management table for module, group, level type, level, search, and pagination controls.",
  "complexity": "Composite",
  "props": [],
  "state_pattern": "Server-loaded workspace with local client state and API persistence",
  "composition": "Composed inside existing BadgeManagementConfig page section",
  "accessibility_level": "Basic semantic table with labeled controls and pagination links",
  "styling": "Tailwind CSS with shadcn/ui primitives",
  "files_created": [],
  "files_modified": ["components/badges/badge-management-config.tsx"],
  "status": "complete",
  "completed_at": "2026-06-12T00:00:00.000Z"
}
```

- [ ] **Step 8: Search for forbidden old origin language**

Run:

```bash
rtk grep 'Internal Badge\|External Badge\|BadgeOrigin\|originVariant\|origin:' components/badges lib/badges app/api/admin
```

Expected: zero matches.

- [ ] **Step 9: Format UI files**

Run:

```bash
rtk bunx biome check --write components/badges/badge-management-config.tsx .ui-design/components/badge-management-external-table.json
```

Expected: exit 0 for scoped files.

- [ ] **Step 10: Checkpoint diff**

Run:

```bash
rtk git diff --stat -- components/badges/badge-management-config.tsx .ui-design/components/badge-management-external-table.json
```

Expected: UI text and tables are level-based.

---

## Task 8: Verification and DB write gate

**Files:**
- No code changes unless verification exposes scoped issues.

- [ ] **Step 1: Run scoped Biome on changed code**

Run:

```bash
rtk bunx biome check --write lib/badges/schema.ts lib/badges/db.ts lib/badges/seed-data.ts components/badges/badge-management-data.ts components/badges/badge-management-config.tsx app/api/admin/badges/route.ts app/api/admin/badges/[badgeId]/route.ts app/api/admin/badge-display-contexts/route.ts app/api/admin/badge-display-contexts/[contextId]/rankings/route.ts 'app/(dashboard)/admin/settings/badge-management/page.tsx' .ui-design/components/badge-management-external-table.json
```

Expected: exit 0 for scoped files.

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
rtk bun typecheck
```

Expected current baseline may fail with unrelated existing errors in `.next/types/validator.ts`, `components/streaming/live-comments.tsx`, and `components/ui/*`. If new errors mention badge files, fix them before moving on. If only baseline errors remain, report exact first badge-free failure summary.

- [ ] **Step 3: Ask for DB write approval before schema command**

Message user:

```txt
Schema command writes to shared dev/prod DB. Approve running `bun platform:ensure-schema` now?
```

Wait for user approval before running DB write command.

- [ ] **Step 4: Run schema command only after approval**

Run after user approval:

```bash
rtk bun platform:ensure-schema
```

Expected: exit 0 and output includes `Platform schema ready.`

- [ ] **Step 5: API smoke after DB schema exists**

Start dev server if not running:

```bash
rtk bun dev
```

Use existing app URL port `1995` unless `NEXT_PUBLIC_PORT` differs. Then run:

```bash
rtk curl http://localhost:1995/api/admin/badges
```

Expected: JSON includes `levelTypes`, `badges`, and `displayContexts` arrays.

- [ ] **Step 6: Final status check**

Run:

```bash
rtk git status --short
rtk git diff --stat
```

Expected: only planned badge/spec/UI tracking files changed, plus already-existing untracked `components/badges/badge-management-data.ts` state resolved by move/re-export.

---

## Self-review checklist

Spec coverage:

- `origin` removed from application badge model: Task 1, Task 6, Task 7.
- `levelType + level` added: Task 1, Task 3, Task 6, Task 7.
- DB schema for catalog/ranking: Task 2.
- Strict FK assignment tables: Task 2.
- RFQ assignment deferred: Task 2 intentionally does not create RFQ table.
- API routes: Task 4.
- Admin page server-loads DB workspace: Task 5.
- UI manages catalog/ranking first: Task 6 and Task 7.
- DB write safety: Task 2 idempotent schema, Task 3 seed marker, Task 8 DB approval gate.

Red-flag scan:

- No unfinished marker strings or unspecified implementation steps.
- Every new file task contains concrete file content.
- Every verification step has exact command and expected result.

Type consistency:

- `BadgeDraft`, `BadgeDefinition`, `BadgeLevelType`, `BadgeManagementWorkspace` names are consistent across seed, DB service, API, and UI tasks.
- DB column names use snake_case; UI types use camelCase through mapper functions.
- Display ranking uses `BadgeRankingConfig[]` in every task.
