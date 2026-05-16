import type { CSSProperties } from "react"
import { alwaysVisibleSections } from "./constants"
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
import type { EnabledSiteSections, SiteBranding, TenantRelation } from "./types"

const visibleCoreSections = new Set(alwaysVisibleSections)

export function SiteLivePreview({
  branding,
  relations,
  sections
}: {
  branding: SiteBranding
  relations: TenantRelation[]
  sections: EnabledSiteSections
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={
        {
          "--site-primary": branding.primaryColor,
          "--site-accent": branding.accentColor
        } as CSSProperties
      }
    >
      <div className="max-h-[760px] overflow-y-auto bg-white">
        {visibleCoreSections.has("header") ? (
          <HeaderSection branding={branding} />
        ) : null}
        {visibleCoreSections.has("banner") ? (
          <BannerSection branding={branding} />
        ) : null}
        {sections.community ? <CommunitySection /> : null}
        {sections.categories ? <CategoriesSection /> : null}
        {visibleCoreSections.has("bfm") ? <BfmSection /> : null}
        {sections.featuredSuppliers ? (
          <SuppliersSection title="Featured Suppliers" />
        ) : null}
        {sections.deals ? <DealsSection /> : null}
        {sections.hotProducts ? <ProductsSection title="Hot Products" /> : null}
        {sections.expoCarousel ? <ExpoCarouselSection /> : null}
        {sections.newProducts ? <ProductsSection title="New Products" /> : null}
        {sections.recommendedSuppliers ? (
          <SuppliersSection title="Recommended Suppliers" />
        ) : null}
        {sections.promo ? <PromoSection /> : null}
        {sections.featureCards ? <FeatureCardsSection /> : null}
        {sections.partners ? <PartnersSection relations={relations} /> : null}
        {sections.cta ? <CtaSection branding={branding} /> : null}
        {visibleCoreSections.has("footer") ? (
          <FooterSection branding={branding} />
        ) : null}
      </div>
    </div>
  )
}
