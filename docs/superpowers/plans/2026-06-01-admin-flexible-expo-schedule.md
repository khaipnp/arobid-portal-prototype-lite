# Admin Flexible Expo Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow Admin Create Expo and Edit Expo to save exact date ranges, month/year schedules, or to-be-announced schedules without forcing fake start/end dates.

**Architecture:** Add a small schedule domain helper module that owns schedule precision parsing, validation, persistence values, and timeline calculation. Keep `ExpoForm` as the UI shell but move schedule-specific choices into focused helpers/state. Persist flexible schedule fields in `expos`, map them through existing DB readers, and preserve Partner Portal schedule values because partner schedule edit is out of scope.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, Bun, Neon/Postgres SQL via `lib/db/neon.ts`, shadcn/ui, Tailwind CSS v4, Biome.

---

## Guardrails

- Do not create new test files. Project memory says manual/code verification preferred unless user explicitly asks for tests.
- Do not run seed scripts or any data mutation script. Dev/prod share DB.
- Do not commit unless user explicitly asks. Use git diff checkpoints instead.
- Keep comments sparse and match surrounding code.

## File structure

- Modify `lib/tradexpo/types.ts`
  - Add `ExpoSchedulePrecision` and nullable schedule fields to `Expo`.
- Create `lib/tradexpo/schedule.ts`
  - Centralize schedule precision constants, month options, validation, persistence normalization, timeline calculation, and form fallback helpers.
- Modify `lib/platform/ensure-schema.ts`
  - Add schedule columns.
  - Relax schedule date columns to nullable.
  - Backfill existing rows to `exact_date_range`.
- Modify `lib/tradexpo/db/platform-data.ts`
  - Map new DB columns to `Expo`.
  - Accept flexible schedule input in `createExpoWithHalls` and `updateExpoWithHalls`.
  - Insert/update nullable exact dates and month/year fields.
  - Reset raw status to `Draft` when exact schedule changes to non-exact and current status is `Live` or `Archived`.
- Modify `lib/partner/db.ts`
  - Map new schedule columns to `Expo` for partner reads.
- Modify `app/api/tradexpo/expos/route.ts`
  - Parse and validate Admin create schedule via `normalizeExpoScheduleInput`.
- Modify `app/api/tradexpo/expos/[expoId]/route.ts`
  - Parse and validate Admin update schedule via `normalizeExpoScheduleInput`.
- Modify `app/api/partner/expos/[expoId]/route.ts`
  - Preserve existing schedule values on partner content updates.
- Modify `components/tradexpo/expo-form.tsx`
  - Add RadioGroup schedule precision selector.
  - Add conditional exact/month/year/TBA fields.
  - Build schedule-aware payload.
  - Add client validation to avoid invalid hidden dates.
- Modify `lib/tradexpo/utils.ts`
  - Route timeline calculation through schedule-aware helper.
- Modify `app/(dashboard)/admin/tradexpo/expos/[expoId]/page.tsx`
  - Call schedule-aware timeline helper and render schedule fallback safely.

## Task 1: Add schedule domain types and helpers

**Files:**
- Modify: `lib/tradexpo/types.ts:113-133`, `lib/tradexpo/types.ts:217`
- Create: `lib/tradexpo/schedule.ts`

- [ ] **Step 1: Extend shared types**

In `lib/tradexpo/types.ts`, insert this type before `export interface Expo`:

```ts
export type ExpoSchedulePrecision =
  | "exact_date_range"
  | "month_year"
  | "unscheduled"
```

Update `Expo` schedule fields to this shape:

```ts
export interface Expo {
  id: string
  slug?: string
  name: string
  thumbnailUrl: string
  ownerEmail: string
  /** ISO date (YYYY-MM-DD), present only when exact dates exist. */
  startDate?: string
  /** ISO date (YYYY-MM-DD), present only when exact dates exist. */
  endDate?: string
  /** Full timestamps for exact date range schedules. */
  startAt?: string
  endAt?: string
  schedulePrecision: ExpoSchedulePrecision
  scheduleMonth?: number | null
  scheduleYear?: number | null
  status: ExpoStatus
  categoryIds: string[]
  createdAt: string
  description?: string
  timezone?: string
  expoTemplateId?: string | null
  ownerUserId?: string | null
}
```

Keep `ExpoTimelinePhase` as:

```ts
export type ExpoTimelinePhase = "Upcoming" | "Live" | "Archived"
```

