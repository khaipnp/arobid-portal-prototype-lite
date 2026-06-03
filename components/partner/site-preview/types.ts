export type CtaOption =
  | "contact_tenant"
  | "view_member_companies"
  | "view_assigned_expos"
  | "contact_arobid"

export type SiteBranding = {
  tenantName: string
  tagline: string
  logoUrl: string
  bannerUrl: string
  primaryColor: string
  accentColor: string
  ctaOption: CtaOption
  publicEmail: string
  publicPhone: string
  publicAddress: string
  publicWebsite: string
  serviceBundleText: string
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

export type SiteMediaKey =
  | "banner"
  | "community"
  | "categories"
  | "bfm"
  | "featuredSuppliers"
  | "deals"
  | "hotProducts"
  | "expoCarousel"
  | "newProducts"
  | "recommendedSuppliers"
  | "promo"
  | "featureCards"
  | "cta"

export type EnabledSiteSections = Record<SiteSectionKey, boolean>
export type SiteSectionMedia = Record<SiteMediaKey, string[]>

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

export type MediaSlotOption = {
  key: SiteMediaKey
  title: string
  description: string
  slots: string[]
}
