# Expo Detail Dynamic Marketing Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build expo-specific Marketing content with Admin publish, Partner review submission, and public Expo Detail rendering.

**Architecture:** Add focused Marketing content domain helpers for defaults, validation, and persistence. Keep existing ExpoForm shared surface and extend payloads/API routes. Public detail loads latest published content and category names, with default fallbacks for Marketing blocks.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Bun, Neon SQL helper, shadcn/ui, Biome.

---

## File Structure

- Modify `lib/platform/ensure-schema.ts`: create `expo_marketing_content_versions` table and indexes idempotently.
- Modify `lib/tradexpo/types.ts`: add Marketing content types.
- Create `lib/tradexpo/expo-marketing-content.ts`: defaults, normalization, validation, icon metadata.
- Modify `lib/tradexpo/db/platform-data.ts`: add DB helpers for published/editable content, admin publish, partner submit, approve/reject, and category resolution.
- Modify `components/tradexpo/expo-form.tsx`: add Marketing editor section and include payload in submit.
- Modify `components/tradexpo/expo-detail/sections.tsx`: make Audience, Categories, ParticipantValues accept dynamic props.
- Modify `app/(tradexpo)/expos/[slug]/page.tsx`: load and pass content/categories.
- Modify `app/api/tradexpo/expos/route.ts`: validate/publish Admin create Marketing content.
- Modify `app/api/tradexpo/expos/[expoId]/route.ts`: validate/publish Admin update Marketing content.
- Modify `app/api/partner/expos/[expoId]/route.ts`: validate/submit Partner Marketing content.
- Create `app/api/tradexpo/expos/[expoId]/marketing/[versionId]/approve/route.ts`: approve submitted content.
- Create `app/api/tradexpo/expos/[expoId]/marketing/[versionId]/reject/route.ts`: reject submitted content.

## Tasks

### Task 1: Domain types and validation

**Files:**
- Modify: `lib/tradexpo/types.ts`
- Create: `lib/tradexpo/expo-marketing-content.ts`

- [ ] Add `ExpoMarketingContent`, version row, and category display types.
- [ ] Add default content based on current hard-coded data.
- [ ] Add `normalizeExpoMarketingContent(input)` returning valid content or default.
- [ ] Add `validateExpoMarketingContent(input)` returning error string or normalized content.

### Task 2: Schema and DB helpers

**Files:**
- Modify: `lib/platform/ensure-schema.ts`
- Modify: `lib/tradexpo/db/platform-data.ts`

- [ ] Add table/index creation inside `migrateExpoManagementSchema()`.
- [ ] Add `getPublishedExpoMarketingContent(expoId)`.
- [ ] Add `getLatestExpoMarketingContentForEdit(expoId)`.
- [ ] Add `publishAdminExpoMarketingContent(expoId, content, userId?)`.
- [ ] Add `submitPartnerExpoMarketingContent(expoId, content, userId)`.
- [ ] Add `approveExpoMarketingContentVersion(expoId, versionId, userId)`.
- [ ] Add `rejectExpoMarketingContentVersion(expoId, versionId, userId, note)`.
- [ ] Add `listExpoCategoriesByIds(categoryIds)`.

### Task 3: API integration

**Files:**
- Modify: `app/api/tradexpo/expos/route.ts`
- Modify: `app/api/tradexpo/expos/[expoId]/route.ts`
- Modify: `app/api/partner/expos/[expoId]/route.ts`
- Create: `app/api/tradexpo/expos/[expoId]/marketing/[versionId]/approve/route.ts`
- Create: `app/api/tradexpo/expos/[expoId]/marketing/[versionId]/reject/route.ts`

- [ ] Accept `marketingContent` in Admin create/update payloads.
- [ ] Validate content and publish Admin content after expo save.
- [ ] Accept `marketingContent` in Partner update payload.
- [ ] Validate content and submit Partner content after expo save.
- [ ] Add approve/reject endpoints with auth role checks.

### Task 4: Form UI

**Files:**
- Modify: `components/tradexpo/expo-form.tsx`

- [ ] Add `initialMarketingContent` prop.
- [ ] Add state for `whoShouldJoin` and `audienceBenefits`.
- [ ] Add add/remove card/item controls.
- [ ] Add validation before submit.
- [ ] Include normalized `marketingContent` in payload.

### Task 5: Page wiring

**Files:**
- Modify: Admin/Partner edit pages if needed to pass initial content.
- Modify: `app/(tradexpo)/expos/[slug]/page.tsx`
- Modify: `components/tradexpo/expo-detail/sections.tsx`

- [ ] Fetch latest editable content for edit pages.
- [ ] Fetch published content and categories for public page.
- [ ] Pass dynamic props to section components.
- [ ] Hide category section if no resolved categories.

### Task 6: Verify

**Files:**
- All changed files

- [ ] Run `bun typecheck`.
- [ ] Run `bun check` if formatting/imports fail.
- [ ] Fix reported issues.

## Self-review

Spec coverage:

- Admin publish covered by Tasks 2–4.
- Partner submit/review covered by Tasks 2–4.
- Public dynamic rendering covered by Task 5.
- Categories from Expo category source covered by Tasks 2 and 5.
- CTA omission covered by Task 1/4 payload shape.
- Conservative DB migration covered by Task 2.

No placeholders remain. Type names are consistent with spec.