- [ ] **Step 2: Create schedule helper module**

Create `lib/tradexpo/schedule.ts` with:

```ts
import type {
  Expo,
  ExpoSchedulePrecision,
  ExpoTimelinePhase
} from "@/lib/tradexpo/types"

export const EXPO_SCHEDULE_PRECISIONS: ExpoSchedulePrecision[] = [
  "exact_date_range",
  "month_year",
  "unscheduled"
]

export const EXPO_MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
]

export type ExpoScheduleInput = {
  schedulePrecision?: string
  startAt?: string
  endAt?: string
  timezone?: string
  scheduleMonth?: number | string | null
  scheduleYear?: number | string | null
}

export type NormalizedExpoSchedule = {
  schedulePrecision: ExpoSchedulePrecision
  startAt: string | null
  endAt: string | null
  timezone: string
  scheduleMonth: number | null
  scheduleYear: number | null
}

export type NormalizeExpoScheduleOptions = {
  requireFutureStart?: boolean
  nowMs?: number
}

function parseSchedulePrecision(
  value: string | undefined
): ExpoSchedulePrecision {
  if (value === "exact_date_range") return "exact_date_range"
  if (value === "month_year") return "month_year"
  if (value === "unscheduled") return "unscheduled"
  return "unscheduled"
}

function parseInteger(value: number | string | null | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim()) {
    return Number.parseInt(value.trim(), 10)
  }
  return Number.NaN
}

function isValidEventYear(value: number) {
  return Number.isInteger(value) && value >= 1900 && value <= 9999
}

export function normalizeExpoScheduleInput(
  input: ExpoScheduleInput,
  options: NormalizeExpoScheduleOptions = {}
): { ok: true; schedule: NormalizedExpoSchedule } | { ok: false; error: string } {
  const schedulePrecision = parseSchedulePrecision(input.schedulePrecision)
  const timezone = input.timezone?.trim() || "Asia/Bangkok"

  if (schedulePrecision === "exact_date_range") {
    const startAt = input.startAt?.trim() ?? ""
    const endAt = input.endAt?.trim() ?? ""
    if (!startAt || !endAt) {
      return { ok: false, error: "Start and end date/time are required." }
    }

    const start = new Date(startAt)
    const end = new Date(endAt)
    const startMs = start.getTime()
    const endMs = end.getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return { ok: false, error: "Invalid start or end date/time." }
    }
    if (endMs <= startMs) {
      return { ok: false, error: "End must be after start." }
    }
    if (options.requireFutureStart) {
      const nowMs = options.nowMs ?? Date.now()
      if (startMs < nowMs - 60_000) {
        return { ok: false, error: "Start date/time cannot be in the past." }
      }
    }

    return {
      ok: true,
      schedule: {
        schedulePrecision,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        timezone,
        scheduleMonth: null,
        scheduleYear: null
      }
    }
  }

  if (schedulePrecision === "month_year") {
    const scheduleMonth = parseInteger(input.scheduleMonth)
    const scheduleYear = parseInteger(input.scheduleYear)
    if (!Number.isInteger(scheduleMonth) || scheduleMonth < 1 || scheduleMonth > 12) {
      return { ok: false, error: "Select a valid schedule month." }
    }
    if (!isValidEventYear(scheduleYear)) {
      return { ok: false, error: "Enter a valid four-digit schedule year." }
    }

    return {
      ok: true,
      schedule: {
        schedulePrecision,
        startAt: null,
        endAt: null,
        timezone,
        scheduleMonth,
        scheduleYear
      }
    }
  }

  return {
    ok: true,
    schedule: {
      schedulePrecision: "unscheduled",
      startAt: null,
      endAt: null,
      timezone,
      scheduleMonth: null,
      scheduleYear: null
    }
  }
}

export function getExpoSchedulePrecision(expo: Partial<Expo>) {
  if (expo.schedulePrecision) return expo.schedulePrecision
  if (expo.startAt && expo.endAt) return "exact_date_range" satisfies ExpoSchedulePrecision
  return "unscheduled" satisfies ExpoSchedulePrecision
}

export function getExpoTimelinePhase(
  nowMs: number,
  schedulePrecision: ExpoSchedulePrecision,
  startAtIso?: string | null,
  endAtIso?: string | null
): ExpoTimelinePhase {
  if (schedulePrecision !== "exact_date_range" || !startAtIso || !endAtIso) {
    return "Upcoming"
  }

  const start = new Date(startAtIso).getTime()
  const end = new Date(endAtIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return "Upcoming"
  if (nowMs < start) return "Upcoming"
  if (nowMs > end) return "Archived"
  return "Live"
}

export function formatExpoScheduleLabel(expo: Expo) {
  const precision = getExpoSchedulePrecision(expo)
  if (precision === "exact_date_range") {
    if (expo.startDate && expo.endDate) return `${expo.startDate} → ${expo.endDate}`
    return "Exact schedule not set"
  }
  if (precision === "month_year") {
    const month = EXPO_MONTH_OPTIONS.find(
      (option) => option.value === expo.scheduleMonth
    )
    return month && expo.scheduleYear
      ? `${month.label} ${expo.scheduleYear}`
      : "Month & year not set"
  }
  return "Schedule to be announced"
}
```

