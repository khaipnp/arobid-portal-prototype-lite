import {
  ArrowRightIcon,
  GemIcon,
  HeartIcon,
  RocketIcon,
  StarIcon
} from "lucide-react"
import Image from "next/image"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
  onChatClick?: () => void
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

export function ExhibitorCard({ exhibitor, onChatClick }: ExhibitorCardProps) {
  const productImages = productFallbackImages.map((image, index) => ({
    image,
    label: exhibitor.products[index] ?? `Featured product ${index + 1}`
  }))

  return (
    <Card className="rounded-xl border-0 bg-white px-5 py-4 shadow-none">
      <div className="flex h-12 items-center gap-3">
        <Image
          src={exhibitor.avatarUrl ?? asset("figma-company-logo.png")}
          alt={exhibitor.company}
          width={50}
          height={50}
          className="size-12 rounded-full object-cover"
        />
        <h3 className="min-w-0 flex-1 select-none font-semibold text-foreground text-sm">
          {exhibitor.company}
        </h3>
        <HeartIcon
          className="size-7 fill-muted text-muted"
          onClick={() => toast("You added the exhibitor to your favorites!")}
        />
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
          className="bg-[#ffefe6] text-[#663014]"
          icon={<RocketIcon className="size-3" />}
          label="Pioneer"
        />
        <Dot />
        <MetaBadge
          className="bg-[#e9e7ff] text-[#2c0f79]"
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
            <div
              key={`${exhibitor.id}-${item.image}`}
              className="relative aspect-square overflow-hidden rounded border border-[#e5e7eb]"
            >
              <Image
                src={item.image}
                alt={item.label}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          className="rounded-full"
          onClick={onChatClick}
        >
          Chat Now
        </Button>
        <Button
          type="button"
          className="rounded-full bg-legend text-white hover:bg-legend-600"
        >
          Send RFQ
        </Button>
      </div>
    </Card>
  )
}
