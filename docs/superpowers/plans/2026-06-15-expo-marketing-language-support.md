# Expo Marketing Language Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `language` field to expos and multi-locale marketing content tabs (Origin + English) to the expo form.

**Architecture:** Add `language` column to `expos` table; update DB functions to save/load per-locale marketing content versions; add language dropdown in General step and dual-tab UI in Marketing step using parallel state for EN content.

**Tech Stack:** Next.js App Router, TypeScript, Bun, Neon/PostgreSQL (tagged-template SQL), shadcn/ui (Tabs, Select), React state

---

## File Map

| File | Change |
|------|--------|
| `lib/platform/ensure-schema.ts` | Add `language` migration after line 2528 |
| `lib/tradexpo/types.ts` | Add `language: string` to `Expo` |
| `lib/tradexpo/db/platform-data.ts` | `ExpoRow`, `rowToExpo`, `CreateExpoWithHallsInput`, INSERT/UPDATE, `getLatestExpoMarketingContentForEdit`, `publishAdminExpoMarketingContent`, `submitPartnerExpoMarketingContent` |
| `components/tradexpo/expo-form/constants.ts` | Add `EXPO_LANGUAGE_OPTIONS` |
| `components/tradexpo/expo-form/general-step.tsx` | Add `language`/`onLanguageChange` props + dropdown |
| `components/tradexpo/expo-form/types.ts` | Add `initialMarketingContentEn` to `ExpoFormProps` |
| `components/tradexpo/expo-form.tsx` | Add language + EN marketing state, handlers, `buildEnMarketingContent`, payload, Tabs UI, imports |
| `app/api/tradexpo/expos/route.ts` | Accept `language`, `marketingContentEn`; publish dual locales |
| `app/api/tradexpo/expos/[expoId]/route.ts` | Same for PUT |
| `app/api/partner/expos/[expoId]/route.ts` | Same for partner PUT |
| `app/(dashboard)/admin/tradexpo/expos/[expoId]/edit/page.tsx` | Use new multi-locale fetch |
| `app/(dashboard)/partner/expo-program/expos/[expoId]/edit/page.tsx` | Same |

---

## Task 1: DB Migration — `language` column on `expos`

**Files:**
- Modify: `lib/platform/ensure-schema.ts` (after line 2528)

- [ ] **Step 1: Add migration**

In `lib/platform/ensure-schema.ts`, after the block ending at line 2528 (`alter column end_date drop not null`), add:

```ts
  await sql`
    alter table expos add column if not exists language text not null default 'vi'
  `
```

- [ ] **Step 2: Run dev server to trigger migration**

```bash
bun dev
```

Expected: Server starts without error. New `language` column appears in `expos` table with default `'vi'`.

- [ ] **Step 3: Commit**

```bash
git add lib/platform/ensure-schema.ts
git commit -m "feat: add language column to expos table"
```

---

## Task 2: Type Updates — `Expo`, `ExpoRow`, `rowToExpo`, `CreateExpoWithHallsInput`

**Files:**
- Modify: `lib/tradexpo/types.ts`
- Modify: `lib/tradexpo/db/platform-data.ts`

- [ ] **Step 1: Add `language` to `Expo` type**

In `lib/tradexpo/types.ts`, in the `Expo` interface (after `ownerUserId`):

```ts
  ownerUserId?: string | null
  language: string
}
```

- [ ] **Step 2: Add `language` to `ExpoRow`**

In `lib/tradexpo/db/platform-data.ts`, in `type ExpoRow` (after `schedule_year`):

```ts
  schedule_year?: number | null
  language?: string | null
}
```

- [ ] **Step 3: Add `language` to `rowToExpo`**

In `rowToExpo` (after `ownerUserId` line):

```ts
    ownerUserId: r.owner_user_id ?? undefined,
    language: r.language ?? "vi"
  }
```

- [ ] **Step 4: Add `language` to `CreateExpoWithHallsInput`**

In `type CreateExpoWithHallsInput` (after `afterWrite`):

```ts
  afterWrite?: (expoId: string) => Promise<void>
  language?: string
}
```

- [ ] **Step 5: Add `language` to `createExpoWithHalls` INSERT**

