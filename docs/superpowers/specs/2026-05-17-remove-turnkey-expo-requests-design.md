# Remove Turnkey Expo Requests from Expo Program

## Goal

Expo Program must no longer expose Turnkey Expo Request flow. Expo Owners work with Arobid Business outside the portal; Arobid creates expos and assigns them to partner organizations.

## Scope

Remove the Turnkey Expo Request code path without destructive database changes:

- Remove request metrics, request list, request dialog, and request actions from Expo Program UI.
- Remove partner Turnkey Request API route handlers.
- Remove Turnkey Request types and data helpers from partner DB module.
- Stop `ensure-schema` from creating `partner_turnkey_expo_requests` for new environments.
- Do not drop or alter existing production tables.

## UI behavior

`components/partner/partner-expo-programs.tsx` will focus on assigned expo operations:

- Summary cards: Assigned Programs, Partnership Models, Bulk Inventory, Booth Utilization.
- Guidance copy: Arobid Business creates and assigns expo programs.
- Bulk Booth Distribution remains unchanged.
- Assigned expo list remains unchanged.

No “Request turnkey expo”, approval, rejection, conversion, or empty request table appears.

## Backend behavior

`getPartnerExpoProgramsWorkspace` returns only assigned expos and quota workspace. It no longer queries `partner_turnkey_expo_requests`.

Route handlers under `app/api/partner/turnkey-requests` are removed. No new API replacement is added.

`lib/platform/ensure-schema.ts` no longer creates or indexes `partner_turnkey_expo_requests`. Existing databases keep existing table if already present.

## Testing

Run targeted verification after implementation:

- `bun typecheck`
- `bun test lib/partner/expo-exhibitors.test.ts` if affected imports overlap
- Browser check `/partner/expos` for no Turnkey Request UI and no console errors