- [ ] **Step 3: Run typecheck for new types**

Run:

```bash
bun typecheck
```

Expected before DB/API/UI updates: TypeScript may fail because `Expo` now requires `schedulePrecision`. Continue to Task 2 if failures point to missing mapped fields.

## Task 2: Add database schema support

**Files:**
- Modify: `lib/platform/ensure-schema.ts:166-179`
- Modify: `lib/platform/ensure-schema.ts:2389-2421`

- [ ] **Step 1: Make base table definition nullable for new installs**

Change the `create table if not exists expos` schedule columns in `lib/platform/ensure-schema.ts` to:

```ts
      start_date date,
      end_date date,
```

- [ ] **Step 2: Add schedule columns and relax old not-null constraints**

After the existing `end_at` column migration block, insert:

```ts
  await sql`
    alter table expos add column if not exists schedule_precision text not null default 'exact_date_range'
  `
  await sql`
    alter table expos add column if not exists schedule_month int
  `
  await sql`
    alter table expos add column if not exists schedule_year int
  `
  await sql`
    alter table expos alter column start_date drop not null
  `
  await sql`
    alter table expos alter column end_date drop not null
  `
```

- [ ] **Step 3: Keep existing backfill safe**

Leave current `start_at` and `end_at` backfill blocks as-is so existing date-only rows become exact schedule rows. Do not add a migration that nulls any existing dates.

- [ ] **Step 4: Verify schema file compiles**

Run:

```bash
bun typecheck
```

Expected: remaining failures may still exist in DB row mapping or API because those tasks are next.

## Task 3: Persist flexible schedule in Admin DB layer

**Files:**
- Modify: `lib/tradexpo/db/platform-data.ts:6-30`
- Modify: `lib/tradexpo/db/platform-data.ts:71-88`
- Modify: `lib/tradexpo/db/platform-data.ts:197-221`
- Modify: `lib/tradexpo/db/platform-data.ts:429-442`
- Modify: `lib/tradexpo/db/platform-data.ts:444-558`
- Modify: `lib/tradexpo/db/platform-data.ts:577-682`

- [ ] **Step 1: Import schedule types**

Add `ExpoSchedulePrecision` to the type import from `@/lib/tradexpo/types`.

```ts
  ExpoSchedulePrecision,
```

- [ ] **Step 2: Extend `ExpoRow`**

Change date columns to nullable and add schedule columns:

```ts
type ExpoRow = {
  id: string
  slug?: string | null
  name: string
  thumbnail_url: string
  owner_email: string
  start_date: string | Date | null
  end_date: string | Date | null
  status: Expo["status"]
  category_ids: string[]
  created_at: string | Date
  description?: string
  timezone?: string
  expo_template_id?: string | null
  owner_user_id?: string | null
  start_at?: string | Date | null
  end_at?: string | Date | null
  schedule_precision?: ExpoSchedulePrecision | null
  schedule_month?: number | null
  schedule_year?: number | null
}
```

- [ ] **Step 3: Make `rowToExpo` nullable-safe**

Replace `rowToExpo` with:

```ts
export function rowToExpo(r: ExpoRow): Expo {
  const startAt = r.start_at ? toIso(r.start_at) : undefined
  const endAt = r.end_at ? toIso(r.end_at) : undefined
  const schedulePrecision =
    r.schedule_precision ??
    (startAt && endAt ? "exact_date_range" : "unscheduled")

  return {
    id: r.id,
    slug: r.slug ?? undefined,
    name: r.name,
    thumbnailUrl: getAssetUrl(r.thumbnail_url, r.id),
    ownerEmail: r.owner_email,
    startDate: startAt
      ? toDateOnly(r.start_at as string | Date)
      : r.start_date
        ? toDateOnly(r.start_date)
        : undefined,
    endDate: endAt
      ? toDateOnly(r.end_at as string | Date)
      : r.end_date
        ? toDateOnly(r.end_date)
        : undefined,
    startAt,
    endAt,
    schedulePrecision,
    scheduleMonth: r.schedule_month ?? null,
    scheduleYear: r.schedule_year ?? null,
    status: r.status,
    categoryIds: r.category_ids,
    createdAt: toIso(r.created_at),
    description: r.description,
    timezone: r.timezone,
    expoTemplateId: r.expo_template_id ?? undefined,
    ownerUserId: r.owner_user_id ?? undefined
  }
}
```

- [ ] **Step 4: Replace create/update input type**

Update `CreateExpoWithHallsInput` to:

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
  halls: ExpoHallDraft[]
}
```

- [ ] **Step 5: Add local schedule persistence helper**

Above `createExpoWithHalls`, add:

```ts
function getSchedulePersistence(input: CreateExpoWithHallsInput) {
  if (input.schedulePrecision !== "exact_date_range") {
    return {
      startDate: null,
      endDate: null,
      startAt: null,
      endAt: null,
      scheduleMonth: input.scheduleMonth,
      scheduleYear: input.scheduleYear
    }
  }

  if (!input.startAt || !input.endAt) {
    throw new Error("Start and end date/time are required.")
  }

  const start = new Date(input.startAt)
  const end = new Date(input.endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start or end date/time.")
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error("End must be after start.")
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    scheduleMonth: null,
    scheduleYear: null
  }
}
```

- [ ] **Step 6: Use schedule helper in create insert**

In `createExpoWithHalls`, remove the local `start`/`end` validation block and replace `startDateStr`/`endDateStr` with:

```ts
  const schedule = getSchedulePersistence(input)
```

Add insert columns after `end_at`:

```ts
        schedule_precision,
        schedule_month,
        schedule_year
```

Add values after `${schedule.endAt}`:

```ts
        ${input.schedulePrecision},
        ${schedule.scheduleMonth},
        ${schedule.scheduleYear}
```

Use these values for existing columns:

```ts
        ${schedule.startDate},
        ${schedule.endDate},
        ${schedule.startAt},
        ${schedule.endAt}
```

- [ ] **Step 7: Use schedule helper in update**

In `updateExpoWithHalls`, remove the local `start`/`end` validation block and replace `startDateStr`/`endDateStr` with:

```ts
  const schedule = getSchedulePersistence(input)
```

Change `currentRows` query to fetch status:

```ts
  const currentRows = (await sql`
    select slug, status from expos where id = ${expoId} limit 1
  `) as { slug: string | null; status: ExpoStatus }[]
```

Add:

```ts
  const currentStatus = currentRows[0]?.status
  const nextStatus =
    input.schedulePrecision !== "exact_date_range" &&
    (currentStatus === "Live" || currentStatus === "Archived")
      ? ("Draft" satisfies ExpoStatus)
      : currentStatus
```

Update set clause schedule fields:

```ts
        start_date = ${schedule.startDate},
        end_date = ${schedule.endDate},
        status = ${nextStatus},
        timezone = ${input.timezone},
        start_at = ${schedule.startAt},
        end_at = ${schedule.endAt},
        schedule_precision = ${input.schedulePrecision},
        schedule_month = ${schedule.scheduleMonth},
        schedule_year = ${schedule.scheduleYear}
```

Keep the existing other columns unchanged.

- [ ] **Step 8: Run typecheck**

Run:

```bash
bun typecheck
```

Expected: failures should now point to callers that still pass `startAt/endAt` without schedule fields.

## Task 4: Map schedule fields in Partner DB reads

**Files:**
- Modify: `lib/partner/db.ts:730-740`
- Modify: `lib/partner/db.ts:772-798`

- [ ] **Step 1: Extend `PartnerExpoRow`**

Add schedule columns:

```ts
  start_date: string | Date | null
  end_date: string | Date | null
  schedule_precision?: ExpoSchedulePrecision | null
  schedule_month?: number | null
  schedule_year?: number | null
```

If `ExpoSchedulePrecision` is not imported yet, add it to the existing type import from `@/lib/tradexpo/types`.

- [ ] **Step 2: Update partner `rowToExpo`**

Replace schedule mapping in `rowToExpo` with:

```ts
  const startAt = row.start_at ? toIso(row.start_at) : undefined
  const endAt = row.end_at ? toIso(row.end_at) : undefined
  const schedulePrecision =
    row.schedule_precision ??
    (startAt && endAt ? "exact_date_range" : "unscheduled")
