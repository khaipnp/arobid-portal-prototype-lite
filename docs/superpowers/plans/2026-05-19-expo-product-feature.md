# Expo Product Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Product Feature section on Expo detail pages that renders only when an Expo has at least 20 products from published seller booths and supports infinite scroll sourcing.

**Architecture:** Add a flat product feed in `lib/tradexpo/db/platform-data.ts`, expose it through a new `app/api/tradexpo/expo-products/route.ts`, and render a new client `ProductsSection` after `ExhibitorsSection`. Reuse existing product detail, wishlist, quick-login, chat, RFQ, and analytics patterns instead of creating parallel flows.

**Tech Stack:** Next.js App Router, React 19 client components, TypeScript, Bun, Neon SQL helper, shadcn/ui, Tailwind CSS v4.

---

## File Structure

- Modify `lib/tradexpo/db/platform-data.ts`
  - Add `ExpoDetailProduct` type.
  - Add `countExpoDetailProducts(expoId)`.
  - Add `listExpoDetailProducts(expoId, { userId, limit, offset })`.
- Create `app/api/tradexpo/expo-products/route.ts`
  - Validate query params.
  - Call product feed helpers.
  - Return `{ data, total, hasMore }`.
- Modify `components/tradexpo/expo-detail/exhibitor-product-detail-dialog.tsx`
  - Allow optional product description.
  - Gate Chat/RFQ with `onAuthRequired` when unauthenticated.
- Create `components/tradexpo/expo-detail/products-section.tsx`
  - Render Product Feature header, cards, infinite scroll, retry, completion state, quick login, product detail, floating chat.
- Modify `app/(tradexpo)/expos/[slug]/page.tsx`
  - Fetch product count + initial products.
  - Render `ProductsSection` after `ExhibitorsSection` only when count >= 20.

## Constants

Use these constants consistently:

```ts
const PRODUCT_FEATURE_MIN_PRODUCTS = 20
const PRODUCT_FEATURE_PAGE_SIZE = 24
```

---

### Task 1: Add Expo product feed DB helpers

**Files:**
- Modify: `lib/tradexpo/db/platform-data.ts`

- [ ] **Step 1: Add the product feed type near `ExpoDetailExhibitor`**

Add after `ExpoDetailExhibitor`:

```ts
export type ExpoDetailProduct = {
  id: string
  name: string
  description: string
  imageUrl?: string
  exhibitorId: string
  exhibitorName: string
  exhibitorCompany: string
  exhibitorLogoUrl?: string
  exhibitorAvatarUrl?: string
  boothTier: string
  country: string
  isWishlisted?: boolean
}
```

- [ ] **Step 2: Add constants near existing list limit constants**

Add near `const DEFAULT_LIST_LIMIT = 100`:

```ts
const PRODUCT_FEATURE_MAX_LIMIT = 48
```

- [ ] **Step 3: Add a product-feed limit normalizer**

Add after `normalizeLimit`:

```ts
function normalizeProductFeedLimit(limit: number | undefined) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return 24
  return Math.max(1, Math.min(PRODUCT_FEATURE_MAX_LIMIT, Math.floor(limit)))
}

function normalizeOffset(offset: number | undefined) {
  if (typeof offset !== "number" || !Number.isFinite(offset)) return 0
  return Math.max(0, Math.floor(offset))
}
```

- [ ] **Step 4: Add count helper before `listExpoDetailExhibitorsByName`**

```ts
export async function countExpoDetailProducts(expoId: string): Promise<number> {
  const rows = (await sql`
    select coalesce(sum(jsonb_array_length(coalesce(bc.products, '[]'::jsonb))), 0)::int as total
    from seller_booth_registrations sbr
    join booth_customizations bc on bc.registration_id = sbr.id
    where sbr.expo_id = ${expoId}
      and bc.publish_status = 'Published'
  `) as { total: number }[]

  return rows[0]?.total ?? 0
}
```

- [ ] **Step 5: Add list helper after count helper**

