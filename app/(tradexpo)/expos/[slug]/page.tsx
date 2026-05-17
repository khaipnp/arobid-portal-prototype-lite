import { notFound } from "next/navigation"
import { TxFooter } from "@/components/landing/tx-footer"
import { TxHeader } from "@/components/landing/tx-header"
import { BroadcastBFM } from "@/components/tradexpo/expo-detail/broadcast-bfm"
import { ExhibitorsSection } from "@/components/tradexpo/expo-detail/exhibitors-section"
import {
  About,
  Audience,
  BoothTier,
  Breadcrumb,
  Categories,
  Hero,
  ParticipantValues,
  Sponsors
} from "@/components/tradexpo/expo-detail/sections"
import { getCurrentSessionUserId } from "@/lib/auth/session"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  getExpoBySlug,
  getExpoHeroStatsByExpo,
  listExpoDetailExhibitorsByName
} from "@/lib/tradexpo/db/platform-data"
import { listWishlistedTargetIds } from "@/lib/wishlist/db"

const VIRTUAL_LOBBY_URL_BY_EXPO_SLUG: Record<string, string> = {
  "food-farm-global-fair":
    "https://arobidglobal.shapespark.com/foodexpo2025_lobby/",
  "vifmw-2026": "https://arobidglobal.shapespark.com/foodexpo2025_lobby/"
}

function toLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date))
}

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await ensurePlatformSchema()
  const expo = await getExpoBySlug(slug)
  if (!expo) notFound()

  const userId = await getCurrentSessionUserId()
  const [exhibitors, heroStats, wishlistedExpoIds] = await Promise.all([
    listExpoDetailExhibitorsByName(expo.name, { userId }),
    getExpoHeroStatsByExpo({ id: expo.id, name: expo.name }),
    userId ? listWishlistedTargetIds(userId, "expo") : new Set<string>()
  ])
  const bfmBroadcastItems = exhibitors
    .filter((exhibitor) => exhibitor.products.length > 0)
    .slice(0, 6)
    .map((exhibitor) => ({
      id: `bfm-${exhibitor.id}`,
      companyName: exhibitor.company,
      productName: exhibitor.products[0]?.name ?? "",
      ctaHref: "/bfm",
      logoUrl: exhibitor.logoUrl
    }))
  const virtualLobbyUrl = VIRTUAL_LOBBY_URL_BY_EXPO_SLUG[expo.slug ?? slug]

  return (
    <main className="min-h-screen scroll-smooth bg-white text-foreground [font-family:var(--font-tight)]">
      <TxHeader />
      <Breadcrumb />
      <Hero
        expoId={expo.id}
        expoTitle={expo.name}
        thumbnailUrl={expo.thumbnailUrl}
        startDateLabel={toLongDate(expo.startDate)}
        endDateLabel={toLongDate(expo.endDate)}
        virtualLobbyUrl={virtualLobbyUrl}
        stats={heroStats}
        bfmItems={bfmBroadcastItems}
        exhibitors={exhibitors}
        isAuthenticated={!!userId}
        initialIsWishlisted={wishlistedExpoIds.has(expo.id)}
      />
      <About title={expo.name} description={expo.description} />
      <Sponsors />
      <ExhibitorsSection
        expoId={expo.id}
        expoName={expo.name}
        initialExhibitors={exhibitors}
        isAuthenticated={!!userId}
      />
      <Audience />
      <Categories />
      <ParticipantValues />
      <BoothTier slug={slug} isAuthenticated={!!userId} />
      <BroadcastBFM items={bfmBroadcastItems} />
      <TxFooter />
    </main>
  )
}
