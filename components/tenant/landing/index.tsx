import type { CSSProperties } from "react"
import {
  initialBranding,
  initialRelations,
  initialSectionMedia,
  initialSections
} from "@/components/partner/site-preview/constants"
import { BannerSection as MiniSiteBannerSection } from "@/components/partner/site-preview/sections/banner-section"
import { BfmSection as MiniSiteBfmSection } from "@/components/partner/site-preview/sections/bfm-section"
import { CategoriesSection as MiniSiteCategoriesSection } from "@/components/partner/site-preview/sections/categories-section"
import { CommunitySection as MiniSiteCommunitySection } from "@/components/partner/site-preview/sections/community-section"
import { CtaSection as MiniSiteCtaSection } from "@/components/partner/site-preview/sections/cta-section"
import { DealsSection as MiniSiteDealsSection } from "@/components/partner/site-preview/sections/deals-section"
import { ExpoCarouselSection as MiniSiteExpoCarouselSection } from "@/components/partner/site-preview/sections/expo-carousel-section"
import { FeatureCardsSection as MiniSiteFeatureCardsSection } from "@/components/partner/site-preview/sections/feature-cards-section"
import { FooterSection as MiniSiteFooterSection } from "@/components/partner/site-preview/sections/footer-section"
import { HeaderSection as MiniSiteHeaderSection } from "@/components/partner/site-preview/sections/header-section"
import { PartnersSection as MiniSitePartnersSection } from "@/components/partner/site-preview/sections/partners-section"
import { ProductsSection as MiniSiteProductsSection } from "@/components/partner/site-preview/sections/products-section"
import { PromoSection as MiniSitePromoSection } from "@/components/partner/site-preview/sections/promo-section"
import { SuppliersSection as MiniSiteSuppliersSection } from "@/components/partner/site-preview/sections/suppliers-section"
import type {
  EnabledSiteSections,
  SiteBranding,
  SiteMediaKey,
  SiteSectionKey,
  SiteSectionMedia,
  TenantRelation,
  TenantRelationType
} from "@/components/partner/site-preview/types"
import { CategorySection } from "./categories"
import { CommunitySection } from "./community"
import { CtaSection } from "./cta"
import { ExpoBanner } from "./expo-banner"
import { TenantFooter } from "./footer"
import { TenantHeader } from "./header"
import { TenantHero } from "./hero"
import { BuyerMatchSection } from "./match-section"
import { PartnersSection } from "./partners"
import { ProductSection } from "./product-section"
import { ServiceTiles } from "./service-tiles"
import { FeaturedSuppliers, RecommendedSuppliers } from "./suppliers"
import { VoucherSection } from "./voucher-section"
import { WhyJoinSection } from "./why-join"

type TenantLandingPageProps = {
  miniSiteContent?: Record<string, unknown> | null
}

type NormalizedMiniSite = {
  branding: SiteBranding
  sections: EnabledSiteSections
  sectionMedia: SiteSectionMedia
  relations: TenantRelation[]
}

const hexColorPattern = /^#[0-9a-fA-F]{6}$/
const ctaOptions = new Set<SiteBranding["ctaOption"]>([
  "contact_tenant",
  "view_member_companies",
  "view_assigned_expos",
  "contact_arobid"
])
const relationTypes = new Set<TenantRelationType>(["partner", "sponsor"])
const sectionMediaKeys = Object.keys(initialSectionMedia) as SiteMediaKey[]

export function TenantLandingPage({
  miniSiteContent
}: TenantLandingPageProps = {}) {
  const miniSite = normalizeMiniSiteContent(miniSiteContent)

  if (miniSite) {
    return <PublishedMiniSiteLandingPage {...miniSite} />
  }

  return (
    <main className="min-h-screen bg-white text-[#030712] [font-family:var(--font-tight)]">
      <TenantHeader />
      <TenantHero />
      <CommunitySection />
      <CategorySection />
      <BuyerMatchSection />
      <FeaturedSuppliers />
      <VoucherSection />
      <ProductSection title="Hot Products" withTabs secondary />
      <ExpoBanner />
      <ProductSection title="New Products" />
      <RecommendedSuppliers />
      <WhyJoinSection />
      <ServiceTiles />
      <PartnersSection />
      <CtaSection />
      <TenantFooter />
    </main>
  )
}

