# Account Profile Dialog Design

## Summary

Build a self-service account information dialog available from the shared dashboard user menu. The dialog lets the current authenticated user update personal information: First Name, Last Name, Gender, Mobile, and Date of Birth. Data is persisted in the database and scoped strictly to the current session user.

## Goals

- Open account management from `Account` in `components/nav-user.tsx` without navigating to a new route.
- Support all dashboard portals because `NavUser` is shared by admin, partner, and seller layouts.
- Persist personal profile fields in the `users` table.
- Update sidebar display name after profile save.
- Keep the implementation isolated from admin user-management flows.

## Non-goals

- No separate `/account`, `/admin/account`, `/partner/account`, or `/seller/account` page.
- No password, email, avatar, company, role, or active-status management in this feature.
- No manual browser verification unless explicitly requested.
- No new test files unless explicitly requested.

## User Experience

Clicking `Account` in the user dropdown opens a dialog. The dropdown item must prevent default menu selection behavior while opening the dialog.

Dialog content:

- Title: `Account information`
- Description: `Update your personal information used across Arobid dashboards.`
- Form fields:
  - First Name: required text input
  - Last Name: required text input
  - Gender: select with `male`, `female`, `other`, `prefer_not_to_say`
  - Mobile: optional tel input
  - DoB: optional date input
- Footer actions:
  - `Cancel`
  - `Save changes`

States:

- When dialog opens, fetch current profile from `GET /api/account/profile`.
- Show loading state while fetching.
- Disable save while submitting.
- Show toast on success or failure.
- On success, close or keep dialog based on the existing component pattern; prefer closing after successful save.
- Call `router.refresh()` after save so server-rendered dashboard shell can update the visible user name.

Layout:

- Use shadcn/ui primitives already used in the project.
- Desktop: compact two-column form where fields fit naturally.
- Mobile: single-column form.
- Match existing token-based styling and avoid hardcoded colors.

## Data Model

Add nullable columns to `users` through `lib/platform/ensure-schema.ts`:

- `first_name text`
- `last_name text`
- `gender text`
- `mobile text`
- `date_of_birth date`

Keep the existing `name` field as display name. On profile save, sync `users.name` from `first_name + " " + last_name` after trimming whitespace. This keeps existing code that reads `user.name` working without broader refactors.

Existing users may not have the new fields. When reading profile data, if `first_name` and `last_name` are empty, derive initial values from `users.name` for display only. Persist explicit first and last name on first save.

`mobile` is stored separately from the existing `phone` field because the requested account field is specifically Mobile and `phone` is already used by admin/company-related user details.

## API Design

Create `app/api/account/profile/route.ts`.

`GET /api/account/profile`:

- Resolve user ID from the current auth session.
- Return `401` if no valid session exists.
- Return current profile fields for the session user.

`PATCH /api/account/profile`:

- Resolve user ID from the current auth session.
- Never accept or trust a client-supplied `userId`.
- Validate payload server-side.
- Update only the current user row.
- Return updated profile.

Validation rules:

- `firstName`: required after trim.
- `lastName`: required after trim.
- `gender`: optional but must be one of `male`, `female`, `other`, `prefer_not_to_say` when present.
- `mobile`: optional; trim and store null when empty.
- `dateOfBirth`: optional; accept `YYYY-MM-DD`, store null when empty.

Errors:

- Invalid JSON: `400`.
- Validation failure: `400` with user-readable error.
- Missing session: `401`.
- Unexpected failure: `500` with generic error.

## Service Boundary

Create `lib/account/profile.ts` to keep route handlers thin.

Responsibilities:

- Define profile types and gender options.
- Normalize input values.
- Validate field values.
- Read current account profile.
- Update current account profile.
- Derive first/last names from `users.name` when explicit fields are missing.

The service should use `ensurePlatformSchema()` before reading or writing profile columns, because shared dev/prod database schema can lag code.

## Component Boundary

Create `components/account/account-profile-dialog.tsx`.

Responsibilities:

- Own dialog state content and form state.
- Fetch profile only when opened.
- Submit update through the API route.
- Show loading, disabled, and toast states.
- Trigger `router.refresh()` after successful save.

Update `components/nav-user.tsx` only to:

- Import and render `AccountProfileDialog`.
- Track dialog open state.
- Change `Account` dropdown item from inert text to dialog trigger behavior.

This keeps `NavUser` from becoming a large form component.

## Security and Authorization

- All reads and writes use the session user ID.
- No role is required beyond being authenticated, because this is self-service personal information.
- Client cannot choose target user ID.
- Admin user-management API remains separate and unchanged.

## Verification

Run after implementation:

- `bun typecheck`
- `bun check`

Manual browser verification is skipped by default per project preference unless requested.

## Open Decisions

No open decisions. User selected database persistence and dialog UI.
