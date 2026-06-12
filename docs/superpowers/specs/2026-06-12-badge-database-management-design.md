# Badge Database Management Design

Date: 2026-06-12

## Context

Badge management currently uses static mock data in `components/badges/badge-management-data.ts` and local React state in `components/badges/badge-management-config.tsx`. Badges are currently classified by `origin` (`Internal Badge` or `External Badge`). The new model removes `origin` and stores badges in the database with a single level system per badge.

The project uses Next.js 16 App Router, Neon Postgres via `lib/db/neon.ts`, and idempotent schema setup through `lib/platform/ensure-schema.ts`. The development and production database are shared, so all schema/data changes must be non-destructive and idempotent.

## Goals

- Replace `origin` with `levelType + level`.
- Support multiple level systems such as `trust` and `membership`.
- Ensure each badge belongs to exactly one level system.
- Persist badge catalog and display rankings in Postgres.
- Create strict FK assignment tables for future detailed assignment UI.
- Update Admin Badge Management UI to manage catalog and display rankings from DB.

## Non-goals

- Build detailed UI for assigning badges to individual companies, products, or expos in this phase.
- Create RFQ badge assignment table before a stable RFQ primary table exists.
- Hard-delete badge records from admin UI.

## Data model

### `badge_level_types`

Stores level systems. Initial rows include `trust` and `membership`.

Columns:

- `id text primary key`
- `name text not null`
- `description text not null default ''`
- `min_level int not null default 1`
- `max_level int not null default 5`
- `sort_order int not null default 0`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Rules:

- Each level type supports levels 1 through 5 by default.
- Future level types can be added without schema changes.

### `badges`

Stores master badge catalog.

Columns:

- `id text primary key`
- `name text not null`
- `module text not null`
- `group_name text not null`
- `level_type_id text not null references badge_level_types(id) on delete restrict`
- `level int not null check (level between 1 and 5)`
- `condition text not null default ''`
- `where_it_appears text not null default ''`
- `design_link text`
- `status text not null check (status in ('draft', 'active', 'archived')) default 'active'`
- `sort_order int not null default 0`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Rules:

- `origin` is removed from application model.
- One badge has exactly one `level_type_id` and one `level`.
- Admin delete action archives by setting `status = 'archived'`.

Initial mapping:

- Membership badges (`Silver`, `Gold`, `Pioneer`, `Diamond`) use `level_type_id = 'membership'`; levels follow current membership order.
- Verification, certification, compliance, and trust badges use `level_type_id = 'trust'`; default `level = 1` unless product owner defines stronger levels later.

### `badge_display_contexts`

Stores display surfaces.

Columns:

- `id text primary key`
- `title text not null`
- `target text not null check (target in ('Supplier', 'Product', 'RFQ', 'TradeXpo'))`
- `surface text not null`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `badge_display_rankings`

Stores badge placement priority per display context.

Columns:

- `context_id text not null references badge_display_contexts(id) on delete cascade`
- `badge_id text not null references badges(id) on delete cascade`
- `active boolean not null default true`
- `priority int not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `primary key (context_id, badge_id)`

Indexes:

- `(context_id, priority)`
- `(badge_id)`

### Strict FK assignment tables

Create assignment schema now. Detailed assignment UI comes later.

#### `company_badges`

- `company_id text not null references companies(id) on delete cascade`
- `badge_id text not null references badges(id) on delete cascade`
- `status text not null check (status in ('pending', 'verified', 'rejected', 'expired')) default 'pending'`
- `evidence_url text`
- `issued_at timestamptz`
- `expires_at timestamptz`
- `verified_at timestamptz`
- `verified_by text references users(id) on delete set null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `primary key (company_id, badge_id)`

#### `company_product_badges`

- `product_id text not null references company_products(id) on delete cascade`
- `badge_id text not null references badges(id) on delete cascade`
- Same verification fields as `company_badges`.
- `primary key (product_id, badge_id)`

#### `expo_badges`

- `expo_id text not null references expos(id) on delete cascade`
- `badge_id text not null references badges(id) on delete cascade`
- Same verification fields as `company_badges`.
- `primary key (expo_id, badge_id)`