In the INSERT statement inside `createExpoWithHalls` (around line 580), add `language` to the column list after `display_target_ids`:

```ts
        display_target_ids,
        language
```

And in the values list after the `display_target_ids` value:

```ts
        ${JSON.stringify(
          normalizeDisplayTargetIds(
            input.displayTargetIds ?? [AROBID_DISPLAY_TARGET_ID]
          )
        )}::jsonb,
        ${input.language ?? "vi"}
```

- [ ] **Step 6: Add `language` to `updateExpoWithHalls` UPDATE**

In the SET clause of `updateExpoWithHalls` (around line 759), replace:

```ts
        display_target_ids = ${JSON.stringify(
          normalizeDisplayTargetIds(
            input.displayTargetIds ?? [AROBID_DISPLAY_TARGET_ID]
          )
        )}::jsonb
      where id = ${expoId}
```

with:

```ts
        display_target_ids = ${JSON.stringify(
          normalizeDisplayTargetIds(
            input.displayTargetIds ?? [AROBID_DISPLAY_TARGET_ID]
          )
        )}::jsonb,
        language = ${input.language ?? "vi"}
      where id = ${expoId}
```

- [ ] **Step 7: Typecheck**

```bash
bun typecheck
```

Expected: Zero errors.

- [ ] **Step 8: Commit**

```bash
git add lib/tradexpo/types.ts lib/tradexpo/db/platform-data.ts
git commit -m "feat: add language field to Expo type and DB row/input"
```

---

## Task 3: Update DB Marketing Functions

**Files:**
- Modify: `lib/tradexpo/db/platform-data.ts`

- [ ] **Step 1: Update `publishAdminExpoMarketingContent` signature**

Replace the function signature:

```ts
export async function publishAdminExpoMarketingContent(
  expoId: string,
  content: ExpoMarketingContent,
  userId?: string | null
): Promise<ExpoMarketingContentVersion> {
```

with:

```ts
export async function publishAdminExpoMarketingContent(
  expoId: string,
  content: ExpoMarketingContent,
  userId?: string | null,
  locale = "vi"
): Promise<ExpoMarketingContentVersion> {
```

- [ ] **Step 2: Replace hardcoded `'en'` locale in `publishAdminExpoMarketingContent`**

In the INSERT inside `publishAdminExpoMarketingContent`, replace:

```ts
      'en',
```

(the `content_locale` value) with:

```ts
      ${locale},
```

- [ ] **Step 3: Update `submitPartnerExpoMarketingContent` signature**

Replace:

```ts
export async function submitPartnerExpoMarketingContent(
  expoId: string,
  content: ExpoMarketingContent,
  userId: string
): Promise<ExpoMarketingContentVersion> {
```

with:

```ts
export async function submitPartnerExpoMarketingContent(
  expoId: string,
  content: ExpoMarketingContent,
  userId: string,
  locale = "vi"
): Promise<ExpoMarketingContentVersion> {
```

- [ ] **Step 4: Replace hardcoded `'en'` locale in `submitPartnerExpoMarketingContent`**

In the INSERT inside `submitPartnerExpoMarketingContent`, replace the `'en'` value with:

```ts
      ${locale},
```

- [ ] **Step 5: Rewrite `getLatestExpoMarketingContentForEdit` to return multi-locale map**

Replace the entire function:

```ts
export async function getLatestExpoMarketingContentForEdit(
  expoId: string
): Promise<Record<string, ExpoMarketingContent>> {
  const rows = (await sql`
    select distinct on (content_locale) *
    from expo_marketing_content_versions
    where expo_id = ${expoId}
    order by content_locale, content_version desc
  `) as ExpoMarketingContentVersionRow[]
  const result: Record<string, ExpoMarketingContent> = {}
  for (const row of rows) {
    result[row.content_locale] = normalizeExpoMarketingContent(row.content)
  }
  return result
}
```

- [ ] **Step 6: Typecheck**

```bash
bun typecheck
```

Expected: Errors on the two edit pages (`marketingVersion?.content` no longer valid) and the two API routes (missing locale arg). These will be fixed in subsequent tasks.

- [ ] **Step 7: Commit**

