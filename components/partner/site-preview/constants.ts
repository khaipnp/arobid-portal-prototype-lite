import type {
  EnabledSiteSections,
  SectionOption,
  SiteBranding,
  TenantRelation
} from "./types"

export const initialBranding: SiteBranding = {
  tenantName: "Arobid Trade Partner",
  tagline: "Your trusted gateway to digital trade exhibitions.",
  logoUrl: "",
  primaryColor: "#f97316",
  accentColor: "#2563eb"
}

export const initialSections: EnabledSiteSections = {
  community: true,
  categories: true,
  featuredSuppliers: true,
  deals: true,
  hotProducts: true,
  expoCarousel: true,
  newProducts: true,
  recommendedSuppliers: true,
  promo: true,
  featureCards: true,
  partners: true,
  cta: true
}

export const sectionOptions: SectionOption[] = [
  {
    key: "community",
    title: "Community/value cards",
    description: "Show community metrics and service feature cards."
  },
  {
    key: "categories",
    title: "Browse by Categories",
    description: "Show category discovery shortcuts."
  },
  {
    key: "featuredSuppliers",
    title: "Featured Suppliers",
    description: "Show highlighted supplier cards."
  },
  {
    key: "deals",
    title: "Hot Deal / Brand eVoucher",
    description: "Show promotional eVoucher deal grid."
  },
  {
    key: "hotProducts",
    title: "Hot Products",
    description: "Show active product recommendations."
  },
  {
    key: "expoCarousel",
    title: "Expo banner carousel",
    description: "Show exhibition promotional carousel."
  },
  {
    key: "newProducts",
    title: "New Products",
    description: "Show latest product cards."
  },
  {
    key: "recommendedSuppliers",
    title: "Recommended Suppliers",
    description: "Show recommended supplier cards."
  },
  {
    key: "promo",
    title: "Large promo block",
    description: "Show large marketing content block."
  },
  {
    key: "featureCards",
    title: "Three feature cards",
    description: "Show three compact service cards."
  },
  {
    key: "partners",
    title: "Our Partners",
    description: "Show partner and sponsor logos."
  },
  {
    key: "cta",
    title: "CTA",
    description: "Show final growth call-to-action."
  }
]

export const initialRelations: TenantRelation[] = [
  {
    id: "partner-viettrade",
    name: "VietTrade Connect",
    type: "partner",
    tier: "Strategic Partner",
    logoUrl: "",
    websiteUrl: "https://example.com/viettrade",
    active: true
  },
  {
    id: "sponsor-logistics",
    name: "Asean Logistics Group",
    type: "sponsor",
    tier: "Gold Sponsor",
    logoUrl: "",
    websiteUrl: "https://example.com/logistics",
    active: true
  },
  {
    id: "sponsor-finance",
    name: "Trade Finance Hub",
    type: "sponsor",
    tier: "Silver Sponsor",
    logoUrl: "",
    websiteUrl: "https://example.com/finance",
    active: false
  }
]

export const emptyRelationForm = {
  name: "",
  type: "partner" as const,
  tier: "Strategic Partner",
  logoUrl: "",
  websiteUrl: "",
  active: true
}

export const communityStats = [
  ["1,200+", "Active Members"],
  ["12,000+", "Products"],
  ["5,600+", "Verified Suppliers"],
  ["120+", "Countries Connected"],
  ["300+", "Exhibitions"]
]

export const categoryLabels = [
  "Woman’s Clothing",
  "Men’s Clothing",
  "Ties & Accessories",
  "Belt & Accessories",
  "Sportwear",
  "Socks & Hosiery",
  "Hats & Caps",
  "Wedding Apparel"
]

export const productNames = [
  "Premium linen blazer",
  "Smart sourcing kit",
  "Industrial safety gloves",
  "Export-ready snack box",
  "Modular booth display"
]

export const supplierNames = [
  "Global Textile Co.",
  "Saigon Manufacturing Hub",
  "ASEAN Premium Supply"
]

export const featureNames = [
  ["AI Buyer Find & Match", "Find qualified buyers / suppliers"],
  ["RFQ Center", "Turn RFQs into Deals"],
  ["Expo Booking", "Connect with leads"],
  ["eVoucher Deals", "Exclusive partner offers"],
  ["Business Support", "Always ready help"],
  ["For Members", "Benefits & Service"]
]
