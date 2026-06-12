"use client"

import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BoxesIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Globe2Icon,
  HeartIcon,
  MenuIcon,
  MessageSquareTextIcon,
  PackageSearchIcon,
  SearchIcon,
  SparklesIcon,
  StoreIcon,
  UsersIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

type MarketplacePreviewActionCard = {
  eyebrow: string
  title: string
  copy: string
  button: string
}

export type MarketplacePreviewConfig = {
  header?: {
    logoSrc?: string
    searchPlaceholder?: string
    primaryEntryPoints?: string[]
    secondaryNavigation?: string[]
  }
  hero?: {
    imageSrc?: string
    eyebrow?: string
    headline?: string
    searchPlaceholder?: string
    ctaLabel?: string
  }
  quickCards?: MarketplacePreviewActionCard[]
  industries?: {
    title?: string
  }
  recommendedCategories?: {
    title?: string
    description?: string
  }
  tradeXpo?: {
    title?: string
    description?: string
    action?: string
  }
  bfm?: {
    title?: string
    description?: string
    ctaLabel?: string
    mediaSrc?: string
  }
  rfqHub?: {
    title?: string
    description?: string
    ctaLabel?: string
  }
  productDiscovery?: {
    title?: string
    description?: string
  }
  suppliers?: {
    title?: string
    description?: string
  }
  trustCta?: {
    eyebrow?: string
    title?: string
    description?: string
    features?: string[]
    primaryCta?: string
    secondaryCta?: string
  }
  footer?: {
    description?: string
  }
}

const industries = [
  ["Agriculture", "/marketplace/categories/agriculture.webp"],
  ["Apparel", "/marketplace/categories/apparel.webp"],
  ["School & Office", "/marketplace/categories/office.webp"],
  ["Shoes & Accessories", "/marketplace/categories/shoes.webp"],
  ["Food & Beverage", "/marketplace/categories/food.webp"],
  ["Fashion Accessories", "/marketplace/categories/fashion.webp"],
  ["Beauty", "/marketplace/categories/beauty.webp"],
  ["Chemicals", "/marketplace/categories/chemicals.webp"],
  ["Home & Garden", "/marketplace/categories/home-garden.webp"]
] as const

const recommendationCategories = [
  ["Beauty", "/marketplace/categories/beauty.webp"],
  ["Gifts & Crafts", "/marketplace/categories/gifts.webp"],
  ["Packaging & Printing", "/marketplace/categories/packaging.webp"],
  ["Personal Care", "/marketplace/categories/personal-care.webp"],
  ["Jewelry & Eyewear", "/marketplace/categories/jewelry.webp"],
  ["Home & Garden", "/marketplace/categories/home-garden.webp"],
  ["Testing Equipment", "/marketplace/categories/testing.webp"],
  ["Textile Materials", "/marketplace/categories/textile.webp"]
] as const

const banners = [
  {
    name: "An Phuoc",
    src: "/marketplace/banners/an-phuoc.png"
  },
  {
    name: "Vietcombank",
    src: "/marketplace/banners/vietcombank.png"
  },
  {
    name: "Sun Space",
    src: "/marketplace/banners/sun-space.png"
  },
  {
    name: "An Thai",
    src: "/marketplace/banners/an-thai.png"
  }
] as const

const expoCards = [
  {
    status: "Upcoming",
    accent: "bg-amber-500",
    dates: "May 22 - Jun 30, 2026",
    title: "Vietnam Beauty & Lifestyle Expo",
    category: "Beauty",
    image: "/marketplace/expos/expo-featured.png",
    stats: ["38 Exhibitors", "1.2K Visitors", "94 Products"]
  },
  {
    status: "Live",
    accent: "bg-emerald-500",
    dates: "May 11 - May 31, 2026",
    title: "Industrial Tools & Hardware Show",
    category: "Tools & Hardware",
    image: "/marketplace/expos/expo-tools.png",
    stats: ["62 Exhibitors", "807 Visitors", "136 Products"]
  },
  {
    status: "Live",
    accent: "bg-blue-600",
    dates: "May 14 - Dec 31, 2026",
    title: "Sports Innovation Expo 2026",
    category: "Sports & Entertainment",
    image: "/marketplace/expos/expo-sports.jpg",
    stats: ["24 Exhibitors", "635 Visitors", "70 Products"]
  }
] as const