```bash
git add lib/tradexpo/db/platform-data.ts
git commit -m "feat: update marketing content DB functions for multi-locale support"
```

---

## Task 4: Language Constant + General Step UI

**Files:**
- Modify: `components/tradexpo/expo-form/constants.ts`
- Modify: `components/tradexpo/expo-form/general-step.tsx`

- [ ] **Step 1: Add `EXPO_LANGUAGE_OPTIONS` to constants**

In `components/tradexpo/expo-form/constants.ts`, add at the top (before existing constants):

```ts
export const EXPO_LANGUAGE_OPTIONS = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "th", label: "ภาษาไทย" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
] as const
```

- [ ] **Step 2: Add `language` and `onLanguageChange` to `GeneralStepProps`**

In `components/tradexpo/expo-form/general-step.tsx`, add to `type GeneralStepProps`:

```ts
  language: string
  onLanguageChange: (value: string) => void
```

- [ ] **Step 3: Add language import**

At the top of `general-step.tsx`, add to the imports from `./constants`:

```ts
import { EXPO_LANGUAGE_OPTIONS } from "./constants"
```

- [ ] **Step 4: Add language dropdown destructuring**

In the `GeneralStep` function params, add:

```ts
  language,
  onLanguageChange,
```

- [ ] **Step 5: Add language dropdown JSX**

In `GeneralStep`, after the description `<Textarea>` block and before the `<ImageUploadField label="Thumbnail"` block, add:

```tsx
        <div className="grid gap-2">
          <Label htmlFor="expo-language">Origin Language</Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger id="expo-language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {EXPO_LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.code} value={opt.code}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
```

- [ ] **Step 6: Typecheck**

```bash
bun typecheck
```

Expected: Errors on `expo-form.tsx` (missing `language`/`onLanguageChange` props on `GeneralStep`). Fixed in Task 5.

- [ ] **Step 7: Commit**

```bash
git add components/tradexpo/expo-form/constants.ts components/tradexpo/expo-form/general-step.tsx
git commit -m "feat: add language dropdown to expo form general step"
```

---

## Task 5: ExpoFormProps + ExpoForm State + EN Marketing State

**Files:**
- Modify: `components/tradexpo/expo-form/types.ts`
- Modify: `components/tradexpo/expo-form.tsx`

- [ ] **Step 1: Add `initialMarketingContentEn` to `ExpoFormProps`**

In `components/tradexpo/expo-form/types.ts`, replace:

```ts
  initialMarketingContent?: ExpoMarketingContent
```

with:

```ts
  initialMarketingContent?: ExpoMarketingContent
  initialMarketingContentEn?: ExpoMarketingContent
```

- [ ] **Step 2: Add Tabs + EXPO_LANGUAGE_OPTIONS import to `expo-form.tsx`**

In `components/tradexpo/expo-form.tsx`, add after the existing `import { Button }` line:

```ts
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
```

And update the import from `./expo-form/constants`:

```ts
import {
  ADMIN_EXPO_FORM_STEPS,
  EXPO_LANGUAGE_OPTIONS,
  PARTNER_EXPO_FORM_STEPS,
  PARTNER_EXPO_PACKAGE_FORM_STEPS
} from "./expo-form/constants"
```

- [ ] **Step 3: Add `language` state in `ExpoForm`**

In `expo-form.tsx`, after the `displayTargetIds` state (around line 182), add:

```ts
  const [language, setLanguage] = React.useState(
    isEdit ? (props.initialExpo.language ?? "vi") : "vi"
  )
```

- [ ] **Step 4: Add EN marketing state**

After the existing `benefitCards` state (around line 210), add:

