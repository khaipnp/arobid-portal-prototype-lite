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
import {
  listExpoCardStats,
  listExpoCategories,
  listExpos,
} from "@/lib/tradexpo/db/platform-data"

function toHomeExpoStatus(status: string): HomeExpoCard["status"] {
  if (status === "Live") return "Live"
  if (status === "Ended" || status === "Archived" || status === "Canceled") {
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
    year: "numeric",
  })
  return `${fmt.format(start).toUpperCase()} - ${fmt.format(end).toUpperCase()}`
}

function slugifyExpoName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildHomeExpoCards(
  expos: Awaited<ReturnType<typeof listExpos>>,
  categoryNameById: Map<string, string>,
  statByExpoId: Map<
    string,
    Awaited<ReturnType<typeof listExpoCardStats>>[number]
  >,
): HomeExpoCard[] {
  return expos.slice(0, 9).map((expo) => {
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
      title: expo.name,
      image: expo.thumbnailUrl || null,
      status,
      tags,
      stats: [
        String(stat?.exhibitors ?? 0),
        String(stat?.visitors ?? 0),
        String(stat?.products ?? 0),
      ],
      action: isLive ? "Virtual Lobby" : "Join as Exhibitor",
      disabled: status === "Archived",
      href,
      detailHref,
      durationLabel: formatDateRange(expo.startDate, expo.endDate),
      countdown: status === "Archived" ? "Ended" : "TBA",
      segment: segment || "General",
    }
  })
}

export default async function Page() {
  const [expoRows, categoryRows, stats] = await Promise.all([
    listExpos(),
    listExpoCategories(),
    listExpoCardStats(),
  ])
  const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]))
  const statByExpoId = new Map(stats.map((item) => [item.expoId, item]))
  const expoCards = buildHomeExpoCards(expoRows, categoryNameById, statByExpoId)
  const categories = ["All Events", ...categoryRows.map((c) => c.name)]

  return (
    <main className="min-h-screen bg-white text-[#030712] [font-family:var(--font-tight)]">
      <TxHeader />
      <Hero />
      <Exhibitions categories={categories} expos={expoCards} />
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
