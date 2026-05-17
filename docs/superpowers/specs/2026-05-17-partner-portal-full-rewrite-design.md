# Partner Portal Full Rewrite Design

## Goal

Rewrite Partner Portal and related Admin Portal workflows to match the Partner Portal wiki model. Partner users are normal Arobid users linked to Partner Organizations through memberships. Admin Portal acts as the control plane; Partner Portal acts as a scoped operations surface.

## Source Requirements

Primary source: `wiki/Module/Core/Partner Portal/` in the referenced worktree.

Key user stories covered:

- US-01 Admin creates and manages Partner Organization.
- US-02 Partner Portal access and capability routing.
- US-03 Shared Partner Portal sidebar module visibility.
- US-04 Invite Partner Organization user.
- US-05 Assign Partner user role.
- US-06 Remove or disable Partner Organization user.
- US-07 Draft Tenant mini-site content.
- US-08 Preview Tenant mini-site.
- Related stories for company association, expo/program assignment, TradeCredit reporting, analytics reporting, and mini-site moderation.

## Domain Model

Partner identity must use existing Arobid users:

- `users`: shared login identity.
- `partner_organizations`: Partner Organization records with type/model/status.
- `partner_memberships`: user-to-partner-org membership, role, status.
- `partner_capability_assignments`: module/action capability grants.
- `partner_scope_assignments`: expo/program/company scope grants.
- `partner_mini_sites`: versioned Tenant mini-site content.
- `partner_mini_site_review_events`: submitted/rejected/published audit trail.

MVP roles:

- Partner Owner.
- Partner Admin.
- Viewer.

Legacy partner role names can be migrated or mapped, but Partner Portal behavior must only expose MVP role semantics.

## Admin Portal Control Plane

Admin Portal must own Partner governance:

1. Partner Organization management
   - Create Partner Organization.
   - Edit organization metadata.
   - Activate/deactivate organization.
   - Assign organization type/model.

2. Membership management
   - Invite new or existing Arobid user to Partner Organization.
   - Assign Owner/Admin/Viewer role.
   - Disable/remove membership.
   - Keep audit metadata for actor and timestamp.

3. Capability and scope management
   - Grant module capabilities.
   - Assign expo/program/company scopes.
   - Prevent Partner Portal access when membership, org, capability, or scope is inactive.

4. Tenant mini-site moderation
   - Review submitted mini-site versions.
   - Publish or reject submitted versions.
   - Require reject reason.
   - Preserve published version while `draft_update` is under review.

Admin routes should live under existing admin dashboard structure and reuse current UI primitives. New Admin pages should be focused on Partner control plane, not duplicate Partner Portal operations.

## Partner Portal Surface

Partner Portal MVP modules:

1. Overview
   - Organization status.
   - Visible capability/scope summary.
   - Key metrics from assigned scope.

2. Mini-site
   - Tenant-only draft editor.
   - Save draft.
   - Submit for review.
   - Preview selected version.
   - State labels: `draft`, `submitted`, `rejected`, `published`, `draft_update`.
   - Viewer read-only.

3. Enterprises & Members
   - Scoped enterprise/company association view.
   - Association lifecycle aligned to wiki: `invited -> pending_acceptance -> active`, then inactive/removed/blocked paths.
   - Do not use `pending_review` or `rejected` for association MVP.

4. Expo Programs
   - Visible only when capability exists and assigned expo/program scope exists.
   - Show assigned programs and operations metrics.
   - No self-created turnkey requests.

5. Quota & TradeCredit Reports
   - Report-only for TradeCredit in MVP unless wiki story explicitly grants management.
   - Show allocated/consumed/available values.

6. Analytics & Reports
   - Read-only reporting based on scoped data.

Deferred/hidden Partner Portal modules:

- Communications.
- Finance & Settlement.
- Service Bundles.
- Government-specific page unless folded into capability-based reports.

Deferred modules should not appear in sidebar and should be server-blocked if route files remain temporarily.

## Access Enforcement

Every Partner page/API must enforce:

1. Authenticated user.
2. User has Partner system role or active Partner membership.
3. Active Partner Organization.
4. Active membership role.
5. Required module capability.
6. Required assigned scope when module is scope-bound.

Client sidebar filtering is only UX. Server-side guards must be source of truth.

Recommended guard API:

- `getPartnerPortalAccess(userId)` returns organization, membership, role, capabilities, scopes, module visibility, readOnly.
- `requirePartnerModule(userId, module)` throws/notFound/redirects for page use.
- `requirePartnerAction(userId, action, scope?)` gates mutations.
- `requirePartnerApiAction(action, scope?)` gates API route handlers.

## Data Flow

Admin flow:

1. Admin creates Partner Organization.
2. Admin invites or attaches Arobid user.
3. Admin assigns role, capabilities, and scopes.
4. User enters Partner Portal.
5. Partner Portal computes access from membership/capabilities/scopes.

Mini-site flow:

1. Partner Owner/Admin edits Tenant mini-site draft.
2. Partner submits version for review.
3. Admin reviews submitted version.
4. Admin publishes or rejects with reason.
5. Published version remains public; preview can show non-public versions with labels.

Expo/program flow:

1. Admin assigns expo/program scope.
2. Partner sees Expo Programs only when capability and scope both exist.
3. Partner can view scoped metrics and allowed operations only.

## UI and Navigation

Partner sidebar must be capability-driven:

- Overview always visible for valid membership.
- Mini-site visible for Tenant org with `mini_site` capability.
- Enterprises & Members visible with `enterprise_association` capability.
- Expo Programs visible with `expo_programs` capability and assigned scope.
- Quota & TradeCredit Reports visible with `tradecredit_reporting` capability.
- Analytics & Reports visible with `analytics_reporting` capability.

Admin navigation should expose Partner Organization control-plane pages in admin dashboard. Page copy must avoid treating partner as “Expo Owner only.”

## Testing

Minimum verification:

- Unit tests for role/capability/scope visibility matrix.
- Unit tests for mini-site status transitions.
- API/page guard tests where existing test harness supports them.
- Typecheck with `bun typecheck`.
- Relevant Bun tests for Partner access/domain functions.
- Manual browser check for Admin Partner control plane and Partner Portal happy paths.

## Migration Strategy

Use incremental replacement with compatibility cleanup:

1. Introduce canonical Partner domain/access types.
2. Add schema bootstrap changes for missing Partner governance tables.
3. Rewrite access calculation and sidebar visibility.
4. Add Admin control-plane pages and APIs.
5. Replace Partner Portal pages with MVP modules.
6. Hide/server-block deferred modules.
7. Remove or stop routing stale Expo Owner-only flows.

## Success Criteria

- Partner users remain normal Arobid users with Partner Organization memberships.
- Admin Portal can create/manage Partner Organizations, memberships, capabilities, scopes, and mini-site moderation.
- Partner Portal shows only MVP modules allowed by role/capability/scope.
- Deferred modules are hidden and server-blocked.
- Tenant mini-site lifecycle follows wiki and does not allow partner self-publish.
- Expo Programs visibility requires assigned scope.
- Server guards protect both page routes and API routes.