```ts
  const initialEnMarketingContent = normalizeExpoMarketingContent(
    props.initialMarketingContentEn ?? DEFAULT_EXPO_MARKETING_CONTENT
  )
  const [enWhoEnabled, setEnWhoEnabled] = React.useState(
    initialEnMarketingContent.whoShouldJoin.enabled
  )
  const [enWhoTitle, setEnWhoTitle] = React.useState(
    initialEnMarketingContent.whoShouldJoin.sectionTitle
  )
  const [enWhoSubtitle, setEnWhoSubtitle] = React.useState(
    initialEnMarketingContent.whoShouldJoin.sectionSubtitle ?? ""
  )
  const [enAudienceCards, setEnAudienceCards] = React.useState<
    AudienceCardFormRow[]
  >(() => audienceRowsFromContent(initialEnMarketingContent))
  const [enBenefitsEnabled, setEnBenefitsEnabled] = React.useState(
    initialEnMarketingContent.audienceBenefits.enabled
  )
  const [enBenefitsTitle, setEnBenefitsTitle] = React.useState(
    initialEnMarketingContent.audienceBenefits.sectionTitle
  )
  const [enBenefitsSubtitle, setEnBenefitsSubtitle] = React.useState(
    initialEnMarketingContent.audienceBenefits.sectionSubtitle ?? ""
  )
  const [enBenefitCards, setEnBenefitCards] = React.useState<
    BenefitCardFormRow[]
  >(() => benefitRowsFromContent(initialEnMarketingContent))
```

- [ ] **Step 5: Add EN handlers**

After the existing `updateBenefitItem` function (around line 345), add:

```ts
  function updateEnAudienceCard(
    index: number,
    patch: Partial<AudienceCardFormRow>
  ) {
    setEnAudienceCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, ...patch } : card))
    )
  }

  function updateEnBenefitCard(
    index: number,
    patch: Partial<BenefitCardFormRow>
  ) {
    setEnBenefitCards((prev) =>
      prev.map((card, i) => {
        if (i !== index) {
          return patch.isFeatured ? { ...card, isFeatured: false } : card
        }
        return { ...card, ...patch }
      })
    )
  }

  function updateEnBenefitItem(
    cardIndex: number,
    itemIndex: number,
    value: string
  ) {
    setEnBenefitCards((prev) =>
      prev.map((card, i) =>
        i === cardIndex
          ? {
              ...card,
              benefitItems: card.benefitItems.map((item, j) =>
                j === itemIndex ? value : item
              )
            }
          : card
      )
    )
  }

  function buildEnMarketingContent(): ExpoMarketingContent {
    return normalizeExpoMarketingContent({
      whoShouldJoin: {
        enabled: enWhoEnabled,
        sectionTitle: enWhoTitle,
        sectionSubtitle: enWhoSubtitle,
        audienceCards: enAudienceCards.map(({ key: _key, ...card }) => card)
      },
      audienceBenefits: {
        enabled: enBenefitsEnabled,
        sectionTitle: enBenefitsTitle,
        sectionSubtitle: enBenefitsSubtitle,
        benefitCards: enBenefitCards.map(({ key: _key, ...card }) => card)
      }
    })
  }
```

- [ ] **Step 6: Wire `language` + `onLanguageChange` to `GeneralStep`**

In the `GeneralStep` JSX render (find the `<GeneralStep` usage around line 640), add:

```tsx
              language={language}
              onLanguageChange={setLanguage}
```

- [ ] **Step 7: Add `language` and `marketingContentEn` to submit payload**

In `onSubmit`, after `const marketingContent = buildMarketingContent()`, add:

```ts
    const enMarketingContent = language !== "en" ? buildEnMarketingContent() : null
    const enHasContent =
      enMarketingContent !== null &&
      (enMarketingContent.whoShouldJoin.audienceCards.length > 0 ||
        enMarketingContent.audienceBenefits.benefitCards.length > 0)
```

Then in the `payload` object, add after `marketingContent`:

```ts
      language,
      marketingContentEn: enHasContent ? enMarketingContent : undefined,
```

- [ ] **Step 8: Replace marketing step JSX with Tab UI**

Replace the existing marketing step block (around line 702–724):