const products = [
  {
    badge: "#1 Best seller",
    name: "Premium ST25 Organic Rice",
    price: "VND 245,000",
    supplier: "Vebo Foods",
    image: "/marketplace/categories/food.webp"
  },
  {
    badge: "New arrival",
    name: "Precision Industrial Scale",
    price: "Contact supplier",
    supplier: "Hoang Thien",
    image: "/marketplace/categories/testing.webp"
  },
  {
    badge: "Trending +133%",
    name: "Sustainable Gift Packaging",
    price: "From VND 32,000",
    supplier: "Green Pack Vietnam",
    image: "/marketplace/categories/packaging.webp"
  },
  {
    badge: "Arobid's choice",
    name: "Vietnamese Coffee Franchise",
    price: "From VND 160M",
    supplier: "Napoli Coffee",
    image: "/marketplace/categories/gifts.webp"
  }
] as const

const suppliers = [
  {
    name: "Hoang Thien Industrial Equipment",
    initials: "HT",
    country: "Vietnam",
    tags: ["Manufacturer", "Service Provider"],
    image: "/marketplace/suppliers/hoang-thien.jpg"
  },
  {
    name: "Napoli Coffee Corporation",
    initials: "NC",
    country: "Vietnam",
    tags: ["Retailer", "Franchisor"],
    image: "/marketplace/suppliers/napoli.png"
  },
  {
    name: "Thien Thanh Construction",
    initials: "TT",
    country: "Vietnam",
    tags: ["Manufacturer", "Exporter"],
    image: "/marketplace/suppliers/thien-thanh.png"
  },
  {
    name: "VNPT Ho Chi Minh City",
    initials: "VN",
    country: "Vietnam",
    tags: ["Technology", "Service Provider"],
    image: "/marketplace/suppliers/vnpt.png"
  }
] as const

const defaultHeroCards: MarketplacePreviewActionCard[] = [
  {
    eyebrow: "Instant Setup",
    title: "AroAI Onboarding",
    copy: "Attract global partners with a complete business profile.",
    button: "Start Onboarding"
  },
  {
    eyebrow: "Global Network",
    title: "Arobid TradeXpo",
    copy: "Connect with global markets through virtual exhibitions.",
    button: "Enter Expo"
  },
  {
    eyebrow: "Data-Driven",
    title: "Buyer Find & Match",
    copy: "Precision AI matching for verified high-intent leads.",
    button: "Get Matches"
  }
]

