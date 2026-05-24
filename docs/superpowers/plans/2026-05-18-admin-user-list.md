# Admin User List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Arobid admin user list at `/admin/administration/users`.

**Architecture:** Extend the existing Administration list pipeline. The server page loads initial user rows, the shared client list component renders the table and fetches paginated/search results, and the dynamic administration API delegates to the same list helper.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun, Neon SQL helper, shadcn/ui table primitives, Lucide icons.

---

## File Structure

- Modify `lib/administration/types.ts`: add `AdminUser` type and include it in list responses.
- Modify `lib/administration/list.ts`: add `users` entity support and SQL query joining `users`, `companies`, and `user_roles`.
- Modify `app/api/administration/[entity]/route.ts`: allow `users` in API routing.
- Modify `components/administration/administration-list-page.tsx`: add users table headers, empty copy, type guards, and row rendering.
- Create `app/(dashboard)/admin/administration/users/page.tsx`: server page using `DashboardShell`, `ensurePlatformSchema()`, and initial users data.
- Modify `components/nav-admin.tsx`: add Administration sidebar item for Users.

## Task 1: Add user data model and list query

**Files:**
- Modify: `lib/administration/types.ts`
- Modify: `lib/administration/list.ts`

- [ ] **Step 1: Update administration types**

In `lib/administration/types.ts`, add this interface after `AdminPermission`:

```ts
export interface AdminUser {
  id: string
  name: string
  email: string
  companyName: string | null
  roleCount: number
  isActive: boolean
}
```

Update `lib/administration/list.ts` imports so they include `AdminUser`:

```ts
import type {
  AdminFeature,
  AdminModule,
  AdminPermission,
  AdminRole,
  AdminUser,
  ListResponse
} from "@/lib/administration/types"
```

Update `AdministrationEntity`:

```ts
export type AdministrationEntity =
  | "modules"
  | "roles"
  | "features"
  | "permissions"
  | "users"
```

Update `AdministrationRecord`:

```ts
export type AdministrationRecord =
  | AdminModule
  | AdminRole
  | AdminFeature
  | AdminPermission
  | AdminUser
```

- [ ] **Step 2: Add users query branch**

In `lib/administration/list.ts`, inside `getAdministrationList`, add this branch after the modules branch and before the roles branch:

```ts
  if (input.entity === "users") {
    const countRows = (await sql`
      select count(*)::int as count
      from users app_user
      left join companies company on company.id = app_user.company_id
      where lower(app_user.name) like ${searchPattern}
        or lower(app_user.email) like ${searchPattern}
        or lower(coalesce(company.name, '')) like ${searchPattern}
    `) as CountRow[]
    totalItems = Number(countRows[0]?.count ?? 0)
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize

    records = (await sql`
      select
        app_user.id,
        app_user.name,
        app_user.email,
        company.name as "companyName",
        coalesce(role_counts.role_count, 0)::int as "roleCount",
        app_user.is_active as "isActive"
      from users app_user
      left join companies company on company.id = app_user.company_id
      left join (
        select user_id, count(*)::int as role_count
        from user_roles
        group by user_id
      ) role_counts on role_counts.user_id = app_user.id
      where lower(app_user.name) like ${searchPattern}
        or lower(app_user.email) like ${searchPattern}
        or lower(coalesce(company.name, '')) like ${searchPattern}
      order by app_user.name asc, app_user.email asc
      limit ${pageSize} offset ${start}
    `) as AdminUser[]

    return {
      data: records,
      meta: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages
      }
    }
  }
```

- [ ] **Step 3: Run typecheck for data model**

Run:

```bash
bun typecheck
```

Expected: TypeScript either passes or reports only follow-up errors from files not updated yet. Continue to Task 2 if errors mention `users` not allowed in route/component unions.

## Task 2: Allow users through API route

**Files:**
- Modify: `app/api/administration/[entity]/route.ts`

- [ ] **Step 1: Update entity allowlist**

In `app/api/administration/[entity]/route.ts`, update the guard to include `users`:

```ts
  if (
    entity !== "modules" &&
    entity !== "roles" &&
    entity !== "features" &&
    entity !== "permissions" &&
    entity !== "users"
  ) {
    return NextResponse.json({ error: "Entity not found." }, { status: 404 })
  }
```

No other route code changes are needed because `getAdministrationList()` now accepts `users`.

- [ ] **Step 2: Run route typecheck**

Run:

```bash
bun typecheck
```

Expected: TypeScript either passes or reports only component/page errors to address in later tasks.

## Task 3: Render users in administration list component

**Files:**
- Modify: `components/administration/administration-list-page.tsx`

- [ ] **Step 1: Import `Badge` and `AdminUser`**

Update imports near the top:

```ts
import { Badge } from "@/components/ui/badge"
```

Update type import from `@/lib/administration/types`:

```ts
import type {
  AdminFeature,
  AdminModule,
  AdminPermission,
  AdminRole,
  AdminUser,
  ListResponse,
  PaginationMeta
} from "@/lib/administration/types"
```

- [ ] **Step 2: Extend entity unions and records**

Replace entity and record definitions with:

```ts
type EntityType = "modules" | "roles" | "features" | "permissions" | "users"
type EntityRecord =
  | AdminModule
  | AdminRole
  | AdminFeature
  | AdminPermission
  | AdminUser
```

- [ ] **Step 3: Add copy and headers**

Update `TITLES`:

```ts
const TITLES: Record<EntityType, string> = {
  modules: "Modules",
  roles: "Roles",
  features: "Features",
  permissions: "Permissions",
  users: "Users"
}
```