RFQ assignment table is intentionally deferred until a stable RFQ primary table exists.

## Service layer

Create `lib/badges/db.ts`.

Exports:

- `type BadgeLevelType`
- `type BadgeDefinition`
- `type BadgeStatus`
- `type DisplayContext`
- `type BadgeRankingConfig`
- `type BadgeManagementWorkspace`
- `getBadgeManagementWorkspace()`
- `createBadge(input)`
- `updateBadge(badgeId, input)`
- `archiveBadge(badgeId)`
- `updateBadgeDisplayRanking(contextId, ranking)`
- `seedBadgeManagementData()`

`seedBadgeManagementData()` uses the current seed lists as source data and performs `insert ... on conflict do update`. It must never truncate badge tables.

## API routes

Create admin routes:

- `GET /api/admin/badges`
- `POST /api/admin/badges`
- `PUT /api/admin/badges/[badgeId]`
- `DELETE /api/admin/badges/[badgeId]`
- `GET /api/admin/badge-display-contexts`
- `PUT /api/admin/badge-display-contexts/[contextId]/rankings`

Each route calls `await ensurePlatformSchema()` before service calls.

Workspace response shape:

```ts
{
  levelTypes: BadgeLevelType[]
  badges: BadgeDefinition[]
  displayContexts: DisplayContext[]
}
```

Validation:

- Badge name is required.
- `levelTypeId` must exist.
- `level` must be inside the configured range; initial hard bound is `1..5`.
- Display ranking must reference existing context and badges.
- Archive returns `404` for unknown badge.

Errors return JSON:

```ts
{ "error": "Message" }
```

## UI changes

`app/(dashboard)/admin/badge-management/page.tsx` loads initial workspace from `getBadgeManagementWorkspace()` and passes it into `BadgeManagementConfig`.

`BadgeManagementConfig` changes:

- Accepts `initialWorkspace` prop.
- Removes `BadgeOrigin` and `originVariant`.
- Displays `Level Type` and `Level` instead of `Badge Type`.
- Renames `External Badge Management` to `Badge Catalog Management`.
- Catalog filters include badge name, module, group, level type, level, surface, and ID.
- Add/edit badge form contains:
  - `name`
  - `module`
  - `group`
  - `levelTypeId`
  - `level`
  - `condition`
  - `whereItAppears`
  - `designLink`
- Add/update/archive calls badge API.
- Publish ranking calls ranking API and updates local state from saved response.

Detailed assignment UI is not included in this phase.

## Migration and seed safety

Because dev/prod share the same DB:

- Use `create table if not exists` for new tables.
- Use `create index if not exists` for indexes.
- Use `insert ... on conflict do update` for seed data.
- Do not truncate or drop existing data.
- Archive badges instead of deleting them.
- Existing static seed remains as fallback/source for DB seed during transition.

## Implementation slices

### Slice 1: Schema and seed

- Add badge schema creation into `ensurePlatformSchema()`.
- Add `lib/badges/db.ts` with DB types and seed helpers.
- Convert app badge types from `origin` to `levelTypeId + level + status`.

### Slice 2: API

- Add admin badge catalog routes.
- Add admin display context ranking routes.
- Add validation and JSON error responses.

### Slice 3: UI DB integration

- Load workspace in admin page.
- Pass workspace into `BadgeManagementConfig`.
- Save catalog changes through API.
- Save ranking changes through API.

### Slice 4: Label cleanup

- Replace Internal/External language with Level Type/Level language.
- Remove External-only table language.
- Update filters, badges, and status labels.

## Verification plan

Run after implementation:

- `bunx biome check --write <changed files>`
- `bun typecheck`
- `bun platform:ensure-schema` after explicit user approval because it writes to shared DB.
- API smoke checks for badge list, create/update/archive, and ranking save when DB env is available.

Known baseline: current `bun typecheck` has unrelated failures in `.next/types/validator.ts`, `components/streaming/live-comments.tsx`, and `components/ui/*`. Report those separately if they remain.
