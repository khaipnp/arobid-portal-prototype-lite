export type BadgeOrigin = "Internal Badge" | "External Badge"
export type DisplayTarget = "Supplier" | "Product" | "RFQ" | "TradeXpo"

export type BadgeDefinition = {
  id: string
  module: string
  name: string
  origin: BadgeOrigin
  group: string
  condition: string
  whereItAppears: string
  designLink?: string
}

export type BadgeRankingConfig = {
  badgeId: string
  active: boolean
  priority: number
}

export type DisplayContext = {
  id: string
  title: string
  target: DisplayTarget
  surface: string
  ranking: BadgeRankingConfig[]
}

export type EntityPreview = {
  name: string
  eligibleBadgeIds: string[]
}

export type ExternalBadgeDraft = {
  name: string
  module: string
  group: string
  condition: string
}

export const emptyExternalBadgeDraft: ExternalBadgeDraft = {
  name: "",
  module: "",
  group: "Certificate",
  condition: ""
}

export const BADGE_CATALOG_PAGE_SIZE = 10

export const productPreviewThumbs = [
  "front-angle",
  "rear-angle",
  "folded-view",
  "open-view"
]

const internalBadgeSeedRows: BadgeDefinition[] = [
  {
    id: "BADGE-B2B-ISO-9001",
    module: "B2B",
    name: "ISO 9001:2015",
    origin: "Internal Badge",
    group: "Certificate",
    condition:
      "Current internal badge inventory entry from the approved Badge Documentation sheet.",
    whereItAppears:
      "B2B Product Detail > Certifications & Compliance; Supplier e-Profile; TradeXpo Trust Signals.",
    designLink:
      "https://www.figma.com/design/XfMhwQO4xZT97rgjsu3Sjn/B2B-Marketplace-2026?node-id=64-2493&t=bLrcHotl6etil7f9-4"
  },
  {
    id: "BADGE-B2B-PRODUCT-NEW",
    module: "B2B",
    name: "Product New",
    origin: "Internal Badge",
    group: "Product",
    condition:
      "System grants the label when product publish/approval date is inside the New Arrival window.",
    whereItAppears:
      "B2B product card/listing if design enables the badge; Homepage Product Highlight > New Arrival.",
    designLink:
      "https://www.figma.com/design/XfMhwQO4xZT97rgjsu3Sjn/B2B-Marketplace-2026?node-id=102-6380&t=bLrcHotl6etil7f9-4"
  },
  {
    id: "BADGE-B2B-PRODUCT-LIVE",
    module: "B2B",
    name: "Product Live",
    origin: "Internal Badge",
    group: "Product",
    condition:
      "System grants the label when the product is published, visible, and approved for live display.",
    whereItAppears:
      "B2B product card/listing only if Product Live badge is approved by PO/design.",
    designLink:
      "https://www.figma.com/design/XfMhwQO4xZT97rgjsu3Sjn/B2B-Marketplace-2026?node-id=2273-26940&t=Tjgx2b2vDZLhtzkW-4"
  },
  {
    id: "BADGE-B2B-TOP-DEAL",
    module: "B2B",
    name: "Top Deal",
    origin: "Internal Badge",
    group: "Product",
    condition:
      "System grants the label when product is linked to an active deal/campaign source.",
    whereItAppears:
      "B2B product card/listing; campaign/deal product section only after admin/config source exists.",
    designLink:
      "https://www.figma.com/design/XfMhwQO4xZT97rgjsu3Sjn/B2B-Marketplace-2026?node-id=102-6380&t=bLrcHotl6etil7f9-4"
  },
  {
    id: "BADGE-B2B-SPECIAL-OFFER",
    module: "B2B",
    name: "Special Offer",
    origin: "Internal Badge",
    group: "Product",
    condition:
      "System grants the label when product is linked to an active promotion/special-offer source.",
    whereItAppears:
      "B2B product card/listing; promotion/campaign section only after admin/config source exists.",
    designLink:
      "https://www.figma.com/design/XfMhwQO4xZT97rgjsu3Sjn/B2B-Marketplace-2026?node-id=102-6380&t=bLrcHotl6etil7f9-4"
  },
  {
    id: "BADGE-RFQ-SILVER",
    module: "RFQ",
    name: "Silver",
    origin: "Internal Badge",
    group: "Membership",
    condition:
      "System grants the label from supplier membership/package status.",
    whereItAppears:
      "Supplier card; supplier e-Profile header; marketplace member display.",
    designLink:
      "https://www.figma.com/design/Vye89EQ5zcaTuZr466qbhG/RFQ-Hubs?node-id=183-13587&t=2cvKZHliZCv6B9CG-4"
  },
  {
    id: "BADGE-RFQ-GOLD",
    module: "RFQ",
    name: "Gold",
    origin: "Internal Badge",
    group: "Membership",
    condition:
      "System grants the label from supplier membership/package status.",
    whereItAppears:
      "Supplier card; supplier e-Profile header; marketplace member display.",
    designLink:
      "https://www.figma.com/design/Vye89EQ5zcaTuZr466qbhG/RFQ-Hubs?node-id=183-13587&t=2cvKZHliZCv6B9CG-4"
  },
  {
    id: "BADGE-RFQ-PIONEER",
    module: "RFQ",
    name: "Pioneer",
    origin: "Internal Badge",
    group: "Membership",
    condition:
      "System grants the label from supplier membership/package status if separate Pioneer badge is approved.",
    whereItAppears:
      "Supplier card; supplier e-Profile header; marketplace member display only if separate Pioneer badge is approved.",
    designLink:
      "https://www.figma.com/design/Vye89EQ5zcaTuZr466qbhG/RFQ-Hubs?node-id=183-13587&t=2cvKZHliZCv6B9CG-4"
  },
  {
    id: "BADGE-RFQ-DIAMOND",
    module: "RFQ",
    name: "Diamond",
    origin: "Internal Badge",
    group: "Membership",
    condition:
      "System grants the label from supplier membership/package status.",
    whereItAppears:
      "Supplier card; supplier e-Profile header; marketplace member display.",
    designLink:
      "https://www.figma.com/design/Vye89EQ5zcaTuZr466qbhG/RFQ-Hubs?node-id=183-13587&t=2cvKZHliZCv6B9CG-4"
  },
  {
    id: "BADGE-TX-VERIFIED-PRO",
    module: "TX",
    name: "Verified Pro",
    origin: "Internal Badge",
    group: "Verification",
    condition:
      "System grants the label from supplier verification source after backend source is confirmed.",
    whereItAppears:
      "Supplier Type filter/search context; supplier card only after BE source is confirmed.",
    designLink:
      "https://www.figma.com/design/nL5mryBHkc8RIwMZUE5fsO/TradeXpo?node-id=2385-13052&t=7g7SOTWs8lMlWV2i-4"
  },
  {
    id: "BADGE-TX-HOT-PICK",
    module: "TX",
    name: "Hot Pick",
    origin: "Internal Badge",
    group: "Exhibition Highlight",
    condition:
      "System grants the label from TradeXpo highlight/config source after source exists.",
    whereItAppears:
      "TradeXpo exhibition card/list/homepage only after admin/config source exists.",
    designLink:
      "https://www.figma.com/design/nL5mryBHkc8RIwMZUE5fsO/TradeXpo?node-id=294-1086&t=7g7SOTWs8lMlWV2i-4"
  },
  {
    id: "BADGE-TX-FEATURED",
    module: "TX",
    name: "Featured",
    origin: "Internal Badge",
    group: "Exhibition Highlight",
    condition:
      "System grants the label from TradeXpo featured placement source.",
    whereItAppears:
      "TradeXpo exhibition card; exhibition list; homepage featured exhibition section.",
    designLink:
      "https://www.figma.com/design/nL5mryBHkc8RIwMZUE5fsO/TradeXpo?node-id=294-1086&t=7g7SOTWs8lMlWV2i-4"
  }
]