Update `EMPTY_COPY`:

```ts
const EMPTY_COPY: Record<EntityType, string> = {
  modules: "No modules found.",
  roles: "No roles found.",
  features: "No features found.",
  permissions: "No permissions found.",
  users: "No users found."
}
```

Update `TABLE_HEADERS`:

```ts
const TABLE_HEADERS: Record<EntityType, string[]> = {
  modules: ["Module", "Code", "Description"],
  roles: ["Role", "Module", "Description"],
  features: ["Feature", "Module", "Description"],
  permissions: ["Permission", "Permission Code", "Description"],
  users: ["Name", "Email", "Company", "Roles", "Status"]
}
```

- [ ] **Step 4: Add user type guard**

Add after `isPermissionRecord`:

```ts
function isUserRecord(value: EntityRecord): value is AdminUser {
  return "email" in value && "isActive" in value
}
```

- [ ] **Step 5: Render user rows**

In `renderRows`, add this branch after the modules branch and before permissions branch:

```tsx
  if (entity === "users") {
    return data.filter(isUserRecord).map((user) => (
      <TableRow key={user.id}>
        <TableCell className="font-medium">{user.name}</TableCell>
        <TableCell className="font-mono text-xs">{user.email}</TableCell>
        <TableCell className="text-muted-foreground">
          {user.companyName ?? "—"}
        </TableCell>
        <TableCell>{user.roleCount}</TableCell>
        <TableCell>
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
      </TableRow>
    ))
  }
```

- [ ] **Step 6: Hide module tabs for users**

Replace:

```ts
  const showTabs = entity !== "modules"
```

with:

```ts
  const showTabs = entity !== "modules" && entity !== "users"
```

- [ ] **Step 7: Run component typecheck**

Run:

```bash
bun typecheck
```

Expected: TypeScript either passes or reports only missing page/nav changes.

## Task 4: Add Users administration page

**Files:**
- Create: `app/(dashboard)/admin/administration/users/page.tsx`

- [ ] **Step 1: Create page file**

Create `app/(dashboard)/admin/administration/users/page.tsx` with:

```tsx
import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getAdministrationList } from "@/lib/administration/list"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  await ensurePlatformSchema()
  const initialData = await getAdministrationList({
    entity: "users",
    pageSize: 20
  })

  return (
    <DashboardShell
      title="Users"
      description="View platform user accounts across Arobid."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Administration" },
        { label: "Users" }
      ]}
    >
      <AdministrationListPage entity="users" initialData={initialData} />
    </DashboardShell>
  )
}
```

- [ ] **Step 2: Run page typecheck**

Run:

```bash
bun typecheck
```

Expected: TypeScript either passes or reports only nav/lint formatting changes.

## Task 5: Add sidebar navigation link

**Files:**
- Modify: `components/nav-admin.tsx`

- [ ] **Step 1: Add icon import**

Add `UsersIcon` to the Lucide import list in `components/nav-admin.tsx`:

```ts
  UsersIcon,
```

- [ ] **Step 2: Add Users item**

In `administrationLinks`, add this object before `Modules`:

```tsx
  {
    name: "Users",
    url: "/admin/administration/users",
    icon: <UsersIcon />
  },
```

Keep `Partner Audit` first if current product priority should stay audit-first; otherwise place Users before Modules. Recommended final order: Partner Audit, Users, Modules, Roles, Features, Permissions.

- [ ] **Step 3: Run typecheck**

Run:

```bash
bun typecheck
```

Expected: PASS.

## Task 6: Format, lint, and manual UI check

**Files:**
- Verify changed files only; no new code files expected beyond page and spec/plan docs.

- [ ] **Step 1: Run Biome check**

Run:

```bash
bun check
```

Expected: command completes successfully. It may rewrite formatting/import order.

- [ ] **Step 2: Run final typecheck**

Run:

```bash
bun typecheck
```

Expected: PASS.

- [ ] **Step 3: Start dev server**

Run:

```bash
bun dev
```

Expected: Next.js dev server starts on `NEXT_PUBLIC_PORT` or `1995`.

- [ ] **Step 4: Open admin users page**

Visit:

```text
http://localhost:1995/admin/administration/users
```

Expected:

- Page title is `Users`.
- Sidebar Administration contains `Users`.
- Table headers are `Name`, `Email`, `Company`, `Roles`, `Status`.
- Active users show `Active`; inactive users show `Inactive`.

- [ ] **Step 5: Verify search and pagination**

In the search input, type a known user email substring.

Expected:

- URL request goes to `/api/administration/users`.
- Results narrow to matching user name, email, or company.
- Pagination footer shows correct total count.
- Previous/Next buttons disable at boundaries.

- [ ] **Step 6: Commit only if user asks**

Do not commit by default. If user asks to commit, stage only relevant files:

```bash
git add app/api/administration/[entity]/route.ts app/(dashboard)/admin/administration/users/page.tsx components/administration/administration-list-page.tsx components/nav-admin.tsx lib/administration/list.ts lib/administration/types.ts docs/superpowers/specs/2026-05-18-admin-user-list-design.md docs/superpowers/plans/2026-05-18-admin-user-list.md
git commit -m "feat(admin): add user list"
```

## Self-Review

- Spec coverage: route, nav link, server initial data, client table, search, pagination, read-only behavior, columns, and no DB migrations are covered.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: `AdminUser`, `EntityType`, `AdministrationEntity`, and `AdministrationRecord` use consistent property names: `companyName`, `roleCount`, `isActive`.
