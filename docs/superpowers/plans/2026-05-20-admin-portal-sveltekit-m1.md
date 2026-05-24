# Admin Portal SvelteKit M1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SvelteKit admin foundation usable with passing checks, working admin auth shell, aligned navigation, and users list/detail parity.

**Architecture:** Keep admin access control in SvelteKit server layout loaders, route data in `+page.server.ts`, and UI in focused Svelte components. Port the existing Next.js user detail screen without changing business behavior, database schema, or broad UI design.

**Tech Stack:** SvelteKit 5, Svelte 5 runes, TypeScript, Bun, Tailwind CSS v4, bits-ui/shadcn-style primitives, Neon serverless SQL.

---

## File Structure

Files to modify:

- `sveltekit-temp/src/routes/(dashboard)/admin/+layout.server.ts` — require sys_admin access and return authenticated admin identity.
- `sveltekit-temp/src/lib/components/nav-admin.svelte` — make active state work for nested admin routes and confirm current admin link coverage.
- `sveltekit-temp/src/routes/(dashboard)/admin/administration/users/+page.server.ts` — require platform schema and load users list; verify no client DB access.
- `sveltekit-temp/src/lib/administration/user-detail.ts` — use existing SvelteKit-compatible user detail and audit helpers.

Files to create:

- `sveltekit-temp/src/lib/components/administration/user-detail-page.svelte` — present user profile, roles, and audit table.
- `sveltekit-temp/src/routes/(dashboard)/admin/administration/users/[userId]/+page.server.ts` — load user detail, record view audit event, return 404 when missing.
- `sveltekit-temp/src/routes/(dashboard)/admin/administration/users/[userId]/+page.svelte` — wrap the detail component in `DashboardShell`.

Files to inspect during execution:

- `app/(dashboard)/admin/administration/users/[userId]/page.tsx` — source UI/behavior parity.
- `components/nav-admin.tsx` — source nav grouping parity if Svelte nav differs.
- `components/user-avatar.tsx` and `sveltekit-temp/src/lib/components/user-avatar.svelte` — avatar behavior parity.

No new test files. Verification uses SvelteKit check/build and manual browser pass.

---

### Task 1: Establish SvelteKit Baseline

**Files:**
- Inspect: `sveltekit-temp/package.json`
- Inspect: `sveltekit-temp/.env.local`
- Inspect: `sveltekit-temp/src/routes/(dashboard)/admin/+layout.server.ts`

- [ ] **Step 1: Confirm package scripts exist**