```ts
export async function listExpoDetailProducts(
  expoId: string,
  options?: { userId?: string | null; limit?: number; offset?: number }
): Promise<ExpoDetailProduct[]> {
  const limit = normalizeProductFeedLimit(options?.limit)
  const offset = normalizeOffset(options?.offset)
  const wishlistedProductIds = options?.userId
    ? await listWishlistedTargetIds(options.userId, "product")
    : new Set<string>()

  const rows = (await sql`
    select
      product_item.value ->> 'id' as product_id,
      product_item.value ->> 'name' as product_name,
      coalesce(product_item.value ->> 'description', '') as product_description,
      nullif(product_item.value ->> 'imageUrl', '') as product_image_url,
      sbr.id as exhibitor_id,
      cu.name as exhibitor_name,
      coalesce(comp.name, cu.name) as exhibitor_company,
      nullif(comp.logo_url, '') as exhibitor_logo_url,
      cu.avatar_url as exhibitor_avatar_url,
      sbr.booth_tier,
      'Vietnam'::text as country,
      case lower(trim(sbr.booth_tier))
        when 'premium' then 1
        when 'professional' then 2
        when 'pro' then 2
        when 'basic' then 3
        else 4
      end as tier_sort,
      sbr.purchased_at,
      product_item.ordinality as product_index
    from seller_booth_registrations sbr
    join users cu on cu.id = sbr.user_id
    left join companies comp on comp.id = cu.company_id
    join booth_customizations bc on bc.registration_id = sbr.id
    cross join lateral jsonb_array_elements(coalesce(bc.products, '[]'::jsonb)) with ordinality as product_item(value, ordinality)
    where sbr.expo_id = ${expoId}
      and bc.publish_status = 'Published'
      and product_item.value ? 'id'
      and product_item.value ? 'name'
    order by tier_sort asc, sbr.purchased_at desc, sbr.id asc, product_item.ordinality asc
    limit ${limit}
    offset ${offset}
  `) as {
    product_id: string | null
    product_name: string | null
    product_description: string | null
    product_image_url: string | null
    exhibitor_id: string
    exhibitor_name: string
    exhibitor_company: string
    exhibitor_logo_url: string | null
    exhibitor_avatar_url: string | null
    booth_tier: string
    country: string
  }[]

  return rows.flatMap((row) => {
    if (!row.product_id || !row.product_name) return []
    return [
      {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description ?? "",
        imageUrl: row.product_image_url ?? undefined,
        exhibitorId: row.exhibitor_id,
        exhibitorName: row.exhibitor_name,
        exhibitorCompany: row.exhibitor_company,
        exhibitorLogoUrl: row.exhibitor_logo_url ?? undefined,
        exhibitorAvatarUrl: row.exhibitor_avatar_url ?? undefined,
        boothTier: normalizeBoothTier(row.booth_tier),
        country: row.country,
        isWishlisted: wishlistedProductIds.has(row.product_id)
      }
    ]
  })
}
```

- [ ] **Step 6: Run typecheck for DB changes**

Run:

```bash
bun typecheck
```

Expected: no TypeScript errors from `platform-data.ts`.

---

### Task 2: Add Expo products API route

**Files:**
- Create: `app/api/tradexpo/expo-products/route.ts`

- [ ] **Step 1: Create route file**

```ts
import { NextResponse } from "next/server"

import { getCurrentSessionUserId } from "@/lib/auth/session"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  countExpoDetailProducts,
  listExpoDetailProducts
} from "@/lib/tradexpo/db/platform-data"

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 48

function parseNonNegativeInteger(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(0, Math.floor(parsed))
}

function parseLimit(value: string | null) {
  const parsed = parseNonNegativeInteger(value, DEFAULT_LIMIT)
  return Math.max(1, Math.min(MAX_LIMIT, parsed))
}

export async function GET(request: Request) {
  await ensurePlatformSchema()
  const url = new URL(request.url)
  const expoId = url.searchParams.get("expoId")?.trim()

  if (!expoId) {
    return NextResponse.json({ error: "expoId is required" }, { status: 400 })
  }

  const offset = parseNonNegativeInteger(url.searchParams.get("offset"), 0)
  const limit = parseLimit(url.searchParams.get("limit"))
  const userId = await getCurrentSessionUserId()
  const [total, data] = await Promise.all([
    countExpoDetailProducts(expoId),
    listExpoDetailProducts(expoId, { userId, limit, offset })
  ])

  return NextResponse.json({
    data,
    total,
    hasMore: offset + data.length < total
  })
}
```

