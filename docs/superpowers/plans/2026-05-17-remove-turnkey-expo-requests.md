# Remove Turnkey Expo Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Turnkey Expo Request flow from Expo Program UI, API, and schema bootstrap without dropping existing database data.

**Architecture:** Expo Program becomes assigned-expo-only. The workspace loader returns assigned expos and quota data; the UI renders operational guidance instead of request CRUD. Route files and schema bootstrap for `partner_turnkey_expo_requests` are removed, but no destructive database command is introduced.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun, Tailwind CSS v4, Neon SQL helpers.

---

## File Structure

- Modify `components/partner/partner-expo-programs.tsx`: remove Turnkey Request state, form, dialog, table, action handlers, and unused imports; replace request summary with partnership/guidance UI.
- Modify `lib/partner/db.ts`: remove `PartnerTurnkeyExpoRequest`, remove `turnkeyRequests` from `PartnerExpoProgramsWorkspace`, remove request query/create/review/convert helpers, and simplify `getPartnerExpoProgramsWorkspace`.
- Delete `app/api/partner/turnkey-requests/route.ts`: remove create request endpoint.
- Delete `app/api/partner/turnkey-requests/[requestId]/review/route.ts`: remove review endpoint.
- Delete `app/api/partner/turnkey-requests/[requestId]/convert/route.ts`: remove conversion endpoint.
- Modify `lib/platform/ensure-schema.ts`: remove create/index/alter block for `partner_turnkey_expo_requests`; do not add `DROP TABLE`.

---

### Task 1: Remove Turnkey Request from workspace data model

**Files:**
- Modify: `lib/partner/db.ts:203-230`
- Modify: `lib/partner/db.ts:1488-1734`

- [ ] **Step 1: Remove Turnkey Request type from workspace shape**

In `lib/partner/db.ts`, delete the whole `PartnerTurnkeyExpoRequest` type and change `PartnerExpoProgramsWorkspace` from:

```ts
export type PartnerTurnkeyExpoRequest = {
  id: string
  title: string
  industry: string
  targetStartDate: string | null
  expectedEnterprises: number
  requestedBooths: number
  status:
    | "draft"
    | "submitted"
    | "in_review"
    | "approved"
    | "rejected"
    | "converted"
  notes: string
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string
  convertedExpoId: string | null
  convertedAt: string | null
  createdAt: string
}

export type PartnerExpoProgramsWorkspace = {
  assignedExpos: PartnerAssignedExpo[]
  quotaWorkspace: PartnerQuotaWorkspace
  turnkeyRequests: PartnerTurnkeyExpoRequest[]
}
```

to:

```ts
export type PartnerExpoProgramsWorkspace = {
  assignedExpos: PartnerAssignedExpo[]
  quotaWorkspace: PartnerQuotaWorkspace
}
```

- [ ] **Step 2: Simplify workspace loader**

Replace `getPartnerExpoProgramsWorkspace` with:

```ts
export async function getPartnerExpoProgramsWorkspace(
  userId: string
): Promise<PartnerExpoProgramsWorkspace> {
  const [assignedExpos, quotaWorkspace] = await Promise.all([
    listPartnerAssignedExpos(userId),
    getPartnerQuotaWorkspace(userId)
  ])

  return {
    assignedExpos,
    quotaWorkspace
  }
}
```

- [ ] **Step 3: Delete request helper functions**

Delete these functions entirely from `lib/partner/db.ts`:

```ts
export async function getPartnerTurnkeyExpoRequests(
  userId: string
): Promise<PartnerTurnkeyExpoRequest[]> {
  // delete whole function body
}

export async function createPartnerTurnkeyExpoRequest(
  userId: string,
  input: {
    title: string
    industry?: string | null
    targetStartDate?: string | null
    expectedEnterprises?: number
    requestedBooths?: number
    notes?: string | null
  }
) {
  // delete whole function body
}

export async function reviewPartnerTurnkeyExpoRequest(
  userId: string,
  requestId: string,
  input: { decision: "approved" | "rejected"; rejectionReason?: string | null }
) {
  // delete whole function body
}

export async function convertPartnerTurnkeyExpoRequest(
  userId: string,
  requestId: string
) {
  // delete whole function body
}
```

- [ ] **Step 4: Run targeted type check for DB references**

Run:

```bash
bun typecheck
```

Expected before UI/API cleanup: TypeScript may fail because UI and route files still import removed members. Failures should mention `turnkeyRequests`, `createPartnerTurnkeyExpoRequest`, `reviewPartnerTurnkeyExpoRequest`, or `convertPartnerTurnkeyExpoRequest`. Continue to next task.

---

### Task 2: Remove Turnkey Request UI from Expo Program

**Files:**
- Modify: `components/partner/partner-expo-programs.tsx:3-464`

- [ ] **Step 1: Remove unused imports**

Change the import block from:

```ts
import {
  BadgeCheckIcon,
  Building2Icon,
  CalendarPlusIcon,
  ClipboardListIcon,
  PackageCheckIcon,
  SendIcon
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
```

