import { BoothSteps } from "@/components/landing/tx/booth-steps"
import type { HomeExpoCard } from "@/components/landing/tx/data"
import { Ecosystem } from "@/components/landing/tx/ecosystem"
import { Exhibitions } from "@/components/landing/tx/exhibitions"
import { Faqs } from "@/components/landing/tx/faqs"
import { Hero, type HeroExpoItem } from "@/components/landing/tx/hero"
import { Introduction } from "@/components/landing/tx/introduction"
import { Partners } from "@/components/landing/tx/partners"
import { Pricing } from "@/components/landing/tx/pricing"
import { Sponsors } from "@/components/landing/tx/sponsors"
import { TxFooter } from "@/components/landing/tx-footer"
import { TxHeader } from "@/components/landing/tx-header"
import { getCurrentSessionUserId } from "@/lib/auth/session"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  listExpoCardStats,
  listExpoCategories,
  listExpos
} from "@/lib/tradexpo/db/platform-data"
import type { Expo } from "@/lib/tradexpo/types"
import { listWishlistedTargetIds } from "@/lib/wishlist/db"

export const dynamic = "force-dynamic"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
})

function formatDateRange(expo: Expo) {
  return `${dateFormatter.format(new Date(expo.startDate ?? ""))} - ${dateFormatter.format(new Date(expo.endDate ?? ""))}`
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)
}

function formatDaysUntil(date: string) {
  const days = Math.max(
    0,
    Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000)
  )
  if (days === 0) return "Today"
  if (days === 1) return "1 day"
  return `${days} days`
}

function toCardStatus(expo: Expo): HomeExpoCard["status"] {
  if (expo.status === "Live") return "Live"
  if (expo.status === "Archived") return "Archived"
  return "Upcoming"
}

function getDetailHref(expo: Expo) {
  return `/tradexpo/expos/${expo.slug ?? expo.id}`
}

export default async function TradeXpoPage() {
  await ensurePlatformSchema()

  const userId = await getCurrentSessionUserId()
  const [expos, categories, cardStats, wishlistedExpoIds] = await Promise.all([
    listExpos({ limit: 12 }),
    listExpoCategories(),
    listExpoCardStats(),
    userId ? listWishlistedTargetIds(userId, "expo") : new Set<string>()
  ])

  const visibleExpos = expos.filter(
    (expo) => expo.status !== "Draft" && expo.status !== "Canceled"
  )
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name])
  )
  const statsByExpoId = new Map(cardStats.map((stats) => [stats.expoId, stats]))

  const heroExpos: HeroExpoItem[] = visibleExpos.slice(0, 5).map((expo) => ({
    title: expo.name,
    dateLabel: formatDateRange(expo),
    slug: expo.slug ?? expo.id,
    detailHref: getDetailHref(expo),
    backgroundImage: expo.thumbnailUrl
  }))

  const expoCards: HomeExpoCard[] = visibleExpos.map((expo) => {
    const stats = statsByExpoId.get(expo.id)
    const status = toCardStatus(expo)
    const segment =
      expo.categoryIds
        .map((categoryId) => categoryNameById.get(categoryId))
        .filter(Boolean)
        .join(", ") || "Multi-industry trade show"

    return {
      id: expo.id,
      title: expo.name,
      image: expo.thumbnailUrl,
      status,
      tags: status === "Live" ? ["Live now", "Hot pick"] : [status],
      stats: [
        formatCount(stats?.exhibitors ?? 0),
        formatCount(stats?.visitors ?? 0),
        formatCount(stats?.products ?? 0)
      ],
      action: "View Detail",
      href: getDetailHref(expo),
      detailHref: getDetailHref(expo),
      durationLabel: formatDateRange(expo),
      countdown:
        status === "Archived" ? "Ended" : formatDaysUntil(expo.endDate ?? ""),
      segment,
      isWishlisted: wishlistedExpoIds.has(expo.id)
    }
  })

  return (
    <main className="min-h-screen bg-white text-foreground [font-family:var(--font-tight)]">
      <TxHeader />
      <Hero expos={heroExpos} />
      <Introduction />
      <Exhibitions
        categories={[
          "All Categories",
          ...categories.map((category) => category.name)
        ]}
        expos={expoCards}
        isAuthenticated={!!userId}
      />
      <Ecosystem />
      <BoothSteps />
      <Pricing />
      <Sponsors />
      <Partners />
      <Faqs />
      <TxFooter />
    </main>
  )
}