- [ ] **Step 2: Run typecheck for route**

Run:

```bash
bun typecheck
```

Expected: route compiles; no missing imports.

---

### Task 3: Adapt product detail dialog auth hooks

**Files:**
- Modify: `components/tradexpo/expo-detail/exhibitor-product-detail-dialog.tsx`

- [ ] **Step 1: Extend `ProductItem` type**

Replace current `ProductItem` type with:

```ts
type ProductItem = {
  id: string
  image: string
  label: string
  description?: string
  isWishlisted?: boolean
}
```

- [ ] **Step 2: Add auth callback prop**

Replace props type with:

```ts
type ExhibitorProductDetailDialogProps = {
  expoId: string
  exhibitorId: string
  exhibitorCompany: string
  products: ProductItem[]
  selectedProduct: ProductItem | null
  onSelectedProductChange: (product: ProductItem | null) => void
  onChatNow?: (product: ProductItem) => void
  onRfqSubmitted?: (product: ProductItem) => void
  onAuthRequired?: () => void
  isAuthenticated?: boolean
}
```

- [ ] **Step 3: Destructure `onAuthRequired`**

In function arguments, add `onAuthRequired` before `isAuthenticated`:

```ts
  onChatNow,
  onRfqSubmitted,
  onAuthRequired,
  isAuthenticated = false
```

- [ ] **Step 4: Change unauthenticated wishlist behavior**

Replace this block inside `toggleProductWishlist`:

```ts
    if (!isAuthenticated) {
      toast.error("Please login to save products to your wishlist")
      return
    }
```

with:

```ts
    if (!isAuthenticated) {
      onAuthRequired?.()
      return
    }
```

- [ ] **Step 5: Use selected product description in overview**

Replace hardcoded overview paragraph:

```tsx
                  <p className="text-foreground text-sm leading-5">
                    The Galaxy Z Fold 6 features a sophisticated folding design
                    with Snapdragon 8 Gen 3 performance and professional-grade
                    camera capabilities.
                  </p>
```

with:

```tsx
                  <p className="text-foreground text-sm leading-5">
                    {selectedProduct.description ||
                      "This product is listed by a verified exhibitor in this Expo."}
                  </p>
```

- [ ] **Step 6: Gate Chat Now action**

Replace button `onClick` body for Chat Now:

```ts
                onClick={() => {
                  if (selectedProduct) {
                    onChatNow?.(selectedProduct)
                  }
                }}
```

with:

```ts
                onClick={() => {
                  if (!isAuthenticated) {
                    onAuthRequired?.()
                    return
                  }
                  if (selectedProduct) {
                    onChatNow?.(selectedProduct)
                  }
                }}
```

- [ ] **Step 7: Gate RFQ action**

Replace RFQ button `onClick`:

```ts
                onClick={() => setIsRfqDialogOpen(true)}
```

with:

```ts
                onClick={() => {
                  if (!isAuthenticated) {
                    onAuthRequired?.()
                    return
                  }
                  setIsRfqDialogOpen(true)
                }}
```

- [ ] **Step 8: Run typecheck for dialog**

Run:

```bash
bun typecheck
```

Expected: existing `ExhibitorCard` call sites still compile because `onAuthRequired` is optional.

---

### Task 4: Create ProductsSection client component

**Files:**
- Create: `components/tradexpo/expo-detail/products-section.tsx`

- [ ] **Step 1: Create component file with full implementation**

