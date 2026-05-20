import { getAuthenticatedUserById } from "$lib/auth/service"
import { getCurrentSessionUserId } from "$lib/auth/session"
import type { HomeExpoCard } from "$lib/components/landing/tx/data"
import {
  listExpoCardStats,
  listExpoCategories,
  listExpos
} from "$lib/tradexpo/db/platform-data"
import { listWishlistedTargetIds } from "$lib/wishlist/db"
import type { PageServerLoad } from "./$types"

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

export const load: PageServerLoad = async (event) => {
  const [expoRows, categoryRows, stats, userId] = await Promise.all([
    listExpos(),
    listExpoCategories(),
    listExpoCardStats(),
    getCurrentSessionUserId(event.cookies)
  ])

  const [user, wishlistedExpoIds] = await Promise.all([
    userId ? getAuthenticatedUserById(userId) : null,
    userId ? listWishlistedTargetIds(userId, "expo") : new Set<string>()
  ])

  const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]))
  const statByExpoId = new Map(stats.map((item) => [item.expoId, item]))

  const sortedExpos = [...expoRows].sort((a, b) => {
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

  const expoCards: HomeExpoCard[] = sortedExpos.slice(0, 9).map((expo) => {
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

  const categories = ["All Events", ...categoryRows.map((c) => c.name)]

  const heroExpos = expoCards.map((card) => ({
    title: card.title,
    dateLabel: card.durationLabel,
    slug: card.detailHref.split("/").pop() || "",
    detailHref: card.detailHref,
    backgroundImage: card.image || undefined
  }))

  return {
    expoCards,
    categories,
    heroExpos,
    isAuthenticated: !!userId,
    user: user
      ? { id: user.id, name: user.name, email: user.email, roles: user.roles }
      : null
  }
}