Open `sveltekit-temp/package.json` and confirm these scripts exist exactly enough to run checks:

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "prepare": "svelte-kit sync || echo ''",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
  }
}
```

Do not edit dependencies unless a command fails because a package is missing.

- [ ] **Step 2: Run SvelteKit check**

Run:

```bash
cd sveltekit-temp && bun run check
```

Expected if baseline is already healthy:

```text
svelte-check found 0 errors and 0 warnings
```

If this fails, copy the first concrete TypeScript/Svelte error into the task notes and fix only that error before rerunning. Do not fix unrelated formatting or redesign UI.

- [ ] **Step 3: Run production build**

Run:

```bash
cd sveltekit-temp && bun run build
```

Expected:

```text
vite build
```

and command exits with code 0. If adapter warnings appear but build succeeds, leave them alone.

- [ ] **Step 4: Commit baseline only if repository policy allows commits**

Do not commit automatically in this session unless the user explicitly asks. If executing in a session where commits are requested, stage only relevant SvelteKit files:

```bash
git add sveltekit-temp/package.json sveltekit-temp/bun.lock sveltekit-temp/svelte.config.js sveltekit-temp/tsconfig.json sveltekit-temp/vite.config.ts
git commit -m "chore: verify sveltekit admin baseline"
```

---

### Task 2: Tighten Admin Role Guard

**Files:**
- Modify: `sveltekit-temp/src/routes/(dashboard)/admin/+layout.server.ts`
- Inspect: `sveltekit-temp/src/lib/auth/rbac.ts`

- [ ] **Step 1: Inspect current guard**

Current `+layout.server.ts` should look like this:

```ts
import { requireRole } from "$lib/auth/rbac"
import { getAuthenticatedUserById } from "$lib/auth/service"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async (event) => {
  const userId = await requireRole(event, "admin")
  const user = await getAuthenticatedUserById(userId)

  return {
    user: {
      name: user?.name ?? "User",
      email: user?.email ?? "",
      avatar: "/avatar.webp",
      roles: user?.roles ?? []
    }
  }
}
```

- [ ] **Step 2: Change admin guard to sys_admin**

Replace file content with:

```ts
import { requireRole } from "$lib/auth/rbac"
import { getAuthenticatedUserById } from "$lib/auth/service"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async (event) => {
  const userId = await requireRole(event, "sys_admin")
  const user = await getAuthenticatedUserById(userId)

  return {
    user: {
      name: user?.name ?? "User",
      email: user?.email ?? "",
      avatar: "/avatar.webp",
      roles: user?.roles ?? []
    }
  }
}
```

Reason: existing Next.js user detail route requires `sys_admin`, and M1 admin foundation should match current high-privilege admin portal behavior.

- [ ] **Step 3: Run check**

Run:

```bash
cd sveltekit-temp && bun run check
```

Expected:

```text
svelte-check found 0 errors and 0 warnings
```

- [ ] **Step 4: Manual auth behavior note**

During browser verification later, confirm:

- unauthenticated `/admin` redirects to `/login`;
- non-sys-admin user cannot enter `/admin`;
- sys_admin user can load `/admin`.

Do not add a new automated test file.

---

### Task 3: Align Admin Navigation Active State

**Files:**
- Modify: `sveltekit-temp/src/lib/components/nav-admin.svelte`
- Inspect: `components/nav-admin.tsx`

- [ ] **Step 1: Inspect current active checks**

Current groups use exact path matching:

```svelte
{@const isActive = $page.url.pathname === item.url}
```

This fails nested routes like `/admin/administration/users/123` because the Users menu item will not stay active.

- [ ] **Step 2: Add nested-aware helper**

In `sveltekit-temp/src/lib/components/nav-admin.svelte`, add this helper before `</script>`:

```svelte
<script lang="ts">
  import {
    BrickWallShield,
    Grid3x2,
    History,
    LayoutDashboard,
    LayoutTemplate,
    MonitorPlay,
    PackageCheck,
    Receipt,
    Shapes,
    ShieldCheck,
    Ticket,
    ToyBrick,
    UserRoundKey,
    Users,
    WalletCards
  } from "lucide-svelte"
  import { page } from "$app/stores"
  import * as Sidebar from "$lib/components/ui/sidebar"

  const tradexpoLinks = [
    {
      name: "Overview",
      url: "/admin/tradexpo",
      icon: LayoutDashboard
    },
    {
      name: "Expo List",
      url: "/admin/tradexpo/expos",
      icon: Grid3x2
    },
    {
      name: "Hall Templates",
      url: "/admin/tradexpo/hall-templates",
      icon: LayoutTemplate
    },
    {
      name: "Booth Templates",
      url: "/admin/tradexpo/booth-templates",
      icon: ToyBrick
    }
  ]

  const servicesLinks = [
    {
      name: "Host Dashboard",
      url: "/admin/streaming",
      icon: MonitorPlay
    },
    {
      name: "Order Management",
      url: "/admin/orders",
      icon: Receipt
    },
    {
      name: "eVoucher",
      url: "/admin/evoucher",
      icon: Ticket
    },
    {
      name: "TradeCredit",
      url: "/admin/tradecredit",
      icon: WalletCards
    },
    {
      name: "Plan Packages",
      url: "/admin/plan-subscriptions/packages",
      icon: PackageCheck
    },
    {
      name: "Payment Management",
      url: "/admin/settings/payment-management",
      icon: WalletCards
    }
  ]

  const administrationLinks = [
    {
      name: "Partner Audit",
      url: "/admin/partners/association-audit",
      icon: History
    },
    {
      name: "Users",
      url: "/admin/administration/users",
      icon: Users
    },
    {
      name: "Modules",
      url: "/admin/administration/modules",
      icon: ShieldCheck
    },
    {
      name: "Roles",
      url: "/admin/administration/roles",
      icon: UserRoundKey
    },
    {
      name: "Features",
      url: "/admin/administration/features",
      icon: Shapes
    },
    {
      name: "Permissions",
      url: "/admin/administration/permissions",
      icon: BrickWallShield
    }
  ]

  function isActivePath(pathname: string, url: string) {
    return pathname === url || pathname.startsWith(`${url}/`)
  }
