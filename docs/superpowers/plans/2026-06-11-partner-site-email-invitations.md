# Partner Site Email Invitations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Partner Site `Join Partner` invitation creation by email with validation preview, CSV/XLSX import, 7-day expiry, and invitation management compatibility for `Pending`, `Accepted`, and `Expired`.

**Architecture:** Keep the existing Partner Site invitation page and `partner_enterprise_members` storage model. Add a validation API before mutation, make DB validation authoritative, derive `Expired` from `invite_expires_at`, and update the manager UI to send only validated `Join Partner` recipients.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, Bun, Neon SQL helpers, shadcn/ui, `xlsx` for spreadsheet parsing.

---

## File structure

- Modify: `package.json`
  - Add `xlsx` dependency for `.xlsx` import support.
- Modify: `bun.lock`
  - Bun lockfile update from `bun add xlsx`.
- Modify: `lib/partner/db.ts`
  - Add invite expiry to workspace rows.
  - Add recipient preview types and DB validation helper.
  - Update create/resend logic to use 7-day expiry and block pending/expired duplicates during create.
- Modify: `app/api/partner/partner-site/invitations/route.ts`
  - Change send route to accept normalized recipient arrays and revalidate before creation.
- Create: `app/api/partner/partner-site/invitations/validate/route.ts`
  - Add preview-only validation endpoint.
- Modify: `components/partner/partner-site-invitation-manager.tsx`
  - Replace link/QR/type flow with `Join Partner` email flow, manual/import tabs, preview UI, and status derivation including `Expired`.
- Verify only: no new test files, per project memory.

---

### Task 1: Add spreadsheet parser dependency

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`

- [ ] **Step 1: Install `xlsx` with Bun**

Run:

```bash
rtk bun add xlsx
```

Expected:

- `package.json` includes `"xlsx"` under `dependencies`.
- `bun.lock` changes.

- [ ] **Step 2: Confirm package metadata changed only as expected**

Run:

```bash
rtk git diff -- package.json bun.lock
```

Expected:

- Diff shows `xlsx` dependency and lockfile package entries.
- No source files changed yet.

- [ ] **Step 3: Checkpoint**

Do not commit unless user explicitly asks. Record checkpoint in final summary:

```text
Dependency checkpoint: xlsx added for invitation file import.
```

---

### Task 2: Add DB preview model and 7-day expiry semantics

**Files:**
- Modify: `lib/partner/db.ts`

- [ ] **Step 1: Extend exported types near `PartnerSiteInvitationType`**

In `lib/partner/db.ts`, near the existing `PartnerSiteInvitationType` and `PartnerSiteInvitationSendResult` definitions, replace that small block with:

```ts
export type PartnerSiteInvitationType = "site_visit" | "join_partner_site"

export type PartnerSiteInvitationRecipientSource = "manual" | "import"

export type PartnerSiteInvitationRecipientIssue = {
  email: string
  reason: string
}

export type PartnerSiteInvitationRecipientPreview = {
  source: PartnerSiteInvitationRecipientSource
  limit: number
  normalizedRecipients: string[]
  valid: string[]
  invalid: PartnerSiteInvitationRecipientIssue[]
  duplicates: PartnerSiteInvitationRecipientIssue[]
  existingPending: PartnerSiteInvitationRecipientIssue[]
  existingExpired: PartnerSiteInvitationRecipientIssue[]
  existingAccepted: PartnerSiteInvitationRecipientIssue[]
  canSend: boolean
}

export type PartnerSiteInvitationSendResult = {
  sentCount: number
  createdCount: number
  resentCount: number
  skipped: { email: string; reason: string }[]
  preview?: PartnerSiteInvitationRecipientPreview
}
```

- [ ] **Step 2: Add `inviteExpiresAt` to member type**

In `PartnerEnterpriseMember`, add field after `acceptedAt`:

```ts
  inviteExpiresAt: string | null
```

- [ ] **Step 3: Include `invite_expires_at` in workspace query**

In `getPartnerEnterpriseWorkspace()`, add `pem.invite_expires_at` to the `select` list right after `pem.accepted_at`:

```sql
      pem.accepted_at,
      pem.invite_expires_at,
      pem.removed_at,
