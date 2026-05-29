# Expo Detail Dynamic Marketing Content Blocks — Design

Date: 2026-05-29

## Goal

Move selected Expo Detail marketing sections from hard-coded content to expo-specific content with review workflow.

Covered blocks:

1. `Who should join?`
2. `Exhibited Categories`
3. `Giá trị đặc quyền từng đối tượng` / `Audience Benefits`

## Scope

Implement review workflow scope:

- Admin can configure and publish Marketing content in Admin create/edit expo flow.
- Expo Owner can configure Marketing content for assigned expos and submit review.
- Public Expo Detail renders published Marketing content only.
- Expo Owner submitted changes do not affect public page until Admin approval.
- `Exhibited Categories` is not editable in Marketing; it renders from selected Expo categories.

Out of scope:

- User-configured CTA labels or targets for Audience Benefits.
- Separate image upload per category card from Marketing tab.
- Full localization management UI. Store locale/version fields and keep render fallback ready.

## Data model

Add table `expo_marketing_content_versions` through idempotent platform schema migration.

Columns:

- `id text primary key`
- `expo_id text not null references expos(id) on delete cascade`
- `source_role text not null` with values `admin`, `partner`
- `status text not null` with values `draft`, `submitted`, `published`, `rejected`
- `content_version int not null`
- `content_locale text not null default 'en'`
- `content jsonb not null default '{}'::jsonb`
- `submitted_by text references users(id) on delete set null`
- `submitted_at timestamptz`
- `reviewed_by text references users(id) on delete set null`
- `reviewed_at timestamptz`
- `review_note text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(expo_id, status, content_version desc)` for public published lookup.
- `(expo_id, updated_at desc)` for edit/review lookup.

Published rule:

- One active published version per expo. Publishing a new version supersedes previous published rows by marking previous rows as rejected or keeping historical rows but public query chooses latest `published` by `content_version desc`.
- Implementation should prefer keeping history and choosing latest published to reduce destructive updates.

## Content payload

```ts
type ExpoMarketingContent = {
  whoShouldJoin: {
    enabled: boolean
    sectionTitle: string
    sectionSubtitle?: string
    audienceCards: Array<{
      title: string
      description: string
      tags: string[]
      displayOrder: number
    }>
  }
  audienceBenefits: {
    enabled: boolean
    sectionTitle: string
    sectionSubtitle?: string
    benefitCards: Array<{
      audienceName: string
      icon: "badge" | "rocket" | "gem"
      benefitItems: string[]
      isFeatured: boolean
      displayOrder: number
    }>
  }
}
```

CTA fields are intentionally omitted.

## Validation

`Who should join?`:

- If enabled, requires 1–6 cards.
- Card requires title and description.
- Tags optional.
- Display order is derived from array order during save.

`Audience Benefits`:

- If enabled, requires 1–6 cards.
- Card requires audience name.
- Card requires at least one non-empty benefit item.
- At most one card can be `isFeatured = true`.
- Icon is selected from known keys only.
- Display order is derived from array order during save.

Public render validation:

- Invalid custom block falls back to default template for Marketing blocks.
- Disabled block does not render.
- Category section hides if selected categories cannot resolve to category names.

## Admin flow

Admin Create/Edit Expo:

1. Form renders `Marketing` card/section.
2. Admin edits `Who should join?` and `Audience Benefits`.
3. Admin save includes `marketingContent` in create/update payload.
4. API validates expo fields and Marketing content.
5. API persists expo data and writes new `published` Marketing content version.
6. Public Expo Detail uses new published version.

If Admin approves Partner content:

1. Admin calls approve endpoint for submitted version.
2. API verifies version belongs to expo and is submitted.
3. API writes/marks approved version as `published` with next version number as needed.
4. Public Expo Detail uses approved content.

If Admin rejects Partner content:

1. Admin calls reject endpoint with optional note.
2. API marks submitted version `rejected`.
3. Public Expo Detail keeps latest published version.

## Expo Owner flow

Partner assigned expo edit:

1. Partner accesses assigned expo through Partner Portal.
2. Existing `requirePartnerAction(userId, "expo.edit")` and assignment capability checks remain.
3. Form renders Marketing content when assignment has `edit_expo_content`.
4. Partner submit saves Marketing content as `submitted`.
5. API does not publish Partner changes directly.
6. Public Expo Detail keeps existing published content or default template.

Initial implementation can reuse current partner expo form surface instead of introducing a new route.

## Public Expo Detail render

Public route loads:

- Expo by slug.
- Published Marketing content by expo id.
- Resolved Expo categories from `expo.categoryIds`.

Render order keeps existing placement:

1. `Who should join?`
2. `Exhibited Categories`
3. `Audience Benefits`

Behavior:

- `Who should join?` renders published content or default template.
- `Exhibited Categories` renders from selected Expo categories only.
- `Audience Benefits` renders published content or default template.
- Disabled or invalid blocks hide/fallback according to block rules.

## Files expected to change

Likely files:

- `lib/platform/ensure-schema.ts`
- `lib/tradexpo/types.ts`
- `lib/tradexpo/db/platform-data.ts` or new focused helper file
- `lib/tradexpo/expo-marketing-content.ts` for validation/defaults/helpers
- `components/tradexpo/expo-form.tsx`
- `components/tradexpo/expo-detail/sections.tsx`
- `app/(tradexpo)/expos/[slug]/page.tsx`
- `app/api/tradexpo/expos/route.ts`
- `app/api/tradexpo/expos/[expoId]/route.ts`
- `app/api/partner/expos/[expoId]/route.ts`
- Admin review routes under `app/api/tradexpo/expos/[expoId]/marketing/...`

## Verification

Run:

- `bun typecheck`
- `bun check` if formatting/imports need fixes

Do not add new test files unless requested. Do not use Chrome MCP UI verification by default.

## Risks and decisions

- Review UI for Admin approval may need separate management surface. API support is required in this scope; full dashboard queue can be minimal if no existing surface fits.
- Shared dev/prod DB means schema changes must be idempotent and conservative.
- Latest published query preserves history and avoids destructive rewrites.
- Localization version fields are stored now, but full translation lifecycle remains future work.
