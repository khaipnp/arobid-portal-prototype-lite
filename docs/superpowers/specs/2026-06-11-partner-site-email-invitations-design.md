# Partner Site Email Invitations Design

Date: 2026-06-11
Tickets: CORE-2204, CORE-2205, CORE-2883
Scope owner: Partner Portal / Partner Site Management / Invitations

## Goal

Implement Partner Site `Join Partner` invitation creation by email for Partner Owner/Admin users. The feature must validate recipients before sending, support manual comma-separated entry and file import, create invitation records under the current Partner Site context, and keep the existing invitation management list/resend behavior compatible with ticket rules.

## Scope

### In scope

- `Join Partner` invitation creation by email.
- Manual recipient entry with up to 20 comma-separated emails.
- File import from `.csv` and `.xlsx` with a `Recipient Email` column and up to 200 emails per upload.
- Downloadable template containing only `Recipient Email`.
- Validation preview before send.
- Duplicate emails in the same input/file ignored and surfaced as preview info.
- Existing current-site `Pending` invitation blocks send with an “already exists” message.
- Existing current-site `Expired` invitation blocks create/send and tells user to use `Resend`.
- Invalid emails block send until fixed.
- Invitation records expire 7 days after send/resend.
- Invitation table supports `All`, `Pending`, `Accepted`, and `Expired` filters.
- Resend remains available for `Pending` and becomes available for `Expired`; `Accepted` cannot resend.

### Out of scope

- Link-only, QR-only, social share, and Site Visit Link invitation creation.
- Editable email templates.
- Real external email provider integration if no sender utility/env already exists in the repo.
- Full public accept/onboarding route for CORE-2883 beyond preserving data semantics and expiry compatibility.
- Granting Partner Portal access from Join Partner invitation.

## Current implementation notes

- `app/(dashboard)/partner/partner-site/invitations/page.tsx` loads `PartnerSiteInvitationManager` with `workspace` from `getPartnerEnterpriseWorkspace()`.
- `components/partner/partner-site-invitation-manager.tsx` currently includes link/QR/email tabs and supports only `Accepted`/`Pending` in table filters.
- `app/api/partner/partner-site/invitations/route.ts` currently validates a raw comma-separated string and calls `createPartnerSiteInvitations()` directly.
- `lib/partner/db.ts` uses `partner_enterprise_members` as the invitation/member store. Email invite rows use `source = 'tenant_invite'`, `contact_email`, `invite_token`, `invite_expires_at`, and `activation_status`.
- `createPartnerSiteInvitations()` currently auto-resends pending duplicates and uses 30-day expiry; this conflicts with CORE-2204 and CORE-2883.
- No general email sender utility was found. Current “send” behavior is record creation/audit only.

## Architecture

### Component layer

Update `PartnerSiteInvitationManager` to focus the create dialog on email-based `Join Partner` invitations.

State groups:

- `recipientText` for manual entry.
- `uploadedRecipients` and `uploadedFileName` for file import.
- `inputMode` as `manual | import`.
- `preview` result returned from server validation.
- `isValidating`, `isSending`, `resendingId`, `message`, and `error`.

Key UI sections:

1. Header controls
   - Search by recipient email.
   - Status filter: `All`, `Pending`, `Accepted`, `Expired`.
   - `Create Invite` button gated by `invite.manage`.

2. Create invitation dialog
   - Shows fixed invitation type: `Join Partner`.
   - Manual tab: textarea for comma-separated emails, limit 20.
   - Import tab: template download, file input accepting `.csv,.xlsx`, limit 200.
   - Preview validation action.
   - Preview result cards/tables for valid recipients, invalid emails, duplicates ignored, existing pending, existing expired.
   - Send button enabled only when server preview is valid.

3. Invitation table
   - Derives `Expired` from `inviteExpiresAt < now` and no accepted date.
   - Shows `Resend` for `Pending` and `Expired` rows only.
   - Empty state remains with active search/filter controls.

### API layer

Keep route family under `app/api/partner/partner-site/invitations`.

Preferred API shape:

- `POST /api/partner/partner-site/invitations/validate`
  - Body: `{ recipients: string[] }`
  - Requires `invite.manage`.
  - Ensures platform schema.
  - Normalizes recipients, enforces limits, validates format, checks current Partner Site duplicates.
  - Returns a preview object without mutating DB.

- `POST /api/partner/partner-site/invitations`
  - Body: `{ recipients: string[] }`
  - Requires `invite.manage`.
  - Re-runs the same server validation.
  - If preview has blocking errors, returns `400` with preview/error.
  - Creates `Join Partner` invitation records for valid recipients.
  - Returns send result and preview.

If keeping a single route is simpler, use an `action: "validate" | "send"` field, but separate validate route is clearer and avoids overloading create semantics.

### DB/service layer

Add or refactor helpers in `lib/partner/db.ts`:

