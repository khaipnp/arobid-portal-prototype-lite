# Expo Marketing Content — Multi-Language Support

**Date:** 2026-06-15  
**Feature:** Add Origin Language + English Language versions to Expo Marketing Content

---

## Problem

The Expo Marketing Content form currently saves a single version with `content_locale` hardcoded to `'en'`. Expos need to support content in their native language (Origin Language) with an optional English version.

---

## Solution Overview

- Add `language` field to `expos` table (ISO 639-1 code, default `'vi'`)
- Add language dropdown to the General step of the Expo form
- Marketing Content step: show two tabs — "Origin Language" (labeled by selected language) and "English" — when origin language is not English
- Save up to two `expo_marketing_content_versions` rows per publish: one per locale
- Edit mode loads both versions by locale

---

## Section 1: Data Layer

### `expos` table
Add migration:
```sql
ALTER TABLE expos ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'vi';
```

### `Expo` type (`lib/tradexpo/types.ts`)
```ts
export interface Expo {
  // ... existing fields
  language: string  // ISO 639-1 code, e.g. 'vi', 'en', 'th'
}
```

### `expo_marketing_content_versions` table
No schema change — `content_locale` column already exists. Currently hardcoded to `'en'`; will now use actual locale values.

### DB functions

**`publishAdminExpoMarketingContent` / `submitPartnerExpoMarketingContent`**  
Add `locale: string` parameter; use it instead of hardcoded `'en'`.

**`getLatestExpoMarketingContentForEdit`**  
Currently returns a single `ExpoMarketingContent`. Update to return all locales:
```ts
// Returns map of locale → content (latest published version per locale)
{ [locale: string]: ExpoMarketingContent }
```
Query: `WHERE expo_id = $1 AND status = 'published' ORDER BY content_version DESC` — group by `content_locale`.

**`rowToExpo`**  
Map `row.language ?? 'vi'` to `Expo.language`.

---

## Section 2: General Step — Language Field

**File:** `components/tradexpo/expo-form/general-step.tsx`

Add Language dropdown after the `description` field.

**Supported languages:**
| Code | Display |
|------|---------|
| `vi` | Tiếng Việt *(default)* |
| `en` | English |
| `th` | ภาษาไทย |
| `id` | Bahasa Indonesia |
| `zh` | 中文 |
| `ja` | 日本語 |
| `ko` | 한국어 |

- Create mode: default `'vi'`
- Edit mode: value from `initialExpo.language`

---

## Section 3: ExpoForm State & Marketing Step UI

### New state in `expo-form.tsx`
```ts
const [language, setLanguage] = useState(initialExpo?.language ?? "vi")
const [marketingContentEn, setMarketingContentEn] = useState<ExpoMarketingContent>(
  props.initialMarketingContentEn ?? DEFAULT_EXPO_MARKETING_CONTENT
)
```

### `ExpoFormProps` additions (`components/tradexpo/expo-form/types.ts`)
```ts
initialMarketingContent?: ExpoMarketingContent      // origin locale (existing)
initialMarketingContentEn?: ExpoMarketingContent    // english version (new)
```

### Marketing Step UI

When `language !== 'en'`: wrap `MarketingStep` in shadcn `Tabs`:
- **Tab 1**: label = language display name (e.g., "Tiếng Việt") — binds to existing `marketingContent` state
- **Tab 2**: label = "English" — binds to `marketingContentEn` state

When `language === 'en'`: render single `MarketingStep` (no tabs), origin state only.

`MarketingStep` component interface unchanged — tabs just pass different `value`/`onChange` props.

---

## Section 4: Submit & Edit Load

### Submit (API route: `app/api/tradexpo/expos/route.ts`)

1. Save `language` to `expos` row
2. Publish origin version: `content_locale = language`
3. If EN content is non-empty (has ≥1 audience card OR ≥1 benefit card): publish additional version with `content_locale = 'en'`

**Non-empty check:**
```ts
const enHasContent =
  marketingContentEn.whoShouldJoin.audienceCards.length > 0 ||
  marketingContentEn.audienceBenefits.benefitCards.length > 0
```

### Edit Load (`app/(dashboard)/admin/tradexpo/expos/[expoId]/edit/page.tsx`)

```ts
const versions = await getLatestExpoMarketingContentForEdit(expoId)
// Pass to form:
initialMarketingContent={versions[expo.language]}
initialMarketingContentEn={versions['en']}
```

---

## Files Changed

| File | Change |
|------|--------|
| `lib/platform/ensure-schema.ts` | Migration: `language` column on `expos` |
| `lib/tradexpo/types.ts` | `Expo.language: string` |
| `lib/tradexpo/db/platform-data.ts` | `rowToExpo`, `getLatestExpoMarketingContentForEdit` (multi-locale return), `publishAdminExpoMarketingContent`, `submitPartnerExpoMarketingContent` (locale param) |
| `components/tradexpo/expo-form/types.ts` | `ExpoFormProps`: add `initialMarketingContentEn` |
| `components/tradexpo/expo-form/general-step.tsx` | Language dropdown field |
| `components/tradexpo/expo-form.tsx` | State: `language`, `marketingContentEn`; submit logic |
| `components/tradexpo/expo-form/marketing-step.tsx` | Tab wrapper for dual-locale UI |
| `app/api/tradexpo/expos/route.ts` | Handle `language` field + dual locale publish |
| `app/(dashboard)/admin/tradexpo/expos/[expoId]/edit/page.tsx` | Pass `initialMarketingContentEn` |