```tsx
"use client"

import { HeartIcon, MessageCircleIcon, SearchIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FloatingChat } from "@/components/tradexpo/chat/floating-chat"
import type {
  ExpoDetailExhibitor,
  ExpoDetailProduct
} from "@/lib/tradexpo/db/platform-data"
import { cn } from "@/lib/utils"
import { trackExpoAnalytics } from "./exhibitor-card"
import { ExhibitorProductDetailDialog } from "./exhibitor-product-detail-dialog"

const PAGE_SIZE = 24
const fallbackImage = "/landing/figma-product-1.png"
const fallbackLogo = "/landing/figma-company-logo.png"

type ProductDialogItem = {
  id: string
  image: string
  label: string
  description?: string
  isWishlisted?: boolean
}

type ProductsResponse = {
  data?: ExpoDetailProduct[]
  total?: number
  hasMore?: boolean
  error?: string
}

type Props = {
  expoId: string
  initialProducts: ExpoDetailProduct[]
  totalProducts: number
  isAuthenticated?: boolean
}

function toDialogItem(product: ExpoDetailProduct): ProductDialogItem {
  return {
    id: product.id,
    image: product.imageUrl ?? fallbackImage,
    label: product.name,
    description: product.description,
    isWishlisted: product.isWishlisted
  }
}

function toChatExhibitor(product: ExpoDetailProduct): ExpoDetailExhibitor {
  return {
    id: product.exhibitorId,
    name: product.exhibitorName,
    company: product.exhibitorCompany,
    logoUrl: product.exhibitorLogoUrl,
    avatarUrl: product.exhibitorAvatarUrl,
    category: "",
    boothTier: product.boothTier,
    boothRef: "",
    country: product.country,
    products: [
      {
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        isWishlisted: product.isWishlisted
      }
    ],
    isWishlisted: false
  }
}

function ProductCard({
  product,
  isAuthenticated,
  onAuthRequired,
  onOpen
}: {
  product: ExpoDetailProduct
  isAuthenticated: boolean
  onAuthRequired: () => void
  onOpen: () => void
}) {
  const [isWishlisted, setIsWishlisted] = useState(!!product.isWishlisted)
  const [isWishlistPending, setIsWishlistPending] = useState(false)

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      onAuthRequired()
      return
    }

    const nextValue = !isWishlisted
    setIsWishlisted(nextValue)
    setIsWishlistPending(true)
    try {
      const res = await fetch(
        nextValue
          ? "/api/wishlist"
          : `/api/wishlist?targetType=product&targetId=${encodeURIComponent(product.id)}`,
        {
          method: nextValue ? "POST" : "DELETE",
          headers: nextValue ? { "Content-Type": "application/json" } : {},
          body: nextValue
            ? JSON.stringify({ targetType: "product", targetId: product.id })
            : undefined
        }
      )

      if (!res.ok) {
        setIsWishlisted(!nextValue)
        const payload = await res.json().catch(() => null)
        toast.error(payload?.error ?? "Could not update wishlist")
        return
      }

      toast.success(
        nextValue
          ? "Product saved to your wishlist"
          : "Product removed from your wishlist"
      )
    } catch (_err) {
      setIsWishlisted(!nextValue)
      toast.error("Could not update wishlist")
    } finally {
      setIsWishlistPending(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl border border-muted bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/40">
        <button
          type="button"
          className="relative h-full w-full"
          onClick={onOpen}
          aria-label={`View product details: ${product.name}`}
        >
          <Image
            src={product.imageUrl ?? fallbackImage}
            alt={product.name}
            fill
            className="object-contain p-3 transition duration-300 hover:scale-105"
          />
        </button>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className={cn(
            "absolute top-2 right-2 rounded-full bg-white/90 shadow-sm hover:bg-white",
            isWishlisted && "text-rose-600 hover:text-rose-700"
          )}
          disabled={isWishlistPending}
          aria-pressed={isWishlisted}
          aria-label={
            isWishlisted
              ? "Remove product from wishlist"
              : "Save product to wishlist"
          }
          onClick={toggleWishlist}
        >
          <HeartIcon className={cn("size-4", isWishlisted && "fill-current")} />
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        <button
          type="button"
          className="line-clamp-2 min-h-10 text-left font-semibold text-foreground text-sm leading-5 hover:text-legend hover:underline"
          onClick={onOpen}
        >
          {product.name}
        </button>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full bg-legend/10 px-2 py-1 font-medium text-legend">
            {product.boothTier}
          </span>
          <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
            {product.country}
          </span>
        </div>

        <div className="flex items-center gap-2 border-t pt-3">
          <Image
            src={product.exhibitorLogoUrl ?? fallbackLogo}
            alt={product.exhibitorCompany}
            width={28}
            height={28}
            className="size-7 rounded-full border bg-white object-contain"
          />
          <span className="line-clamp-1 font-semibold text-[#022582] text-xs underline underline-offset-2">
            {product.exhibitorCompany}
          </span>
        </div>
      </div>
    </Card>
  )
}

export function ProductsSection({
  expoId,
  initialProducts,
  totalProducts,
  isAuthenticated = false
}: Props) {
  const router = useRouter()
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [products, setProducts] = useState(initialProducts)
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProducts)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ExpoDetailProduct | null>(null)
  const [activeChatProduct, setActiveChatProduct] = useState<ExpoDetailProduct | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quickLoginData, setQuickLoginData] = useState({ fullName: "", email: "" })

  const selectedDialogProduct = selectedProduct
    ? toDialogItem(selectedProduct)
    : null

  const selectedExhibitorProducts = useMemo(() => {
    if (!selectedProduct) return []
    const related = products.filter(
      (product) => product.exhibitorId === selectedProduct.exhibitorId
    )
    const hasSelected = related.some((product) => product.id === selectedProduct.id)
    return (hasSelected ? related : [selectedProduct, ...related]).map(toDialogItem)
  }, [products, selectedProduct])

  const loadMore = async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    setLoadError(false)
    try {
      const query = new URLSearchParams({
        expoId,
        offset: String(products.length),
        limit: String(PAGE_SIZE)
      })
      const res = await fetch(`/api/tradexpo/expo-products?${query.toString()}`)
      const payload = (await res.json()) as ProductsResponse
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not load products")
      }
      const nextProducts = payload.data ?? []
      setProducts((current) => [...current, ...nextProducts])
      setHasMore(Boolean(payload.hasMore))
    } catch (_err) {
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async () => {
    if (!quickLoginData.fullName || !quickLoginData.email) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/quick-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quickLoginData)
      })

      if (res.ok) {
        setShowAuthDialog(false)
        router.refresh()
        toast.success("Login successful!")
      } else {
        const payload = await res.json()
        toast.error(payload.error || "Failed to process quick login")
      }
    } catch (_err) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const requireAuth = () => {
    setQuickLoginData({ fullName: "", email: "" })
    setShowAuthDialog(true)
  }

  const openProduct = (product: ExpoDetailProduct) => {
    trackExpoAnalytics("/api/tradexpo/analytics/product-view", {
      expoId,
      exhibitorId: product.exhibitorId,
      productId: product.id
    })
    setSelectedProduct(product)
  }

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || loadError) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: "600px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadError, loadMore])

  return (
    <section className="bg-white px-4 py-16">
      <div className="container mx-auto">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-medium text-legend text-sm">Product sourcing</p>
            <h2 className="font-semibold text-[32px] leading-10">
              Product Feature
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Explore featured products from verified exhibitors.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-muted-foreground text-sm">
            <SearchIcon className="size-4" />
            {totalProducts.toLocaleString()} listed products
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={`${product.exhibitorId}-${product.id}`}
              product={product}
              isAuthenticated={isAuthenticated}
              onAuthRequired={requireAuth}
              onOpen={() => openProduct(product)}
            />
          ))}
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Card
                  key={`product-skeleton-${index}`}
                  className="h-80 animate-pulse rounded-2xl bg-muted/60"
                />
              ))
            : null}
        </div>

        <div ref={sentinelRef} className="h-10" />

        {loadError ? (
          <div className="mt-4 flex justify-center">
            <Button type="button" variant="outline" onClick={loadMore}>
              Try again
            </Button>
          </div>
        ) : null}

        {!hasMore && products.length > 0 ? (
          <p className="mt-4 text-center text-muted-foreground text-sm">
            You’ve explored all listed products.
          </p>
        ) : null}
      </div>

      {selectedProduct ? (
        <ExhibitorProductDetailDialog
          expoId={expoId}
          exhibitorId={selectedProduct.exhibitorId}
          exhibitorCompany={selectedProduct.exhibitorCompany}
          products={selectedExhibitorProducts}
          selectedProduct={selectedDialogProduct}
          onSelectedProductChange={(product) => {
            if (!product) {
              setSelectedProduct(null)
              return
            }
            const next = products.find((item) => item.id === product.id)
            if (next) setSelectedProduct(next)
          }}
          isAuthenticated={isAuthenticated}
          onAuthRequired={requireAuth}
          onChatNow={(product) => {
            trackExpoAnalytics("/api/tradexpo/analytics/product-chat", {
              expoId,
              exhibitorId: selectedProduct.exhibitorId,
              productId: product.id
            })
            setActiveChatProduct(selectedProduct)
          }}
          onRfqSubmitted={(product) => {
            trackExpoAnalytics("/api/tradexpo/analytics/rfq", {
              expoId,
              exhibitorId: selectedProduct.exhibitorId,
              productId: product.id
            })
          }}
        />
      ) : null}

      {activeChatProduct ? (
        <FloatingChat
          exhibitor={toChatExhibitor(activeChatProduct)}
          selectedProduct={toDialogItem(activeChatProduct)}
          onClose={() => setActiveChatProduct(null)}
        />
      ) : null}

      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Quick Login</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your details to register as a buyer and continue sourcing
              products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product-feature-full-name">Full Name</Label>
              <Input
                id="product-feature-full-name"
                placeholder="John Doe"
                value={quickLoginData.fullName}
                onChange={(e) =>
                  setQuickLoginData((prev) => ({
                    ...prev,
                    fullName: e.target.value
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-feature-email">Email</Label>
              <Input
                id="product-feature-email"
                type="email"
                placeholder="john@example.com"
                value={quickLoginData.email}
                onChange={(e) =>
                  setQuickLoginData((prev) => ({
                    ...prev,
                    email: e.target.value
                  }))
                }
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <Button
              className="bg-legend text-white hover:bg-legend-600"
              disabled={isSubmitting}
              onClick={handleQuickLogin}
            >
              {isSubmitting ? "Processing..." : "Continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
bun typecheck
```

