# Admin Portal SvelteKit Parity Migration Design

## Goal

Migrate the admin portal from Next.js App Router to SvelteKit with route, data, and interaction parity before any larger refactor. The SvelteKit admin should replace the current Next.js admin surfaces once critical routes, auth guards, and manual admin workflows match existing behavior.

## Scope

In scope:

- Admin dashboard shell, navigation, breadcrumbs, and role guard behavior.
- Administration routes: users, user detail, roles, permissions, modules, and features.
- Tradexpo admin routes: overview, expos list, new expo, detail, edit, hall templates, hall slots, booth templates.
- Remaining admin modules after core admin and Tradexpo: orders, partners, plan subscriptions, payment settings, evoucher, streaming, and tradecredit.
- SvelteKit server loaders/actions and API endpoints needed by migrated screens.
- Manual browser verification for each completed module.

Out of scope:

- Broad visual redesign.
- Business logic rewrite unrelated to migration.
- Database schema changes unless a migrated feature cannot work without one.
- New test files unless explicitly requested.

## Current State

`sveltekit-temp` contains a SvelteKit 5 project with Tailwind, bits-ui/shadcn-style primitives, auth helpers, administration helpers, Tradexpo helpers, dashboard layouts, and initial routes.

Already present:

- Root landing and login routes.
- Admin, partner, and seller dashboard layouts.
- Auth API routes for login, demo login, logout, and session.
- Notifications API route.
- Administration users list route and component.
- Shared Svelte UI primitives.

Remaining gap: the Next.js admin portal still owns most routes and interactions. SvelteKit currently has foundation plus partial administration coverage, not replacement readiness.

## Architecture

Use SvelteKit route boundaries to mirror existing Next.js route structure:

- `+layout.server.ts` handles session lookup and RBAC checks for dashboard areas.
- `+layout.svelte` owns dashboard shell composition and navigation.
- `+page.server.ts` loads route data and exposes server actions where forms mutate state.
- `+page.svelte` renders UI and delegates feature-heavy sections to `$lib/components/*`.
- `$lib/<feature>/` contains data access, domain types, validation, and reusable business helpers.
- `src/routes/api/*/+server.ts` exists only where client interactions need fetch-style endpoints.

Keep database access out of Svelte components. Treat loaders, actions, route handlers, and scripts as system boundaries for validation and environment assumptions.

## Migration Strategy

### Milestone 1: Admin foundation usable

- Confirm SvelteKit dependencies, env loading, `svelte-check`, and build work locally.
- Verify login, logout, session, and admin RBAC flow.
- Align admin sidebar/navigation with current Next.js admin structure.
- Port admin users detail page to pair with the existing users list.

Exit criteria:

- Admin shell loads in SvelteKit.
- Users list and user detail work with real data.
- Auth guard blocks unauthenticated or unauthorized access.
- SvelteKit check passes.

### Milestone 2: Administration complete

Port remaining administration screens with parity-first behavior:

- Roles.
- Permissions.
- Modules.
- Features.

Exit criteria:

- `/admin/administration/*` route coverage matches Next.js.
- Lists, detail views, and core actions behave like existing admin portal.
- Manual browser pass covers admin administration golden path.

### Milestone 3: Tradexpo admin complete

Port Tradexpo routes in dependency order:

1. Tradexpo overview.
2. Expos list.
3. New expo.
4. Expo detail.
5. Expo edit.
6. Hall templates.
7. Hall template detail and slots.
8. Booth templates.
9. Booth template detail.

Exit criteria:

- Tradexpo admin route coverage matches Next.js.
- Expo create/edit/detail flows work.
- Template management flows work.
- Manual browser pass covers key Tradexpo admin flows.

### Milestone 4: Remaining admin modules

Port lower-dependency business surfaces:

- Orders.
- Partners and partner mini-site/audit routes.
- Plan subscriptions and packages.
- Settings/payment management/bank accounts.
- Evoucher.
- Streaming.
- Tradecredit.

Exit criteria:

- Remaining admin route coverage matches Next.js.
- Core list/detail/action flows work for each module.
- Manual browser pass covers one golden path per module.

### Milestone 5: Cutover readiness

- Create route coverage checklist comparing Next.js admin routes to SvelteKit routes.
- Run SvelteKit check/build.
- Run manual browser verification for critical admin workflows.
- Decide whether to replace Next.js admin routes or keep temporary parallel deployment.

Exit criteria:

- Critical route parity confirmed.
- Known gaps documented.
- Cutover choice explicit.

## Data Flow

Read flow:

1. Browser requests SvelteKit admin route.
2. Dashboard layout server loader validates session and role.
3. Page server loader calls `$lib/<feature>/db` or service helpers.
4. Page component receives typed data and renders feature component.

Mutation flow:

1. User submits form or triggers client interaction.
2. Server action or API route validates boundary input.
3. Feature service performs database operation.
4. Route invalidates/reloads data or returns updated payload.
5. UI shows same success/error behavior as Next.js version.

## Error Handling

- Auth and RBAC errors redirect or return access-denied behavior matching current portal.
- Loader errors should fail at route boundary with clear admin-facing fallback where existing Next.js routes already do so.
- Form/action validation should happen at server boundary and return field or action errors to the page.
- Do not add broad fallback logic for impossible internal states.

## Verification

For each milestone:

- Run SvelteKit type/check command.
- Use browser manually for golden path and main edge cases.
- Compare route behavior against current Next.js admin route.
- Avoid adding new test files unless explicitly requested.

Manual verification checklist per module:

- Unauthenticated access behavior.
- Authorized admin load behavior.
- List route rendering.
- Detail route rendering when applicable.
- Main create/update/action flow when applicable.
- Empty/error state if route already supports it in Next.js.

## Constraints

- Preserve parity before redesign or refactor.
- Prefer existing data helpers and domain logic where portable.
- Use SvelteKit server loaders/actions as primary migration boundary.
- Keep UI tokens and shadcn-style primitives consistent with current design system.
- Do not change database schema without explicit approval because dev and production share the database.
- Do not create worktrees or branches unless requested.
