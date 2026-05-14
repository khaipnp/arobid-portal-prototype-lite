"use client"

import {
  Building2Icon,
  CalendarIcon,
  ExternalLinkIcon,
  HeartIcon,
  PackageIcon,
  Trash2Icon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"
import type { WishlistItem } from "@/lib/wishlist/db"

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`
}

export function WishlistPageContent({
  initialItems
}: {
  initialItems: WishlistItem[]
}) {
  const [items, setItems] = useState(initialItems)
  const count = items.length
  const savedExpoCount = useMemo(
    () =>
      new Set(
        items
          .map((item) =>
            item.targetType === "product" ? undefined : item.expo.id
          )
          .filter(Boolean)
      ).size,
    [items]
  )
  const savedProductCount = items.filter(
    (item) => item.targetType === "product"
  ).length

  const removeItem = async (targetType: string, targetId: string) => {
    const currentItems = items
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.targetType === targetType && item.targetId === targetId)
      )
    )

    try {
      const res = await fetch(
        `/api/wishlist?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        setItems(currentItems)
        const payload = await res.json().catch(() => null)
        toast.error(payload?.error ?? "Could not remove wishlist item")
        return
      }
      toast.success("Removed from wishlist")
    } catch (_err) {
      setItems(currentItems)
      toast.error("Could not remove wishlist item")
    }
  }

  if (items.length === 0) {
    return (
      <div className="px-4">
        <Empty className="min-h-[360px] border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HeartIcon />
            </EmptyMedia>
            <EmptyTitle className="font-bold text-lg">
              No Saved Items
            </EmptyTitle>
            <EmptyDescription>
              Save expos, products, and sellers from public Expo pages and
              return here to review them from your workspace.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/">Explore Expos</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="grid gap-4 px-4 pb-6">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="font-bold text-3xl">{count}</p>
          <p className="mt-1 font-semibold text-base">Saved Items</p>
          <p className="text-muted-foreground text-sm">
            Expos, products, and sellers marked for follow-up.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="font-bold text-3xl">{savedExpoCount}</p>
          <p className="mt-1 font-semibold text-base">Related Expos</p>
          <p className="text-muted-foreground text-sm">
            Expo events represented in your wishlist.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="font-bold text-3xl">{savedProductCount}</p>
          <p className="mt-1 font-semibold text-base">Saved Products</p>
          <p className="text-muted-foreground text-sm">
            Product opportunities saved from seller booths.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          if (item.targetType === "product") {
            return (
              <article
                key={`${item.targetType}-${item.targetId}`}
                className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:flex-row md:items-start"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <Image
                    src={
                      item.product.imageUrl ?? "/landing/figma-product-1.png"
                    }
                    alt={item.product.name}
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-lg border bg-white object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-base">
                        {item.product.name}
                      </h2>
                      <Badge variant="outline">Product</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
                      <span className="inline-flex items-center gap-1">
                        <PackageIcon className="size-3.5" />
                        {item.seller.name}
                      </span>
                    </div>
                    {item.product.description ? (
                      <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
                        {item.product.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <RemoveWishlistButton item={item} onRemove={removeItem} />
              </article>
            )
          }

          if (item.targetType === "expo") {
            return (
              <article
                key={`${item.targetType}-${item.targetId}`}
                className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:flex-row md:items-start"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <Image
                    src={item.expo.thumbnailUrl}
                    alt={item.expo.name}
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-lg border bg-white object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-base">
                        {item.expo.name}
                      </h2>
                      <Badge variant="outline">Expo</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="size-3.5" />
                        {formatDateRange(
                          item.expo.startDate,
                          item.expo.endDate
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 md:justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={item.expo.slug ? `/expos/${item.expo.slug}` : "/"}
                    >
                      View Expo
                      <ExternalLinkIcon className="size-3.5" />
                    </Link>
                  </Button>
                  <RemoveWishlistButton item={item} onRemove={removeItem} />
                </div>
              </article>
            )
          }

          return (
            <article
              key={`${item.targetType}-${item.targetId}`}
              className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:flex-row md:items-start"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <Image
                  src={item.logoUrl ?? "/landing/figma-company-logo.png"}
                  alt={item.company}
                  width={56}
                  height={56}
                  className="size-14 shrink-0 rounded-full border bg-white object-contain"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold text-base">
                      {item.company}
                    </h2>
                    <Badge variant="outline">Seller</Badge>
                    <Badge variant="outline">{item.boothTier}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Building2Icon className="size-3.5" />
                      {item.expo.name}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="size-3.5" />
                      {formatDateRange(item.expo.startDate, item.expo.endDate)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md border px-2 py-0.5 text-xs">
                      {item.boothRef}
                    </span>
                    {item.category ? (
                      <span className="rounded-md border px-2 py-0.5 text-xs">
                        {item.category}
                      </span>
                    ) : null}
                    <span className="rounded-md border px-2 py-0.5 text-xs">
                      {item.country}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-2 md:justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={item.expo.slug ? `/expos/${item.expo.slug}` : "/"}
                  >
                    View Expo
                    <ExternalLinkIcon className="size-3.5" />
                  </Link>
                </Button>
                <RemoveWishlistButton item={item} onRemove={removeItem} />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function RemoveWishlistButton({
  item,
  onRemove
}: {
  item: WishlistItem
  onRemove: (targetType: string, targetId: string) => void
}) {
  const label =
    item.targetType === "product"
      ? item.product.name
      : item.targetType === "expo"
        ? item.expo.name
        : item.company
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Remove ${label} from wishlist`}
      onClick={() => onRemove(item.targetType, item.targetId)}
    >
      <Trash2Icon />
    </Button>
  )
}
