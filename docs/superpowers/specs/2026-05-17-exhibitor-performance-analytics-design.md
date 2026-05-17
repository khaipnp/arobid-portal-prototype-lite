# Exhibitor Performance Analytics Design

## Goal

Show real exhibitor performance metrics in Partner Portal exhibitor detail pages: RFQs received, most viewed product, most chatted product, total chat events, eProfile visits, and most wishlisted product during the expo.

## Chosen approach

Add first-party event tracking for expo exhibitor analytics. Store event rows in dedicated append-only tables for profile views, product views, product chat events, and RFQ events. Reuse existing `user_wishlist_items` for wishlist metrics.

## Schema

Add idempotent schema setup in `lib/platform/ensure-schema.ts`:

- `expo_exhibitor_profile_visits`
  - `id`, `expo_id`, `exhibitor_id`, `visitor_user_id`, `visitor_key`, `created_at`
- `expo_exhibitor_product_views`
  - `id`, `expo_id`, `exhibitor_id`, `product_id`, `visitor_user_id`, `visitor_key`, `created_at`
- `expo_exhibitor_product_chat_events`
  - `id`, `expo_id`, `exhibitor_id`, `product_id`, `conversation_id`, `visitor_user_id`, `visitor_key`, `created_at`
- `expo_exhibitor_rfq_events`
  - `id`, `expo_id`, `exhibitor_id`, `product_id`, `requester_user_id`, `requester_key`, `created_at`

Foreign keys should reference `expos(id)`. Product IDs may reference `company_products(id)` when available; if existing data can contain product IDs from booth customization JSON, keep product ID as text without a strict FK.

## Tracking APIs

Add route handlers under `app/api/tradexpo/analytics/`:

- `POST /api/tradexpo/analytics/profile-view`
- `POST /api/tradexpo/analytics/product-view`
- `POST /api/tradexpo/analytics/product-chat`
- `POST /api/tradexpo/analytics/rfq`

Each endpoint accepts JSON with:

- `expoId`
- `exhibitorId`
- `productId` when applicable
- `conversationId` for product chat when available
- optional anonymous `visitorKey`/`requesterKey`

If a user session exists, store the user id. If there is no session, accept a generated visitor key from the client. Invalid required fields return 400.

## Public page wiring

Wire tracking from public expo pages/components:

- eProfile view records a profile-view event when the exhibitor profile is opened.
- Product view records a product-view event when product detail/open action happens.
- Product chat records a product-chat event when user starts chat from a product or exhibitor product context.
- RFQ records an RFQ event when user submits an RFQ flow.

Tracking failures should not block the user action.

## Partner detail metrics

Extend `PartnerExpoExhibitorDetail` in `lib/partner/db.ts` with:

```ts
performance: {
  rfqCount: number
  chatCount: number
  eProfileVisits: number
  topViewedProduct: PartnerExpoExhibitorPerformanceProduct | null
  topChattedProduct: PartnerExpoExhibitorPerformanceProduct | null
  topWishlistedProduct: PartnerExpoExhibitorPerformanceProduct | null
}
```

`PartnerExpoExhibitorPerformanceProduct` contains:

- `productId`
- `productName`
- `count`

All metrics must filter to the expo time window using `expo.start_at`/`expo.end_at` when available, falling back to `start_date`/`end_date`.

## UI

Add a Performance card to `components/partner/partner-expo-exhibitor-detail.tsx`:

- RFQs received
- Chat events received
- eProfile visits
- Most viewed product
- Most chatted product
- Most wishlisted product

Display `No data yet` for missing top products.

## Testing

Add targeted tests for analytics aggregation in partner exhibitor detail:

1. Counts profile visits, product views, product chats, and RFQs only within the expo window.
2. Selects top viewed/chatted/wishlisted product by count.
3. Ignores events for other exhibitors and other expos.
4. Returns zero/null metrics when no events exist.

## Scope boundaries

In scope:

- Real event tables.
- Tracking API endpoints.
- Wiring current public expo interactions where existing UI flow exists.
- Partner detail performance display.

Out of scope:

- Historical backfill for old behavior.
- Anti-fraud/de-duplication logic.
- Advanced analytics charts or time series.
- Export/report downloads.
