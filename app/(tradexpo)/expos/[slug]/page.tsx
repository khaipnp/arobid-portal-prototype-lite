import { notFound } from "next/navigation"
import { TxFooter } from "@/components/landing/tx-footer"
import { TxHeader } from "@/components/landing/tx-header"
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
import {
  getExpoBySlug,
  getExpoHeroStatsByExpo,
  listExpoDetailExhibitorsByName
} from "@/lib/tradexpo/db/platform-data"
import { getCurrentSessionUserId } from "@/lib/auth/session"

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
  const expo = await getExpoBySlug(slug)
  if (!expo) notFound()

  const [exhibitors, heroStats] = await Promise.all([
    listExpoDetailExhibitorsByName(expo.name),
    getExpoHeroStatsByExpo({ id: expo.id, name: expo.name })
  ])
  const virtualLobbyUrl = VIRTUAL_LOBBY_URL_BY_EXPO_SLUG[expo.slug ?? slug]
  const userId = await getCurrentSessionUserId()

  return (
    <main className="min-h-screen scroll-smooth bg-white text-foreground [font-family:var(--font-tight)]">
      <TxHeader />
      <Breadcrumb />
      <Hero
        expoTitle={expo.name}
        thumbnailUrl={expo.thumbnailUrl}
        startDateLabel={toLongDate(expo.startDate)}
        endDateLabel={toLongDate(expo.endDate)}
        virtualLobbyUrl={virtualLobbyUrl}
        stats={heroStats}
      />
      <About title={expo.name} description={expo.description} />
      <Sponsors />
      <ExhibitorsSection expoName={expo.name} initialExhibitors={exhibitors} />
      <Audience />
      <Categories />
      <ParticipantValues />
      <BoothTier slug={slug} isAuthenticated={!!userId} />
      <TxFooter />
    </main>
  )
}
