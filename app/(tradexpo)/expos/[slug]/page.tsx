import { notFound } from "next/navigation"
import { TxFooter } from "@/components/landing/tx-footer"
import { TxHeader } from "@/components/landing/tx-header"
import { BroadcastBFM } from "@/components/tradexpo/expo-detail/broadcast-bfm"
import { ExhibitorsSection } from "@/components/tradexpo/expo-detail/exhibitors-section"
import { ProductsSection } from "@/components/tradexpo/expo-detail/products-section"
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
  countExpoDetailProducts,
  getExpoBySlug,
  getExpoHeroStatsByExpo,
  getPublishedExpoMarketingContent,
  listExpoCategoriesByIds,
  listExpoDetailExhibitorsByName,
  listExpoDetailProducts
} from "@/lib/tradexpo/db/platform-data"
import { getExpoMarketingContentForRender } from "@/lib/tradexpo/expo-marketing-content"
import { listWishlistedTargetIds } from "@/lib/wishlist/db"

const VIRTUAL_LOBBY_URL_BY_EXPO_SLUG: Record<string, string> = {
  "food-farm-global-fair":
    "https://arobidglobal.shapespark.com/foodexpo2025_lobby/",
  "vifmw-2026": "https://arobidglobal.shapespark.com/foodexpo2025_lobby/"
}

const PRODUCT_FEATURE_MIN_PRODUCTS = 20
const PRODUCT_FEATURE_PAGE_SIZE = 24

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
  const [
    exhibitors,
    heroStats,
    wishlistedExpoIds,
    productCount,
    publishedMarketing,
    expoCategories
  ] = await Promise.all([
    listExpoDetailExhibitorsByName(expo.name, { userId }),
    getExpoHeroStatsByExpo({ id: expo.id, name: expo.name }),
    userId ? listWishlistedTargetIds(userId, "expo") : new Set<string>(),
    countExpoDetailProducts(expo.id),
    getPublishedExpoMarketingContent(expo.id),
    listExpoCategoriesByIds(expo.categoryIds)
  ])
  const marketingContent = getExpoMarketingContentForRender(
    publishedMarketing?.content
  )
  const initialProducts =
    productCount >= PRODUCT_FEATURE_MIN_PRODUCTS
      ? await listExpoDetailProducts(expo.id, {
          userId,
          limit: PRODUCT_FEATURE_PAGE_SIZE,
          offset: 0
        })
      : []
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
        startDateLabel={toLongDate(expo.startDate ?? "")}
        endDateLabel={toLongDate(expo.endDate ?? "")}
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
      {productCount >= PRODUCT_FEATURE_MIN_PRODUCTS ? (
        <ProductsSection
          expoId={expo.id}
          initialProducts={initialProducts}
          totalProducts={productCount}
          isAuthenticated={!!userId}
        />
      ) : null}
      <Audience content={marketingContent.whoShouldJoin} />
      <Categories categories={expoCategories} />
      <ParticipantValues content={marketingContent.audienceBenefits} />
      <BoothTier slug={slug} isAuthenticated={!!userId} />
      <BroadcastBFM items={bfmBroadcastItems} />
      <TxFooter />
    </main>
  )
}
