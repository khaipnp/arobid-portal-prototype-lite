import type { CSSProperties } from "react"
import { alwaysVisibleSections } from "./constants"
import { BannerAdsSection } from "./sections/banner-ads-section"
import { BannerSection } from "./sections/banner-section"
import { BfmSection } from "./sections/bfm-section"
import { CategoriesSection } from "./sections/categories-section"
import { CommunitySection } from "./sections/community-section"
import { CtaSection } from "./sections/cta-section"
import { DealsSection } from "./sections/deals-section"
import { ExpoCarouselSection } from "./sections/expo-carousel-section"
import { FeatureCardsSection } from "./sections/feature-cards-section"
import { FooterSection } from "./sections/footer-section"
import { HeaderSection } from "./sections/header-section"
import { PartnersSection } from "./sections/partners-section"
import { ProductsSection } from "./sections/products-section"
import { PromoSection } from "./sections/promo-section"
import { SuppliersSection } from "./sections/suppliers-section"
import type {
  EnabledSiteSections,
  SiteBranding,
  SiteSectionMedia,
  TenantRelation
} from "./types"

const visibleCoreSections = new Set(alwaysVisibleSections)

export function SiteLivePreview({
  branding,
  relations,
  sectionMedia,
  sections
}: {
  branding: SiteBranding
  relations: TenantRelation[]
  sectionMedia: SiteSectionMedia
  sections: EnabledSiteSections
}) {
  return (
    <div
      className="overflow-hidden rounded-3xl border"
      style={
        {
          "--site-primary": branding.primaryColor,
          "--site-accent": branding.accentColor
        } as CSSProperties
      }
    >
      <div className="max-h-[85dvh] overflow-y-auto">
        {visibleCoreSections.has("header") ? (
          <HeaderSection branding={branding} />
        ) : null}
        {visibleCoreSections.has("banner") ? (
          <BannerSection branding={branding} media={sectionMedia.banner} />
        ) : null}
        {sections.community ? (
          <CommunitySection media={sectionMedia.community} />
        ) : null}
        {sections.categories ? (
          <CategoriesSection media={sectionMedia.categories} />
        ) : null}
        {visibleCoreSections.has("bfm") ? (
          <BfmSection branding={branding} media={sectionMedia.bfm} />
        ) : null}
        {sections.bannerAds1 ? (
          <BannerAdsSection media={sectionMedia.bannerAds1} />
        ) : null}
        {sections.featuredSuppliers ? (
          <SuppliersSection
            title="Featured Suppliers"
            media={sectionMedia.featuredSuppliers}
          />
        ) : null}
        {sections.deals ? <DealsSection media={sectionMedia.deals} /> : null}
        {sections.hotProducts ? (
          <ProductsSection
            title="Hot Products"
            media={sectionMedia.hotProducts}
          />
        ) : null}
        {sections.expoCarousel ? (
          <ExpoCarouselSection
            branding={branding}
            media={sectionMedia.expoCarousel}
          />
        ) : null}
        {sections.bannerAds2 ? (
          <BannerAdsSection media={sectionMedia.bannerAds2} />
        ) : null}
        {sections.newProducts ? (
          <ProductsSection
            title="New Products"
            media={sectionMedia.newProducts}
          />
        ) : null}
        {sections.recommendedSuppliers ? (
          <SuppliersSection
            title="Recommended Suppliers"
            media={sectionMedia.recommendedSuppliers}
          />
        ) : null}
        {sections.promo ? (
          <PromoSection branding={branding} media={sectionMedia.promo} />
        ) : null}
        {sections.featureCards ? (
          <FeatureCardsSection media={sectionMedia.featureCards} />
        ) : null}
        {sections.partners ? <PartnersSection relations={relations} /> : null}
        {sections.cta ? (
          <CtaSection branding={branding} media={sectionMedia.cta} />
        ) : null}
        {visibleCoreSections.has("footer") ? (
          <FooterSection branding={branding} />
        ) : null}
      </div>
    </div>
  )
}
