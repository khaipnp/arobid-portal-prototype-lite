const r2Base =
  "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing"

export const tenantAssets = {
  logoTbsg: `${r2Base}/logo-tbsg.png`,
  heroCity: `${r2Base}/hero-city.png`,
  communityPattern: `${r2Base}/community-pattern.png`,
  featureAiMatch: `${r2Base}/feature-ai-match.jpg`,
  featureRfq: `${r2Base}/feature-rfq.png`,
  featureExpo: `${r2Base}/feature-expo.png`,
  featureEvoucher: `${r2Base}/feature-evoucher.png`,
  featureSupport: `${r2Base}/feature-support.png`,
  featureMembers: `${r2Base}/feature-members.png`,
  buyerMatchUi: `${r2Base}/buyer-match-ui.png`,
  buyerMatchAd: `${r2Base}/buyer-match-ad.png`,
  voucherCoffeeMain: `${r2Base}/voucher-coffee-main.jpg`,
  voucherCoffee: `${r2Base}/voucher-coffee.jpg`,
  voucherInterior: `${r2Base}/voucher-interior.jpg`,
  voucherAppliance: `${r2Base}/voucher-appliance.jpg`,
  voucherCoffeeBag: `${r2Base}/voucher-coffee-bag.jpg`,
  expoBannerBg: `${r2Base}/expo-banner-bg.png`,
  expoVideo: `${r2Base}/expo-video.jpg`,
  whyJoinBg: `${r2Base}/why-join-bg.jpg`,
  whyJoinVideo: `${r2Base}/why-join-video.png`,
  whyJoinNews: `${r2Base}/why-join-news.jpg`,
  serviceCardBg: `${r2Base}/service-card-bg.png`,
  serviceRfq: `${r2Base}/service-rfq.png`,
  serviceAi: `${r2Base}/service-ai.png`,
  serviceSupport: `${r2Base}/service-support.png`,
  ctaBg: `${r2Base}/cta-bg.png`,
  footerLogo: `${r2Base}/footer-logo.png`
} as const

export const navItems = [
  "All Categories",
  "TradeXpo",
  "Suppliers",
  "eVoucher Deals",
  "For Members",
  "About TBSG"
]

export const categoryItems = [
  {
    name: "Woman’s Clothing",
    image: `${r2Base}/category-women.png`
  },
  {
    name: "Men’s Clothing",
    image: `${r2Base}/category-men.png`
  },
  {
    name: "Ties & Accessories",
    image: `${r2Base}/category-ties.png`
  },
  {
    name: "Belt & Accessories",
    image: `${r2Base}/category-belts.png`
  },
  {
    name: "Sportwear",
    image: `${r2Base}/category-sportwear.png`
  },
  {
    name: "Socks & Hosiery",
    image: `${r2Base}/category-socks.png`
  },
  {
    name: "Hats & Caps",
    image: `${r2Base}/category-hats.png`
  },
  {
    name: "Wedding Apparel & Accessories",
    image: `${r2Base}/category-wedding.png`
  }
]

export const stats = [
  ["1,200+", "Active Members"],
  ["12,000+", "Products"],
  ["5,600+", "Verified Suppliers"],
  ["120+", "Countries Connected"],
  ["300+", "Exhibitions"]
] as const

export const communityFeatures = [
  {
    title: "AI Buyer Find & Match",
    description: "Find qualified buyers / suppliers",
    image: tenantAssets.featureAiMatch,
    size: "large"
  },
  {
    title: "RFQ Center",
    description: "Turn RFQs into Deals",
    image: tenantAssets.featureRfq,
    size: "wide"
  },
  {
    title: "Expo Booking",
    description: "Connect with leads",
    image: tenantAssets.featureExpo,
    size: "wide"
  },
  {
    title: "eVoucher Deals",
    description: "Exclusive partner offers",
    image: tenantAssets.featureEvoucher,
    size: "compact"
  },
  {
    title: "Business Support",
    description: "Always ready help",
    image: tenantAssets.featureSupport,
    size: "compact"
  },
  {
    title: "For Members",
    description: "Benefits & Service",
    image: tenantAssets.featureMembers,
    size: "compact"
  }
] as const

export const supplierCards = [
  {
    name: "SAI GON FOOD AND BEVERAGE CO., LTD",
    products: [
      `${r2Base}/product-green-gram.jpg`,
      tenantAssets.voucherCoffee,
      `${r2Base}/product-cashew-400g.png`,
      tenantAssets.voucherCoffeeBag
    ]
  },
  {
    name: "PHU MINH TAM TRADING & SERVICE CO., LTD",
    products: [
      `${r2Base}/product-brown-rice.jpg`,
      `${r2Base}/product-cashew-400g.png`,
      `${r2Base}/product-sachi.jpg`,
      `${r2Base}/product-green-gram.jpg`
    ]
  },
  {
    name: "LISA FOOD",
    products: [
      `${r2Base}/product-cashew-400g.png`,
      `${r2Base}/product-sachi.jpg`,
      tenantAssets.voucherInterior,
      tenantAssets.voucherAppliance
    ]
  }
]