```tsx
          {activeStep.id === "marketing" ? (
            <MarketingStep
              whoEnabled={whoEnabled}
              onWhoEnabledChange={setWhoEnabled}
              whoTitle={whoTitle}
              onWhoTitleChange={setWhoTitle}
              whoSubtitle={whoSubtitle}
              onWhoSubtitleChange={setWhoSubtitle}
              audienceCards={audienceCards}
              onAudienceCardsChange={setAudienceCards}
              onUpdateAudienceCard={updateAudienceCard}
              benefitsEnabled={benefitsEnabled}
              onBenefitsEnabledChange={setBenefitsEnabled}
              benefitsTitle={benefitsTitle}
              onBenefitsTitleChange={setBenefitsTitle}
              benefitsSubtitle={benefitsSubtitle}
              onBenefitsSubtitleChange={setBenefitsSubtitle}
              benefitCards={benefitCards}
              onBenefitCardsChange={setBenefitCards}
              onUpdateBenefitCard={updateBenefitCard}
              onUpdateBenefitItem={updateBenefitItem}
            />
          ) : null}
```

with:

```tsx
          {activeStep.id === "marketing" ? (
            language !== "en" ? (
              <Tabs defaultValue="origin" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="origin">
                    {EXPO_LANGUAGE_OPTIONS.find((l) => l.code === language)
                      ?.label ?? language}
                  </TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
                <TabsContent value="origin">
                  <MarketingStep
                    whoEnabled={whoEnabled}
                    onWhoEnabledChange={setWhoEnabled}
                    whoTitle={whoTitle}
                    onWhoTitleChange={setWhoTitle}
                    whoSubtitle={whoSubtitle}
                    onWhoSubtitleChange={setWhoSubtitle}
                    audienceCards={audienceCards}
                    onAudienceCardsChange={setAudienceCards}
                    onUpdateAudienceCard={updateAudienceCard}
                    benefitsEnabled={benefitsEnabled}
                    onBenefitsEnabledChange={setBenefitsEnabled}
                    benefitsTitle={benefitsTitle}
                    onBenefitsTitleChange={setBenefitsTitle}
                    benefitsSubtitle={benefitsSubtitle}
                    onBenefitsSubtitleChange={setBenefitsSubtitle}
                    benefitCards={benefitCards}
                    onBenefitCardsChange={setBenefitCards}
                    onUpdateBenefitCard={updateBenefitCard}
                    onUpdateBenefitItem={updateBenefitItem}
                  />
                </TabsContent>
                <TabsContent value="en">
                  <MarketingStep
                    whoEnabled={enWhoEnabled}
                    onWhoEnabledChange={setEnWhoEnabled}
                    whoTitle={enWhoTitle}
                    onWhoTitleChange={setEnWhoTitle}
                    whoSubtitle={enWhoSubtitle}
                    onWhoSubtitleChange={setEnWhoSubtitle}
                    audienceCards={enAudienceCards}
                    onAudienceCardsChange={setEnAudienceCards}
                    onUpdateAudienceCard={updateEnAudienceCard}
                    benefitsEnabled={enBenefitsEnabled}
                    onBenefitsEnabledChange={setEnBenefitsEnabled}
                    benefitsTitle={enBenefitsTitle}
                    onBenefitsTitleChange={setEnBenefitsTitle}
                    benefitsSubtitle={enBenefitsSubtitle}
                    onBenefitsSubtitleChange={setEnBenefitsSubtitle}
                    benefitCards={enBenefitCards}
                    onBenefitCardsChange={setEnBenefitCards}
                    onUpdateBenefitCard={updateEnBenefitCard}
                    onUpdateBenefitItem={updateEnBenefitItem}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <MarketingStep
                whoEnabled={whoEnabled}
                onWhoEnabledChange={setWhoEnabled}
                whoTitle={whoTitle}
                onWhoTitleChange={setWhoTitle}
                whoSubtitle={whoSubtitle}
                onWhoSubtitleChange={setWhoSubtitle}
                audienceCards={audienceCards}
                onAudienceCardsChange={setAudienceCards}
                onUpdateAudienceCard={updateAudienceCard}
                benefitsEnabled={benefitsEnabled}
                onBenefitsEnabledChange={setBenefitsEnabled}
                benefitsTitle={benefitsTitle}
                onBenefitsTitleChange={setBenefitsTitle}
                benefitsSubtitle={benefitsSubtitle}
                onBenefitsSubtitleChange={setBenefitsSubtitle}
                benefitCards={benefitCards}
                onBenefitCardsChange={setBenefitCards}
                onUpdateBenefitCard={updateBenefitCard}
                onUpdateBenefitItem={updateBenefitItem}
              />
            )
          ) : null}
```

