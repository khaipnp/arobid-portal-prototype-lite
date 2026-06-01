# Expo Form Step UI Design

## Goal

Show `ExpoForm` as a step-based wizard so long Expo setup forms are easier to scan and complete. Keep existing form state, validation, payload, and API behavior unchanged.

## Scope

Change UI only in `components/tradexpo/expo-form.tsx` unless TypeScript or formatting requires nearby small adjustments.

In scope:

- Replace current two-tab layout with step navigation.
- Use five admin steps: General information, Schedule, Expo owner, Hall configuration, Marketing content.
- Use partner-content steps that hide admin-only owner and hall steps.
- Add Previous / Next navigation.
- Keep final submit behavior and backend payload unchanged.

Out of scope:

- New API routes.
- Database/schema changes.
- New validation rules beyond existing `canSubmit`, schedule normalization, and marketing validation.
- Visual verification through Chrome MCP unless user explicitly requests it.

## Architecture

`ExpoForm` remains one client component and one `<form>`. Step state controls which section is visible. All existing React state stays at the same component level so switching steps never drops user input.

Create a small step model in the component:

- Step id.
- Step title.
- Optional description.
- Completion/availability state if useful.
- React section content rendered from existing blocks.

Build visible steps from `editableScope`:

- Admin create/edit: `general`, `schedule`, `owner`, `halls`, `marketing`.
- Partner content edit: `general`, `schedule`, `marketing`.

If a current active step becomes hidden, default to the first visible step.

## UI Behavior

Use sidebar-style step navigation inspired by the screenshot:

- Desktop: left vertical rail with numbered badges and step labels.
- Mobile: horizontally scrollable step rail above content.
- Active step uses stronger foreground/background token styling.
- Inactive steps stay clickable so users can jump back and forth.

Right side renders one card-like content area for the active step. Existing sections keep their labels and controls.

Footer behavior:

- `Cancel` stays available.
- `Previous` disabled on first visible step.
- `Next` shown until final step.
- Submit button shown on final step with existing `canSubmit || submitting` disabled logic.

## Data Flow

No data-flow change.

- Inputs still update existing local state.
- `onSubmit` still builds the same payload.
- `normalizeExpoScheduleInput` and `validateExpoMarketingContent` still guard submit.
- Owner change confirmation dialog remains outside step content so it works from owner step.

## Error Handling

Existing top-level `error` and `scheduleError` remain. Errors display near bottom of form as currently. `scheduleError` still renders inside the Schedule step.

Do not add per-step blocking validation. Users can move between steps freely; final submit remains source of truth.

## Testing / Verification

Follow project preference: no new test files unless requested.

Verification:

- Run `bun typecheck`.
- Optionally run `bun check` if formatting/import order needs auto-fix.
- Manual browser verification skipped unless user asks.

## Self-review

- No placeholders or TBDs.
- Scope is UI-only and matches approved five-step design.
- Admin and partner-content behavior are explicit.
- API and persistence behavior remain unchanged.
