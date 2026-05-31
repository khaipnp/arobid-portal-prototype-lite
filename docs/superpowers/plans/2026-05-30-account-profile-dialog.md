# Account Profile Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-service account profile dialog from the shared dashboard user menu so authenticated users can update First Name, Last Name, Gender, Mobile, and Date of Birth.

**Architecture:** Add profile columns to the existing `users` table through `ensurePlatformSchema`, isolate account profile database/validation logic in `lib/account/profile.ts`, expose session-scoped `GET/PATCH` through `app/api/account/profile/route.ts`, and render a focused dialog component from `components/nav-user.tsx`. The client never sends or chooses a target user ID; server code always resolves the current session user.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, Bun, Neon SQL helper, shadcn/ui Dialog/Input/Select/Button/Label, Sonner toast, Biome.

---

## File Structure

- Modify `lib/platform/ensure-schema.ts`
  - Add nullable `users` columns: `first_name`, `last_name`, `gender`, `mobile`, `date_of_birth`.
- Create `lib/account/profile.ts`
  - Own profile types, gender options, validation, normalization, first/last derivation, read and update SQL.
- Create `app/api/account/profile/route.ts`
  - Session-scoped `GET` and `PATCH` route handlers.
- Create `components/account/account-profile-dialog.tsx`
  - Client dialog, form state, fetch-on-open, submit, loading/error/toast, router refresh.
- Modify `components/nav-user.tsx`
  - Add account dialog open state and wire `Account` dropdown item to open dialog.

No new test files. Verification uses `bun typecheck` and `bun check` per project preference.

---

### Task 1: Add account profile schema columns

**Files:**
- Modify: `lib/platform/ensure-schema.ts`

- [ ] **Step 1: Locate existing users column migrations**

Open `lib/platform/ensure-schema.ts` around the existing users table definition and follow-up `alter table users add column if not exists ...` calls. The new columns belong after existing users column migrations, near the current `industry` and `industry_category_id` additions.

- [ ] **Step 2: Add nullable profile columns**

Insert these statements after the existing users column additions, before code that depends on users data seeding:

```ts
  await sql`alter table users add column if not exists first_name text`
  await sql`alter table users add column if not exists last_name text`
  await sql`alter table users add column if not exists gender text`
  await sql`alter table users add column if not exists mobile text`
  await sql`alter table users add column if not exists date_of_birth date`
```

Do not add a DB check constraint for gender in this task. Validation will live in `lib/account/profile.ts`; this avoids introducing a shared DB constraint that could fail if existing data contains unexpected values.

- [ ] **Step 3: Run typecheck for schema edit**

Run:

```bash
bun typecheck
```

Expected: TypeScript completes without errors caused by `lib/platform/ensure-schema.ts`.

- [ ] **Step 4: Commit schema change**

Stage only this file:

```bash
git add lib/platform/ensure-schema.ts
git commit -m "feat: add account profile columns"
```

---

### Task 2: Create account profile service

**Files:**
- Create: `lib/account/profile.ts`

- [ ] **Step 1: Create service file with types and helpers**

Create `lib/account/profile.ts` with this content:

```ts
import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const ACCOUNT_PROFILE_GENDERS = [
  "male",
  "female",
  "other",
  "prefer_not_to_say"
] as const

export type AccountProfileGender = (typeof ACCOUNT_PROFILE_GENDERS)[number]

export interface AccountProfile {
  firstName: string
  lastName: string
  gender: AccountProfileGender | null
  mobile: string | null
  dateOfBirth: string | null
}

export interface UpdateAccountProfileInput {
  firstName?: unknown
  lastName?: unknown
  gender?: unknown
  mobile?: unknown
  dateOfBirth?: unknown
}

type AccountProfileRow = {
  name: string
  firstName: string | null
  lastName: string | null
  gender: string | null
  mobile: string | null
  dateOfBirth: string | null
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeNullableText(value: unknown) {
  const normalized = normalizeText(value)
  return normalized || null
}

function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { firstName: "", lastName: "" }
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" }
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? ""
  }
}

function isAccountProfileGender(
  value: string
): value is AccountProfileGender {
  return ACCOUNT_PROFILE_GENDERS.includes(value as AccountProfileGender)
}

function normalizeGender(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string" || !isAccountProfileGender(value)) {
    throw new Error("Gender is invalid.")
  }
  return value
}

function normalizeDateOfBirth(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string" || !DATE_RE.test(value)) {
    throw new Error("Date of birth must use YYYY-MM-DD format.")
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date of birth is invalid.")
  }

  return value
}

function toAccountProfile(row: AccountProfileRow): AccountProfile {
  const derivedName = splitDisplayName(row.name)
  const firstName = row.firstName?.trim() || derivedName.firstName
  const lastName = row.lastName?.trim() || derivedName.lastName
  const gender = row.gender && isAccountProfileGender(row.gender) ? row.gender : null

  return {
    firstName,
    lastName,
    gender,
    mobile: row.mobile?.trim() || null,
    dateOfBirth: row.dateOfBirth
  }
}

export function normalizeAccountProfileInput(
  input: UpdateAccountProfileInput
): AccountProfile {
  const firstName = normalizeText(input.firstName)
  const lastName = normalizeText(input.lastName)

  if (!firstName) {
    throw new Error("First name is required.")
  }
  if (!lastName) {
    throw new Error("Last name is required.")
  }

  return {
    firstName,
    lastName,
    gender: normalizeGender(input.gender),
    mobile: normalizeNullableText(input.mobile),
    dateOfBirth: normalizeDateOfBirth(input.dateOfBirth)
  }
}

export async function getAccountProfile(
  userId: string
): Promise<AccountProfile | null> {
  await ensurePlatformSchema()

  const rows = (await sql`
    select
      name,
      first_name as "firstName",
      last_name as "lastName",
      gender,
      mobile,
      date_of_birth::text as "dateOfBirth"
    from users
    where id = ${userId}
      and is_active = true
    limit 1
  `) as AccountProfileRow[]

  const row = rows[0]
  return row ? toAccountProfile(row) : null
}

export async function updateAccountProfile(
  userId: string,
  input: UpdateAccountProfileInput
): Promise<AccountProfile> {
  await ensurePlatformSchema()

  const profile = normalizeAccountProfileInput(input)
  const displayName = `${profile.firstName} ${profile.lastName}`.trim()

  const rows = (await sql`
    update users
    set
      name = ${displayName},
      first_name = ${profile.firstName},
      last_name = ${profile.lastName},
      gender = ${profile.gender},
      mobile = ${profile.mobile},
      date_of_birth = ${profile.dateOfBirth}::date
    where id = ${userId}
      and is_active = true
    returning
      name,
      first_name as "firstName",
      last_name as "lastName",
      gender,
      mobile,
      date_of_birth::text as "dateOfBirth"
  `) as AccountProfileRow[]

  const row = rows[0]
  if (!row) {
    throw new Error("Account profile not found.")
  }

  return toAccountProfile(row)
}
```

- [ ] **Step 2: Check import/style compatibility**

Run:

```bash
bun typecheck
```

Expected: TypeScript may fail only if `profile.dateOfBirth` nullable cast creates a SQL typing issue. If it fails at `date_of_birth = ${profile.dateOfBirth}::date`, replace that line with:

```ts
      date_of_birth = nullif(${profile.dateOfBirth ?? ""}, '')::date
```

Then rerun `bun typecheck` and expect no errors from `lib/account/profile.ts`.

- [ ] **Step 3: Commit service**

```bash
git add lib/account/profile.ts
git commit -m "feat: add account profile service"
```

---

### Task 3: Add session-scoped account profile API

**Files:**
- Create: `app/api/account/profile/route.ts`

- [ ] **Step 1: Create route handler**

Create `app/api/account/profile/route.ts` with this content:

```ts
import { NextResponse } from "next/server"
import {
  getAccountProfile,
  updateAccountProfile
} from "@/lib/account/profile"
import { getCurrentSessionUserId } from "@/lib/auth/session"

export async function GET() {
  try {
    const userId = await getCurrentSessionUserId({ clearInvalidCookie: true })
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const profile = await getAccountProfile(userId)
    if (!profile) {
      return NextResponse.json({ error: "Account profile not found." }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json(
      { error: "Failed to load account profile." },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const userId = await getCurrentSessionUserId({ clearInvalidCookie: true })
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    )
  }

  try {
    const profile = await updateAccountProfile(
      userId,
      typeof body === "object" && body !== null ? body : {}
    )

    return NextResponse.json({ ok: true, profile })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update account profile."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun typecheck
```

Expected: no type errors in `app/api/account/profile/route.ts`.

- [ ] **Step 3: Commit API route**

```bash
git add app/api/account/profile/route.ts
git commit -m "feat: add account profile api"
```

---

### Task 4: Build account profile dialog component

**Files:**
- Create: `components/account/account-profile-dialog.tsx`

- [ ] **Step 1: Create dialog component**

Create `components/account/account-profile-dialog.tsx` with this content:

```tsx
"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" }
] as const

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  gender: "",
  mobile: "",
  dateOfBirth: ""
}

type AccountProfileFormState = typeof EMPTY_FORM

type AccountProfilePayload = {
  firstName: string
  lastName: string
  gender: string | null
  mobile: string | null
  dateOfBirth: string | null
}

interface AccountProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountProfileDialog({
  open,
  onOpenChange
}: AccountProfileDialogProps) {
  const router = useRouter()
  const [form, setForm] = React.useState<AccountProfileFormState>(EMPTY_FORM)
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setLoadError(null)

      try {
        const response = await fetch("/api/account/profile")
        const payload = (await response.json()) as {
          profile?: AccountProfilePayload
          error?: string
        }

        if (!response.ok || !payload.profile) {
          throw new Error(payload.error ?? "Could not load account profile.")
        }

        if (!cancelled) {
          setForm({
            firstName: payload.profile.firstName,
            lastName: payload.profile.lastName,
            gender: payload.profile.gender ?? "",
            mobile: payload.profile.mobile ?? "",
            dateOfBirth: payload.profile.dateOfBirth ?? ""
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not load account profile."
          setLoadError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [open])

  function updateField<K extends keyof AccountProfileFormState>(
    key: K,
    value: AccountProfileFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender || null,
          mobile: form.mobile,
          dateOfBirth: form.dateOfBirth || null
        })
      })
      const payload = (await response.json()) as {
        profile?: AccountProfilePayload
        error?: string
      }

      if (!response.ok || !payload.profile) {
        toast.error(payload.error ?? "Could not save account profile.")
        return
      }

      toast.success("Account profile saved.")
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Account information</DialogTitle>
          <DialogDescription>
            Update your personal information used across Arobid dashboards.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {loadError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                {loadError}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-first-name">First Name</Label>
                <Input
                  id="account-first-name"
                  value={form.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-last-name">Last Name</Label>
                <Input
                  id="account-last-name"
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-gender">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(value) => updateField("gender", value)}
                >
                  <SelectTrigger id="account-gender" className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-mobile">Mobile</Label>
                <Input
                  id="account-mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={(event) => updateField("mobile", event.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="account-date-of-birth">DoB</Label>
                <Input
                  id="account-date-of-birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) =>
                    updateField("dateOfBirth", event.target.value)
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || Boolean(loadError)}>
                {submitting && <Spinner />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun typecheck
```

Expected: no type errors in `components/account/account-profile-dialog.tsx`.

If `SelectTrigger` does not accept `id`, move the `id` to a wrapping `div` and remove `htmlFor` from that label:

```tsx
<Label>Gender</Label>
<Select ...>
```

Then rerun `bun typecheck`.