```

Add field to row type:

```ts
    invite_expires_at: string | Date | null
```

Add mapped property after `acceptedAt`:

```ts
    inviteExpiresAt: row.invite_expires_at ? toIso(row.invite_expires_at) : null,
```

- [ ] **Step 4: Add recipient validation helpers before `createPartnerSiteInvitations`**

Insert this code immediately before `export async function createPartnerSiteInvitations`:

```ts
const partnerSiteInvitationEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const partnerSiteInvitationExpirySql = sql`now() + interval '7 days'`

function getPartnerSiteInvitationLimit(
  source: PartnerSiteInvitationRecipientSource
) {
  return source === "import" ? 200 : 20
}

function getFirstInvitationPreviewError(
  preview: PartnerSiteInvitationRecipientPreview
) {
  if (preview.normalizedRecipients.length === 0) {
    return "At least one recipient email is required."
  }
  if (preview.normalizedRecipients.length > preview.limit) {
    return `Recipient limit exceeded. ${preview.source === "import" ? "Imported files" : "Manual input"} support up to ${preview.limit} emails.`
  }
  if (preview.invalid.length > 0) return "Invalid email found."
  if (preview.existingPending.length > 0) {
    return "One or more recipients already have pending invitations."
  }
  if (preview.existingExpired.length > 0) {
    return "One or more recipients have expired invitations. Use Resend."
  }
  if (preview.existingAccepted.length > 0) {
    return "One or more recipients already accepted invitations."
  }

  return null
}

export async function validatePartnerSiteInvitationRecipients(
  userId: string,
  input: {
    recipients: string[]
    source?: PartnerSiteInvitationRecipientSource
  }
): Promise<PartnerSiteInvitationRecipientPreview> {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const source = input.source ?? "manual"
  const limit = getPartnerSiteInvitationLimit(source)
  const seen = new Set<string>()
  const normalizedRecipients: string[] = []
  const duplicates: PartnerSiteInvitationRecipientIssue[] = []

  for (const rawEmail of input.recipients) {
    const email = rawEmail.trim().toLowerCase()
    if (!email) continue
    if (seen.has(email)) {
      duplicates.push({ email, reason: "Duplicate ignored." })
      continue
    }
    seen.add(email)
    normalizedRecipients.push(email)
  }

  const invalid = normalizedRecipients
    .filter((email) => !partnerSiteInvitationEmailPattern.test(email))
    .map((email) => ({ email, reason: "Invalid email format." }))
  const structurallyValid = normalizedRecipients.filter((email) =>
    partnerSiteInvitationEmailPattern.test(email)
  )

  const existingRows = structurallyValid.length
    ? ((await sql`
        select
          lower(contact_email) as email,
          activation_status,
          accepted_at,
          invite_expires_at
        from partner_enterprise_members
        where partner_org_id = ${organization.id}
          and source = 'tenant_invite'
          and contact_email is not null
          and lower(contact_email) = any(${structurallyValid}::text[])
      `) as {
        email: string
        activation_status: PartnerEnterpriseMember["activationStatus"]
        accepted_at: string | Date | null
        invite_expires_at: string | Date | null
      }[])
    : []

  const existingPending: PartnerSiteInvitationRecipientIssue[] = []
  const existingExpired: PartnerSiteInvitationRecipientIssue[] = []
  const existingAccepted: PartnerSiteInvitationRecipientIssue[] = []
  const blocked = new Set<string>()
  const now = Date.now()

  for (const row of existingRows) {
    const accepted = row.activation_status === "active" || Boolean(row.accepted_at)
    const expiresAt = row.invite_expires_at
      ? new Date(row.invite_expires_at).getTime()
      : null
    const expired = !accepted && expiresAt !== null && expiresAt < now
    const pending =
      !accepted &&
      !expired &&
      (row.activation_status === "invited" ||
        row.activation_status === "pending_acceptance")

    if (accepted) {
      existingAccepted.push({
        email: row.email,
        reason: "Invitation already accepted."
      })
      blocked.add(row.email)
      continue
    }
    if (expired) {
      existingExpired.push({
        email: row.email,
        reason: "Invitation expired. Use Resend."
      })
      blocked.add(row.email)
      continue
    }
    if (pending) {
      existingPending.push({
        email: row.email,
        reason: "Pending invitation already exists."
      })
      blocked.add(row.email)
    }
  }

  const invalidSet = new Set(invalid.map((issue) => issue.email))
  const valid = structurallyValid.filter(
    (email) => !invalidSet.has(email) && !blocked.has(email)
  )
  const preview: PartnerSiteInvitationRecipientPreview = {
    source,
    limit,
    normalizedRecipients,
    valid,
    invalid,
    duplicates,
    existingPending,
    existingExpired,
    existingAccepted,
    canSend: false
  }
  preview.canSend = getFirstInvitationPreviewError(preview) === null

  return preview
}
```

- [ ] **Step 5: Update `createPartnerSiteInvitations` input and behavior**

In `createPartnerSiteInvitations`, change input type to include source:

```ts
  input: {
    invitationType: PartnerSiteInvitationType
    recipients: string[]
    source?: PartnerSiteInvitationRecipientSource
  }
