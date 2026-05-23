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

export function TenantLandingPage() {
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
