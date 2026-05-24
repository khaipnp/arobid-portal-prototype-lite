# Expo Product Feature Section Design

## Goal

Add a **Product Feature** section to the public Expo detail page after the Exhibitors section. The section surfaces products listed by published seller booths and creates a continuous sourcing experience for buyers through infinite scroll.

## Eligibility and Visibility

A product is eligible when it comes from `booth_customizations.products` for a seller booth registration in the current Expo and that booth customization has `publish_status = 'Published'`.

The section renders only when the Expo has at least 20 eligible products. If the count is below 20, the page hides the whole section with no empty state.

## Data Model

Introduce an `ExpoDetailProduct` shape derived from published booth customizations:

- product fields: `id`, `name`, `description`, `imageUrl`
- exhibitor context: `exhibitorId`, `exhibitorCompany`, `logoUrl`, `boothTier`, `country`
- buyer state: `isWishlisted`

The source of truth remains `booth_customizations.products`; the feature does not read from `company_products` for this section.

## Data Access

Add DB helpers in `lib/tradexpo/db/platform-data.ts`:

- `countExpoDetailProducts(expoId)` counts eligible products for gating.
- `listExpoDetailProducts(expoId, { userId, limit, offset })` returns a flat product feed.

The feed order should be stable: booth tier priority, seller booth purchase time, exhibitor id, then product position from the JSON array. This keeps infinite scroll deterministic across requests.

## Page Integration

Update `app/(tradexpo)/expos/[slug]/page.tsx` to load product count and initial products alongside existing exhibitors and hero stats. Render `ProductsSection` immediately after `ExhibitorsSection` only when `productCount >= 20`.

## API

Add `app/api/tradexpo/expo-products/route.ts`.

Request query:

- `expoId`: required
- `offset`: optional, defaults to `0`
- `limit`: optional, clamped to a safe maximum such as `24`

Response:

```json
{
  "data": [],
  "total": 0,
  "hasMore": false
}
```

The route calls `ensurePlatformSchema()`, resolves current session user id, and returns wishlist state for authenticated buyers.

## UI

Create `components/tradexpo/expo-detail/products-section.tsx` as a client component.

Section header:

- Title: `Product Feature`
- Subtitle: `Explore featured products from verified exhibitors.`
- Product count is shown as supporting text.

Product card visual direction follows the provided reference:

- large product image at top in a rounded white frame
- product name below, bold and clickable
- no price line in the first implementation because `SellerBoothProduct` has no price field
- no minimum order line in the first implementation because `SellerBoothProduct` has no MOQ field
- company row at bottom with small logo and underlined company name
- no separate `View details` CTA

Clicking the product image or product name opens product detail.

## Infinite Scroll

`ProductsSection` receives initial products and total count from the server. It uses an `IntersectionObserver` sentinel at the end of the grid.

When sentinel enters view and more products exist:

1. call `/api/tradexpo/expo-products?expoId=...&offset=<current length>&limit=...`
2. append returned products
3. update `hasMore`

While loading, show a small group of card skeletons. When no more products remain, show a quiet completion line such as `You’ve explored all listed products`.

If a later page request fails, keep already loaded products and show a small `Try again` action at the bottom.

## Product Detail and Actions

Reuse the existing `ExhibitorProductDetailDialog` by adapting its product item type to include optional description and by passing the selected product plus products from the same exhibitor that are already loaded in the section. Product cards pass enough exhibitor context for analytics, chat, RFQ, and wishlist actions.

Wishlist, chat, and RFQ must respect authentication because wishlist saves to the buyer workspace and chat/RFQ are user-specific flows.

Unauthenticated buyer behavior:

- clicking wishlist opens quick login dialog
- clicking chat opens quick login dialog
- submitting RFQ opens quick login first if user context is required

After quick login succeeds, call `router.refresh()` so server-provided user state and wishlist state are refreshed.

## Analytics

Keep existing analytics endpoints:

- product view: `/api/tradexpo/analytics/product-view`
- product chat: `/api/tradexpo/analytics/product-chat`
- RFQ: `/api/tradexpo/analytics/rfq`

Track product detail opens from the Product Feature section as product views.

## Testing and Verification

Manual verification focus:

1. Expo with fewer than 20 eligible products hides Product Feature.
2. Expo with 20 or more eligible products shows Product Feature after Exhibitors.
3. Infinite scroll loads more products without replacing existing products.
4. Clicking image/name opens detail dialog.
5. Unauthenticated wishlist/chat opens quick login instead of failing with only a toast.
6. Authenticated wishlist persists through existing wishlist API.
7. API failure during infinite scroll keeps current grid and offers retry.

Run typecheck and project checks after implementation.
