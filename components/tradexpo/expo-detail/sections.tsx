"use client"

import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BoxIcon,
  CheckIcon,
  ChevronRightIcon,
  GemIcon,
  HeartIcon,
  HomeIcon,
  RadioIcon,
  RocketIcon,
  SendIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import type { BFMBroadcastItem } from "@/components/tradexpo/expo-detail/broadcast-bfm"
import { Button } from "@/components/ui/button"
import { getAssetUrl } from "@/lib/image-utils"
import type { ExpoDetailExhibitor } from "@/lib/tradexpo/db/platform-data"
import type {
  ExpoBenefitCardContent,
  ExpoCategoryDisplay,
  ExpoMarketingContent
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"
import {
  asset,
  audiences,
  BOOTH_TIERS,
  productImages,
  sponsors,
  valueCards
} from "./data"
import { VirtualLobbyDialog } from "./virtual-lobby-dialog"

const BENEFIT_ICON_BY_KEY: Record<
  ExpoBenefitCardContent["icon"],
  typeof BadgeCheckIcon
> = {
  badge: BadgeCheckIcon,
  rocket: RocketIcon,
  gem: GemIcon
}

const BENEFIT_TONE_BY_KEY: Record<ExpoBenefitCardContent["icon"], string> = {
  badge: "bg-[#ecfdf5] text-[#16a34a]",
  rocket: "bg-[#fff7ed] text-[#ed6203]",
  gem: "bg-[#ecfeff] text-[#0ea5e9]"
}

function formatHeroStat(value: number) {
  if (value >= 1000) {
    const compact = new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1
    }).format(value)
    return compact.toUpperCase()
  }
  return new Intl.NumberFormat("en-US").format(value)
}

export function Breadcrumb() {
  return (
    <nav className="container mx-auto flex h-14 items-center gap-1 px-4 text-foreground text-sm md:px-0">
      <Link href="/" className="flex items-center gap-1">
        <HomeIcon className="size-4 text-muted-foreground" />
      </Link>
      <ChevronRightIcon className="size-4 text-muted-foreground" />
      <span className="select-none">Expo Detail</span>
    </nav>
  )
}