type ExternalBadgeGroupSeed = {
  module: "Company" | "Product / Service"
  group: string
  whereItAppears: string
  names: string[]
}

const externalBadgeGroupRows: ExternalBadgeGroupSeed[] = [
  {
    module: "Company",
    group: "Corporate Identity & Trust",
    whereItAppears: "Company card; company detail pages.",
    names: ["GS1", "EORI", "IEC"]
  },
  {
    module: "Company",
    group: "Quality Management",
    whereItAppears: "Company card; company detail pages.",
    names: [
      "ISO 9001",
      "ISO 13485",
      "IATF 16949",
      "AS9100",
      "GMP",
      "cGMP",
      "HACCP",
      "ISO 22000",
      "FSSC 22000",
      "BRCGS"
    ]
  },
  {
    module: "Company",
    group: "ESG & Sustainability",
    whereItAppears: "Company card; company detail pages.",
    names: [
      "EcoVadis",
      "Sedex",
      "SMETA",
      "SA8000",
      "B Corp",
      "CDP",
      "SBTi",
      "Net Zero",
      "Synesgy",
      "UNGC",
      "S&P ESG",
      "RBA"
    ]
  },
  {
    module: "Company",
    group: "Information Security & Digital Trust",
    whereItAppears: "Company card; company detail pages.",
    names: [
      "ISO 27001",
      "ISO 27701",
      "ISO 22301",
      "ISO 20000",
      "SOC 1",
      "SOC 2",
      "SOC 3",
      "PCI DSS",
      "TISAX"
    ]
  },
  {
    module: "Company",
    group: "Export & Trade Compliance",
    whereItAppears: "Company card; company detail pages.",
    names: [
      "AEO",
      "FDA",
      "CE",
      "UKCA",
      "UL",
      "FCC",
      "RoHS",
      "REACH",
      "Halal",
      "Kosher",
      "GlobalG.A.P",
      "FSC",
      "USDA Organic",
      "EU Organic",
      "ASC",
      "MSC",
      "PEFC"
    ]
  },
  {
    module: "Product / Service",
    group: "Market Access & Regulatory",
    whereItAppears: "Product card; product detail pages; service detail pages.",
    names: [
      "CE",
      "UKCA",
      "FCC",
      "UL",
      "CSA",
      "CCC",
      "PSE",
      "KC",
      "BIS",
      "SAA",
      "EAC",
      "FDA",
      "FDA 510(k)",
      "CE MDR"
    ]
  },
  {
    module: "Product / Service",
    group: "Religious & Cultural Compliance",
    whereItAppears: "Product card; product detail pages; service detail pages.",
    names: ["Halal", "Kosher", "Vegan", "Vegetarian"]
  },
  {
    module: "Product / Service",
    group: "Quality & Safety",
    whereItAppears: "Product card; product detail pages; service detail pages.",
    names: [
      "ISO 9001",
      "ISO 13485",
      "ISO 17025",
      "ISO 17020",
      "IATF 16949",
      "AS9100",
      "TL9000",
      "GMP",
      "cGMP",
      "HACCP",
      "ISO 22000",
      "FSSC 22000",
      "BRCGS",
      "SQF",
      "IFS",
      "IECQ QC080000",
      "MDSAP"
    ]
  },
  {
    module: "Product / Service",
    group: "ESG & Sustainability",
    whereItAppears: "Product card; product detail pages; service detail pages.",
    names: [
      "EcoVadis",
      "Sedex",
      "SMETA",
      "SA8000",
      "B Corp",
      "GRI",
      "ISSB",
      "CDP",
      "SBTi",
      "Net Zero",
      "Synesgy",
      "S&P ESG",
      "FSC",
      "PEFC",
      "Rainforest Alliance",
      "Fairtrade",
      "ISCC PLUS",
      "RSPO"
    ]
  },
  {
    module: "Product / Service",
    group: "Industry Specific Standards & Market Certifications",
    whereItAppears: "Product card; product detail pages; service detail pages.",
    names: [
      "GlobalG.A.P",
      "USDA Organic",
      "EU Organic",
      "JAS Organic",
      "MSC",
      "ASC",
      "OEKO-TEX",
      "GOTS",
      "Bluesign",
      "BCI",
      "Textile Exchange",
      "WRAP",
      "LEED",
      "BREEAM",
      "CE Construction",
      "ASTM",
      "EN",
      "IEC",
      "IEC 62368",
      "IEC 60601",
      "Energy Star",
      "EPEAT",
      "JCI",
      "ISO 15189",
      "CAP",
      "FIATA",
      "IATA",
      "WCA",
      "AEO",
      "ISO 28000",
      "ISO 10002",
      "ISO 44001",
      "ITIL",
      "Six Sigma",
      "CPD",
      "FWF",
      "MSC CoC",
      "BAP",
      "ISO 21001"
    ]
  },
  {
    module: "Product / Service",
    group: "Information Security & Digital Trust",
    whereItAppears: "Product card; product detail pages; service detail pages.",
    names: [
      "ISO 27001",
      "ISO 27701",
      "ISO 20000",
      "ISO 22301",
      "SOC 1",
      "SOC 2",
      "SOC 3",
      "PCI DSS",
      "TISAX",
      "NIST CSF"
    ]
  }
]

