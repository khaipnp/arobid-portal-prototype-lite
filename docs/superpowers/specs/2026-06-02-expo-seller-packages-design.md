# Expo Seller Packages — Design

Date: 2026-06-02

## Goal

Allow Admin users to configure seller/exhibitor packages per expo during the Admin Expo create/edit flow. Packages must be flexible for public Expo Detail display and linked to real `plan-subscriptions` package definitions for future checkout/subscription behavior.

## Decision

Use a hybrid model:

- Store expo-specific package display data in a new `expo_package_displays` table.
- Link each display row to a real `package_definitions` record.
- Let Admin either link an existing package or create a new package inline.
- Keep public pricing/benefits customizable per expo without mutating shared package definitions.
- Target Seller / Exhibitor packages only in this scope.

## Scope

In scope:

- Admin Expo create/edit form gets a `Packages` step.
- Admin can add up to 6 seller packages per expo.
- Admin can link existing package definitions.
- Admin can create new package definitions inline.
- Inline package creation defaults to an event-bound seller/exhibitor setup for the current expo.
- Advanced settings allow overriding plan and role when needed.
- Public Expo Detail can render expo-specific packages with pricing and benefits.
- Package displays keep a link to the real subscription package definition.

Out of scope:

- Buyer/Visitor packages.
- Checkout flow implementation.
- Multi-currency conversion.
- Package approval workflow.
- Partner editing of packages.
- Deleting underlying package definitions when an expo display is removed.

## Data model

Add table `expo_package_displays` through an idempotent platform schema migration.

Columns:

- `id text primary key`
- `expo_id text not null references expos(id) on delete cascade`
- `package_definition_id text not null references package_definitions(id) on delete restrict`
- `source text not null` with values `linked`, `inline_created`
- `name text not null`
- `description text not null default ''`
- `price numeric not null default 0`
- `price_unit text not null default 'VND'`
- `benefits jsonb not null default '[]'::jsonb`
- `is_featured boolean not null default false`
- `is_public boolean not null default true`
- `sort_order int not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(expo_id, sort_order)` for form/public listing.
- `(package_definition_id)` for reverse lookup.

Rules:

- One expo can have multiple package displays.
- A package definition can be reused across expos.
- Display fields are copied/overridden per expo and do not mutate linked package definitions for `linked` rows.
- Removing a display row only unlinks the package from that expo.

## Types

Add domain types near Tradexpo types:

```ts
type ExpoPackageDisplaySource = "linked" | "inline_created"

type ExpoPackageDisplay = {
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

type ExpoPackageInput = {
  id?: string
  mode: "link_existing" | "create_new"
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
```

## Admin form UX

Add a new admin-only step to `ExpoForm`:

1. General information
2. Schedule
3. Management
4. Halls
5. Packages
6. Marketing

Partner-content edit keeps current reduced steps and does not show `Packages`.

`Packages` step contains package cards. Each card supports:

- Mode selector: `Link existing package` or `Create new package`.
- Package name.
- Description.
- Price.
- Currency.
- Benefits list.
- Featured checkbox.
- Public visibility toggle.
- Remove package button.

When linking an existing package:

- Admin chooses from package options.
- Form autofills display fields from selected package.
- Admin can override display fields for this expo.
- Backend never mutates the linked package definition.

When creating a new package inline:

- Admin fills package fields in the expo form.
- Backend creates a real package definition.
- Backend creates package plan mapping for the current expo.
- Default plan/role should target seller/exhibitor event-bound usage.
- Advanced settings expose plan and role if defaults cannot be resolved or Admin needs override.

Featured behavior:

- Only one package can be featured.
- Checking one card clears featured state from other cards.

Limits:

- Maximum 6 packages per expo.
- Maximum 10 benefits per package.

## API payload

Admin `POST /api/tradexpo/expos` and `PUT /api/tradexpo/expos/[expoId]` accept a new `packages` field:

```ts
packages: Array<{
  id?: string
  mode: "link_existing" | "create_new"
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
}>
```

Partner routes ignore package payloads and must not alter package config.

## Data flow: create expo