Expected: likely one warning/error about `loadMore` dependency because `loadMore` is not memoized.

- [ ] **Step 3: If hook dependency error appears, wrap `loadMore` in `useCallback`**

Add `useCallback` import:

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
```

Change `const loadMore = async () => {` to:

```ts
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    setLoadError(false)
    try {
      const query = new URLSearchParams({
        expoId,
        offset: String(products.length),
        limit: String(PAGE_SIZE)
      })
      const res = await fetch(`/api/tradexpo/expo-products?${query.toString()}`)
      const payload = (await res.json()) as ProductsResponse
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not load products")
      }
      const nextProducts = payload.data ?? []
      setProducts((current) => [...current, ...nextProducts])
      setHasMore(Boolean(payload.hasMore))
    } catch (_err) {
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }, [expoId, hasMore, isLoading, products.length])
```

- [ ] **Step 4: Run typecheck again**

Run:

```bash
bun typecheck
```

Expected: `ProductsSection` compiles.

---

### Task 5: Wire ProductsSection into Expo detail page

**Files:**
- Modify: `app/(tradexpo)/expos/[slug]/page.tsx`

- [ ] **Step 1: Add component import**

Add below `ExhibitorsSection` import:

```ts
import { ProductsSection } from "@/components/tradexpo/expo-detail/products-section"
```

- [ ] **Step 2: Add DB helper imports**

Change platform-data import to include:

```ts
  countExpoDetailProducts,
  getExpoBySlug,
  getExpoHeroStatsByExpo,
  listExpoDetailExhibitorsByName,
  listExpoDetailProducts