```

Replace recipient normalization and duplicate-resend behavior from the start of function through `let resentCount = 0` with:

```ts
  const preview = await validatePartnerSiteInvitationRecipients(userId, {
    recipients: input.recipients,
    source: input.source
  })
  const previewError = getFirstInvitationPreviewError(preview)
  if (previewError) throw new Error(previewError)

  const skipped: { email: string; reason: string }[] = []
  let createdCount = 0
  let resentCount = 0
```

Then change the loop to iterate `preview.valid`:

```ts
  for (const email of preview.valid) {
```

Inside the loop, keep advisory lock, but replace duplicate handling with blocking skip logic:

```ts
    if (duplicate?.activation_status === "blocked") {
      skipped.push({ email, reason: "Blocked association." })
      continue
    }
    if (duplicate?.activation_status === "active" || duplicate?.accepted_at) {
      skipped.push({ email, reason: "Already accepted." })
      continue
    }
    if (duplicate) {
      skipped.push({ email, reason: "Invitation already exists." })
      continue
    }
```

Remove the old `if (duplicate) { update ... resend_invite ... }` block entirely.

Change insert expiry from 30 days:

```sql
        now() + interval '7 days',
```

Return preview in result:

```ts
  return {
    sentCount: createdCount + resentCount,
    createdCount,
    resentCount,
    skipped,
    preview
  }
```

- [ ] **Step 6: Update resend expiry to 7 days**

In `resendPartnerEnterpriseInvitation`, change:

```sql
      invite_expires_at = now() + interval '30 days',
```

to:

```sql
      invite_expires_at = now() + interval '7 days',
```

If `createPartnerEnterpriseMember()` invitation expiry should remain company-association behavior, do not change it in this task unless product asks. Only Partner Site email invitation create/resend is in scope.

- [ ] **Step 7: Run typecheck for DB changes**

Run:

```bash
rtk bun typecheck
```

Expected:

- Typecheck may fail because API/UI still expect old types. Accept failures only if they point to invitation route/component that later tasks will update.
- No SQL syntax/type mistakes outside touched invitation paths.

---

### Task 3: Add validation API and update send API

**Files:**
- Create: `app/api/partner/partner-site/invitations/validate/route.ts`
- Modify: `app/api/partner/partner-site/invitations/route.ts`

- [ ] **Step 1: Create validation route**

Create `app/api/partner/partner-site/invitations/validate/route.ts` with:

```ts
import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  type PartnerSiteInvitationRecipientSource,
  validatePartnerSiteInvitationRecipients
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

function isRecipientSource(
  value: unknown
): value is PartnerSiteInvitationRecipientSource {
  return value === "manual" || value === "import"
}

function toRecipientArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("invite.manage")
    const body = (await request.json()) as {
      recipients?: unknown
      source?: unknown
    }
    const preview = await validatePartnerSiteInvitationRecipients(userId, {
      recipients: toRecipientArray(body.recipients),
      source: isRecipientSource(body.source) ? body.source : "manual"
    })

    return NextResponse.json(preview)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Validation failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
```

- [ ] **Step 2: Replace send route request parsing**

Replace `app/api/partner/partner-site/invitations/route.ts` contents with:

```ts
import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  createPartnerSiteInvitations,
  type PartnerSiteInvitationRecipientSource
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

function isRecipientSource(
  value: unknown
): value is PartnerSiteInvitationRecipientSource {
  return value === "manual" || value === "import"
}

function toRecipientArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("invite.manage")
    const body = (await request.json()) as {
      recipients?: unknown
      source?: unknown
    }
    const result = await createPartnerSiteInvitations(userId, {
      invitationType: "join_partner_site",
      recipients: toRecipientArray(body.recipients),
      source: isRecipientSource(body.source) ? body.source : "manual"
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
```

- [ ] **Step 3: Verify routes compile**

Run:

```bash
rtk bun typecheck
```

Expected:

- Typecheck may still fail in `PartnerSiteInvitationManager` because UI has not been updated to new API payloads/types.
- No route-specific import or type errors remain.

---

### Task 4: Update invitation manager types, parsing, and file import helpers

**Files:**
- Modify: `components/partner/partner-site-invitation-manager.tsx`

- [ ] **Step 1: Update imports**

Replace icon imports with the reduced set:

```ts
import {
  DownloadIcon,
  FileSpreadsheetIcon,
  MailIcon,
  SearchIcon,
  SendIcon,
  UploadIcon,
  XIcon
} from "lucide-react"
```

Remove unused imports:

```ts
import Image from "next/image"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
```

Add XLSX import:

```ts
import * as XLSX from "xlsx"
```

Keep existing shadcn imports, but add `ChangeEvent` type if needed through React namespace:

```ts
import { useMemo, useState } from "react"
```

- [ ] **Step 2: Update status/type constants and row type**

Replace status/type constants near top with:

```ts
const invitationStatusLabels = {
  accepted: "Accepted",
  pending: "Pending",
  expired: "Expired"
} as const

type InvitationStatus = keyof typeof invitationStatusLabels
type StatusFilter = InvitationStatus | "all"
type RecipientSource = "manual" | "import"

type InvitationRow = {
  id: string
  recipient: string
  enterpriseName: string
  status: InvitationStatus
  updatedAt: string
}

type RecipientIssue = {
  email: string
  reason: string
}

type RecipientPreview = {
  source: RecipientSource
  limit: number
  normalizedRecipients: string[]
  valid: string[]
  invalid: RecipientIssue[]
  duplicates: RecipientIssue[]
  existingPending: RecipientIssue[]
  existingExpired: RecipientIssue[]
  existingAccepted: RecipientIssue[]
  canSend: boolean
}

type ParsedRecipients = {
  valid: string[]
  invalid: string[]
  duplicates: string[]
}

type SendInvitationResponse = {
  sentCount: number
  createdCount: number
  resentCount: number
  skipped: { email: string; reason: string }[]
  preview?: RecipientPreview
}
```

- [ ] **Step 3: Replace invitation dialog state**

Inside component, replace `invitationType`, link, QR, and old sending state with:

```ts
  const [inputMode, setInputMode] = useState<RecipientSource>("manual")
  const [recipientText, setRecipientText] = useState("")
  const [uploadedRecipients, setUploadedRecipients] = useState<string[]>([])
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<RecipientPreview | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSending, setIsSending] = useState(false)
```

Remove `invitationLink`, `copyInvitationLink`, and `qrCodeUrl` logic.

Add selected recipients memo:

```ts
  const selectedRecipients = useMemo(
    () =>
      inputMode === "manual"
        ? parseRecipientEmails(recipientText).valid.concat(
            parseRecipientEmails(recipientText).invalid
          )
        : uploadedRecipients,
    [inputMode, recipientText, uploadedRecipients]
  )
```

- [ ] **Step 4: Update dialog open/reset handlers**

Replace `openInviteDialog()` with:

```ts
  function resetInviteDialog() {
    setInputMode("manual")
    setRecipientText("")
    setUploadedRecipients([])
    setUploadedFileName(null)
    setPreview(null)
    setError(null)
  }

  function openInviteDialog() {
    resetInviteDialog()
    setInviteOpen(true)
  }

  function updateInviteOpen(open: boolean) {
    setInviteOpen(open)
    if (!open) resetInviteDialog()
  }
```

Use `updateInviteOpen` in `<Dialog open={inviteOpen} onOpenChange={updateInviteOpen}>`.

- [ ] **Step 5: Add preview and send handlers**

Replace old `sendInvitationEmail()` with:

```ts
  async function validateRecipients() {
    setMessage(null)
    setError(null)
    setPreview(null)

    if (!partnerId) {
      setError("Partner context is required before sending invitations.")
      return
    }
    if (selectedRecipients.length === 0) {
      setError("Enter at least one recipient email.")
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch(
        "/api/partner/partner-site/invitations/validate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipients: selectedRecipients, source: inputMode })
        }
      )
      const payload = (await response.json().catch(() => null)) as
        | RecipientPreview
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "Could not validate recipients."
        )
      }

      setPreview(payload as RecipientPreview)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not validate recipients."
      )
    } finally {
      setIsValidating(false)
    }
  }

  async function sendInvitationEmail() {
    setMessage(null)
    setError(null)

    if (!preview?.canSend) {
      setError("Validate recipients before sending invitations.")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/partner/partner-site/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: preview.valid, source: inputMode })
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Could not send invitations.")
      }

      const result = (await response.json()) as SendInvitationResponse
      setMessage(
        `Invitation records created for ${result.createdCount} recipient(s).`
      )
      if (result.skipped.length > 0) {
        setError(
          `Skipped: ${result.skipped.map((item) => `${item.email} (${item.reason})`).join(", ")}`
        )
      }
      setInviteOpen(false)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send invitations."
      )
    } finally {
      setIsSending(false)
    }
  }
