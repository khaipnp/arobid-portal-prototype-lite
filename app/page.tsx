import { BoothSteps } from "@/components/landing/tx/booth-steps"
import type { HomeExpoCard } from "@/components/landing/tx/data"
import { Ecosystem } from "@/components/landing/tx/ecosystem"
import { Exhibitions } from "@/components/landing/tx/exhibitions"
import { Faqs } from "@/components/landing/tx/faqs"
import { Hero } from "@/components/landing/tx/hero"
import { Introduction } from "@/components/landing/tx/introduction"
import { Partners } from "@/components/landing/tx/partners"
import { Pricing } from "@/components/landing/tx/pricing"
import { Sponsors } from "@/components/landing/tx/sponsors"
import { TxFooter } from "@/components/landing/tx-footer"
import { TxHeader } from "@/components/landing/tx-header"
import { getCurrentSessionUserId } from "@/lib/auth/session"
import {
  listExpoCardStats,
  listExpoCategories,
  listExpos
} from "@/lib/tradexpo/db/platform-data"
import { listWishlistedTargetIds } from "@/lib/wishlist/db"

function toHomeExpoStatus(status: string): HomeExpoCard["status"] {
  if (status === "Live") return "Live"
  if (status === "Archived" || status === "Canceled") {
    return "Archived"
  }
  return "Upcoming"
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const fmt = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
  return `${fmt.format(start).toUpperCase()} - ${fmt.format(end).toUpperCase()}`
}

function slugifyExpoName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getHomeStatusRank(status: HomeExpoCard["status"]) {
  if (status === "Live") return 0
  if (status === "Upcoming") return 1
  return 2
}

function getHomeTimeRank(startDate: string, endDate: string) {
  const now = Date.now()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (start <= now && now <= end) return 0
  if (start > now) return 1
  return 2
}

function buildHomeExpoCards(
  expos: Awaited<ReturnType<typeof listExpos>>,
  categoryNameById: Map<string, string>,
  statByExpoId: Map<
    string,
    Awaited<ReturnType<typeof listExpoCardStats>>[number]
  >,
  wishlistedExpoIds: Set<string>
): HomeExpoCard[] {
  const sortedExpos = [...expos].sort((a, b) => {
    const statusRankDiff =
      getHomeStatusRank(toHomeExpoStatus(a.status)) -
      getHomeStatusRank(toHomeExpoStatus(b.status))
    if (statusRankDiff !== 0) return statusRankDiff

    const timeRankDiff =
      getHomeTimeRank(a.startDate, a.endDate) -
      getHomeTimeRank(b.startDate, b.endDate)
    if (timeRankDiff !== 0) return timeRankDiff

    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })

  return sortedExpos.slice(0, 9).map((expo) => {
    const stat = statByExpoId.get(expo.id)
    const status = toHomeExpoStatus(expo.status)
    const isLive = status === "Live"
    const tags = isLive
      ? ["Hot pick"]
      : status === "Upcoming"
        ? ["Featured"]
        : []
    const segment = expo.categoryIds
      .slice(0, 3)
      .map((id) => categoryNameById.get(id))
      .filter(Boolean)
      .join(" • ")
    const detailSlug = expo.slug || slugifyExpoName(expo.name)
    const detailHref = `/expos/${detailSlug}`
    const href = status === "Upcoming" ? "/seller" : detailHref
    return {
      id: expo.id,
      title: expo.name,
      image: expo.thumbnailUrl || null,
      status,
      tags,
      stats: [
        String(stat?.exhibitors ?? 0),
        String(stat?.visitors ?? 0),
        String(stat?.products ?? 0)
      ],
      action: isLive ? "Virtual Lobby" : "Join as Exhibitor",
      disabled: status === "Archived",
      href,
      detailHref,
      durationLabel: formatDateRange(expo.startDate, expo.endDate),
      countdown: status === "Archived" ? "Ended" : "TBA",
      segment: segment || "General",
      isWishlisted: wishlistedExpoIds.has(expo.id)
    }
  })
}

export default async function Page() {
  const [expoRows, categoryRows, stats, userId] = await Promise.all([
    listExpos(),
    listExpoCategories(),
    listExpoCardStats(),
    getCurrentSessionUserId()
  ])
  const wishlistedExpoIds = userId
    ? await listWishlistedTargetIds(userId, "expo")
    : new Set<string>()
  const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]))
  const statByExpoId = new Map(stats.map((item) => [item.expoId, item]))
  const expoCards = buildHomeExpoCards(
    expoRows,
    categoryNameById,
    statByExpoId,
    wishlistedExpoIds
  )
  const categories = ["All Events", ...categoryRows.map((c) => c.name)]

  const heroExpos = expoCards.map((card) => ({
    title: card.title,
    dateLabel: card.durationLabel,
    slug: card.detailHref.split("/").pop() || "",
    detailHref: card.detailHref,
    backgroundImage: card.image || undefined
  }))

  return (
    <main className="min-h-screen bg-white text-[#030712] [font-family:var(--font-tight)]">
      <TxHeader />
      <Hero expos={heroExpos} />
      <Exhibitions
        categories={categories}
        expos={expoCards}
        isAuthenticated={!!userId}
      />
      <Introduction />
      <Pricing />
      <BoothSteps />
      <Ecosystem />
      <Partners />
      <Sponsors />
      <Faqs />
      <TxFooter />
    </main>
  )
}