- `validatePartnerSiteInvitationRecipients(userId, { recipients })`
  - Resolve current partner organization through existing partner helpers.
  - Normalize and dedupe emails.
  - Enforce max count from request context:
    - manual: 20 before calling API or via `source: "manual"`.
    - import: 200.
  - Query existing `tenant_invite` rows for current `partner_org_id` and recipient emails.
  - Classify existing records:
    - `accepted`: `activation_status = 'active'` or `accepted_at is not null`.
    - `pending`: not accepted and `invite_expires_at >= now()`.
    - `expired`: not accepted and `invite_expires_at < now()`.
  - Return preview with `canSend` boolean and blocking reasons.

- `createPartnerSiteInvitations(userId, { invitationType: "join_partner_site", recipients })`
  - Keep exported function compatible if other code imports it.
  - Reject non-`join_partner_site` for this route, or keep lower-level type support but call with join only.
  - Run validation before mutation.
  - For valid recipients only, insert new rows:
    - `activation_status = 'pending_acceptance'`
    - `source = 'tenant_invite'`
    - `relationship_type = 'member'`
    - `invite_expires_at = now() + interval '7 days'`
    - `last_action = 'invite'`
  - Do not auto-resend duplicates. Pending/expired handling belongs to management/resend.
  - Write audit event `invite`.

- `resendPartnerEnterpriseInvitation(userId, memberId)`
  - Allow when source is `tenant_invite`, not accepted, and status is `pending_acceptance`/`invited` or expired by `invite_expires_at`.
  - Set new token and `invite_expires_at = now() + interval '7 days'`.
  - Write audit event `resend_invite`.

- `getPartnerEnterpriseWorkspace()`
  - Include `invite_expires_at` in select/map so UI can derive `Expired`.

### Email sending

Because no email provider utility was found, implementation should not pretend external delivery happened unless a sender exists during coding. Use one of these paths during implementation:

1. If a project email sender exists but was missed, call it from the create/resend service after record mutation.
2. If no sender exists, keep the current prototype behavior: create records and return a message such as “Invitation records created and queued for email delivery.” Avoid wording that claims external email delivery was verified.

A future email integration can hook into the DB service at the point where invite token/link and recipient are known.

## Data flow

### Manual flow

1. Partner Owner/Admin opens Invitations page.
2. User opens Create Invite.
3. User chooses manual mode and enters comma-separated emails.
4. Client parses for local count/help text but sends normalized candidates to server preview.
5. Server validates format, dedupes, checks current Partner Site duplicates/expired rows.
6. UI renders preview.
7. If preview is clean, user sends.
8. Server revalidates and creates records with 7-day expiry.
9. UI closes dialog, shows result, refreshes workspace.

### Import flow

1. User downloads template with one header: `Recipient Email`.
2. User uploads `.csv` or `.xlsx`.
3. Client extracts the `Recipient Email` column.
4. Client blocks unsupported/wrong template before server call where possible.
5. Server validates same as manual with 200-recipient limit.
6. Send follows same path as manual.

### Management/resend flow

1. Workspace loads tenant invite rows with `inviteExpiresAt`.
2. UI derives row status:
   - `Accepted`: active or accepted.
   - `Expired`: pending-like row with expiry in the past.
   - `Pending`: pending-like row with expiry not past.
3. `Resend` calls existing member resend API.
4. Server sets new 7-day expiry and token.
5. UI refreshes.

## Error handling

Blocking preview errors:

- No recipient email.
- Unsupported file type.
- Missing `Recipient Email` column.
- Manual input has more than 20 unique emails.
- Import has more than 200 unique emails.
- One or more invalid emails.
- Recipient already has `Pending` invitation in current Partner Site.
- Recipient has `Expired` invitation and must use `Resend`.

Non-blocking preview info:

- Duplicate emails ignored inside same input/file.

API error responses should include plain `error` string and, when useful, `preview` payload so UI can display row-level details.

## Security and permissions

- All invitation validation, creation, and resend APIs require `invite.manage`.
- Server must not trust client preview. Send revalidates before mutation.
- Queries are scoped by current partner organization from authenticated user.
- Recipient emails are normalized to lowercase and trimmed.
- File parsing happens client-side for UX, but server remains authoritative for all business rules.

## Verification

Run after implementation:

- `rtk bun typecheck`
- `rtk bun check` if formatting/import sorting changed or typecheck points at format-sensitive code.

Manual checks in UI can be done by page inspection, but this project memory says not to default to Chrome MCP UI verification. Use browser verification only if the user asks or if local code behavior cannot be checked otherwise.

## Implementation boundaries

Planned changed files:

- `components/partner/partner-site-invitation-manager.tsx`
- `app/api/partner/partner-site/invitations/route.ts`
- optional new `app/api/partner/partner-site/invitations/validate/route.ts`
- `lib/partner/db.ts`
- `lib/platform/ensure-schema.ts` only if a column/index is missing; current schema already has invite token/expiry fields.
- `package.json`/lockfile only if `.xlsx` parsing requires adding a dependency.

No new test files unless explicitly requested, per project memory. Verification relies on typecheck/check and targeted manual reasoning.

## Self-review notes

- No placeholders remain.
- Scope is limited to Partner Site email invitation creation plus management compatibility needed by CORE-2205 and data semantics needed by CORE-2883.
- Expiry is consistently 7 days across create/resend/derived status.
- Email delivery limitation is explicit because no sender utility was found in the current code search.