to:

```ts
import {
  BadgeCheckIcon,
  Building2Icon,
  ClipboardListIcon,
  HandshakeIcon,
  PackageCheckIcon,
  SendIcon
} from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
```

- [ ] **Step 2: Delete request status labels**

Delete:

```ts
const requestStatusLabels: Record<
  PartnerExpoProgramsWorkspace["turnkeyRequests"][number]["status"],
  string
> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted"
}
```

- [ ] **Step 3: Remove request state and submit helpers**

Inside `PartnerExpoPrograms`, delete:

```ts
const router = useRouter()
const canCreateTurnkey = access.actions["turnkey.create"]
const [showRequestDialog, setShowRequestDialog] = useState(false)
const [requestForm, setRequestForm] = useState({
  title: "",
  industry: "",
  targetStartDate: "",
  expectedEnterprises: "50",
  requestedBooths: "30",
  notes: ""
})
const [error, setError] = useState<string | null>(null)
const [isSaving, setIsSaving] = useState(false)
```

Delete these functions:

```ts
async function submitJson(url: string, body?: unknown) {
  // delete whole function body
}

async function submitTurnkeyRequest() {
  // delete whole function body
}

async function reviewTurnkeyRequest(
  requestId: string,
  decision: "approved" | "rejected"
) {
  // delete whole function body
}

async function convertTurnkeyRequest(requestId: string) {
  // delete whole function body
}
```

Keep `access` prop because `PartnerExpoList` still needs it.

- [ ] **Step 4: Replace metrics section**

Replace the first four `MetricCard` cards with:

```tsx
<MetricCard
  title="Assigned Programs"
  value={numberFormat.format(summary.assigned)}
  note="Arobid Business creates and assigns expo programs"
  icon={<Building2Icon />}
/>
<MetricCard
  title="Partnership Models"
  value={numberFormat.format(summary.coHost + summary.turnkey + summary.tenant)}
  note={`${numberFormat.format(summary.coHost)} co-host / ${numberFormat.format(summary.turnkey)} turnkey / ${numberFormat.format(summary.tenant)} tenant`}
  icon={<HandshakeIcon />}
/>
<MetricCard
  title="Bulk Inventory"
  value={numberFormat.format(bulkTotal.available)}
  note={`${numberFormat.format(bulkTotal.allocated)} allocated / ${numberFormat.format(bulkTotal.consumed)} consumed`}
  icon={<PackageCheckIcon />}
/>
<MetricCard
  title="Booth Utilization"
  value={`${summary.booths > 0 ? Math.round((summary.soldBooths / summary.booths) * 100) : 0}%`}
  note={`${numberFormat.format(summary.soldBooths)} / ${numberFormat.format(summary.booths)} booths`}
  icon={<BadgeCheckIcon />}
/>
```

- [ ] **Step 5: Replace request card with guidance card**

Replace the entire `Card` whose title is `Turnkey Expo Requests` with:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Expo Program Assignment</CardTitle>
    <CardDescription>
      Expo Owners coordinate with Arobid Business to create programs.
      Assigned expos appear here after Arobid links them to your partner
      organization.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-md border p-3">
        <p className="font-semibold text-sm">1. Align scope</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Confirm program goals, sectors, schedule, and organizer model with
          Arobid Business.
        </p>
      </div>
      <div className="rounded-md border p-3">
        <p className="font-semibold text-sm">2. Arobid creates expo</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Arobid configures the expo, halls, booth inventory, and operating
          model outside the request queue.
        </p>
      </div>
      <div className="rounded-md border p-3">
        <p className="font-semibold text-sm">3. Partner operates</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Once assigned, your team manages exhibitors, quotas, bundles, and
          program performance from this portal.
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 6: Delete request dialog and Field helper**

Delete the entire `<Dialog open={showRequestDialog} ...>` block near the end of the component.

Delete the `Field` helper function because no local form remains:

```tsx
function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
```

Keep `EmptyState` because Bulk Booth Distribution still uses it.

- [ ] **Step 7: Run type check for UI references**

Run:

```bash
bun typecheck
```

Expected before route cleanup: TypeScript may still fail only because API route files import removed DB helpers. No failure should mention `components/partner/partner-expo-programs.tsx`.

---

### Task 3: Remove Turnkey Request API routes

**Files:**
- Delete: `app/api/partner/turnkey-requests/route.ts`
- Delete: `app/api/partner/turnkey-requests/[requestId]/review/route.ts`
- Delete: `app/api/partner/turnkey-requests/[requestId]/convert/route.ts`

- [ ] **Step 1: Delete create route**

Remove `app/api/partner/turnkey-requests/route.ts` entirely. It currently imports `createPartnerTurnkeyExpoRequest`; no replacement route is needed.

- [ ] **Step 2: Delete review route**

