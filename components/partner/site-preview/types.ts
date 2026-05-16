export type SiteBranding = {
  tenantName: string
  tagline: string
  logoUrl: string
  primaryColor: string
  accentColor: string
}

export type AlwaysVisibleSiteSectionKey = "header" | "banner" | "bfm" | "footer"

export type SiteSectionKey =
  | "community"
  | "categories"
  | "featuredSuppliers"
  | "deals"
  | "hotProducts"
  | "expoCarousel"
  | "newProducts"
  | "recommendedSuppliers"
  | "promo"
  | "featureCards"
  | "partners"
  | "cta"

export type EnabledSiteSections = Record<SiteSectionKey, boolean>

export type TenantRelationType = "partner" | "sponsor"

export type TenantRelation = {
  id: string
  name: string
  type: TenantRelationType
  tier: string
  logoUrl: string
  websiteUrl: string
  active: boolean
}

export type RelationForm = Omit<TenantRelation, "id">

export type SectionOption = {
  key: SiteSectionKey
  title: string
  description: string
}