1. Validate expo basics.
2. Validate halls.
3. Validate marketing content.
4. Validate package payload.
5. Create expo and halls.
6. Save package displays for the new expo:
   - `link_existing`: verify package exists and is compatible with seller/expo usage.
   - `create_new`: create package definition and event-bound package plan mapping.
   - Insert `expo_package_displays` rows.
7. Publish admin marketing content.
8. Return expo id.

## Data flow: update expo

1. Validate expo basics.
2. Validate halls.
3. Validate marketing content.
4. Validate package payload.
5. Update expo and halls.
6. Upsert package displays:
   - Keep rows still present in payload.
   - Remove display rows missing from payload.
   - Do not delete underlying package definitions.
   - Do not mutate linked package definitions for `linked` rows.
   - For `inline_created` rows, update package definition basics only when the row is still associated with the same created package and no safer source of truth exists.
7. Publish admin marketing content.
8. Return success.

## Transaction strategy

Package writes should be part of the same logical save as expo/halls/marketing. Existing `createExpoWithHalls()` currently commits internally before marketing publish. Implementation should avoid partial saves by introducing a focused service/helper that coordinates expo, halls, packages, and marketing in one transaction or refactors existing helpers to allow transaction reuse.

If a package save fails, expo save should not leave a newly created expo with missing required package configuration.

## Validation

Backend validation should enforce:

- Package name is required.
- Price must be finite and zero or greater.
- Currency is required and normalized uppercase.
- Benefits must contain at least one non-empty item.
- At most one package can be featured.
- Linked package must exist.
- Selected package must be compatible with EXPO/event-bound seller usage, or Advanced config must provide a valid EXPO plan and seller/exhibitor role.
- Advanced plan must target `EXPO`.
- Inline package requires a seller/exhibitor role.
- Benefits are trimmed and capped at 10 items.
- Packages are capped at 6 rows.

Client-side validation mirrors these rules for better UX, but backend validation is authoritative.

## Public Expo Detail render

Public Expo Detail loads package displays by `expoId` and renders a package/pricing section only when public package rows exist.

Render behavior:

- Sort by `sortOrder`.
- Show package name, description, price, currency, and benefits.
- Highlight `isFeatured` package.
- Use `packageDefinitionId` as the future checkout/subscription target.
- Hide section when no public packages exist.

Existing Marketing blocks remain unchanged.

## File impact

Likely files:

- `lib/platform/ensure-schema.ts`
- `lib/tradexpo/types.ts`
- `lib/tradexpo/db/platform-data.ts` or a new focused package helper file
- `lib/plan-subscriptions/db.ts`
- `app/api/tradexpo/expos/route.ts`
- `app/api/tradexpo/expos/[expoId]/route.ts`
- Admin expo create/edit page files that instantiate `ExpoForm`
- `components/tradexpo/expo-form.tsx`
- `components/tradexpo/expo-form/constants.ts`
- `components/tradexpo/expo-form/types.ts`
- `components/tradexpo/expo-form/row-helpers.ts`
- `components/tradexpo/expo-form/packages-step.tsx`
- `app/(tradexpo)/expos/[slug]/page.tsx`
- `components/tradexpo/expo-detail/sections.tsx`

## Verification

Run:

- `bun typecheck`
- `bun check` if formatting/import organization needs fixes

Project preferences:

- Do not create new test files unless requested.
- Do not use Chrome MCP UI verification by default.

## Risks and mitigations

- Shared dev/prod DB: keep migrations idempotent and conservative.
- Partial expo creation: use transaction-aware save flow for expo/halls/packages/marketing.
- Existing package reuse: keep display overrides separate from package definitions.
- Inline-created package lifecycle: unlink from expo on display removal, do not delete package definitions.
- Default seller/exhibitor plan discovery may not always succeed; Advanced settings covers this path.

## Self-review

- No placeholders or unresolved TBDs.
- Scope is seller/exhibitor package configuration only.
- Data model, API flow, UI behavior, validation, public render, and verification are aligned.
- Destructive behavior is avoided by unlinking package displays instead of deleting package definitions.