```

- [ ] **Step 6: Add file/template helpers**

Add helper functions inside component before `return`:

```ts
  function downloadTemplate() {
    const blob = new Blob(["Recipient Email\n"], {
      type: "text/csv;charset=utf-8;"
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "partner-site-invitation-template.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    setPreview(null)
    setError(null)
    setUploadedRecipients([])
    setUploadedFileName(null)

    if (!file) return

    try {
      const recipients = await readRecipientFile(file)
      setUploadedRecipients(recipients)
      setUploadedFileName(file.name)
      setInputMode("import")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file.")
    }
  }
```

Add helper functions below component:

```ts
async function readRecipientFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension !== "csv" && extension !== "xlsx") {
    throw new Error("Unsupported file type. Upload .csv or .xlsx.")
  }

  if (extension === "csv") {
    const text = await file.text()
    return parseRecipientCsv(text)
  }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error("Spreadsheet is empty.")
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ""
  })
  return extractRecipientEmailColumn(rows)
}

function parseRecipientCsv(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const [header, ...rows] = lines
  if (!header) throw new Error("CSV is empty.")
  const headers = splitCsvLine(header)
  const emailIndex = headers.findIndex(
    (item) => item.trim().toLowerCase() === "recipient email"
  )
  if (emailIndex === -1) {
    throw new Error('Template must include "Recipient Email" column.')
  }

  return rows
    .map((line) => splitCsvLine(line)[emailIndex]?.trim() ?? "")
    .filter(Boolean)
}

function splitCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let quoted = false

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === "," && !quoted) {
      values.push(current)
      current = ""
      continue
    }
    current += char
  }
  values.push(current)

  return values
}

function extractRecipientEmailColumn(rows: Record<string, unknown>[]) {
  if (rows.length === 0) throw new Error("Spreadsheet is empty.")
  const firstRow = rows[0]
  const emailKey = Object.keys(firstRow).find(
    (key) => key.trim().toLowerCase() === "recipient email"
  )
  if (!emailKey) {
    throw new Error('Template must include "Recipient Email" column.')
  }

  return rows
    .map((row) => String(row[emailKey] ?? "").trim())
    .filter(Boolean)
}
```

- [ ] **Step 7: Update parser helper to track duplicates**

Replace `parseRecipientEmails()` with:

```ts
function parseRecipientEmails(value: string): ParsedRecipients {
  const emails = value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const seen = new Set<string>()
  const uniqueEmails: string[] = []
  const duplicates: string[] = []

  for (const email of emails) {
    if (seen.has(email)) {
      duplicates.push(email)
      continue
    }
    seen.add(email)
    uniqueEmails.push(email)
  }

  return {
    valid: uniqueEmails.filter(isEmail),
    invalid: uniqueEmails.filter((email) => !isEmail(email)),
    duplicates
  }
}
```

- [ ] **Step 8: Run typecheck for helper phase**

Run:

```bash
rtk bun typecheck
```

Expected:

- Typecheck likely fails until JSX is updated in Task 5.
- No errors in new file parsing helper types except JSX references not yet adjusted.

---

### Task 5: Update invitation manager JSX and status behavior

**Files:**
- Modify: `components/partner/partner-site-invitation-manager.tsx`

- [ ] **Step 1: Update status filter options**

Replace status select options with:

```tsx
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
```

- [ ] **Step 2: Allow resend for pending and expired**

Replace resend guard:

```ts
    if (invitation.status !== "pending" || resendingId) return