function slugifyToken(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function makeExternalBadgeId(module: string, name: string) {
  return `BADGE-EXT-${slugifyToken(module)}-${slugifyToken(name)}`
}

export const initialBadgeDefinitions: BadgeDefinition[] = [
  ...internalBadgeSeedRows,
  ...externalBadgeGroupRows.flatMap((group) =>
    group.names.map((name) => ({
      id: makeExternalBadgeId(group.module, name),
      module: group.module,
      name,
      origin: "External Badge" as const,
      group: group.group,
      condition:
        "External badge master data from boss list. Eligibility and verification are not configured in Admin Portal.",
      whereItAppears: group.whereItAppears
    }))
  )
]

export const displayContexts: DisplayContext[] = [
  {
    id: "product-card-listing",
    title: "Product Card / Listing",
    target: "Product",
    surface: "B2B product card/listing; campaign/deal product sections",
    ranking: [
      { badgeId: "BADGE-B2B-PRODUCT-NEW", active: true, priority: 1 },
      { badgeId: "BADGE-B2B-PRODUCT-LIVE", active: true, priority: 2 },
      { badgeId: "BADGE-B2B-TOP-DEAL", active: true, priority: 3 },
      { badgeId: "BADGE-B2B-SPECIAL-OFFER", active: true, priority: 4 }
    ]
  },
  {
    id: "product-detail-certifications",
    title: "Product Detail",
    target: "Product",
    surface: "Certifications & Compliance",
    ranking: [
      {
        badgeId: makeExternalBadgeId("Product / Service", "ISO 9001"),
        active: true,
        priority: 1
      },
      {
        badgeId: makeExternalBadgeId("Product / Service", "CE"),
        active: true,
        priority: 2
      },
      {
        badgeId: makeExternalBadgeId("Product / Service", "FDA"),
        active: true,
        priority: 3
      }
    ]
  },
  {
    id: "supplier-eprofile-header",
    title: "Supplier e-Profile Header",
    target: "Supplier",
    surface: "Supplier e-Profile header; marketplace member display",
    ranking: [
      { badgeId: "BADGE-RFQ-DIAMOND", active: true, priority: 1 },
      { badgeId: "BADGE-RFQ-GOLD", active: true, priority: 2 },
      { badgeId: "BADGE-RFQ-SILVER", active: true, priority: 3 },
      { badgeId: "BADGE-RFQ-PIONEER", active: false, priority: 4 },
      {
        badgeId: makeExternalBadgeId("Company", "ISO 9001"),
        active: true,
        priority: 5
      },
      {
        badgeId: makeExternalBadgeId("Company", "GS1"),
        active: true,
        priority: 6
      }
    ]
  },
  {
    id: "supplier-card",
    title: "Supplier Card",
    target: "Supplier",
    surface: "Supplier card; Supplier Type filter/search context",
    ranking: [
      { badgeId: "BADGE-TX-VERIFIED-PRO", active: true, priority: 1 },
      { badgeId: "BADGE-RFQ-DIAMOND", active: true, priority: 2 },
      { badgeId: "BADGE-RFQ-GOLD", active: true, priority: 3 },
      { badgeId: "BADGE-RFQ-SILVER", active: true, priority: 4 }
    ]
  },
  {
    id: "tradexpo-trust-signals",
    title: "TradeXpo Trust Signals",
    target: "TradeXpo",
    surface: "TradeXpo Trust Signals",
    ranking: [
      {
        badgeId: makeExternalBadgeId("Company", "ISO 9001"),
        active: true,
        priority: 1
      },
      {
        badgeId: makeExternalBadgeId("Company", "CE"),
        active: true,
        priority: 2
      },
      {
        badgeId: makeExternalBadgeId("Company", "FDA"),
        active: true,
        priority: 3
      }
    ]
  },
  {
    id: "tradexpo-exhibitor-card",
    title: "TradeXpo Exhibitor Card",
    target: "TradeXpo",
    surface: "Booth selector; hall/expo configuration; exhibitor card/header",
    ranking: [
      { badgeId: "BADGE-TX-FEATURED", active: true, priority: 1 },
      { badgeId: "BADGE-TX-HOT-PICK", active: true, priority: 2 },
      { badgeId: "BADGE-TX-VERIFIED-PRO", active: true, priority: 3 }
    ]
  }
]

export const previewByContext: Record<string, EntityPreview[]> = {
  "product-card-listing": [
    {
      name: "Product Card",
      eligibleBadgeIds: [
        "BADGE-B2B-PRODUCT-NEW",
        "BADGE-B2B-PRODUCT-LIVE",
        "BADGE-B2B-SPECIAL-OFFER"
      ]
    },
    {
      name: "Industrial Pump Product Card",
      eligibleBadgeIds: ["BADGE-B2B-PRODUCT-LIVE", "BADGE-B2B-TOP-DEAL"]
    }
  ],
  "product-detail-certifications": [
    {
      name: "Food Processing Product Detail",
      eligibleBadgeIds: [
        makeExternalBadgeId("Product / Service", "ISO 9001"),
        makeExternalBadgeId("Product / Service", "FDA")
      ]
    },
    {
      name: "Industrial Component Product Detail",
      eligibleBadgeIds: [
        makeExternalBadgeId("Product / Service", "CE"),
        makeExternalBadgeId("Product / Service", "ISO 9001")
      ]
    }
  ],
  "supplier-eprofile-header": [
    {
      name: "SUNSPACE WINDOW JOINT STOCK COMPANY",
      eligibleBadgeIds: [
        "BADGE-RFQ-DIAMOND",
        "BADGE-RFQ-GOLD",
        makeExternalBadgeId("Company", "ISO 9001"),
        makeExternalBadgeId("Company", "GS1")
      ]
    },
    {
      name: "MEKONG INDUSTRIAL SUPPLY CO., LTD",
      eligibleBadgeIds: [
        "BADGE-RFQ-GOLD",
        makeExternalBadgeId("Company", "ISO 9001")
      ]
    }
  ],
  "supplier-card": [
    {
      name: "Verified Pro Supplier Card",
      eligibleBadgeIds: [
        "BADGE-TX-VERIFIED-PRO",
        "BADGE-RFQ-GOLD",
        "BADGE-RFQ-SILVER"
      ]
    },
    {
      name: "Membership-only Supplier Card",
      eligibleBadgeIds: ["BADGE-RFQ-DIAMOND", "BADGE-RFQ-GOLD"]
    }
  ],
  "tradexpo-trust-signals": [
    {
      name: "TradeXpo Booth Trust Signals",
      eligibleBadgeIds: [
        makeExternalBadgeId("Company", "ISO 9001"),
        makeExternalBadgeId("Company", "CE")
      ]
    }
  ],
  "tradexpo-exhibitor-card": [
    {
      name: "Featured Exhibitor Card",
      eligibleBadgeIds: ["BADGE-TX-FEATURED", "BADGE-TX-HOT-PICK"]
    },
    {
      name: "Verified Exhibitor Header",
      eligibleBadgeIds: ["BADGE-TX-VERIFIED-PRO", "BADGE-TX-FEATURED"]
    }
  ]
}