```

- [ ] **Step 3: Add constants near virtual lobby map**

```ts
const PRODUCT_FEATURE_MIN_PRODUCTS = 20
const PRODUCT_FEATURE_PAGE_SIZE = 24
```

- [ ] **Step 4: Load product count and initial products**

Replace current Promise block:

```ts
  const [exhibitors, heroStats, wishlistedExpoIds] = await Promise.all([
    listExpoDetailExhibitorsByName(expo.name, { userId }),
    getExpoHeroStatsByExpo({ id: expo.id, name: expo.name }),
    userId ? listWishlistedTargetIds(userId, "expo") : new Set<string>()
  ])
```

with:

```ts
  const [exhibitors, heroStats, wishlistedExpoIds, productCount] =
    await Promise.all([
      listExpoDetailExhibitorsByName(expo.name, { userId }),
      getExpoHeroStatsByExpo({ id: expo.id, name: expo.name }),
      userId ? listWishlistedTargetIds(userId, "expo") : new Set<string>(),
      countExpoDetailProducts(expo.id)
    ])
  const initialProducts =
    productCount >= PRODUCT_FEATURE_MIN_PRODUCTS
      ? await listExpoDetailProducts(expo.id, {
          userId,
          limit: PRODUCT_FEATURE_PAGE_SIZE,
          offset: 0
        })
      : []
