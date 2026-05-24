# Admin User List Design

## Goal

Arobid admins need a read-only user list inside the Administration workspace so they can inspect platform users without changing account, role, or status data.

## Scope

Build a read-only Users page at `/admin/administration/users`.

Include:

- Administration sidebar link named `Users`.
- Server-rendered page with initial data.
- Client table with search and pagination matching existing administration list UX.
- Columns: Name, Email, Company, Role count, Status.
- Search by user name, email, or company name.
- Pagination with 20 users per page.

Exclude:

- Creating, editing, activating, deactivating, deleting users.
- Editing roles or permissions.
- Database migrations or seed data changes.

## Architecture

Extend the existing Administration list pattern rather than creating a separate management flow.

- `app/(dashboard)/admin/administration/users/page.tsx` loads initial user data and renders the shared list component.
- `components/nav-admin.tsx` adds the `Users` item under Administration.
- `components/administration/administration-list-page.tsx` supports a new `users` entity and renders user-specific columns.
- `lib/administration/types.ts` defines `AdminUser`.
- `lib/administration/list.ts` accepts `users` as an entity and queries `users`, `companies`, and `user_roles`.
- `app/api/administration/[entity]/route.ts` allows `users` and returns the same paginated response shape.

## Data Flow

1. Page calls `ensurePlatformSchema()` to ensure base tables exist.
2. Page calls `getAdministrationList({ entity: "users", pageSize: 20 })`.
3. Client component receives initial rows.
4. Search, refresh, and pagination fetch `/api/administration/users`.
5. API calls the same list helper and returns `{ data, meta }`.

## Query Behavior

User rows come from `users`.

- Join `companies` by `users.company_id = companies.id`.
- Count roles from `user_roles` grouped by `user_id`.
- Return `companyName` as `null` if no company exists.
- Return `roleCount` as `0` if no roles exist.
- Order by user name, then email.

## Error Handling

Reuse existing administration table behavior:

- Keep previous rows during fetches.
- Show retry panel on load failure.
- Show empty state if no users match search.

## Testing

Run:

- `bun typecheck`
- `bun check`

Manual UI check:

- Visit `/admin/administration/users` as admin.
- Confirm table loads.
- Confirm search narrows results.
- Confirm pagination controls work.
- Confirm sidebar link appears under Administration.