</script>
```

Keep link arrays unchanged unless they differ from the current file.

- [ ] **Step 3: Replace exact active checks**

Replace every:

```svelte
{@const isActive = $page.url.pathname === item.url}
```

with:

```svelte
{@const isActive = isActivePath($page.url.pathname, item.url)}
```

There should be three replacements: TradeXpo, Service Management, Administration.

- [ ] **Step 4: Run check**

Run:

```bash
cd sveltekit-temp && bun run check
```

Expected:

```text
svelte-check found 0 errors and 0 warnings
```

---

### Task 4: Add User Detail Server Route

**Files:**
- Create: `sveltekit-temp/src/routes/(dashboard)/admin/administration/users/[userId]/+page.server.ts`
- Use: `sveltekit-temp/src/lib/administration/user-detail.ts`
- Use: `sveltekit-temp/src/lib/platform/ensure-schema.ts`

- [ ] **Step 1: Create server loader**

Create `sveltekit-temp/src/routes/(dashboard)/admin/administration/users/[userId]/+page.server.ts` with:

```ts
import { error } from "@sveltejs/kit"
import {
  getAdministrationUserDetail,
  getRequestAuditContext,
  recordUserAuditEvent
} from "$lib/administration/user-detail"
import { requireRole } from "$lib/auth/rbac"
import { ensurePlatformSchema } from "$lib/platform/ensure-schema"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (event) => {
  const actorUserId = await requireRole(event, "sys_admin")
  await ensurePlatformSchema()

  const userId = event.params.userId
  const auditContext = await getRequestAuditContext(event.request)

  await recordUserAuditEvent({
    targetUserId: userId,
    actorUserId,
    actorType: "admin",
    action: "admin.user.view",
    resourceType: "administration_user_detail",
    resourceId: userId,
    summary: "Admin viewed user detail.",
    metadata: { surface: "admin.administration.users.detail" },
    ...auditContext
  })

  const user = await getAdministrationUserDetail(userId)
  if (!user) {
    throw error(404, "User not found")
  }

  return { user }
}
```

- [ ] **Step 2: Run check**

Run:

```bash
cd sveltekit-temp && bun run check
```

Expected failure at this point is acceptable only if it says route types are not generated before sync. Because `bun run check` runs `svelte-kit sync`, expected final result is:

```text
svelte-check found 0 errors and 0 warnings
```

If TypeScript reports an import mismatch, fix import path or exported name in this task before continuing.

---

### Task 5: Add User Detail Svelte Component

**Files:**
- Create: `sveltekit-temp/src/lib/components/administration/user-detail-page.svelte`
- Use: `sveltekit-temp/src/lib/components/user-avatar.svelte`
- Use: `sveltekit-temp/src/lib/components/ui/badge`
- Use: `sveltekit-temp/src/lib/components/ui/card`

- [ ] **Step 1: Create component with profile and roles parity**

Create `sveltekit-temp/src/lib/components/administration/user-detail-page.svelte` with:

```svelte
<script lang="ts">
  import UserAvatar from "$lib/components/user-avatar.svelte"
  import { Badge } from "$lib/components/ui/badge"
  import * as Card from "$lib/components/ui/card"
  import type { AdministrationUserDetail } from "$lib/administration/user-detail"

  interface Props {
    user: AdministrationUserDetail
  }

  let { user }: Props = $props()

  const statusLabel = $derived(user.isActive ? "Active" : "Inactive")

  function formatDateTime(value: string | null) {
    if (!value) return "—"
    return new Date(value).toLocaleString()
  }

  function formatAction(value: string) {
    return value.replaceAll(".", " · ").replaceAll("_", " ")
  }

  function formatMetadata(metadata: Record<string, unknown>) {
    const entries = Object.entries(metadata)
    if (entries.length === 0) return "—"
    return entries
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ")
  }
