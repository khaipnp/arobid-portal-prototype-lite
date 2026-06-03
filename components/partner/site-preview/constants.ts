import type {
  AlwaysVisibleSiteSectionKey,
  EnabledSiteSections,
  MediaSlotOption,
  RelationForm,
  SectionOption,
  SiteBranding,
  SiteSectionMedia,
  TenantRelation
} from "./types"

export const initialBranding: SiteBranding = {
  tenantName: "Arobid Trade Partner",
  tagline: "Your trusted gateway to digital trade exhibitions.",
  logoUrl: "",
  bannerUrl: "",
  primaryColor: "#f97316",
  accentColor: "#2563eb",
  ctaOption: "contact_tenant",
  publicEmail: "partner@arobid.com",
  publicPhone: "+84 28 0000 0000",
  publicAddress: "Ho Chi Minh City, Vietnam",
  publicWebsite: "https://arobid.com",
  serviceBundleText:
    "Partner support services are available through Arobid Business."
}

export const alwaysVisibleSections: AlwaysVisibleSiteSectionKey[] = [
  "header",
  "banner",
  "bfm",
  "footer"
]
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

export const initialSectionMedia: SiteSectionMedia = {
  banner: [""],
  community: ["", "", ""],
  categories: ["", "", "", "", "", "", "", ""],
  bfm: [""],
  featuredSuppliers: ["", "", ""],
  deals: ["", "", "", "", ""],
  hotProducts: ["", "", "", "", ""],
  expoCarousel: [""],
  newProducts: ["", "", "", "", ""],
  recommendedSuppliers: ["", "", ""],
  promo: ["", "", ""],
  featureCards: ["", "", ""],
  cta: [""]
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

export const mediaSlotOptions: MediaSlotOption[] = [
  {
    key: "banner",
    title: "Banner hero media",
    description: "Main visual used in the top hero banner.",
    slots: ["Hero visual"]
  },
  {
    key: "community",
    title: "Community feature media",
    description: "Images for the community/value feature cards.",
    slots: ["Feature 1", "Feature 2", "Feature 3"]
  },
  {
    key: "categories",
    title: "Category media",
    description: "Images for category shortcut tiles.",
    slots: [
      "Category 1",
      "Category 2",
      "Category 3",
      "Category 4",
      "Category 5",
      "Category 6",
      "Category 7",
      "Category 8"
    ]
  },
  {
    key: "bfm",
    title: "Buyer Find & Match media",
    description: "Visual for the Buyer Find & Match content block.",
    slots: ["Section visual"]
  },
  {
    key: "featuredSuppliers",
    title: "Featured supplier media",
    description: "Images for highlighted supplier cards.",
    slots: ["Supplier 1", "Supplier 2", "Supplier 3"]
  },
  {
    key: "deals",
    title: "Deal media",
    description: "Background images for eVoucher deal cards.",
    slots: ["Top deal", "Deal 2", "Deal 3", "Deal 4", "Deal 5"]
  },
  {
    key: "hotProducts",
    title: "Hot product media",
    description: "Product images for the Hot Products section.",
    slots: ["Product 1", "Product 2", "Product 3", "Product 4", "Product 5"]
  },
  {
    key: "expoCarousel",
    title: "Expo carousel media",
    description: "Background visual for the expo carousel banner.",
    slots: ["Carousel visual"]
  },
  {
    key: "newProducts",
    title: "New product media",
    description: "Product images for the New Products section.",
    slots: ["Product 1", "Product 2", "Product 3", "Product 4", "Product 5"]
  },
  {
    key: "recommendedSuppliers",
    title: "Recommended supplier media",
    description: "Images for recommended supplier cards.",
    slots: ["Supplier 1", "Supplier 2", "Supplier 3"]
  },
  {
    key: "promo",
    title: "Promo media",
    description: "Images for the large promo cards.",
    slots: ["Promo 1", "Promo 2", "Promo 3"]
  },
  {
    key: "featureCards",
    title: "Feature card media",
    description: "Images for the three compact feature cards.",
    slots: ["Feature 1", "Feature 2", "Feature 3"]
  },
  {
    key: "cta",
    title: "CTA background media",
    description: "Optional background visual for the final call-to-action.",
    slots: ["CTA background"]
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

export const emptyRelationForm: RelationForm = {
  name: "",
  type: "partner",
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
