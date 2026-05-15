import { ArrowRightIcon, GemIcon, RocketIcon, StarIcon } from "lucide-react"
import Image from "next/image"
import { type ReactNode, useState } from "react"
import { ExhibitorCardActions } from "@/components/tradexpo/expo-detail/exhibitor-card-actions"
import { ExhibitorProductDetailDialog } from "@/components/tradexpo/expo-detail/exhibitor-product-detail-dialog"
import { Card } from "@/components/ui/card"
import type { ExpoDetailExhibitor } from "@/lib/tradexpo/db/platform-data"

const asset = (name: string) => `/landing/${name}`

const productFallbackImages = [
  asset("figma-product-1.png"),
  asset("figma-product-2.png"),
  asset("figma-product-3.png"),
  asset("figma-product-4.png")
]

type ExhibitorCardProps = {
  exhibitor: ExpoDetailExhibitor
  isAuthenticated?: boolean
  onChatClick?: (
    product?: {
      id: string
      image: string
      label: string
      isWishlisted?: boolean
    } | null
  ) => void
}

function Dot() {
  return <span className="text-[#d1d5db]">·</span>
}

function MetaBadge({
  className,
  icon,
  label
}: {
  className: string
  icon?: ReactNode
  label: string
}) {
  return (
    <span
      className={`inline-flex h-5 select-none items-center gap-1 rounded-full px-1.5 text-xs leading-4 ${className}`}
    >
      {icon}
      {label}
    </span>
  )
}

export function ExhibitorCard({
  exhibitor,
  isAuthenticated = false,
  onChatClick
}: ExhibitorCardProps) {
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string
    image: string
    label: string
    isWishlisted?: boolean
  } | null>(null)

  const productImages = exhibitor.products.map((product, index) => ({
    id: product.id,
    image:
      product.imageUrl ??
      productFallbackImages[index] ??
      productFallbackImages[0],
    label: product.name,
    isWishlisted: product.isWishlisted
  }))

  return (
    <Card className="rounded-3xl bg-white px-5 py-4">
      <div className="flex h-12 items-center gap-3">
        <Image
          src={exhibitor.logoUrl ?? asset("figma-company-logo.png")}
          alt={exhibitor.company}
          width={1000}
          height={1000}
          className="size-12 rounded-full border bg-white object-contain"
        />
        <h3 className="min-w-0 flex-1 select-none font-semibold text-foreground text-sm">
          {exhibitor.company}
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-muted-foreground text-xs">
        <span className="select-none">{exhibitor.country}</span>
        <Dot />
        <span className="inline-flex items-center gap-1 font-medium text-legend">
          <span className="text-legend">✓</span>
          EXPIRED
        </span>
        <Dot />
        <MetaBadge
          className="bg-amber-100 text-amber-900"
          icon={<RocketIcon className="size-3" />}
          label="Pioneer"
        />
        <Dot />
        <MetaBadge
          className="bg-purple-100 text-purple-900"
          icon={<GemIcon className="size-3" />}
          label="Diamond"
        />
        <Dot />
        <span className="inline-flex select-none items-center gap-1">
          <StarIcon className="size-3 fill-yellow-500 text-yellow-500" />
          5.0
        </span>
        <Dot />
        <span>20 years</span>
        <Dot />
        <span className="inline-flex h-6 items-center rounded bg-[#f1f5f9] px-1.5 text-[#022582]">
          Exporter
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[#6b7280] text-sm">Featured products</p>
          <a
            href="#booths"
            className="inline-flex items-center gap-1 font-medium text-legend text-xs"
          >
            View More
            <ArrowRightIcon className="size-3.5" />
          </a>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-3">
          {productImages.map((item) => (
            <button
              type="button"
              key={`${exhibitor.id}-${item.image}`}
              className="relative aspect-square overflow-hidden rounded-2xl border border-muted transition hover:border-legend"
              onClick={() => setSelectedProduct(item)}
              aria-label={`View product details: ${item.label}`}
            >
              <Image
                src={item.image}
                alt={item.label}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      <ExhibitorCardActions
        exhibitorId={exhibitor.id}
        exhibitorCompany={exhibitor.company}
        isAuthenticated={isAuthenticated}
        initialIsWishlisted={exhibitor.isWishlisted}
        onChatClick={() => onChatClick?.(null)}
      />

      <ExhibitorProductDetailDialog
        exhibitorCompany={exhibitor.company}
        products={productImages}
        selectedProduct={selectedProduct}
        onSelectedProductChange={setSelectedProduct}
        isAuthenticated={isAuthenticated}
        onChatNow={(product) => {
          onChatClick?.(product)
        }}
      />
    </Card>
  )
}