</script>

<div class="mt-4 space-y-6">
  <Card.Root>
    <Card.Content class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-4">
        <UserAvatar name={user.name} class="h-16 w-16 text-lg" />
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="font-semibold text-2xl tracking-tight">{user.name}</h1>
            <Badge variant={user.isActive ? "default" : "secondary"}>
              {statusLabel}
            </Badge>
          </div>
          <p class="text-muted-foreground text-sm">{user.email}</p>
          <p class="text-muted-foreground text-sm">
            {user.companyName ?? "No company assigned"}
          </p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 md:min-w-80">
        <div class="rounded-2xl border bg-muted/30 p-3">
          <p class="text-muted-foreground text-xs uppercase tracking-wide">Roles</p>
          <p class="font-semibold text-2xl tabular-nums">{user.roleCount}</p>
        </div>
        <div class="rounded-2xl border bg-muted/30 p-3">
          <p class="text-muted-foreground text-xs uppercase tracking-wide">Audit events</p>
          <p class="font-semibold text-2xl tabular-nums">{user.auditEventCount}</p>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <div class="grid gap-4 lg:grid-cols-3">
    <Card.Root class="lg:col-span-2">
      <Card.Header>
        <Card.Title>Profile</Card.Title>
        <Card.Description>Core account and organization data.</Card.Description>
      </Card.Header>
      <Card.Content>
        <dl class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">User ID</dt>
            <dd class="break-all font-mono text-xs">{user.id}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Email</dt>
            <dd class="text-sm">{user.email}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Company</dt>
            <dd class="text-sm">{user.companyName ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Company ID</dt>
            <dd class="break-all font-mono text-xs">{user.companyId ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Job title</dt>
            <dd class="text-sm">{user.jobTitle ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Industry</dt>
            <dd class="text-sm">{user.industry ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Phone</dt>
            <dd class="text-sm">{user.phone ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Location</dt>
            <dd class="text-sm">{user.location ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Website</dt>
            <dd class="text-sm">{user.website ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Latest audit activity</dt>
            <dd class="text-sm">{formatDateTime(user.latestActivityAt)}</dd>
          </div>
        </dl>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Roles</Card.Title>
        <Card.Description>Global and scoped permissions.</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if user.roles.length === 0}
          <p class="text-muted-foreground text-sm">No roles assigned.</p>
        {:else}
          <div class="space-y-3">
            {#each user.roles as role (`${role.roleId}-${role.expoId ?? "global"}`)}
              <div class="rounded-2xl border p-3">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-medium">{role.roleName}</p>
                  <Badge variant="outline">{role.scope}</Badge>
                </div>
                <p class="mt-1 font-mono text-muted-foreground text-xs">
                  {role.expoId ?? "global"}
                </p>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Audit & tracking</Card.Title>
      <Card.Description>
        Newest user-related events from admin, auth, and domain modules.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if user.auditEvents.length === 0}
        <div class="flex min-h-48 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
          No audit events found.
        </div>
      {:else}
        <div class="overflow-hidden rounded-2xl border">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b bg-muted/40">
                <tr class="text-left">
                  <th class="px-4 py-3 font-medium">Timestamp</th>
                  <th class="px-4 py-3 font-medium">Action</th>
                  <th class="px-4 py-3 font-medium">Actor</th>
                  <th class="px-4 py-3 font-medium">Resource</th>
                  <th class="px-4 py-3 font-medium">Summary</th>
                  <th class="px-4 py-3 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {#each user.auditEvents as event (event.id)}
                  <tr class="border-b last:border-b-0">
                    <td class="whitespace-nowrap px-4 py-3 text-xs">
                      {formatDateTime(event.createdAt)}
                    </td>
                    <td class="px-4 py-3">
                      <Badge variant="outline">{formatAction(event.action)}</Badge>
                    </td>
                    <td class="px-4 py-3">
                      <p class="font-medium">{event.actorName ?? event.actorType}</p>
                      <p class="text-muted-foreground text-xs">
                        {event.actorEmail ?? event.actorUserId ?? "—"}
                      </p>
                    </td>
                    <td class="px-4 py-3">
                      <p>{event.resourceType ?? "—"}</p>
                      <p class="font-mono text-muted-foreground text-xs">
                        {event.resourceId ?? "—"}
                      </p>
                    </td>
                    <td class="max-w-72 px-4 py-3">{event.summary}</td>
                    <td class="max-w-64 px-4 py-3 text-muted-foreground text-xs">
                      {formatMetadata(event.metadata)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
```

- [ ] **Step 2: Run check**

Run:

```bash
cd sveltekit-temp && bun run check
```

Expected:

```text
svelte-check found 0 errors and 0 warnings
```

If Svelte reports component import names differ for `Badge` or `Card`, inspect each `index.ts` under `sveltekit-temp/src/lib/components/ui/*` and update imports to match exported names.

---

### Task 6: Add User Detail Page Route

**Files:**
- Create: `sveltekit-temp/src/routes/(dashboard)/admin/administration/users/[userId]/+page.svelte`
- Use: `sveltekit-temp/src/lib/components/administration/user-detail-page.svelte`
- Use: `sveltekit-temp/src/lib/components/tradexpo/dashboard-shell.svelte`

- [ ] **Step 1: Create page wrapper**

Create `sveltekit-temp/src/routes/(dashboard)/admin/administration/users/[userId]/+page.svelte` with:

```svelte
<script lang="ts">
  import UserDetailPage from "$lib/components/administration/user-detail-page.svelte"
  import DashboardShell from "$lib/components/tradexpo/dashboard-shell.svelte"
  import type { PageData } from "./$types"

  interface Props {
    data: PageData
  }

  let { data }: Props = $props()
</script>

<DashboardShell
  title="User Detail"
  breadcrumbs={[
    { label: "Dashboard", href: "/admin" },
    { label: "Administration" },
    { label: "Users", href: "/admin/administration/users" },
    { label: data.user.name }
  ]}
  showBackButton
>
  <UserDetailPage user={data.user} />
</DashboardShell>
```

- [ ] **Step 2: Run check**

Run:

```bash
cd sveltekit-temp && bun run check
```

Expected:

```text
svelte-check found 0 errors and 0 warnings
```

If `showBackButton` is not accepted by `DashboardShell`, inspect `sveltekit-temp/src/lib/components/tradexpo/dashboard-shell.svelte`. Add `showBackButton?: boolean` support only if the component lacks it and the Next.js shell has this behavior.

---

### Task 7: Wire Users List To Detail Route

**Files:**
- Modify: `sveltekit-temp/src/lib/components/administration/administration-list-page.svelte`
- Inspect: `components/administration/administration-list-page.tsx`

- [ ] **Step 1: Inspect row click or action behavior**

Open `sveltekit-temp/src/lib/components/administration/administration-list-page.svelte` and identify how user rows render. If the Users list already links to `/admin/administration/users/{id}`, do not change it.

- [ ] **Step 2: Add detail link only if missing**

If user rows lack a detail link, add this anchor around the user name or action cell:

```svelte
<a
  href={`/admin/administration/users/${item.id}`}
  class="font-medium text-primary underline-offset-4 hover:underline"
>
  {item.name}
</a>
```

Use the actual row variable name in the file. Do not rename existing list state or change pagination/filter behavior.

- [ ] **Step 3: Run check**

Run:

```bash
cd sveltekit-temp && bun run check
```

Expected:

```text
svelte-check found 0 errors and 0 warnings
```

---

### Task 8: Manual Browser Verification

**Files:**
- No source changes unless verification reveals a specific defect.

- [ ] **Step 1: Start SvelteKit dev server**

Run:

```bash
cd sveltekit-temp && bun run dev -- --host 127.0.0.1 --port 5173
```

Expected:

```text
Local:   http://127.0.0.1:5173/
```

Keep this server running while using the browser.

- [ ] **Step 2: Verify unauthenticated admin guard**

Open:

```text
http://127.0.0.1:5173/admin
```

Expected: browser lands on `/login` or login page content appears.

- [ ] **Step 3: Verify sys_admin login**

Use existing SvelteKit login/demo flow. If there is a demo-login button, use it. If not, submit known local admin credentials from the environment or seed data already used in this project. Do not print secrets into notes.

Expected: browser reaches `/admin` and sidebar renders Admin Portal.

- [ ] **Step 4: Verify users list**

Open:

```text
http://127.0.0.1:5173/admin/administration/users
```

Expected:

- page title `Users` appears;
- user table/list renders;
- no browser console errors;
- sidebar Users item active.

- [ ] **Step 5: Verify user detail**

Click first user detail link or open one known user ID:

```text
http://127.0.0.1:5173/admin/administration/users/<user-id>
```

Expected:

- page title `User Detail` appears;
- profile card shows name/email/company;
- roles card renders roles or empty state;
- audit table renders events or empty state;
- sidebar Users item remains active;
- browser console has no errors.

- [ ] **Step 6: Verify not found behavior**

Open:

```text
http://127.0.0.1:5173/admin/administration/users/not-a-real-user-id
```

Expected: SvelteKit 404 response or not-found page appears. No database mutation error should appear.

- [ ] **Step 7: Stop dev server**

Stop the dev server with `Ctrl+C` in its terminal.

---

### Task 9: Final Verification And Handoff

**Files:**
- Inspect: changed SvelteKit files only.

- [ ] **Step 1: Run final SvelteKit check**

Run:

```bash
cd sveltekit-temp && bun run check
```

Expected:

```text
svelte-check found 0 errors and 0 warnings
```

- [ ] **Step 2: Run final production build**

Run:

```bash
cd sveltekit-temp && bun run build
```

Expected: command exits with code 0.

- [ ] **Step 3: Review git diff**

Run:

```bash
git diff -- sveltekit-temp docs/superpowers/specs/2026-05-20-admin-portal-sveltekit-parity-design.md docs/superpowers/plans/2026-05-20-admin-portal-sveltekit-m1.md
```

Expected:

- admin layout role guard changed to `sys_admin`;
- nav active state supports nested paths;
- user detail server route exists;
- user detail page and component exist;
- plan/spec files exist.

- [ ] **Step 4: Do not commit unless requested**

If user requests commit, stage only relevant files and keep unrelated existing changes out:

```bash
git add docs/superpowers/specs/2026-05-20-admin-portal-sveltekit-parity-design.md docs/superpowers/plans/2026-05-20-admin-portal-sveltekit-m1.md sveltekit-temp/src/routes/'(dashboard)'/admin/+layout.server.ts sveltekit-temp/src/lib/components/nav-admin.svelte sveltekit-temp/src/lib/components/administration/user-detail-page.svelte sveltekit-temp/src/routes/'(dashboard)'/admin/administration/users/'[userId]'/+page.server.ts sveltekit-temp/src/routes/'(dashboard)'/admin/administration/users/'[userId]'/+page.svelte

git commit -m "feat: add sveltekit admin user detail foundation"
```

Do not stage unrelated modified Next.js files unless explicitly requested.

---

## Self-Review

Spec coverage:

- Confirm SvelteKit dependencies/check/build: Task 1 and Task 9.
- Verify login/logout/session/admin RBAC flow: Task 2 and Task 8.
- Align admin sidebar/navigation: Task 3 and Task 8.
- Port admin users detail page: Task 4, Task 5, Task 6, Task 7.
- Manual browser verification: Task 8.
- No new test files: respected in all tasks.
- No database schema changes: respected; existing `ensurePlatformSchema` and audit schema helper only.

Placeholder scan:

- No TBD/TODO/FIXME placeholders.
- Only `<user-id>` appears as a browser verification placeholder, paired with instruction to click a real user or use a known ID.

Type consistency:

- Server route returns `{ user }`.
- Page wrapper uses `data.user`.
- Component accepts `AdministrationUserDetail`.
- Role guard uses existing `requireRole(event, "sys_admin")` signature.