Remove `app/api/partner/turnkey-requests/[requestId]/review/route.ts` entirely. It currently imports `reviewPartnerTurnkeyExpoRequest`; no replacement route is needed.

- [ ] **Step 3: Delete convert route**

Remove `app/api/partner/turnkey-requests/[requestId]/convert/route.ts` entirely. It currently imports `convertPartnerTurnkeyExpoRequest`; no replacement route is needed.

- [ ] **Step 4: Verify no route imports remain**

Run:

```bash
bun typecheck
```

Expected before schema cleanup: no import errors for Turnkey Request helpers. If errors remain, search code references and remove them:

```bash
# Use Grep tool instead of shell grep if working interactively.
```

---

### Task 4: Remove schema bootstrap for request table

**Files:**
- Modify: `lib/platform/ensure-schema.ts:1367-1419`

- [ ] **Step 1: Delete table creation block**

Remove this whole block:

```ts
await sql`
  create table if not exists partner_turnkey_expo_requests (
    id text primary key,
    partner_org_id text not null references partner_organizations(id) on delete cascade,
    title text not null,
    industry text not null default '',
    target_start_date date,
    expected_enterprises int not null default 0,
    requested_booths int not null default 0,
    status text not null default 'submitted',
    notes text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )
`
```

- [ ] **Step 2: Delete request status constraint block**

Remove this whole block:

```ts
await sql`
  do $$
  begin
    alter table partner_turnkey_expo_requests
    add constraint partner_turnkey_expo_requests_status_ck
    check (status in ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'converted'));
  exception
    when duplicate_object then null;
  end $$;
`
```

- [ ] **Step 3: Delete request index and alter blocks**

Remove these blocks:

```ts
await sql`
  create index if not exists idx_partner_turnkey_requests_org
  on partner_turnkey_expo_requests (partner_org_id, created_at desc)
`
await sql`
  alter table partner_turnkey_expo_requests
  add column if not exists reviewed_by text references users(id) on delete set null
`
await sql`
  alter table partner_turnkey_expo_requests
  add column if not exists reviewed_at timestamptz
`
await sql`
  alter table partner_turnkey_expo_requests
  add column if not exists rejection_reason text not null default ''
`
await sql`
  alter table partner_turnkey_expo_requests
  add column if not exists approved_payload_json jsonb not null default '{}'::jsonb
`
await sql`
  alter table partner_turnkey_expo_requests
  add column if not exists converted_expo_id text references expos(id) on delete set null
`
await sql`
  alter table partner_turnkey_expo_requests
  add column if not exists converted_at timestamptz
`
```

Do not add `drop table`, `drop index`, or destructive DDL.

- [ ] **Step 4: Run schema type check**

Run:

```bash
bun typecheck
```

Expected: PASS.

---

### Task 5: Final verification

**Files:**
- Verify only, no code changes expected.

- [ ] **Step 1: Search remaining Turnkey Request code-path references**

Use Grep tool or equivalent search for these patterns outside ignored worktrees:

```text
turnkeyRequests
PartnerTurnkeyExpoRequest
partner_turnkey_expo_requests
createPartnerTurnkeyExpoRequest
reviewPartnerTurnkeyExpoRequest
convertPartnerTurnkeyExpoRequest
Turnkey Expo Requests
Request turnkey expo
```

Expected: no matches in live code. Matches in deleted files, docs/specs/plans, `.claude/worktrees`, or historical docs are acceptable only if not compiled/runtime code.

- [ ] **Step 2: Run targeted tests**

Run:

```bash
bun typecheck
bun test lib/partner/expo-exhibitors.test.ts
```

Expected: both pass.

- [ ] **Step 3: Browser-check Expo Program**

Start dev server if not already running:

```bash
bun dev
```

Open `/partner/expos` in browser. Expected UI:

- No “Turnkey Requests” metric.
- No “Turnkey Expo Requests” table.
- No “Request turnkey expo” button.
- Guidance card says Arobid Business creates and assigns expos.
- Assigned expo list still renders.
- Bulk Booth Distribution still renders.
- Browser console has no new errors.

- [ ] **Step 4: Review changed files**

Run:

```bash
git diff -- components/partner/partner-expo-programs.tsx lib/partner/db.ts lib/platform/ensure-schema.ts app/api/partner/turnkey-requests docs/superpowers/specs/2026-05-17-remove-turnkey-expo-requests-design.md docs/superpowers/plans/2026-05-17-remove-turnkey-expo-requests.md
```

Expected: diff only removes Turnkey Request code path and adds spec/plan docs. No destructive SQL appears.

---

## Self-Review

- Spec coverage: UI removal is Task 2, API route removal is Task 3, DB helper removal is Task 1, schema bootstrap removal is Task 4, no destructive DB change is explicitly enforced in Task 4.
- Placeholder scan: no TBD/TODO/fill-later placeholders.
- Type consistency: `PartnerExpoProgramsWorkspace` no longer has `turnkeyRequests`; UI and route tasks remove all consumers before final typecheck.