- [ ] **Step 3: Commit dialog component**

```bash
git add components/account/account-profile-dialog.tsx
git commit -m "feat: add account profile dialog"
```

---

### Task 5: Wire account dialog into NavUser

**Files:**
- Modify: `components/nav-user.tsx`

- [ ] **Step 1: Update imports**

Modify imports at the top of `components/nav-user.tsx`:

```tsx
import {
  BellIcon,
  ChevronRightIcon,
  LogOutIcon,
  UserCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AccountProfileDialog } from "@/components/account/account-profile-dialog";
```

Keep existing dropdown/sidebar imports below these. Do not remove `Link`; Notifications still uses it.

- [ ] **Step 2: Add dialog state**

Inside `NavUser`, after `const router = useRouter();`, add:

```tsx
  const [accountOpen, setAccountOpen] = React.useState(false);
```

- [ ] **Step 3: Change Account dropdown item**

Replace the existing Account item:

```tsx
              <DropdownMenuItem>
                <UserCircleIcon />
                Account
              </DropdownMenuItem>
```

with:

```tsx
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setAccountOpen(true);
                }}
              >
                <UserCircleIcon />
                Account
              </DropdownMenuItem>
```

- [ ] **Step 4: Render dialog next to dropdown**

Because JSX currently returns only `<SidebarMenu>...</SidebarMenu>`, wrap the return in a fragment and render the dialog sibling after `</SidebarMenu>`:

```tsx
  return (
    <>
      <SidebarMenu>
        ...existing sidebar menu JSX...
      </SidebarMenu>
      <AccountProfileDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
      />
    </>
  );
```

Do not change logout behavior.

- [ ] **Step 5: Run typecheck**

```bash
bun typecheck
```

Expected: no type errors in `components/nav-user.tsx`.

- [ ] **Step 6: Commit navigation wiring**

```bash
git add components/nav-user.tsx
git commit -m "feat: open account profile dialog from nav"
```

---

### Task 6: Final verification and formatting

**Files:**
- Verify all files changed by Tasks 1-5.

- [ ] **Step 1: Run Biome check/fix**

Run:

```bash
bun check
```

Expected: Biome completes successfully. It may rewrite formatting/imports.

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
bun typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 3: Inspect final git status**

Run:

```bash
git status --short
```

Expected: only implementation files from this plan are modified/untracked, plus the pre-existing unrelated change in `app/(dashboard)/admin/tradexpo/expos/[expoId]/page.tsx` if still present.

- [ ] **Step 4: Commit verification formatting changes if any**

If `bun check` changed files from this feature, commit only feature files:

```bash
git add lib/platform/ensure-schema.ts lib/account/profile.ts app/api/account/profile/route.ts components/account/account-profile-dialog.tsx components/nav-user.tsx
git commit -m "chore: format account profile dialog changes"
```

If there are no feature file changes after `bun check`, skip this commit.

---

## Self-Review

Spec coverage:

- Dialog opened from `Account` in shared `NavUser`: Task 5.
- No route page: no page task exists.
- DB persistence: Task 1 and Task 2.
- Current-user-only API: Task 3.
- First Name, Last Name, Gender, Mobile, DoB fields: Task 2 validation and Task 4 UI.
- Sidebar display name refresh: Task 2 syncs `users.name`; Task 4 calls `router.refresh()`.
- Admin user-management isolation: plan creates new `lib/account` and `app/api/account` files, no admin API changes.
- Verification commands: Task 6.

Placeholder scan:

- No `TBD`, `TODO`, or `implement later` placeholders.
- Edge handling is specified with exact error messages, validation rules, and code.

Type consistency:

- API payload uses `firstName`, `lastName`, `gender`, `mobile`, `dateOfBirth` across service, route, and component.
- DB columns use `first_name`, `last_name`, `gender`, `mobile`, `date_of_birth` only inside SQL.
- Gender values match spec: `male`, `female`, `other`, `prefer_not_to_say`.