```

Return fields:

```ts
    startDate: startAt
      ? toDateOnly(row.start_at as string | Date)
      : row.start_date
        ? toDateOnly(row.start_date)
        : undefined,
    endDate: endAt
      ? toDateOnly(row.end_at as string | Date)
      : row.end_date
        ? toDateOnly(row.end_date)
        : undefined,
    startAt,
    endAt,
    schedulePrecision,
    scheduleMonth: row.schedule_month ?? null,
    scheduleYear: row.schedule_year ?? null,
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
bun typecheck
```

Expected: remaining failures should point to API payloads and UI date assumptions.

## Task 5: Update Admin API validation

**Files:**
- Modify: `app/api/tradexpo/expos/route.ts:1-133`
- Modify: `app/api/tradexpo/expos/[expoId]/route.ts:1-183`

- [ ] **Step 1: Import schedule normalizer**

In both Admin API files, add:

```ts
import { normalizeExpoScheduleInput } from "@/lib/tradexpo/schedule"
```

- [ ] **Step 2: Extend request body types**

In both body type blocks, add:

```ts
    schedulePrecision?: string
    scheduleMonth?: number | string | null
    scheduleYear?: number | string | null
```

- [ ] **Step 3: Replace create schedule validation**

In `app/api/tradexpo/expos/route.ts`, replace the existing `startAt/endAt` required block and past-date validation with:

```ts
  const scheduleResult = normalizeExpoScheduleInput(body, {
    requireFutureStart: true
  })
  if (!scheduleResult.ok) {
    return NextResponse.json({ error: scheduleResult.error }, { status: 400 })
  }
  const schedule = scheduleResult.schedule
```

When calling `createExpoWithHalls`, pass:

```ts
      schedulePrecision: schedule.schedulePrecision,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      timezone: schedule.timezone,
      scheduleMonth: schedule.scheduleMonth,
      scheduleYear: schedule.scheduleYear,
```

Remove old `startAt`, `endAt`, `timezone` variables from that call.

- [ ] **Step 4: Replace update schedule validation**

In `app/api/tradexpo/expos/[expoId]/route.ts`, replace the existing `startAt/endAt` required block with:

```ts
  const scheduleResult = normalizeExpoScheduleInput(body)
  if (!scheduleResult.ok) {
    return NextResponse.json({ error: scheduleResult.error }, { status: 400 })
  }
  const schedule = scheduleResult.schedule
```

When calling `updateExpoWithHalls`, pass:

```ts
      schedulePrecision: schedule.schedulePrecision,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      timezone: schedule.timezone,
      scheduleMonth: schedule.scheduleMonth,
      scheduleYear: schedule.scheduleYear,
```

Remove old `startAt`, `endAt`, `timezone` variables from that call.

- [ ] **Step 5: Run typecheck**

Run:

```bash
bun typecheck
```

Expected: partner API may still fail because it calls `updateExpoWithHalls` without schedule fields.

## Task 6: Preserve schedule in Partner content update API

**Files:**
- Modify: `app/api/partner/expos/[expoId]/route.ts:52-127`

- [ ] **Step 1: Stop accepting partner schedule fields**

Remove these from the partner body type:

```ts
    startAt?: string
    endAt?: string
    timezone?: string
```

Remove the partner schedule required block:

```ts
  const startAt = body.startAt?.trim() ?? ""
  const endAt = body.endAt?.trim() ?? ""
  if (!startAt || !endAt) {
    return NextResponse.json(
      { error: "Start and end date/time are required." },
      { status: 400 }
    )
  }