export function Hero({
  expoId,
  expoTitle = "Vietnam International Furniture Manufacturing & Wood Expo (VIFMW) #1",
  startDateLabel = "April 15, 2026",
  endDateLabel = "April 17, 2026",
  thumbnailUrl,
  virtualLobbyUrl,
  stats,
  bfmItems,
  exhibitors = [],
  isAuthenticated = false,
  initialIsWishlisted = false
}: {
  expoId: string
  expoTitle?: string
  startDateLabel?: string
  endDateLabel?: string
  thumbnailUrl?: string
  virtualLobbyUrl?: string
  bfmItems?: BFMBroadcastItem[]
  exhibitors?: ExpoDetailExhibitor[]
  isAuthenticated?: boolean
  initialIsWishlisted?: boolean
  stats?: {
    exhibitors: number
    visitors: number
    products: number
    rfqs: number
  }
}) {
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted)
  const [isWishlistPending, setIsWishlistPending] = useState(false)
  const heroStats: Array<[string, string]> = [
    [formatHeroStat(stats?.exhibitors ?? 0), "Exhibitors"],
    [formatHeroStat(stats?.visitors ?? 0), "Visitors"],
    [formatHeroStat(stats?.products ?? 0), "Products"],
    [formatHeroStat(stats?.rfqs ?? 0), "RFQs"]
  ]

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to save expos to your wishlist")
      return
    }

    const nextValue = !isWishlisted
    setIsWishlisted(nextValue)
    setIsWishlistPending(true)
    try {
      const res = await fetch(
        nextValue
          ? "/api/wishlist"
          : `/api/wishlist?targetType=expo&targetId=${encodeURIComponent(expoId)}`,
        {
          method: nextValue ? "POST" : "DELETE",
          headers: nextValue ? { "Content-Type": "application/json" } : {},
          body: nextValue
            ? JSON.stringify({ targetType: "expo", targetId: expoId })
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
          ? "Expo saved to your wishlist"
          : "Expo removed from your wishlist"
      )
    } catch (_err) {
      setIsWishlisted(!nextValue)
      toast.error("Could not update wishlist")
    } finally {
      setIsWishlistPending(false)
    }
  }

  return (
    <section className="bg-linear-to-b from-white via-25% via-[#ffe0d2] to-white pb-0">
      <div className="container relative mx-auto min-h-[60vh] overflow-hidden rounded-4xl">
        <Image
          src={getAssetUrl(thumbnailUrl, expoTitle, 1284, 722)}
          alt=""
          fill
          priority
          sizes="aspect-2/1"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-b from-black/10 to-black/20 backdrop-blur-[2px]" />
        <div className="absolute right-7 bottom-6 hidden w-2xs md:block">
          <div className="z-10 mx-auto flex w-max items-center gap-3 rounded-full bg-[#01175c] py-1.5 pr-5 pl-1.5">
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-green-600 px-3 font-medium text-white text-xs">
              <RadioIcon className="size-3" />
              Live
            </span>
            <span className="text-sm text-white">Event ends in</span>
          </div>
          <div className="-mt-2 rounded-xl border border-[#f3f4f6] bg-white px-6 pt-7 pb-5 shadow-lg">
            <div className="flex items-center justify-between text-center">
              {[
                ["12", "Days"],
                ["03", "Hours"],
                ["24", "Min"],
                ["00", "Sec"]
              ].map(([value, label], index) => (
                <div key={label} className="contents">
                  {index > 0 && <span className="font-medium">:</span>}
                  <div>
                    <p className="font-medium text-2xl leading-8">{value}</p>
                    <p className="text-[#6b7280] text-xs">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="-mt-0.5 grid grid-cols-[1fr_auto_1fr] items-end rounded-xl border border-[#f3f4f6] bg-white px-4 py-3 shadow-lg">
            <div>
              <p className="text-muted-foreground text-xs">Start</p>
              <p className="font-medium text-sm">{startDateLabel}</p>
            </div>
            <span className="grid h-4 w-5 place-items-center rounded-full bg-legend text-white">
              <ArrowRightIcon className="size-3" />
            </span>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">End</p>
              <p className="font-medium text-sm">{endDateLabel}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-7 max-w-3xl text-white md:left-10">
          <h1 className="max-w-2xl font-medium text-3xl tracking-normal md:text-4xl md:leading-11">
            {expoTitle}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <VirtualLobbyDialog
              src={virtualLobbyUrl}
              expoTitle={expoTitle}
              bfmItems={bfmItems}
              exhibitors={exhibitors}
            />
            <Link href="#booths">
              <Button variant="secondary" size="lg">
                Join as Exhibitor
              </Button>
            </Link>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={isWishlistPending}
              aria-pressed={isWishlisted}
              onClick={toggleWishlist}
            >
              <HeartIcon className={cn(isWishlisted && "fill-current")} />
              {isWishlisted ? "Saved" : "Save Expo"}
            </Button>
          </div>
          <div className="mt-9 grid max-w-155 grid-cols-2 gap-y-4 divide-white/20 md:grid-cols-4 md:divide-x">
            {heroStats.map(([value, label]) => (
              <div key={label} className="first:pl-0 md:px-5">
                <p className="font-medium text-3xl">{value}</p>
                <p className="text-muted text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function About({
  title = "VICONS",
  description = "At the 1st Vietnam International Construction & Building Materials Expo, businesses can demonstrate their large-scale production capacity and compliance with rigorous technical standards such as ISO 9001, CE, ASTM, JIS, and green building certifications like LEED and BREEAM. Through interactive 3D/VR models, suppliers can intuitively showcase their full portfolio, ranging from structural steel and raw materials to finishing materials and modern M&E systems."
}: {
  title?: string
  description?: string
}) {
  return (
    <section className="container relative mx-auto grid gap-8 px-4 py-16 md:grid-cols-[1fr_1.1fr] md:px-0">
      <h2 className="font-semibold text-[32px] leading-10">About {title}</h2>
      <div>
        <p className="text-foreground text-sm leading-6">{description}</p>
        <Link
          href="#booths"
          className="mt-4 inline-flex items-center gap-1 font-medium text-legend text-sm"
        >
          View more
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </section>
  )
}

export function Sponsors() {
  return (
    <section id="sponsors" className="container mx-auto px-4 pb-10 md:px-0">
      <div className="border-[#e5e7eb] border-t pt-10 text-center">
        <p className="font-medium text-foreground">
          Get sponsored by companies such as:
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {sponsors.map(([name, image]) => (
            <Image
              key={name}
              src={asset(image)}
              alt={name}
              width={150}
              height={32}
              className="h-7 max-w-37 object-contain"
            />
          ))}
          <span className="font-bold text-2xl">HubSpot</span>
        </div>
      </div>
    </section>
  )
}

export function Audience({
  content
}: {
  content?: ExpoMarketingContent["whoShouldJoin"]
}) {
  const block = content ?? {
    enabled: true,
    sectionTitle: "Who should join?",
    audienceCards: audiences.map((audience, index) => ({
      title: audience.title,
      description: audience.body,
      tags: [...audience.tags],
      displayOrder: index
    }))
  }
  if (!block.enabled || block.audienceCards.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-16 md:px-0">
      <h2 className="text-center font-semibold text-[32px] leading-10">
        {block.sectionTitle}
      </h2>
      {block.sectionSubtitle ? (
        <p className="mx-auto mt-2 max-w-2xl text-center text-foreground">
          {block.sectionSubtitle}
        </p>
      ) : null}
      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {block.audienceCards
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((audience, index) => (
            <article
              key={`${audience.title}-${audience.displayOrder}`}
              className={cn(
                "flex gap-6",
                index % 2 === 0 ? "lg:pt-23.25" : "lg:pt-0"
              )}
            >
              <p className="pt-10 font-medium text-[#9ba5ff] text-[32px] leading-10">
                {String(index + 1).padStart(2, "0")}
              </p>
              <div>
                <h3 className="font-semibold text-xl leading-7">
                  {audience.title}
                </h3>
                <p className="mt-1 text-foreground text-sm leading-5">
                  {audience.description}
                </p>
                {audience.tags.length > 0 ? (
                  <div className="mt-6 flex flex-wrap gap-1">
                    {audience.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#f3f4f6] px-2 py-1 text-foreground text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
      </div>
    </section>
  )
}

export function Categories({
  categories
}: {
  categories: ExpoCategoryDisplay[]
}) {
  if (categories.length === 0) return null

  return (
    <section className="container mx-auto px-4 pb-16 text-center md:px-0">
      <h2 className="font-semibold text-[32px] leading-10">
        Exhibited Categories
      </h2>
      <p className="mt-2 text-foreground">
        Navigating selected categories for this Expo.
      </p>
      <div className="mt-10 grid gap-6 text-left md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category, index) => (
          <div
            key={category.id}
            className="flex h-20 items-center gap-4 rounded-lg border border-[#f3f4f6] bg-white p-2"
          >
            <div className="relative size-16 overflow-hidden rounded">
              <Image
                src={asset(productImages[index % productImages.length])}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <p className="font-medium text-lg">{category.name}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ParticipantValues({
  content
}: {
  content?: ExpoMarketingContent["audienceBenefits"]
}) {
  const block =
    content ??
    ({
      enabled: true,
      sectionTitle: "Giá trị đặc quyền từng đối tượng",
      sectionSubtitle:
        "Specialized digital solutions to maximize trade efficiency and technical connectivity for all participants.",
      benefitCards: valueCards.map((card, index) => ({
        audienceName: card.title,
        icon: index === 1 ? "rocket" : index === 2 ? "gem" : "badge",
        benefitItems: [...card.points],
        isFeatured: index === 1,
        displayOrder: index
      }))
    } satisfies ExpoMarketingContent["audienceBenefits"])
  if (!block.enabled || block.benefitCards.length === 0) return null

  return (
    <section className="bg-[#f9fafb] px-4 py-16 md:px-20">
      <div className="container mx-auto text-center">
        <h2 className="font-semibold text-[32px] leading-10">
          {block.sectionTitle}
        </h2>
        {block.sectionSubtitle ? (
          <p className="mt-2 text-foreground">{block.sectionSubtitle}</p>
        ) : null}
        <div className="mt-10 grid gap-6 text-left lg:grid-cols-3">
          {block.benefitCards
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((card) => {
              const Icon = BENEFIT_ICON_BY_KEY[card.icon]
              const tone = BENEFIT_TONE_BY_KEY[card.icon]
              return (
                <article
                  key={`${card.audienceName}-${card.displayOrder}`}
                  className={cn(
                    "rounded-xl bg-white p-6",
                    card.isFeatured && "ring-2 ring-legend/20"
                  )}
                >
                  <div
                    className={cn(
                      "grid size-14 place-items-center rounded-lg",
                      tone
                    )}
                  >
                    <Icon className="size-7" />
                  </div>
                  <h3 className="mt-4 font-semibold text-xl leading-7">
                    {card.audienceName}
                  </h3>
                  <div className="mt-4 border-[#e5e7eb] border-t pt-4">
                    <ul className="space-y-4">
                      {card.benefitItems.map((point) => (
                        <li
                          key={point}
                          className="flex gap-3 text-sm leading-5"
                        >
                          <CheckIcon className="mt-0.5 size-4 shrink-0 text-[#16a34a]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              )
            })}
        </div>
      </div>
    </section>
  )
}

export function BoothTier({
  slug,
  isAuthenticated
}: {
  slug: string
  isAuthenticated: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTierId, setActiveTierId] = useState<
    (typeof BOOTH_TIERS)[number]["id"]
  >(BOOTH_TIERS[2].id) // Default to Premium
  const activeTier =
    BOOTH_TIERS.find((t) => t.id === activeTierId) || BOOTH_TIERS[2]

  const handleBookNow = () => {
    if (!isAuthenticated) {
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`
      router.push(loginUrl)
      return
    }
    router.push(`/tradexpo/expos/${slug}/booking?tier=${activeTier.id}`)
  }

  return (
    <section id="booths" className="container mx-auto px-4 py-16 md:px-0">
      <h2 className="text-center font-semibold text-[32px] leading-10">
        Type of 3D Booths
      </h2>
      <p className="mt-2 text-center text-foreground">
        Choose a professional exhibition space tailored to your business scale.
      </p>
      <div className="mt-10 grid border-[#e5e7eb] border-b text-center md:grid-cols-3">
        {BOOTH_TIERS.map((tier) => (
          <button
            type="button"
            key={tier.id}
            onClick={() => setActiveTierId(tier.id)}
            className={cn(
              "h-12 font-medium text-sm transition-colors",
              activeTierId === tier.id
                ? "border-legend border-b-2 text-legend"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tier.name}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.06fr]">
        <div className="flex flex-col">
          <h3 className="font-semibold text-2xl leading-8">
            {activeTier.name} Booth
          </h3>
          <p className="mt-2 text-muted-foreground text-sm leading-5">
            {activeTier.description}
          </p>
          <p className="mt-7 font-medium text-2xl leading-8">
            {`$${activeTier.price.toLocaleString()}`}
          </p>
          <div className="mt-5 grid gap-x-6 gap-y-2 md:grid-cols-2">
            {activeTier.features.map(([feature, strong]) => (
              <div key={feature} className="flex items-center gap-3 text-sm">
                <CheckIcon className="size-4 text-green-600" />
                <span className={strong ? "font-semibold" : undefined}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex flex-wrap gap-3 pt-7">
            <Link href="#about">
              <Button variant="secondary">Explore Exhibitions</Button>
            </Link>

            <Button
              variant="default"
              onClick={handleBookNow}
              className="bg-legend hover:bg-legend-600"
            >
              Book Now
            </Button>
          </div>
        </div>
        <div className="relative min-h-90 overflow-hidden rounded-2xl bg-[#f3f4f6]">
          <p className="absolute top-8 left-1/2 -translate-x-1/2 font-semibold text-xl">
            {activeTier.name}
          </p>
          <Image
            src={asset(activeTier.image)}
            alt={`${activeTier.name} 3D booth`}
            width={500}
            height={437}
            loading="eager"
            className="absolute top-14 left-1/2 w-62 -translate-x-1/2 object-contain md:w-75"
          />
          <div className="absolute top-1/2 left-1/2 grid size-18 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[20px] bg-black/60 text-white backdrop-blur-sm">
            <BoxIcon className="size-10" />
          </div>
        </div>
      </div>
      <div className="relative mt-16 min-h-68 overflow-hidden rounded-2xl bg-black">
        <Image
          src={asset("figma-promo.png")}
          alt=""
          fill
          loading="eager"
          sizes="(min-width: 1280px) 1282px, 100vw"
          className="object-cover"
        />
        <div className="relative z-10 max-w-xl px-8 py-10 text-white md:px-14 md:py-14">
          <p className="font-semibold text-[34px] leading-[1.15] md:text-[40px] md:leading-12">
            Your road to big deals starts at the 2026 Expos.
          </p>
          <Link
            href="/rfq"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-legend px-6 font-medium text-sm text-white"
          >
            <SendIcon className="size-4" />
            Make an RFQ
          </Link>
        </div>
      </div>
    </section>
  )
}