function PublishedMiniSiteLandingPage({
  branding,
  relations,
  sectionMedia,
  sections
}: NormalizedMiniSite) {
  return (
    <main
      className="min-h-screen bg-white text-[#030712] [font-family:var(--font-tight)]"
      style={
        {
          "--site-primary": branding.primaryColor,
          "--site-accent": branding.accentColor
        } as CSSProperties
      }
    >
      <MiniSiteHeaderSection branding={branding} />
      <MiniSiteBannerSection branding={branding} media={sectionMedia.banner} />
      {sections.community ? (
        <MiniSiteCommunitySection media={sectionMedia.community} />
      ) : null}
      {sections.categories ? (
        <MiniSiteCategoriesSection media={sectionMedia.categories} />
      ) : null}
      <MiniSiteBfmSection media={sectionMedia.bfm} />
      {sections.featuredSuppliers ? (
        <MiniSiteSuppliersSection
          title="Featured Suppliers"
          media={sectionMedia.featuredSuppliers}
        />
      ) : null}
      {sections.deals ? (
        <MiniSiteDealsSection media={sectionMedia.deals} />
      ) : null}
      {sections.hotProducts ? (
        <MiniSiteProductsSection
          title="Hot Products"
          media={sectionMedia.hotProducts}
        />
      ) : null}
      {sections.expoCarousel ? (
        <MiniSiteExpoCarouselSection media={sectionMedia.expoCarousel} />
      ) : null}
      {sections.newProducts ? (
        <MiniSiteProductsSection
          title="New Products"
          media={sectionMedia.newProducts}
        />
      ) : null}
      {sections.recommendedSuppliers ? (
        <MiniSiteSuppliersSection
          title="Recommended Suppliers"
          media={sectionMedia.recommendedSuppliers}
        />
      ) : null}
      {sections.promo ? (
        <MiniSitePromoSection media={sectionMedia.promo} />
      ) : null}
      {sections.featureCards ? (
        <MiniSiteFeatureCardsSection media={sectionMedia.featureCards} />
      ) : null}
      {sections.partners ? (
        <MiniSitePartnersSection relations={relations} />
      ) : null}
      {sections.cta ? (
        <MiniSiteCtaSection branding={branding} media={sectionMedia.cta} />
      ) : null}
      <MiniSiteFooterSection branding={branding} />
    </main>
  )
}

function normalizeMiniSiteContent(
  content: Record<string, unknown> | null | undefined
): NormalizedMiniSite | null {
  if (!content) return null

  return {
    branding: normalizeBranding(content.branding),
    sections: normalizeSections(content.sections),
    sectionMedia: normalizeSectionMedia(content.sectionMedia),
    relations: normalizeRelations(content.relations)
  }
}

function normalizeBranding(value: unknown): SiteBranding {
  const record = isRecord(value) ? value : {}
  const ctaOption = record.ctaOption

  return {
    tenantName: readString(record, "tenantName", initialBranding.tenantName),
    tagline: readString(record, "tagline", initialBranding.tagline),
    logoUrl: readString(record, "logoUrl", initialBranding.logoUrl, true),
    bannerUrl: readString(record, "bannerUrl", initialBranding.bannerUrl, true),
    primaryColor: readHexColor(
      record,
      "primaryColor",
      initialBranding.primaryColor
    ),
    accentColor: readHexColor(
      record,
      "accentColor",
      initialBranding.accentColor
    ),
    ctaOption:
      typeof ctaOption === "string" &&
      ctaOptions.has(ctaOption as SiteBranding["ctaOption"])
        ? (ctaOption as SiteBranding["ctaOption"])
        : initialBranding.ctaOption,
    publicEmail: readString(record, "publicEmail", initialBranding.publicEmail),
    publicPhone: readString(record, "publicPhone", initialBranding.publicPhone),
    publicAddress: readString(
      record,
      "publicAddress",
      initialBranding.publicAddress
    ),
    publicWebsite: readString(
      record,
      "publicWebsite",
      initialBranding.publicWebsite
    ),
    serviceBundleText: readString(
      record,
      "serviceBundleText",
      initialBranding.serviceBundleText
    )
  }
}

function normalizeSections(value: unknown): EnabledSiteSections {
  const record = isRecord(value) ? value : {}
  const sections: EnabledSiteSections = { ...initialSections }

  for (const key of Object.keys(initialSections) as SiteSectionKey[]) {
    if (typeof record[key] === "boolean") {
      sections[key] = record[key]
    }
  }

  return sections
}

function normalizeSectionMedia(value: unknown): SiteSectionMedia {
  const record = isRecord(value) ? value : {}
  const sectionMedia: SiteSectionMedia = { ...initialSectionMedia }

  for (const key of sectionMediaKeys) {
    const mediaValue = record[key]
    const slotCount = initialSectionMedia[key].length

    sectionMedia[key] = Array.from({ length: slotCount }, (_, index) => {
      if (!Array.isArray(mediaValue)) return ""
      const slotValue = mediaValue[index]
      return typeof slotValue === "string" ? slotValue : ""
    })
  }

  return sectionMedia
}

function normalizeRelations(value: unknown): TenantRelation[] {
  if (!Array.isArray(value)) return initialRelations

  return value.flatMap((relation, index) => {
    if (!isRecord(relation)) return []

    const name = readString(relation, "name", "")
    if (!name) return []

    const type = relation.type

    return [
      {
        id: readString(relation, "id", `relation-${index}`),
        name,
        type:
          typeof type === "string" &&
          relationTypes.has(type as TenantRelationType)
            ? (type as TenantRelationType)
            : "partner",
        tier: readString(relation, "tier", "Strategic Partner"),
        logoUrl: readString(relation, "logoUrl", "", true),
        websiteUrl: readString(relation, "websiteUrl", "", true),
        active: typeof relation.active === "boolean" ? relation.active : true
      }
    ]
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(
  record: Record<string, unknown>,
  key: string,
  fallback: string,
  allowEmpty = false
) {
  const value = record[key]
  if (typeof value !== "string") return fallback
  if (!allowEmpty && !value.trim()) return fallback
  return value
}

function readHexColor(
  record: Record<string, unknown>,
  key: string,
  fallback: string
) {
  const value = record[key]
  return typeof value === "string" && hexColorPattern.test(value)
    ? value
    : fallback
}
