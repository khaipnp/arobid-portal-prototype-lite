"use client"

import { HeartIcon, SearchIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { FloatingChat } from "@/components/tradexpo/chat/floating-chat"
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
  currentUserId?: string
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
    ownerUserId: product.exhibitorOwnerUserId,
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
  isAuthenticated = false,
  currentUserId
}: Props) {
  const router = useRouter()
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [products, setProducts] = useState(initialProducts)
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProducts)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [selectedProduct, setSelectedProduct] =
    useState<ExpoDetailProduct | null>(null)
  const [activeChatProduct, setActiveChatProduct] =
    useState<ExpoDetailProduct | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quickLoginData, setQuickLoginData] = useState({
    fullName: "",
    email: ""
  })

  const selectedDialogProduct = selectedProduct
    ? toDialogItem(selectedProduct)
    : null

  const selectedExhibitorProducts = useMemo(() => {
    if (!selectedProduct) return []
    const related = products.filter(
      (product) => product.exhibitorId === selectedProduct.exhibitorId
    )
    const hasSelected = related.some(
      (product) => product.id === selectedProduct.id
    )
    return (hasSelected ? related : [selectedProduct, ...related]).map(
      toDialogItem
    )
  }, [products, selectedProduct])

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
            ? [
                "product-skeleton-1",
                "product-skeleton-2",
                "product-skeleton-3",
                "product-skeleton-4",
                "product-skeleton-5",
                "product-skeleton-6",
                "product-skeleton-7",
                "product-skeleton-8"
              ].map((skeletonKey) => (
                <Card
                  key={skeletonKey}
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
          currentUserId={currentUserId}
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
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
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