```

with:

```ts
    if (
      (invitation.status !== "pending" && invitation.status !== "expired") ||
      resendingId
    ) {
      return
    }
```

Replace row action condition:

```tsx
                  {invitation.status === "pending" ? (
```

with:

```tsx
                  {invitation.status === "pending" ||
                  invitation.status === "expired" ? (
```

- [ ] **Step 3: Replace dialog body with email-only Join Partner flow**

Inside `<Dialog>`, replace content after `DialogHeader` with:

```tsx
          <div className="grid gap-4">
            <div className="rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 font-medium text-sm">
                <MailIcon className="h-4 w-4" />
                Join Partner invitation
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                Send controlled email invitations for companies to join your
                Partner Site. Invitation links expire after 7 days.
              </p>
            </div>

            <Tabs
              value={inputMode}
              onValueChange={(value) => {
                setInputMode(value as RecipientSource)
                setPreview(null)
                setError(null)
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">
                  <MailIcon className="h-4 w-4" />
                  Manual input
                </TabsTrigger>
                <TabsTrigger value="import">
                  <FileSpreadsheetIcon className="h-4 w-4" />
                  Import file
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <Field label="Recipient emails">
                  <Textarea
                    value={recipientText}
                    onChange={(event) => {
                      setRecipientText(event.target.value)
                      setPreview(null)
                    }}
                    placeholder="a@company.com, b@company.com"
                    rows={8}
                  />
                </Field>
                <p className="text-muted-foreground text-sm">
                  Manual input supports up to 20 comma-separated emails.
                </p>
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={downloadTemplate}>
                    <DownloadIcon className="h-4 w-4" />
                    Download template
                  </Button>
                  <Button asChild type="button" variant="outline">
                    <label className="cursor-pointer">
                      <UploadIcon className="h-4 w-4" />
                      Upload CSV/XLSX
                      <input
                        className="sr-only"
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm">
                  Imported files must include only a Recipient Email column and
                  support up to 200 emails.
                </p>
                {uploadedFileName ? (
                  <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                    {uploadedFileName}: {uploadedRecipients.length} recipient(s)
                    loaded.
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {selectedRecipients.length} recipient(s)
              </Badge>
              <Badge variant="outline">Join Partner</Badge>
              {preview ? (
                <Badge variant={preview.canSend ? "default" : "destructive"}>
                  {preview.canSend ? "Ready to send" : "Fix required"}
                </Badge>
              ) : null}
            </div>

            {preview ? <RecipientPreviewPanel preview={preview} /> : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="w-full"
                type="button"
                variant="outline"
                disabled={!canManageInvitations || isValidating || isSending}
                onClick={validateRecipients}
              >
                {isValidating ? "Validating..." : "Preview validation"}
              </Button>
              <Button
                className="w-full"
                disabled={
                  !canManageInvitations ||
                  isSending ||
                  !partnerId ||
                  !preview?.canSend
                }
                onClick={sendInvitationEmail}
              >
                <SendIcon className="h-4 w-4" />
                {isSending ? "Sending..." : "Send invitation"}
              </Button>
            </div>
          </div>
```

Also update dialog description to:

```tsx
              Validate recipients first, then send Join Partner invitation
              records under the current Partner Site context.
```

- [ ] **Step 4: Add preview panel component**

Add below `Field` component:

```tsx
function RecipientPreviewPanel({ preview }: { preview: RecipientPreview }) {
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{preview.valid.length} valid</Badge>
        {preview.invalid.length > 0 ? (
          <Badge variant="destructive">{preview.invalid.length} invalid</Badge>
        ) : null}
        {preview.duplicates.length > 0 ? (
          <Badge variant="outline">
            {preview.duplicates.length} duplicate(s) ignored
          </Badge>
        ) : null}
      </div>

      <PreviewIssueList title="Valid recipients" emails={preview.valid} />
      <PreviewIssueList title="Invalid emails" issues={preview.invalid} />
      <PreviewIssueList title="Duplicates ignored" issues={preview.duplicates} />
      <PreviewIssueList
        title="Already pending"
        issues={preview.existingPending}
      />
      <PreviewIssueList
        title="Expired - use Resend"
        issues={preview.existingExpired}
      />
      <PreviewIssueList
        title="Already accepted"
        issues={preview.existingAccepted}
      />
    </div>
  )
}

function PreviewIssueList({
  emails,
  issues,
  title
}: {
  emails?: string[]
  issues?: RecipientIssue[]
  title: string
}) {
  const items = issues ?? emails?.map((email) => ({ email, reason: "" })) ?? []
  if (items.length === 0) return null

  return (
    <div className="space-y-1">
      <p className="font-medium text-sm">{title}</p>
      <div className="max-h-28 overflow-y-auto rounded-md bg-muted/40 p-2 text-sm">
        {items.map((item) => (
          <div key={`${title}-${item.email}`} className="flex justify-between gap-3">
            <span>{item.email}</span>
            {item.reason ? (
              <span className="text-muted-foreground">{item.reason}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update status derivation**

Replace `getInvitationStatus()` with:

```ts
function getInvitationStatus(
  member: Required<PartnerEnterpriseMember>
): InvitationStatus | null {
  if (member.activationStatus === "active" || member.acceptedAt) {
    return "accepted"
  }
  if (
    member.activationStatus === "invited" ||
    member.activationStatus === "pending_acceptance"
  ) {
    if (
      member.inviteExpiresAt &&
      new Date(member.inviteExpiresAt).getTime() < Date.now()
    ) {
      return "expired"
    }

    return "pending"
  }

  return null
}
```

Replace `InvitationStatusBadge` with:

```tsx
function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  if (status === "accepted") {
    return <Badge variant="default">Accepted</Badge>
  }
  if (status === "expired") {
    return <Badge variant="destructive">Expired</Badge>
  }

  return <Badge variant="secondary">Pending</Badge>
}
```

- [ ] **Step 6: Run component typecheck**

Run:

```bash
rtk bun typecheck
```

Expected:

- No TypeScript errors in invitation manager.
- If import sorting/formatting warnings appear later, Task 6 runs Biome.

---

### Task 6: Run formatter/check and fix mechanical issues

**Files:**
- Modify if needed: files touched by Biome.

- [ ] **Step 1: Run project check**

Run:

```bash
rtk bun check
```

Expected:

- Biome writes formatting/import fixes.
- No remaining lint errors.

- [ ] **Step 2: Run typecheck after formatting**

Run:

```bash
rtk bun typecheck
```

Expected:

- `No errors` / exit code 0.

- [ ] **Step 3: Inspect diff**

Run:

```bash
rtk git diff
```

Expected:

- Changes limited to planned files.
- No unrelated reformatting outside touched invitation/dependency files.
- `docs/superpowers/specs/2026-06-11-partner-site-email-invitations-design.md` and this plan file may appear as uncommitted docs.

- [ ] **Step 4: Checkpoint**

Do not commit unless user explicitly asks. Record verification status in final summary:

```text
Verified: bun check and bun typecheck passed.
```

If a command fails, record exact failing command and top errors, then fix before marking complete.

---

### Task 7: Manual behavior review from code paths

**Files:**
- No source changes unless defects found.

- [ ] **Step 1: Review manual send path**

Confirm code path:

```text
PartnerSiteInvitationManager manual textarea
→ selectedRecipients
→ POST /api/partner/partner-site/invitations/validate
→ validatePartnerSiteInvitationRecipients
→ preview.canSend
→ POST /api/partner/partner-site/invitations
→ createPartnerSiteInvitations
→ insert tenant_invite rows with 7-day expiry
→ router.refresh()
```

Expected:

- Manual limit is 20 through server validation.
- Send button disabled until preview can send.

- [ ] **Step 2: Review import send path**

Confirm code path:

```text
File input .csv/.xlsx
→ readRecipientFile
→ parse Recipient Email column
→ selectedRecipients
→ validation API with source "import"
→ limit 200
→ send API
```

Expected:

- Wrong extension throws `Unsupported file type. Upload .csv or .xlsx.`
- Missing column throws `Template must include "Recipient Email" column.`

- [ ] **Step 3: Review duplicate/current-site rules**

Confirm DB validation returns blocking issues:

```text
invalid → preview.invalid
pending existing row → preview.existingPending
expired existing row → preview.existingExpired
accepted existing row → preview.existingAccepted
duplicate in input → preview.duplicates, non-blocking
```

Expected:

- Any invalid/pending/expired/accepted issue makes `canSend = false`.
- Duplicates alone do not block send.

- [ ] **Step 4: Review management compatibility**

Confirm UI derives:

```text
active or acceptedAt → Accepted
pending/invited + inviteExpiresAt before now → Expired
pending/invited + not expired → Pending
```

Expected:

- Filter includes `Expired`.
- Resend button appears for `Pending` and `Expired` only.
- Resend updates expiry to 7 days.

---

## Self-review

### Spec coverage

- CORE-2204 manual up to 20: Task 2 validation limit, Task 5 UI copy.
- CORE-2204 CSV/XLSX up to 200: Task 1 dependency, Task 4 file helpers, Task 2 validation limit.
- Template with `Recipient Email`: Task 4 download and parser checks.
- Preview before send: Task 3 validate route, Task 5 preview panel/send disabled.
- Invalid blocks send: Task 2 `canSend`, Task 5 disabled send.
- Duplicate ignored: Task 2 duplicate preview, Task 5 preview panel.
- Pending exists blocks: Task 2 existingPending.
- Expired requires resend: Task 2 existingExpired, Task 5 resend for expired.
- Records created: Task 2 create function, Task 3 send route.
- CORE-2205 statuses/search/filter/resend: Task 5 status filter/derive/resend action.
- CORE-2883 7-day expiry semantics: Task 2 create/resend expiry and Task 5 expired derive.

### Placeholder scan

No `TBD`, `TODO`, “implement later”, “similar to”, or undefined functions remain. Helper functions referenced in UI are defined in Task 4/5.

### Type consistency

- `RecipientSource` in component matches `PartnerSiteInvitationRecipientSource` in DB/API.
- `RecipientPreview` in component matches `PartnerSiteInvitationRecipientPreview` JSON shape.
- `inviteExpiresAt` added to `PartnerEnterpriseMember`, selected in workspace query, and used in `getInvitationStatus()`.
- API send/validate payload shape is `{ recipients: string[], source: "manual" | "import" }`.
