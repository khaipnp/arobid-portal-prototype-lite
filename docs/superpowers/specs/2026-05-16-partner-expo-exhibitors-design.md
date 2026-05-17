# Partner Expo Exhibitors Design

## Goal

Show Expo Owners which exhibitors joined an assigned expo, what booths they bought, how many booths each business owns, business profile details, and related commercial/payment information.

## Chosen approach

Use existing registration data as the source of truth. `seller_booth_registrations` defines participation in an expo. Join outward to `users`, `companies`, `booth_customizations`, and `orders` for profile, publish readiness, products, and payment totals.

This avoids adding schema for the first version. If future flows need invitation lifecycle or manual exhibitor approval, add a dedicated `expo_exhibitors` table later.

## Architecture

- Extend `app/(dashboard)/partner/expos/[expoId]/page.tsx` to fetch an exhibitor workspace in parallel with the current operations and GoLIVE data.
- Add data helpers in `lib/partner/db.ts`:
  - `getPartnerExpoExhibitors(userId, expoId)` verifies partner assignment, then returns grouped exhibitor rows for the expo.
  - `getPartnerExpoExhibitorDetail(userId, expoId, exhibitorId)` verifies partner assignment, then returns one exhibitor with registrations, orders, and product readiness.
- Add UI components under `components/partner/`:
  - Overview teaser card for top exhibitors.
  - Full exhibitor table for a new tab.
  - Detail page sections for company profile, booth registrations, orders, and products.
- Add route `app/(dashboard)/partner/expos/[expoId]/exhibitors/[exhibitorId]/page.tsx` for drilldown.

## Data model

### Exhibitor list row

Each row represents one business, grouped by `companies.id` when available. If a seller user has no company, group by `users.id` and display user name/email as fallback.

Fields:

- `id`: company id or fallback user id.
- `displayName`: company name or user name/email.
- `contactName`, `contactEmail`, `phone`.
- `website`, `address`, `industry`, `taxId`, `logoUrl` where available.
- `boothCount`.
- `boothRefs`.
- `tierMix`: counts by Basic, Professional, Premium.
- `registrationStatuses`.
- `publishedBoothCount`.
- `productCount` from `booth_customizations.products`.
- `paidAmount` from paid orders.
- `paymentStatus`: `Paid`, `Pending`, or `No order`.
- `latestPurchasedAt`.

### Payment matching

Prefer matching booth registration orders by `orders.reference_id = seller_booth_registrations.id`. If legacy/demo data does not have that reference, fall back to `orders.expo_name = expo.name` plus `orders.booth_ref = seller_booth_registrations.booth_ref`.

Payment status rules:

- `Paid`: at least one matched order has `status = 'Paid'`.
- `Pending`: matched orders exist but none are paid.
- `No order`: no matched order.

## UI behavior

### Overview teaser

Add a compact “Top Exhibitors” card to the existing Overview tab near the operational snapshot.

It shows:

- Total exhibitors.
- Total booths purchased.
- Paid revenue.
- Top 5 exhibitors ranked by booth count, then paid amount.
- A “View all exhibitors” control that switches to the Exhibitors tab.

Empty state: show “No exhibitors yet.”

### Exhibitors tab

Add a third tab next to Overview and GoLIVE.

Content:

- Summary cards: exhibitors, booths purchased, published booths, paid revenue.
- Client-side search/filter for company/contact, booth tier, registration status, and payment status.
- Table columns: Company, Contact, Booths, Booth refs, Tier mix, Publish status, Payment, Paid amount, Latest purchase.
- Row link to `/partner/expos/[expoId]/exhibitors/[exhibitorId]`.

Empty state: dashed card explaining there are no booth registrations for this expo yet.

### Exhibitor detail route

The detail route shows:

- Company profile header with logo, name, website, address, industry, and tax id.
- Contact block for seller representative.
- Booth registrations table with booth ref, tier, status, publish status, product count, and purchased date.
- Orders table with payment status, method, amount, discount, and timestamps.
- Products/readiness section from booth customization product counts.
- Breadcrumbs back to Partner Overview and the expo detail.

## Access control

Every list/detail helper must verify that the current partner user belongs to an active partner organization assigned to the expo. Unassigned expos return `null` and route handlers/pages use `notFound()`.

Do not expose exhibitors across partner organizations.

## Testing

Add Bun tests for data helpers:

1. Groups multiple booth registrations from the same company into one exhibitor row.
2. Falls back to seller user identity when `company_id` is missing.
3. Aggregates booth tier mix, published booth count, product count, paid amount, and payment status.
4. Blocks access when the partner user is not assigned to the expo.
5. Detail helper returns registrations and orders only for the selected exhibitor within the assigned expo.

After implementation, run:

- Targeted Bun tests for new helper behavior.
- `bun typecheck`.
- Browser smoke test through Partner Portal: Overview teaser, Exhibitors tab filters, and detail route.

## Scope boundaries

In scope:

- Read-only exhibitor visibility for Expo Owners.
- Existing schema, existing registration/order/profile tables.
- Client-side filtering for first version.
- Dedicated detail route.

Out of scope:

- Manual exhibitor invite/approval workflow.
- Editing exhibitor business profile from Partner Portal.
- New schema table for expo-exhibitor lifecycle.
- Server-side pagination unless real data volume requires it later.