function isVideoMedia(src?: string) {
  return Boolean(src?.match(/\.(mp4|webm|ogg|mov)(?:$|[?#])/i))
}

function DynamicMediaPreview({
  src,
  alt,
  className
}: {
  src?: string
  alt: string
  className?: string
}) {
  if (!src) {
    return (
      <img alt={alt} className={className} src="/marketplace/buyer-match.png" />
    )
  }

  if (isVideoMedia(src)) {
    return (
      <video autoPlay className={className} loop muted playsInline src={src} />
    )
  }

  return <img alt={alt} className={className} src={src} />
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: string
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-6">
      <div>
        {eyebrow ? (
          <p className="mb-1 font-semibold text-[#ce631f] text-xs uppercase tracking-[0.2em]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-bold text-2xl text-slate-950 tracking-tight md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-slate-500 text-sm md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <button
          type="button"
          className="hidden items-center gap-1 font-semibold text-[#ce631f] text-sm hover:text-[#a94712] sm:flex"
        >
          {action}
          <ArrowRightIcon className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

export function MarketplaceHome({
  preview
}: {
  preview?: MarketplacePreviewConfig
}) {
  const [bannerIndex, setBannerIndex] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const inlineBanner = banners[(bannerIndex + 1) % banners.length]
  const headerSearchPlaceholder =
    preview?.header?.searchPlaceholder ??
    "Watch for men, industrial parts, solar systems..."
  const heroSearchPlaceholder =
    preview?.hero?.searchPlaceholder ?? headerSearchPlaceholder
  const heroCards = preview?.quickCards?.length
    ? preview.quickCards
    : defaultHeroCards
  const primaryEntryPoints = preview?.header?.primaryEntryPoints?.length
    ? preview.header.primaryEntryPoints
    : ["Become a Supplier", "Request for Quotation", "Sign in / Join now"]
  const secondaryNavigation = preview?.header?.secondaryNavigation?.length
    ? preview.header.secondaryNavigation
    : ["All categories", "TradeXpo", "My Workspace", "Help Center", "EN - USD"]

  function moveBanner(direction: number) {
    setBannerIndex(
      (current) => (current + direction + banners.length) % banners.length
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-950">
      <header className="sticky top-0 z-50 border-slate-200 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-4 lg:px-8">
          <Link href="/marketplace" className="shrink-0">
            <Image
              src={
                preview?.header?.logoSrc ??
                "/marketplace/arobid-marketplace-logo.png"
              }
              alt="Arobid.com"
              width={150}
              height={56}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          <div className="hidden max-w-2xl flex-1 items-center rounded-full border border-[#d88952] bg-white p-1 md:flex">
            <button
              type="button"
              className="flex items-center gap-1 px-4 font-medium text-sm"
            >
              Products <ChevronDownIcon className="size-3.5" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <input
              aria-label="Search marketplace"
              placeholder={headerSearchPlaceholder}
              className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none"
            />
            <button
              type="button"
              aria-label="Search"
              className="grid size-10 place-items-center rounded-full bg-[#d76a24] text-white transition-transform hover:scale-105"
            >
              <SearchIcon className="size-5" />
            </button>
          </div>

          <nav className="ml-auto hidden items-center gap-5 xl:flex">
            {primaryEntryPoints.slice(0, 3).map((item, index) =>
              index === 2 ? (
                <Link
                  href="/login"
                  key={item}
                  className="flex items-center gap-2 text-sm"
                >
                  <UsersIcon className="size-5 text-[#d76a24]" />
                  <span>{item}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  key={item}
                  className="flex items-center gap-2 text-left text-sm"
                >
                  {index === 0 ? (
                    <StoreIcon className="size-5 text-[#d76a24]" />
                  ) : (
                    <MessageSquareTextIcon className="size-5 text-[#d76a24]" />
                  )}
                  <span>{item}</span>
                </button>
              )
            )}
          </nav>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="ml-auto grid size-10 place-items-center rounded-full border border-slate-200 xl:hidden"
          >
            <MenuIcon className="size-5" />
          </button>
        </div>

        <div className="border-slate-100 border-t">
          <div className="mx-auto flex h-12 max-w-[1440px] items-center gap-5 overflow-x-auto px-4 text-sm lg:px-8">
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 font-semibold"
            >
              <BoxesIcon className="size-4 text-[#d76a24]" />
              {secondaryNavigation[0] ?? "All categories"}
              <ChevronDownIcon className="size-3.5" />
            </button>
            <Link
              href="/tradexpo"
              className="shrink-0 font-bold text-lg tracking-tight"
            >
              {secondaryNavigation[1] ?? "TradeXpo"}
            </Link>
            {secondaryNavigation.slice(2).map((item, index) => (
              <span
                className={
                  index === 0
                    ? "ml-auto hidden shrink-0 text-slate-600 md:block"
                    : "hidden shrink-0 text-slate-600 md:block"
                }
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="grid gap-3 border-slate-200 border-t bg-white p-4 text-sm xl:hidden">
            <Link href="/login">Sign in / Join now</Link>
            <button type="button" className="text-left">
              Become a Supplier
            </button>
            <button type="button" className="text-left">
              Request for Quotation
            </button>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative isolate mx-auto min-h-[610px] max-w-[1440px] overflow-hidden bg-slate-900 md:min-h-[650px]">
          <Image
            src={preview?.hero?.imageSrc ?? "/marketplace/hero.webp"}
            alt="AI-powered global trade city"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-slate-950/45" />
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 pt-24 text-center md:pt-32">
            <span className="rounded-full border border-white/70 bg-white/90 px-5 py-2 font-semibold text-[#bd571b] text-xs shadow-lg backdrop-blur">
              {preview?.hero?.eyebrow ?? "AI-Powered Trade Infrastructure"}
            </span>
            <h1 className="mt-6 max-w-4xl font-bold text-3xl tracking-[-0.04em] md:text-5xl">
              {preview?.hero?.headline ?? (
                <>
                  Smart Sourcing with{" "}
                  <span className="text-[#df722d]">Semantic Precision</span>
                </>
              )}
            </h1>
            <div className="mt-8 flex w-full max-w-4xl items-center rounded-2xl bg-white p-2 shadow-[0_22px_55px_rgba(20,42,70,0.22)] md:rounded-full">
              <input
                placeholder={heroSearchPlaceholder}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none md:px-6 md:text-base"
              />
              <button
                type="button"
                className="flex h-12 items-center gap-2 rounded-xl bg-[#d76a24] px-4 font-bold text-sm text-white shadow-lg hover:bg-[#b85217] md:rounded-full md:px-7 md:text-base"
              >
                {preview?.hero?.ctaLabel ?? "AI Deep Search"}
                <SparklesIcon className="size-5" />
              </button>
            </div>
          </div>

          <div className="absolute right-4 bottom-5 left-4 z-20 grid gap-3 md:right-8 md:bottom-7 md:left-8 md:grid-cols-3">
            {heroCards.map((item, index) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-white/70 bg-white/95 p-4 text-left shadow-xl backdrop-blur transition-transform hover:-translate-y-1 md:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fff1e7] text-[#c65a19]">
                    {index === 0 ? (
                      <BriefcaseBusinessIcon className="size-5" />
                    ) : index === 1 ? (
                      <Globe2Icon className="size-5" />
                    ) : (
                      <PackageSearchIcon className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#c65a19] text-xs">
                      {item.eyebrow}
                    </p>
                    <h3 className="mt-0.5 font-bold text-lg">{item.title}</h3>
                    <p className="mt-1 line-clamp-1 text-slate-500 text-xs md:text-sm">
                      {item.copy}
                    </p>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1 font-semibold text-sm"
                    >
                      {item.button}
                      <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1360px] px-4 py-12 lg:px-8">
          <SectionHeading
            title={preview?.industries?.title ?? "Top Industries"}
            action="Explore all categories"
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {industries.map(([name, image]) => (
              <button
                type="button"
                key={name}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[#e9a77b] hover:shadow-lg"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={image}
                    alt={name}
                    fill
                    sizes="(min-width: 1024px) 140px, (min-width: 640px) 20vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <span className="line-clamp-2 min-h-8 font-medium text-xs">
                  {name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1360px] px-4 pb-12 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="relative aspect-[1280/340] min-h-48">
              <Image
                src={banners[bannerIndex].src}
                alt={`${banners[bannerIndex].name} promotional banner`}
                fill
                sizes="(min-width: 1360px) 1296px, 100vw"
                className="object-cover"
              />
            </div>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={() => moveBanner(-1)}
              className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-md hover:bg-white"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={() => moveBanner(1)}
              className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-md hover:bg-white"
            >
              <ChevronRightIcon className="size-5" />
            </button>
            <div className="absolute right-0 bottom-3 left-0 flex justify-center gap-2">
              {banners.map((banner, index) => (
                <button
                  type="button"
                  key={banner.name}
                  aria-label={`Show ${banner.name} banner`}
                  onClick={() => setBannerIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === bannerIndex
                      ? "w-8 bg-[#d76a24]"
                      : "w-2 bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="border-slate-200 border-y bg-white">
          <div className="mx-auto max-w-[1360px] px-4 py-12 lg:px-8">
            <SectionHeading
              eyebrow="Personalized discovery"
              title={
                preview?.recommendedCategories?.title ??
                "Recommended for Your Business"
              }
              description={
                preview?.recommendedCategories?.description ??
                "Explore fast-growing categories selected from active buyer intent."
              }
            />
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recommendationCategories.map(([name, image]) => (
                <button
                  type="button"
                  key={name}
                  className="group w-36 shrink-0 text-left md:w-44"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={image}
                      alt={name}
                      fill
                      sizes="(min-width: 768px) 176px, 144px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span className="absolute right-3 bottom-3 left-3 font-semibold text-sm text-white">
                      {name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1360px] px-4 py-14 lg:px-8">
          <SectionHeading
            eyebrow="Virtual exhibitions"
            title={preview?.tradeXpo?.title ?? "Arobid TradeXpo"}
            description={
              preview?.tradeXpo?.description ??
              "Activate global trade flow through digital exhibition infrastructure."
            }
            action={preview?.tradeXpo?.action ?? "View all events"}
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {expoCards.map((expo) => (
              <article
                key={expo.title}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-52">
                  <Image
                    src={expo.image}
                    alt={expo.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <span
                    className={`absolute top-4 left-4 rounded-full px-3 py-1 font-bold text-white text-xs ${expo.accent}`}
                  >
                    {expo.status}
                  </span>
                </div>
                <div className="p-5">
                  <p className="font-semibold text-[#c65a19] text-xs uppercase tracking-wider">
                    {expo.dates}
                  </p>
                  <h3 className="mt-2 font-bold text-xl">{expo.title}</h3>
                  <p className="mt-1 text-slate-500 text-sm">{expo.category}</p>
                  <div className="mt-5 grid grid-cols-3 gap-2 border-slate-100 border-t pt-4 text-center">
                    {expo.stats.map((stat) => (
                      <span key={stat} className="text-slate-500 text-xs">
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden bg-[#09213a] text-white">
          <div className="mx-auto grid max-w-[1360px] items-center gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="font-semibold text-[#f49a5e] text-xs uppercase tracking-[0.2em]">
                Verified demand meets verified supply
              </p>
              <h2 className="mt-4 max-w-xl font-bold text-3xl tracking-tight md:text-5xl">
                {preview?.bfm?.title ?? "Buyer Find & Match"}
              </h2>
              <p className="mt-5 max-w-xl text-blue-100/75 leading-7">
                {preview?.bfm?.description ??
                  "Instantly connecting standardized supplier data with verified buyer intent for absolute precision in global sourcing."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  "Semantic matching",
                  "Verified profiles",
                  "High-intent leads"
                ].map((feature) => (
                  <span
                    key={feature}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm"
                  >
                    <BadgeCheckIcon className="size-4 text-[#f49a5e]" />
                    {feature}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#dd722d] px-6 font-bold hover:bg-[#c35c19]"
              >
                {preview?.bfm?.ctaLabel ?? "Get Matches Now"}
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
            <div className="mx-auto w-full max-w-xl">
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl">
                <div className="relative aspect-[600/340] overflow-hidden rounded-3xl bg-slate-950/40">
                  <DynamicMediaPreview
                    src={preview?.bfm?.mediaSrc}
                    alt="Global buyer and supplier matching"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1360px] px-4 py-10 lg:px-8">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[1360/260] min-h-[180px] w-full">
              <Image
                src={inlineBanner.src}
                alt={inlineBanner.name}
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-slate-950/20 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex max-w-lg flex-col justify-center px-6 text-white md:px-10">
                <p className="font-semibold text-white/75 text-xs uppercase tracking-[0.2em]">
                  Sponsored placement
                </p>
                <h3 className="mt-3 font-bold text-2xl md:text-3xl">
                  Partner spotlight inventory
                </h3>
                <p className="mt-3 text-sm text-white/80 md:text-base">
                  Rotating banner placement managed through Banner Ads
                  Management.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto px-4 py-14 lg:max-w-[1360px] lg:px-8">
            <div className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-xl">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
                <div className="p-8 md:p-10 lg:p-12">
                  <p className="font-semibold text-[#f49a5e] text-xs uppercase tracking-[0.2em]">
                    RFQ orchestration
                  </p>
                  <h2 className="mt-4 max-w-xl whitespace-pre-line font-bold text-3xl tracking-tight md:text-5xl">
                    {preview?.rfqHub?.title ?? "Turn RFQs into\nDeals with AI"}
                  </h2>
                  <p className="mt-5 max-w-2xl text-slate-300 leading-7">
                    {preview?.rfqHub?.description ??
                      "Converting buyer intent into structured RFQs with intelligent precision and consistency at scale."}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    {[
                      "Intent capture",
                      "Structured RFQ flow",
                      "AI-assisted completion"
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#dd722d] px-6 font-bold text-white hover:bg-[#c35c19]"
                  >
                    {preview?.rfqHub?.ctaLabel ?? "Access to RFQ Hub"}
                    <ArrowRightIcon className="size-4" />
                  </button>
                </div>
                <div className="relative min-h-[320px] overflow-hidden bg-[#101f34] p-8">
                  <div className="absolute top-10 right-10 size-24 rounded-full bg-[#dd722d]/15 blur-2xl" />
                  <div className="absolute bottom-10 left-10 size-24 rounded-full bg-sky-500/15 blur-2xl" />
                  <div className="relative grid gap-4">
                    {[
                      {
                        icon: MessageSquareTextIcon,
                        title: "Buyer requirement captured",
                        copy: "Natural-language requests normalized into structured sourcing requirements."
                      },
                      {
                        icon: SparklesIcon,
                        title: "AI-guided qualification",
                        copy: "Missing attributes, quantities, and compliance fields surfaced before submission."
                      },
                      {
                        icon: BoxesIcon,
                        title: "Supplier-ready RFQ output",
                        copy: "Consistent RFQs routed into supplier and matching workflows with less manual cleanup."
                      }
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                      >
                        <div className="flex items-start gap-4">
                          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10">
                            <item.icon className="size-5 text-[#f49a5e]" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="mt-1 text-slate-300 text-sm">
                              {item.copy}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#ebeef2]">
          <div className="mx-auto max-w-[1360px] px-4 py-14 lg:px-8">
            <SectionHeading
              eyebrow="Strategic support network"
              title={
                preview?.trustCta?.title ??
                "Infrastructure Support for Seamless Digital Trade"
              }
              description={
                preview?.trustCta?.description ??
                "We unite industry leaders in finance, logistics, and law to safeguard your trade flow - from 3D virtual sourcing to secure global delivery."
              }
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  icon: Building2Icon,
                  title: "Financial rails",
                  copy: "Payment, trade finance, and transaction support for cross-border execution."
                },
                {
                  icon: BriefcaseBusinessIcon,
                  title: "Legal coverage",
                  copy: "Structured legal support for trade documents, contracting, and dispute prevention."
                },
                {
                  icon: PackageSearchIcon,
                  title: "Logistics readiness",
                  copy: "Shipment visibility, handling coordination, and delivery assurance across trade flows."
                },
                {
                  icon: Globe2Icon,
                  title: "Digital exhibition layer",
                  copy: "3D sourcing environments and event infrastructure that extend buyer reach globally."
                }
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-3xl border border-white bg-white p-6 shadow-sm"
                >
                  <div className="grid size-12 place-items-center rounded-2xl bg-slate-100">
                    <item.icon className="size-5 text-[#d76a24]" />
                  </div>
                  <h3 className="mt-5 font-bold text-lg text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-slate-600 text-sm leading-6">
                    {item.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1360px] px-4 py-14 lg:px-8">
          <SectionHeading
            eyebrow="Marketplace intelligence"
            title={
              preview?.productDiscovery?.title ?? "Products Gaining Momentum"
            }
            description={
              preview?.productDiscovery?.description ??
              "A compact view of best sellers, new arrivals, trending products and Arobid selections."
            }
            action="Browse products"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.name}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 font-bold text-[#b94e12] text-xs shadow">
                    {product.badge}
                  </span>
                  <button
                    type="button"
                    aria-label={`Favorite ${product.name}`}
                    className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/95 shadow"
                  >
                    <HeartIcon className="size-4" />
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-slate-500 text-xs">{product.supplier}</p>
                  <h3 className="mt-1 line-clamp-2 min-h-12 font-bold">
                    {product.name}
                  </h3>
                  <p className="mt-4 font-bold text-[#c75b19]">
                    {product.price}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#ebeef2]">
          <div className="mx-auto max-w-[1360px] px-4 py-14 lg:px-8">
            <SectionHeading
              eyebrow="Verified business network"
              title={preview?.suppliers?.title ?? "Recommended Suppliers"}
              description={
                preview?.suppliers?.description ??
                "Build stronger sourcing relationships with active, verified Vietnamese businesses."
              }
              action="View supplier directory"
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {suppliers.map((supplier) => (
                <article
                  key={supplier.name}
                  className="rounded-3xl border border-white bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-white">
                      <Image
                        src={supplier.image}
                        alt={supplier.name}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                      <span className="font-bold text-slate-400">
                        {supplier.initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 min-h-10 font-bold text-sm">
                        {supplier.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-slate-500 text-xs">
                        <Globe2Icon className="size-3.5" />
                        {supplier.country}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Favorite ${supplier.name}`}
                      className="ml-auto"
                    >
                      <HeartIcon className="size-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {supplier.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 font-semibold text-sm hover:border-[#d76a24] hover:text-[#c65a19]"
                  >
                    View supplier
                    <ArrowRightIcon className="size-4" />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#071727] text-slate-300">
        <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
          <div className="sm:col-span-2">
            <Image
              src={
                preview?.header?.logoSrc ??
                "/marketplace/arobid-marketplace-logo.png"
              }
              alt="Arobid.com"
              width={160}
              height={60}
              className="h-12 w-auto brightness-0 invert"
            />
            <p className="mt-4 max-w-md text-sm leading-6">
              {preview?.footer?.description ??
                "AI-powered trade infrastructure connecting verified buyers, suppliers and global exhibition opportunities."}
            </p>
          </div>
          {[
            ["Marketplace", "Products", "Suppliers", "RFQ Center"],
            ["TradeXpo", "Upcoming events", "Virtual lobby", "Exhibit"],
            ["Support", "Help Center", "Contact", "Trust & Safety"]
          ].map(([title, ...links]) => (
            <div key={title}>
              <h3 className="font-bold text-white">{title}</h3>
              <div className="mt-4 grid gap-3 text-sm">
                {links.map((link) => (
                  <button
                    type="button"
                    key={link}
                    className="text-left hover:text-white"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-white/10 border-t px-4 py-5 text-center text-xs">
          Arobid Marketplace prototype. Reconstructed from the current Arobid
          development homepage for local product exploration.
        </div>
      </footer>
    </div>
  )
}