```

- [ ] **Step 5: Render section after ExhibitorsSection**

Add after `</ExhibitorsSection>`:

```tsx
      {productCount >= PRODUCT_FEATURE_MIN_PRODUCTS ? (
        <ProductsSection
          expoId={expo.id}
          initialProducts={initialProducts}
          totalProducts={productCount}
          isAuthenticated={!!userId}
        />
      ) : null}
```

- [ ] **Step 6: Run typecheck**

Run:

```bash
bun typecheck
```

Expected: Expo page compiles with new imports.

---

### Task 6: Format and check project

**Files:**
- Modify only files touched above if Biome writes formatting changes.

- [ ] **Step 1: Run Biome check/fix**

Run:

```bash
bun check
```

Expected: Biome formats/organizes imports. If it changes files, review diff.

- [ ] **Step 2: Run typecheck after formatting**

Run:

```bash
bun typecheck
```

Expected: pass.

- [ ] **Step 3: Inspect diff**

Run:

```bash
git diff -- app/(tradexpo)/expos/[slug]/page.tsx app/api/tradexpo/expo-products/route.ts components/tradexpo/expo-detail/products-section.tsx components/tradexpo/expo-detail/exhibitor-product-detail-dialog.tsx lib/tradexpo/db/platform-data.ts docs/superpowers/specs/2026-05-19-expo-product-feature-design.md docs/superpowers/plans/2026-05-19-expo-product-feature.md
```

Expected: diff only contains Product Feature implementation and spec/plan files.

---

### Task 7: Manual UI verification

**Files:**
- No code changes expected unless verification finds defects.

- [ ] **Step 1: Start dev server**

Run:

```bash
bun dev
```

Expected: Next.js dev server starts on configured port or port 1995.

- [ ] **Step 2: Open Expo detail page in browser**

Use a known Expo slug such as:

```text
http://localhost:1995/expos/food-farm-global-fair
```

Expected: page loads without console errors.

- [ ] **Step 3: Verify Product Feature gating**

If current Expo has at least 20 eligible products, expect Product Feature after Exhibitors.

If current Expo has fewer than 20 eligible products, expect no Product Feature section. Do not seed or mutate shared database without explicit user approval.

- [ ] **Step 4: Verify product interactions**

On an Expo where section renders:

1. click product image
2. expect detail dialog opens
3. close dialog
4. click product name
5. expect same dialog opens

- [ ] **Step 5: Verify unauthenticated auth gating**

In logged-out state:

1. click product wishlist heart
2. expect Quick Login dialog
3. cancel
4. open product detail
5. click Chat Now
6. expect Quick Login dialog

- [ ] **Step 6: Verify infinite scroll**

Scroll near section bottom.

Expected:

- skeleton cards appear while loading
- new products append below old products
- existing cards remain in place
- end state displays `You’ve explored all listed products` when no more products remain

- [ ] **Step 7: Stop dev server**

Stop the local dev server from the terminal. Do not kill unrelated processes.

---

## Self-Review

Spec coverage:

- Eligibility from `booth_customizations.products` + `Published`: Task 1.
- Hide under 20 products: Task 5.
- Flat DB feed and API offset pagination: Tasks 1 and 2.
- UI header `Product Feature`, card reference, no CTA: Task 4.
- Infinite scroll, loading skeleton, retry, completion state: Task 4.
- Dialog reuse and product view analytics: Tasks 3 and 4.
- Wishlist/chat/RFQ quick-login gating: Tasks 3 and 4.
- Manual verification: Task 7.

Placeholder scan: no TBD/TODO/fill-in placeholders. One route URL uses known local dev port from project instructions.

Type consistency: `ExpoDetailProduct`, `ProductDialogItem`, `ProductsResponse`, and `ExhibitorProductDetailDialog` prop names match across tasks.