```

- [ ] **Step 2: Pass existing schedule to `updateExpoWithHalls`**

In the `updateExpoWithHalls` call, replace schedule arguments with:

```ts
      schedulePrecision: expo.schedulePrecision,
      startAt: expo.startAt ?? null,
      endAt: expo.endAt ?? null,
      timezone: expo.timezone || "Asia/Bangkok",
      scheduleMonth: expo.scheduleMonth ?? null,
      scheduleYear: expo.scheduleYear ?? null,
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
bun typecheck
```

Expected: remaining failures should point to UI components assuming required `startDate/endDate` strings.

## Task 7: Update schedule-aware timeline utility

**Files:**
- Modify: `lib/tradexpo/utils.ts:163-181`
- Modify: `app/(dashboard)/admin/tradexpo/expos/[expoId]/page.tsx:97-100`

- [ ] **Step 1: Re-export schedule-aware timeline helper**

In `lib/tradexpo/utils.ts`, add import:

```ts
import type { ExpoSchedulePrecision } from "@/lib/tradexpo/types"
```

Replace `getExpoTimelinePhase` signature with:

```ts
export function getExpoTimelinePhase(
  nowMs: number,
  schedulePrecision: ExpoSchedulePrecision,
  startAtIso?: string | null,
  endAtIso?: string | null
): ExpoTimelinePhase {
  if (schedulePrecision !== "exact_date_range" || !startAtIso || !endAtIso) {
    return "Upcoming"
  }

  const start = new Date(startAtIso).getTime()
  const end = new Date(endAtIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return "Upcoming"
  if (nowMs < start) return "Upcoming"
  if (nowMs > end) return "Archived"
  return "Live"
}
```

- [ ] **Step 2: Update admin detail call site**

In `app/(dashboard)/admin/tradexpo/expos/[expoId]/page.tsx`, replace timeline calculation with:

```ts
  const timelinePhase = getExpoTimelinePhase(
    Date.now(),
    expo.schedulePrecision,
    expo.startAt,
    expo.endAt
  )
```

Render badge unconditionally because non-exact schedules return `Upcoming`:

```tsx
              <Badge variant="outline" className={timelineStyles[timelinePhase]}>
                Timeline: {timelinePhase}
              </Badge>
```

- [ ] **Step 3: Run targeted search for old signature**

Run:

```bash
rg "getExpoTimelinePhase\(" /Users/ection/Working/arobid-portal-prototype
```

Expected: only utility definition and updated call sites remain. If another call exists, update it to pass `schedulePrecision`, `startAt`, and `endAt`.

## Task 8: Update Expo form schedule UI and payload

**Files:**
- Modify: `components/tradexpo/expo-form.tsx:3-69`
- Modify: `components/tradexpo/expo-form.tsx:189-242`
- Modify: `components/tradexpo/expo-form.tsx:417-455`
- Modify: `components/tradexpo/expo-form.tsx:499-505`
- Modify: `components/tradexpo/expo-form.tsx:689-725`

- [ ] **Step 1: Add imports**

Add UI import:

```ts
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
```

Add schedule helpers:

```ts
import {
  EXPO_MONTH_OPTIONS,
  getExpoSchedulePrecision,
  normalizeExpoScheduleInput
} from "@/lib/tradexpo/schedule"
```

Add type:

```ts
  ExpoSchedulePrecision,
```

- [ ] **Step 2: Add schedule option metadata**

Below `MARKETING_ICON_OPTIONS`, add:

```ts
const SCHEDULE_PRECISION_OPTIONS: Array<{
  value: ExpoSchedulePrecision
  label: string
  description: string
}> = [
  {
    value: "exact_date_range",
    label: "Exact date range",
    description: "Use confirmed start and end date/time."
  },
  {
    value: "month_year",
    label: "Month & year",
    description: "Use event month and year while exact dates are pending."
  },
  {
    value: "unscheduled",
    label: "To be announced",
    description: "Create this Expo without schedule fields."
  }
]
```

- [ ] **Step 3: Add schedule state**

After `timezone` state, add:

```ts
  const [schedulePrecision, setSchedulePrecision] =
    React.useState<ExpoSchedulePrecision>(() =>
      isEdit ? getExpoSchedulePrecision(props.initialExpo) : "unscheduled"
    )
  const [scheduleMonth, setScheduleMonth] = React.useState(() =>
    isEdit && props.initialExpo.scheduleMonth
      ? String(props.initialExpo.scheduleMonth)
      : ""
  )
  const [scheduleYear, setScheduleYear] = React.useState(() =>
    isEdit && props.initialExpo.scheduleYear
      ? String(props.initialExpo.scheduleYear)
      : ""
  )
  const [scheduleError, setScheduleError] = React.useState<string | null>(null)
```

Change create defaults for `startLocal` and `endLocal` to empty strings:

```ts
    return ""
```

For edit fallback inside `startLocal`, return empty if no `startAt` and no `startDate`:

```ts
      if (props.initialExpo.startDate) {
        return toDatetimeLocalValue(
          new Date(`${props.initialExpo.startDate}T12:00:00`)
        )
      }
      return ""
```

For edit fallback inside `endLocal`, return empty if no `endAt` and no `endDate`:

```ts
      if (props.initialExpo.endDate) {
        return toDatetimeLocalValue(
          new Date(`${props.initialExpo.endDate}T12:00:00`)
        )
      }
      return ""
```

- [ ] **Step 4: Build schedule payload safely**

At the start of `onSubmit`, after owner check, add:

```ts
    setScheduleError(null)
    const scheduleResult = normalizeExpoScheduleInput({
      schedulePrecision,
      startAt: startLocal,
      endAt: endLocal,
      timezone,
      scheduleMonth,
      scheduleYear
    })
    if (!scheduleResult.ok) {
      setScheduleError(scheduleResult.error)
      return
    }
    const schedule = scheduleResult.schedule
```

Remove:

```ts
    const startAt = new Date(startLocal).toISOString()
    const endAt = new Date(endLocal).toISOString()
```

In payload replace schedule fields with:

```ts
      schedulePrecision: schedule.schedulePrecision,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      timezone: schedule.timezone,
      scheduleMonth: schedule.scheduleMonth,
      scheduleYear: schedule.scheduleYear,
```

- [ ] **Step 5: Include schedule in `canSubmit`**

Replace `canSubmit` with:

```ts
  const hasScheduleInput =
    schedulePrecision === "exact_date_range"
      ? startLocal.trim().length > 0 && endLocal.trim().length > 0
      : schedulePrecision === "month_year"
        ? scheduleMonth.trim().length > 0 && scheduleYear.trim().length > 0
        : true

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    expoTemplateId &&
    categoryIds.length > 0 &&
    ownerPick !== null &&
    hasScheduleInput
```

- [ ] **Step 6: Replace old schedule grid JSX**

Replace the block currently rendering Start/End/Timezone with:

```tsx
              <section className="space-y-3 rounded-lg border p-4">
                <div>
                  <h3 className="font-medium text-sm">Schedule</h3>
                  <p className="text-muted-foreground text-xs">
                    Choose how precise the Expo schedule is right now.
                  </p>
                </div>
                <RadioGroup
                  value={schedulePrecision}
                  onValueChange={(value) => {
                    setSchedulePrecision(value as ExpoSchedulePrecision)
                    setScheduleError(null)
                  }}
                  className="grid gap-3 md:grid-cols-3"
                >
                  {SCHEDULE_PRECISION_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <RadioGroupItem value={option.value} className="mt-0.5" />
                      <span className="grid gap-1">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-muted-foreground text-xs">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>

                {schedulePrecision === "exact_date_range" ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="start">Start</Label>
                      <Input
                        id="start"
                        type="datetime-local"
                        value={startLocal}
                        onChange={(e) => setStartLocal(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end">End</Label>
                      <Input
                        id="end"
                        type="datetime-local"
                        value={endLocal}
                        onChange={(e) => setEndLocal(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPO_FORM_TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}

                {schedulePrecision === "month_year" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Month</Label>
                      <Select value={scheduleMonth} onValueChange={setScheduleMonth}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPO_MONTH_OPTIONS.map((month) => (
                            <SelectItem
                              key={month.value}
                              value={String(month.value)}
                            >
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="schedule-year">Year</Label>
                      <Input
                        id="schedule-year"
                        inputMode="numeric"
                        pattern="[0-9]{4}"
                        value={scheduleYear}
                        onChange={(e) => setScheduleYear(e.target.value)}
                        placeholder="2026"
                        required
                      />
                    </div>
                  </div>
                ) : null}

                {schedulePrecision === "unscheduled" ? (
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-muted-foreground text-sm">
                    Schedule to be announced. You can add exact dates later from
                    Edit Expo.
                  </p>
                ) : null}

                {scheduleError ? (
                  <p className="text-destructive text-xs">{scheduleError}</p>
                ) : null}
              </section>
```

- [ ] **Step 7: Run formatter and typecheck**

Run:

```bash
bun check
bun typecheck
```

Expected: `bun check` writes formatting/import fixes. `bun typecheck` may expose downstream components that require nullable date handling.

## Task 9: Fix nullable schedule display fallout

**Files:**
- Modify call sites reported by `bun typecheck` where `expo.startDate` or `expo.endDate` is required as `string`.
- Likely modify:
  - `components/tradexpo/expo-list-manager.tsx`
  - `components/partner/partner-expo-list.tsx`
  - `components/partner/partner-dashboard.tsx`
  - `components/seller/seller-expo-list.tsx`
  - `components/seller/seller-expo-detail.tsx`
  - `app/(tradexpo)/tradexpo/page.tsx`

- [ ] **Step 1: Add safe display helper imports where needed**

Where a component renders date ranges, import:

```ts
import { formatExpoScheduleLabel } from "@/lib/tradexpo/schedule"
```

- [ ] **Step 2: Replace direct date range strings**

Replace direct display like:

```tsx
{expo.startDate} → {expo.endDate}
```

with:

```tsx
{formatExpoScheduleLabel(expo)}
```

- [ ] **Step 3: Guard date filters and sorts**

In list filters that compare `expo.startDate` or `expo.endDate`, keep non-exact schedules out of exact date filtering:

```ts
    if (startDateFilter) {
      result = result.filter(
        (expo) => expo.startDate && expo.startDate >= startDateFilter
      )
    }

    if (endDateFilter) {
      result = result.filter(
        (expo) => expo.endDate && expo.endDate <= endDateFilter
      )
    }
```

For sorting by start date, push non-exact schedules to bottom:

```ts
const leftStart = left.startDate ?? "9999-12-31"
const rightStart = right.startDate ?? "9999-12-31"
return leftStart.localeCompare(rightStart)
```

- [ ] **Step 4: Guard countdown math**

Where code does `new Date(expo.startDate)` or days-until calculations, use:

```ts
if (!expo.startDate) return null
```

or filter exact-only rows first:

```ts
const exactScheduledExpos = expos.filter(
  (expo) => expo.schedulePrecision === "exact_date_range" && expo.startDate
)
```

- [ ] **Step 5: Re-run typecheck until clean**

Run:

```bash
bun typecheck
```

Expected: no TypeScript errors.

## Task 10: Final formatting and verification

**Files:**
- All modified files from prior tasks.

- [ ] **Step 1: Run Biome check/write**

Run:

```bash
bun check
```

Expected: command completes. It may rewrite imports/classes.

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
bun typecheck
```

Expected: command completes with no errors.

- [ ] **Step 3: Inspect diff**

Run:

```bash
git diff --stat
git diff -- docs/superpowers/specs/2026-06-01-admin-flexible-expo-schedule-design.md docs/superpowers/plans/2026-06-01-admin-flexible-expo-schedule.md lib/tradexpo/types.ts lib/tradexpo/schedule.ts lib/platform/ensure-schema.ts lib/tradexpo/db/platform-data.ts lib/partner/db.ts app/api/tradexpo/expos/route.ts app/api/tradexpo/expos/[expoId]/route.ts app/api/partner/expos/[expoId]/route.ts components/tradexpo/expo-form.tsx lib/tradexpo/utils.ts app/(dashboard)/admin/tradexpo/expos/[expoId]/page.tsx
```

Expected: diff contains schedule precision model, admin UI selector, server validation, DB persistence, and nullable date guards only.

- [ ] **Step 4: Manual acceptance check**

Review code against these cases without running seed/data mutation scripts:

```text
AC-01: Create Expo shows schedule selector.
AC-02: Exact date range shows Start, End, Timezone only.
AC-03: Month & year shows Month and Year only.
AC-04: To be announced hides schedule inputs.
AC-05: To be announced payload has no required start/end/month/year.
AC-06: Month/year missing month or year blocks submit.
AC-07: Month/year valid payload stores month_year.
AC-08: Exact with missing start/end blocks submit.
AC-09: Exact with end <= start blocks submit.
AC-10: Exact valid payload stores exact_date_range.
AC-11: Exact future timeline is Upcoming.
AC-12: Exact in-range timeline is Live.
AC-13: Exact past timeline is Archived.
AC-14: Month/year timeline is Upcoming.
AC-15: Unscheduled timeline is Upcoming.
```

- [ ] **Step 5: Stop before commit**

Do not commit. Report verification output and changed files to the user.

## Self-review notes

- Spec coverage: data model, Admin UI, Admin API, Partner out-of-scope preservation, timeline status, and verification all map to tasks above.
- Placeholder scan: no TBD/TODO placeholders; code steps include concrete snippets.
- Type consistency: `schedulePrecision`, `scheduleMonth`, `scheduleYear`, `startAt`, and `endAt` names match across types, API, DB, and UI.
- User preference adjustments: plan avoids new tests, avoids seed/data mutation scripts, and avoids commits unless user asks.