- [ ] **Step 9: Typecheck**

```bash
bun typecheck
```

Expected: Remaining errors are in the 3 API routes and 2 edit pages.

- [ ] **Step 10: Commit**

```bash
git add components/tradexpo/expo-form/types.ts components/tradexpo/expo-form.tsx
git commit -m "feat: add language state and dual-locale marketing tabs to expo form"
```

---

## Task 6: Update API Routes

**Files:**
- Modify: `app/api/tradexpo/expos/route.ts`
- Modify: `app/api/tradexpo/expos/[expoId]/route.ts`
- Modify: `app/api/partner/expos/[expoId]/route.ts`

### 6a: Admin POST route (`app/api/tradexpo/expos/route.ts`)

- [ ] **Step 1: Add `language` and `marketingContentEn` to body type**

In the `body` type definition, add after `marketingContent`:

```ts
    marketingContent?: unknown
    marketingContentEn?: unknown
    language?: string
```

- [ ] **Step 2: Parse and validate `language`**

After the `marketingResult` validation block, add:

```ts
  const language = body.language?.trim() || "vi"

  const enMarketingResult =
    body.marketingContentEn != null
      ? validateExpoMarketingContent(body.marketingContentEn)
      : null
  if (enMarketingResult && !enMarketingResult.ok) {
    return NextResponse.json({ error: enMarketingResult.error }, { status: 400 })
  }
```

- [ ] **Step 3: Add `language` to `createExpoWithHalls` call**

In the `createExpoWithHalls` call, add:

```ts
      language,
```

- [ ] **Step 4: Publish EN content in `afterWrite`**

In the `afterWrite` callback, after `publishAdminExpoMarketingContent(...)`, add:

```ts
        await publishAdminExpoMarketingContent(
          createdExpoId,
          marketingResult.content,
          userId,
          language
        )
        if (enMarketingResult?.ok) {
          await publishAdminExpoMarketingContent(
            createdExpoId,
            enMarketingResult.content,
            userId,
            "en"
          )
        }
```

Note: Remove the original `publishAdminExpoMarketingContent` call (the one without locale) since the new call above replaces it.

### 6b: Admin PUT route (`app/api/tradexpo/expos/[expoId]/route.ts`)

- [ ] **Step 5: Add `language` and `marketingContentEn` to body type**

In the `body` type, add after `marketingContent`:

```ts
    marketingContent?: unknown
    marketingContentEn?: unknown
    language?: string
```

- [ ] **Step 6: Parse and validate**

After the `marketingResult` validation block, add:

```ts
  const language = body.language?.trim() || "vi"

  const enMarketingResult =
    body.marketingContentEn != null
      ? validateExpoMarketingContent(body.marketingContentEn)
      : null
  if (enMarketingResult && !enMarketingResult.ok) {
    return NextResponse.json({ error: enMarketingResult.error }, { status: 400 })
  }
```

- [ ] **Step 7: Add `language` to `updateExpoWithHalls` call**

In the `updateExpoWithHalls` call, add:

```ts
      language,
```

- [ ] **Step 8: Replace `publishAdminExpoMarketingContent` call with locale-aware version**

Replace:

```ts
        await publishAdminExpoMarketingContent(
          savedExpoId,
          marketingResult.content,
          userId
        )
```

with:

```ts
        await publishAdminExpoMarketingContent(
          savedExpoId,
          marketingResult.content,
          userId,
          language
        )
        if (enMarketingResult?.ok) {
          await publishAdminExpoMarketingContent(
            savedExpoId,
            enMarketingResult.content,
            userId,
            "en"
          )
        }
```

### 6c: Partner PUT route (`app/api/partner/expos/[expoId]/route.ts`)

- [ ] **Step 9: Add `language` and `marketingContentEn` to body type**

Add to the body type:

```ts
    marketingContentEn?: unknown
    language?: string
```

- [ ] **Step 10: Parse and validate**

After the `marketingResult` block, add:

```ts
  const language = (body as { language?: string }).language?.trim() || expo.language ?? "vi"

  const enMarketingResult =
    (body as { marketingContentEn?: unknown }).marketingContentEn != null
      ? validateExpoMarketingContent(
          (body as { marketingContentEn?: unknown }).marketingContentEn
        )
      : null
  if (enMarketingResult && !enMarketingResult.ok) {
    return NextResponse.json({ error: enMarketingResult.error }, { status: 400 })
  }
```

- [ ] **Step 11: Add `language` to `updateExpoWithHalls` call**

In the `updateExpoWithHalls` call, add:

```ts
      language,
```

- [ ] **Step 12: Replace `submitPartnerExpoMarketingContent` with locale-aware call and add EN**

Replace:

```ts
    const marketingVersion = await submitPartnerExpoMarketingContent(
      expoId,
      marketingResult.content,
      userId
    )
```

with:

```ts
    const marketingVersion = await submitPartnerExpoMarketingContent(
      expoId,
      marketingResult.content,
      userId,
      language
    )
    if (enMarketingResult?.ok) {
      await submitPartnerExpoMarketingContent(
        expoId,
        enMarketingResult.content,
        userId,
        "en"
      )
    }
```

- [ ] **Step 13: Typecheck**

```bash
bun typecheck
```

Expected: Only errors remaining are in the 2 edit pages.

- [ ] **Step 14: Commit**

```bash
git add app/api/tradexpo/expos/route.ts app/api/tradexpo/expos/\[expoId\]/route.ts app/api/partner/expos/\[expoId\]/route.ts
git commit -m "feat: update expo API routes to handle language and dual-locale marketing content"
```

---

## Task 7: Update Edit Pages

**Files:**
- Modify: `app/(dashboard)/admin/tradexpo/expos/[expoId]/edit/page.tsx`
- Modify: `app/(dashboard)/partner/expo-program/expos/[expoId]/edit/page.tsx`

### 7a: Admin Edit Page

- [ ] **Step 1: Update `marketingVersion` variable to `marketingVersions`**

Replace:

```ts
    marketingVersion,
```

with:

```ts
    marketingVersions,
```

And in the `Promise.all` array, replace:

```ts
    getLatestExpoMarketingContentForEdit(expoId),
```

(no change needed — function call stays the same, just return type changed)

- [ ] **Step 2: Update `ExpoForm` props**

Replace:

```tsx
        initialMarketingContent={marketingVersion?.content}
```

with:

```tsx
        initialMarketingContent={marketingVersions[expo.language ?? "vi"]}
        initialMarketingContentEn={marketingVersions["en"]}
```

### 7b: Partner Edit Page

- [ ] **Step 3: Update `marketingVersion` variable**

Replace:

```ts
    marketingVersion,
```

with:

```ts
    marketingVersions,
```

- [ ] **Step 4: Update `ExpoForm` props**

Replace:

```tsx
        initialMarketingContent={marketingVersion?.content}
```

with:

```tsx
        initialMarketingContent={marketingVersions[expo.language ?? "vi"]}
        initialMarketingContentEn={marketingVersions["en"]}
```

- [ ] **Step 5: Typecheck — all errors resolved**

```bash
bun typecheck
```

Expected: Zero errors.

- [ ] **Step 6: Final commit**

```bash
git add app/\(dashboard\)/admin/tradexpo/expos/\[expoId\]/edit/page.tsx app/\(dashboard\)/partner/expo-program/expos/\[expoId\]/edit/page.tsx
git commit -m "feat: load multi-locale marketing content in expo edit pages"
```

---

## Verification

- [ ] Start dev server: `bun dev`
- [ ] Create new expo → General step shows "Origin Language" dropdown, default Tiếng Việt
- [ ] Go to Marketing step → two tabs: "Tiếng Việt" and "English"
- [ ] Fill origin tab content, leave English tab empty → save → only 1 `expo_marketing_content_versions` row with `content_locale = 'vi'`
- [ ] Fill both tabs → save → 2 rows in `expo_marketing_content_versions` (`vi` and `en`)
- [ ] Edit the expo → both tabs reload their respective content
- [ ] Change Origin Language to "ภาษาไทย" → tab label changes to "ภาษาไทย", saves with `content_locale = 'th'`
- [ ] Change Origin Language to "English" → single tab shown, no English tab