export const productCards = [
  {
    title: "Green Gram Vigna Green Beans Mung Beans Green Moong",
    price: "VND 1.500.000 - 1.600.000",
    supplier: "PHU MINH TAM TRADING ...",
    image: `${r2Base}/product-green-gram.jpg`
  },
  {
    title: "High Quality Vietnam Brown Rice Organic in Bulk for Sale 2Kg, 5Kg",
    price: "VND 104.000 - 110.000",
    supplier: "SEN VIET INVESTMENT ...",
    image: `${r2Base}/product-brown-rice.jpg`
  },
  {
    title: "LisaFood Super Premium 400g Peeled Roasted Cashew Nuts",
    price: "VND 1.500.000 - 1.600.000",
    supplier: "LISA FOOD",
    image: `${r2Base}/product-cashew-400g.png`
  },
  {
    title: "LisaFood Super Premium Roasted Sachi Nuts 250g",
    price: "VND 1.500.000 - 1.600.000",
    supplier: "LISA FOOD",
    image: `${r2Base}/product-sachi.jpg`
  },
  {
    title: "Castell-III Electronic Hanging Scale",
    price: "VND 1.500.000 - 1.600.000",
    supplier: "HOANG THIEN INDUSTRIAL...",
    image: `${r2Base}/product-scale.jpg`
  }
]

export const voucherCards = [
  {
    image: tenantAssets.voucherCoffeeMain,
    featured: true
  },
  {
    image: tenantAssets.voucherCoffee
  },
  {
    image: tenantAssets.voucherInterior
  },
  {
    image: tenantAssets.voucherAppliance
  },
  {
    image: tenantAssets.voucherCoffeeBag
  }
]

export const serviceTiles = [
  {
    title: "RFQ Center",
    description: "Request and manage quotes in one system.",
    button: "Discover now",
    image: tenantAssets.serviceRfq,
    primary: true
  },
  {
    title: "AI Buyer Find & Match",
    description: "Instantly connect with high-intent global partners.",
    button: "Find Matches",
    image: tenantAssets.serviceAi
  },
  {
    title: "Business Support",
    description: "Optimize your experience with expert platform support.",
    button: "Get Support",
    image: tenantAssets.serviceSupport
  }
]

export const partnerLogos = [
  { id: "tan-pham-gia", image: `${r2Base}/partner-tan-pham-gia.png` },
  { id: "hoang-the-1", image: `${r2Base}/partner-hoang-the.png` },
  { id: "rewa", image: `${r2Base}/partner-rewa.png` },
  { id: "napoly-1", image: `${r2Base}/partner-napoly.png` },
  { id: "royal-1", image: `${r2Base}/partner-royal.png` },
  { id: "tata-1", image: `${r2Base}/partner-tata.png` },
  { id: "logistics", image: `${r2Base}/partner-logistics.png` },
  { id: "hoang-the-2", image: `${r2Base}/partner-hoang-the.png` },
  { id: "envii", image: `${r2Base}/partner-envii.png` },
  { id: "tata-2", image: `${r2Base}/partner-tata.png` },
  { id: "dnp", image: `${r2Base}/partner-dnp.png` },
  { id: "napoly-2", image: `${r2Base}/partner-napoly.png` },
  { id: "royal-2", image: `${r2Base}/partner-royal.png` },
  { id: "tata-3", image: `${r2Base}/partner-tata.png` },
  { id: "tata-4", image: `${r2Base}/partner-tata.png` },
  { id: "tata-5", image: `${r2Base}/partner-tata.png` },
  { id: "tata-6", image: `${r2Base}/partner-tata.png` },
  { id: "tata-7", image: `${r2Base}/partner-tata.png` }
]

export const newsItems = [
  "TBSG x Nam Viet Group: Bridging Business, Government, and Education for Regional Value.",
  "TBSG Association Promotes Vietnam-China Business Links for Sustainable Development.",
  "TBSG x SHBA: Strengthening Inter-Regional Business Connectivity and Collaboration."
]

export const footerColumns = [
  ["For Buyers", "Find Suppliers", "RFQ Center", "Buyer Service", "Membership"],
  [
    "For Suppliers",
    "Find Buyers",
    "List Your Company",
    "Pricing",
    "Supplier Resources"
  ],
  ["Support", "Help Center", "Contact Us", "Terms of Use", "Privacy Policy"],
  ["About TBSG", "About Us", "Events", "News & Insights", "Community"]
] as const
