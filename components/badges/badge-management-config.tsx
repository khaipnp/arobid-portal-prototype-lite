"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BadgeCheckIcon,
  CrownIcon,
  GemIcon,
  GripVerticalIcon,
  type LucideIcon,
  PackageCheckIcon,
  PlusIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  XIcon,
  ZapIcon
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type BadgeOrigin = "Internal Badge" | "External Badge"
type DisplayTarget = "Supplier" | "Product" | "RFQ" | "TradeXpo"

type BadgeDefinition = {
  id: string
  module: string
  name: string
  origin: BadgeOrigin
  group: string
  condition: string
  whereItAppears: string
  designLink?: string
}

type BadgeRankingConfig = {
  badgeId: string
  active: boolean
  priority: number
}

type DisplayContext = {
  id: string
  title: string
  target: DisplayTarget
  surface: string
  ranking: BadgeRankingConfig[]
}

type EntityPreview = {
  name: string
  eligibleBadgeIds: string[]
}

type ExternalBadgeDraft = {
  name: string
  module: string
  group: string
  condition: string
}

const emptyExternalBadgeDraft: ExternalBadgeDraft = {
  name: "",
  module: "",
  group: "Certificate",
  condition: ""
}

const BADGE_CATALOG_PAGE_SIZE = 10

const productPreviewThumbs = [
  "front-angle",
  "rear-angle",
  "folded-view",
  "open-view",
  "detail-view"
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

function makeExternalBadgeId(module: string, name: string) {
  return `BADGE-EXT-${slugifyToken(module)}-${slugifyToken(name)}`
}

const initialBadgeDefinitions: BadgeDefinition[] = [
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

const displayContexts: DisplayContext[] = [
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

const previewByContext: Record<string, EntityPreview[]> = {
  "product-card-listing": [
    {
      name: "Samsung Galaxy Fold Product Card",
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

const badgeArtwork: Record<
  string,
  {
    label: string
    Icon: LucideIcon
    className: string
    iconClassName: string
  }
> = {
  "BADGE-B2B-ISO-9001": {
    label: "ISO 9001",
    Icon: ShieldCheckIcon,
    className: "bg-[#ecfdf5] text-[#047857] ring-[#bbf7d0]",
    iconClassName: "bg-white/80 text-[#059669]"
  },
  [makeExternalBadgeId("Company", "ISO 9001")]: {
    label: "ISO 9001",
    Icon: ShieldCheckIcon,
    className: "bg-[#ecfdf5] text-[#047857] ring-[#bbf7d0]",
    iconClassName: "bg-white/80 text-[#059669]"
  },
  [makeExternalBadgeId("Product / Service", "ISO 9001")]: {
    label: "ISO 9001",
    Icon: ShieldCheckIcon,
    className: "bg-[#ecfdf5] text-[#047857] ring-[#bbf7d0]",
    iconClassName: "bg-white/80 text-[#059669]"
  },
  [makeExternalBadgeId("Company", "FDA")]: {
    label: "FDA",
    Icon: ShieldCheckIcon,
    className: "bg-[#eef2ff] text-[#3730a3] ring-[#c7d2fe]",
    iconClassName: "bg-white/80 text-[#4f46e5]"
  },
  [makeExternalBadgeId("Product / Service", "FDA")]: {
    label: "FDA",
    Icon: ShieldCheckIcon,
    className: "bg-[#eef2ff] text-[#3730a3] ring-[#c7d2fe]",
    iconClassName: "bg-white/80 text-[#4f46e5]"
  },
  [makeExternalBadgeId("Company", "CE")]: {
    label: "CE",
    Icon: ShieldCheckIcon,
    className: "bg-[#fff7ed] text-[#c2410c] ring-[#fed7aa]",
    iconClassName: "bg-white/80 text-[#ea580c]"
  },
  [makeExternalBadgeId("Product / Service", "CE")]: {
    label: "CE",
    Icon: ShieldCheckIcon,
    className: "bg-[#fff7ed] text-[#c2410c] ring-[#fed7aa]",
    iconClassName: "bg-white/80 text-[#ea580c]"
  },
  [makeExternalBadgeId("Company", "GS1")]: {
    label: "GS1",
    Icon: BadgeCheckIcon,
    className: "bg-[#eff6ff] text-[#1d4ed8] ring-[#bfdbfe]",
    iconClassName: "bg-white/80 text-[#2563eb]"
  },
  "BADGE-B2B-PRODUCT-NEW": {
    label: "NEW",
    Icon: SparklesIcon,
    className: "bg-[#eef1ff] text-[#082e8f] ring-[#dde3ff]",
    iconClassName: "bg-white/70 text-[#294bd8]"
  },
  "BADGE-B2B-PRODUCT-LIVE": {
    label: "LIVE",
    Icon: ZapIcon,
    className: "bg-[#f97316] text-white ring-[#fed7aa]",
    iconClassName: "bg-white/20 text-white"
  },
  "BADGE-B2B-TOP-DEAL": {
    label: "TOP DEAL",
    Icon: TrophyIcon,
    className: "bg-[#ffe7e7] text-[#dc2626] ring-[#fecaca]",
    iconClassName: "bg-white/75 text-[#dc2626]"
  },
  "BADGE-B2B-SPECIAL-OFFER": {
    label: "SPECIAL OFFER",
    Icon: ZapIcon,
    className: "bg-[#082873] text-white ring-[#bfdbfe]",
    iconClassName: "bg-[#facc15] text-[#082873]"
  },
  "BADGE-RFQ-SILVER": {
    label: "SILVER",
    Icon: BadgeCheckIcon,
    className: "bg-[#f1f5f9] text-[#475569] ring-[#cbd5e1]",
    iconClassName: "bg-white/80 text-[#64748b]"
  },
  "BADGE-RFQ-GOLD": {
    label: "GOLD",
    Icon: CrownIcon,
    className: "bg-[#fef3c7] text-[#92400e] ring-[#fde68a]",
    iconClassName: "bg-white/80 text-[#d97706]"
  },
  "BADGE-RFQ-PIONEER": {
    label: "PIONEER",
    Icon: StarIcon,
    className: "bg-[#fdf2f8] text-[#be185d] ring-[#fbcfe8]",
    iconClassName: "bg-white/80 text-[#db2777]"
  },
  "BADGE-RFQ-DIAMOND": {
    label: "DIAMOND",
    Icon: GemIcon,
    className: "bg-[#e0f2fe] text-[#075985] ring-[#bae6fd]",
    iconClassName: "bg-white/80 text-[#0284c7]"
  },
  "BADGE-TX-VERIFIED-PRO": {
    label: "VERIFIED PRO",
    Icon: BadgeCheckIcon,
    className: "bg-[#ecfdf5] text-[#047857] ring-[#bbf7d0]",
    iconClassName: "bg-white/80 text-[#059669]"
  },
  "BADGE-TX-HOT-PICK": {
    label: "HOT PICK",
    Icon: TrophyIcon,
    className: "bg-[#ffe7e7] text-[#dc2626] ring-[#fecaca]",
    iconClassName: "bg-white/75 text-[#dc2626]"
  },
  "BADGE-TX-FEATURED": {
    label: "FEATURED",
    Icon: StarIcon,
    className: "bg-[#fdf2f8] text-[#be185d] ring-[#fbcfe8]",
    iconClassName: "bg-white/80 text-[#db2777]"
  }
}

function getBadgeArtwork(badge: BadgeDefinition) {
  return (
    badgeArtwork[badge.id] ?? {
      label: badge.name.toUpperCase(),
      Icon: BadgeCheckIcon,
      className: "bg-slate-100 text-slate-700 ring-slate-200",
      iconClassName: "bg-white text-slate-600"
    }
  )
}

function originVariant(origin: BadgeOrigin) {
  return origin === "Internal Badge" ? "default" : "outline"
}

function targetTone(target: DisplayTarget) {
  const tones: Record<DisplayTarget, string> = {
    Supplier: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Product: "border-sky-200 bg-sky-50 text-sky-700",
    RFQ: "border-amber-200 bg-amber-50 text-amber-700",
    TradeXpo: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
  }
  return tones[target]
}

function getContextCounts() {
  return displayContexts.reduce(
    (counts, context) => {
      counts[context.target] = (counts[context.target] ?? 0) + 1
      return counts
    },
    {} as Partial<Record<DisplayTarget, number>>
  )
}

export function BadgeManagementConfig() {
  const [catalogBadges, setCatalogBadges] = useState(initialBadgeDefinitions)
  const [rankingsByContext, setRankingsByContext] = useState(
    () =>
      Object.fromEntries(
        displayContexts.map((context) => [context.id, context.ranking])
      ) as Record<string, BadgeRankingConfig[]>
  )
  const [selectedContextId, setSelectedContextId] = useState(
    displayContexts[0]?.id ?? ""
  )
  const [previewEntityName, setPreviewEntityName] = useState("")
  const [publishedAtByContext, setPublishedAtByContext] = useState<
    Record<string, string | null>
  >(Object.fromEntries(displayContexts.map((context) => [context.id, null])))
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isAddBadgeOpen, setIsAddBadgeOpen] = useState(false)
  const [isAddExternalBadgeOpen, setIsAddExternalBadgeOpen] = useState(false)
  const [badgeToAdd, setBadgeToAdd] = useState("")
  const [addBadgeQuery, setAddBadgeQuery] = useState("")
  const [catalogQuery, setCatalogQuery] = useState("")
  const [catalogPage, setCatalogPage] = useState(1)
  const [externalBadgeDraft, setExternalBadgeDraft] = useState(
    emptyExternalBadgeDraft
  )

  const selectedContext =
    displayContexts.find((context) => context.id === selectedContextId) ??
    displayContexts[0]
  const selectedRanking = rankingsByContext[selectedContext.id] ?? []
  const previewEntities = previewByContext[selectedContext.id] ?? []
  const selectedPreviewEntity =
    previewEntities.find((entity) => entity.name === previewEntityName) ??
    previewEntities[0]
  const sortedRanking = useMemo(() => {
    return [...selectedRanking].sort((a, b) => a.priority - b.priority)
  }, [selectedRanking])
  const activeRanking = useMemo(() => {
    return sortedRanking.filter((item) => item.active)
  }, [sortedRanking])
  const availableBadgesForContext = catalogBadges.filter(
    (badge) => !selectedRanking.some((item) => item.badgeId === badge.id)
  )
  const filteredAvailableBadges = useMemo(() => {
    const query = addBadgeQuery.trim().toLowerCase()
    if (!query) return availableBadgesForContext

    return availableBadgesForContext.filter((badge) =>
      [badge.id, badge.name, badge.module, badge.group, badge.origin].some(
        (value) => value.toLowerCase().includes(query)
      )
    )
  }, [addBadgeQuery, availableBadgesForContext])
  const contextCounts = getContextCounts()
  const activePlacements = Object.values(rankingsByContext)
    .flat()
    .filter((item) => item.active).length
  const publishedAt = publishedAtByContext[selectedContext.id]
  const filteredBadgeDefinitions = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase()
    if (!query) return catalogBadges

    return catalogBadges.filter((badge) =>
      [badge.id, badge.name, badge.module, badge.group, badge.origin].some(
        (value) => value.toLowerCase().includes(query)
      )
    )
  }, [catalogBadges, catalogQuery])
  const totalCatalogPages = Math.max(
    1,
    Math.ceil(filteredBadgeDefinitions.length / BADGE_CATALOG_PAGE_SIZE)
  )
  const paginatedBadgeDefinitions = useMemo(() => {
    const start = (catalogPage - 1) * BADGE_CATALOG_PAGE_SIZE
    return filteredBadgeDefinitions.slice(
      start,
      start + BADGE_CATALOG_PAGE_SIZE
    )
  }, [catalogPage, filteredBadgeDefinitions])

  useEffect(() => {
    if (catalogPage > totalCatalogPages) {
      setCatalogPage(totalCatalogPages)
    }
  }, [catalogPage, totalCatalogPages])

  function getCatalogBadge(badgeId: string) {
    const badge = catalogBadges.find((item) => item.id === badgeId)
    if (!badge) {
      throw new Error(`Missing badge definition for ${badgeId}`)
    }
    return badge
  }

  function updateRanking(
    badgeId: string,
    patch: Partial<Omit<BadgeRankingConfig, "badgeId">>
  ) {
    setRankingsByContext((current) => ({
      ...current,
      [selectedContext.id]: (current[selectedContext.id] ?? []).map((item) =>
        item.badgeId === badgeId ? { ...item, ...patch } : item
      )
    }))
  }

  function moveRanking(badgeId: string, direction: -1 | 1) {
    setRankingsByContext((current) => {
      const contextRanking = current[selectedContext.id] ?? []
      const sorted = [...contextRanking].sort((a, b) => a.priority - b.priority)
      const currentIndex = sorted.findIndex((item) => item.badgeId === badgeId)
      const targetIndex = currentIndex + direction

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
        return current
      }

      const currentItem = sorted[currentIndex]
      const targetItem = sorted[targetIndex]

      return {
        ...current,
        [selectedContext.id]: contextRanking.map((item) => {
          if (item.badgeId === currentItem.badgeId) {
            return { ...item, priority: targetItem.priority }
          }
          if (item.badgeId === targetItem.badgeId) {
            return { ...item, priority: currentItem.priority }
          }
          return item
        })
      }
    })
  }

  function addBadgeToContext(badgeId: string) {
    if (!badgeId) return

    setRankingsByContext((current) => {
      const contextRanking = current[selectedContext.id] ?? []
      if (contextRanking.some((item) => item.badgeId === badgeId)) {
        return current
      }

      const nextPriority =
        contextRanking.length > 0
          ? Math.max(...contextRanking.map((item) => item.priority)) + 1
          : 1

      return {
        ...current,
        [selectedContext.id]: [
          ...contextRanking,
          { badgeId, active: true, priority: nextPriority }
        ]
      }
    })
    setBadgeToAdd("")
    setIsAddBadgeOpen(false)
  }

  function removeBadgeFromContext(badgeId: string) {
    setRankingsByContext((current) => ({
      ...current,
      [selectedContext.id]: (current[selectedContext.id] ?? []).filter(
        (item) => item.badgeId !== badgeId
      )
    }))
  }

  function openAddBadgeDialog() {
    setBadgeToAdd("")
    setAddBadgeQuery("")
    setIsAddBadgeOpen(true)
  }

  function publishContext() {
    setPublishedAtByContext((current) => ({
      ...current,
      [selectedContext.id]: new Date().toISOString()
    }))
  }

  function openAddExternalBadgeDialog() {
    setExternalBadgeDraft(emptyExternalBadgeDraft)
    setIsAddExternalBadgeOpen(true)
  }

  function updateExternalBadgeDraft(patch: Partial<ExternalBadgeDraft>) {
    setExternalBadgeDraft((current) => ({ ...current, ...patch }))
  }

  function createExternalBadge() {
    const name = externalBadgeDraft.name.trim()
    if (!name) return

    const module = externalBadgeDraft.module.trim() || "External"
    const group = externalBadgeDraft.group.trim() || "Certificate"
    const condition =
      externalBadgeDraft.condition.trim() ||
      "External badge eligibility must be verified and valid. Condition is not configured in Admin Portal."
    const slug = name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    const baseId = `BADGE-EXT-${slug || "CUSTOM"}`

    setCatalogBadges((current) => {
      let nextId = baseId
      let suffix = 2
      while (current.some((badge) => badge.id === nextId)) {
        nextId = `${baseId}-${suffix}`
        suffix += 1
      }

      return [
        ...current,
        {
          id: nextId,
          module,
          name,
          origin: "External Badge",
          group,
          condition,
          whereItAppears:
            "Available for Admin Badge Management contexts after operations assigns it."
        }
      ]
    })

    setCatalogQuery("")
    setExternalBadgeDraft(emptyExternalBadgeDraft)
    setIsAddExternalBadgeOpen(false)
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Display contexts" value={displayContexts.length} />
        <MetricCard
          label="Product contexts"
          value={contextCounts.Product ?? 0}
        />
        <MetricCard
          label="Supplier contexts"
          value={contextCounts.Supplier ?? 0}
        />
        <MetricCard label="Active placements" value={activePlacements} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border-foreground/10">
          <CardHeader>
            <CardTitle>Display Surfaces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayContexts.map((context) => {
              const isSelected = context.id === selectedContext.id
              const activeCount = (rankingsByContext[context.id] ?? []).filter(
                (item) => item.active
              ).length
              return (
                <button
                  key={context.id}
                  type="button"
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-muted/40 text-foreground"
                      : "bg-background hover:bg-muted/30"
                  )}
                  onClick={() => setSelectedContextId(context.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{context.title}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("border", targetTone(context.target))}
                    >
                      {context.target}
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {activeCount} active badge placements
                  </p>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-foreground/10">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontalIcon className="size-5 text-muted-foreground" />
                    Context Detail
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={cn("border", targetTone(selectedContext.target))}
                >
                  {selectedContext.target}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <InfoPill label="Context" value={selectedContext.title} />
                <InfoPill label="Target" value={selectedContext.target} />
                <InfoPill
                  label="Active badges"
                  value={String(activeRanking.length)}
                />
                <InfoPill
                  label="Total badges"
                  value={String(sortedRanking.length)}
                />
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-medium text-sm">Preview & publish</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      Preview
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={publishContext}
                      disabled={activeRanking.length === 0}
                    >
                      {publishedAt ? "Republish" : "Publish"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <InfoPill
                    label="Last published"
                    value={formatPublishedAt(publishedAt)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>Badge Inventory</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={openAddBadgeDialog}
                disabled={availableBadgesForContext.length === 0}
              >
                <PlusIcon className="size-4" />
                Add Badge
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">Context #</TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Badge Type</TableHead>
                      <TableHead className="w-[112px] text-center">
                        Active
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRanking.length > 0 ? (
                      sortedRanking.map((item, index) => {
                        const badge = getCatalogBadge(item.badgeId)
                        return (
                          <TableRow key={item.badgeId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <GripVerticalIcon className="size-4 text-muted-foreground" />
                                <Badge variant="secondary">
                                  #{item.priority}
                                </Badge>
                                <div className="flex overflow-hidden rounded-lg border bg-background">
                                  <button
                                    type="button"
                                    className="border-r p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                                    disabled={index === 0}
                                    onClick={() =>
                                      moveRanking(item.badgeId, -1)
                                    }
                                    aria-label={`Move ${badge.name} up`}
                                  >
                                    <ArrowUpIcon className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                                    disabled={
                                      index === sortedRanking.length - 1
                                    }
                                    onClick={() => moveRanking(item.badgeId, 1)}
                                    aria-label={`Move ${badge.name} down`}
                                  >
                                    <ArrowDownIcon className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <BadgeArtwork badge={badge} />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{badge.group}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={originVariant(badge.origin)}>
                                {badge.origin}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={item.active}
                                  onCheckedChange={(active) =>
                                    updateRanking(item.badgeId, { active })
                                  }
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() =>
                                    removeBadgeFromContext(item.badgeId)
                                  }
                                  aria-label={`Remove ${badge.name}`}
                                >
                                  <XIcon className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No badges
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-foreground/10">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Badge Catalog Reference</CardTitle>
          <Button type="button" size="sm" onClick={openAddExternalBadgeDialog}>
            <PlusIcon className="size-4" />
            Add External Badge
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={catalogQuery}
            onChange={(event) => {
              setCatalogQuery(event.target.value)
              setCatalogPage(1)
            }}
            placeholder="Search badge, module, group, type, or ID"
            className="max-w-md"
          />
          <div className="overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Badge</TableHead>
                  <TableHead className="w-[150px]">Badge Type</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="min-w-[280px]">Condition</TableHead>
                  <TableHead className="w-[140px] text-center">
                    Admin Editable
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBadgeDefinitions.length > 0 ? (
                  paginatedBadgeDefinitions.map((badge) => (
                    <TableRow key={badge.id}>
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1">
                          <BadgeArtwork badge={badge} size="sm" />
                          <p className="text-muted-foreground text-xs">
                            {badge.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={originVariant(badge.origin)}>
                          {badge.origin}
                        </Badge>
                      </TableCell>
                      <TableCell>{badge.module}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{badge.group}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[420px] whitespace-normal text-muted-foreground text-xs leading-relaxed">
                        {badge.condition}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          No
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No badges found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredBadgeDefinitions.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {(catalogPage - 1) * BADGE_CATALOG_PAGE_SIZE + 1}-
                {Math.min(
                  catalogPage * BADGE_CATALOG_PAGE_SIZE,
                  filteredBadgeDefinitions.length
                )}{" "}
                of {filteredBadgeDefinitions.length}
              </p>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setCatalogPage((current) => Math.max(1, current - 1))
                      }}
                      aria-disabled={catalogPage === 1}
                      className={
                        catalogPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-3 text-sm">
                      Page {catalogPage} / {totalCatalogPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setCatalogPage((current) =>
                          Math.min(totalCatalogPages, current + 1)
                        )
                      }}
                      aria-disabled={catalogPage === totalCatalogPages}
                      className={
                        catalogPage === totalCatalogPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Badge Preview</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-2xl border bg-gradient-to-b from-slate-50 to-white p-4">
              <Tabs
                value={selectedPreviewEntity?.name ?? ""}
                onValueChange={setPreviewEntityName}
              >
                <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/40 p-1">
                  {previewEntities.map((entity) => (
                    <TabsTrigger key={entity.name} value={entity.name}>
                      {entity.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="mt-4">
                {selectedPreviewEntity ? (
                  selectedContext.id === "product-card-listing" ? (
                    <ProductListingPreview
                      entity={selectedPreviewEntity}
                      getBadgeById={getCatalogBadge}
                      ranking={activeRanking}
                    />
                  ) : (
                    <EntityPreviewCard
                      context={selectedContext}
                      entity={selectedPreviewEntity}
                      getBadgeById={getCatalogBadge}
                      ranking={activeRanking}
                    />
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
                    No preview entity
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <InfoPill label="Context" value={selectedContext.title} />
              <InfoPill label="Target" value={selectedContext.target} />
              <InfoPill
                label="Active badges"
                value={String(activeRanking.length)}
              />
              <InfoPill
                label="Last published"
                value={formatPublishedAt(publishedAt)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddBadgeOpen}
        onOpenChange={(open) => {
          setIsAddBadgeOpen(open)
          if (!open) {
            setBadgeToAdd("")
            setAddBadgeQuery("")
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Badge</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                {selectedContext.title}
              </p>
              <p className="text-muted-foreground text-xs">
                Choose one badge to add into this context ranking.
              </p>
            </div>

            <Input
              value={addBadgeQuery}
              onChange={(event) => {
                setAddBadgeQuery(event.target.value)
                setBadgeToAdd("")
              }}
              placeholder="Search badge by name, module, type, or ID"
            />

            <Select
              value={badgeToAdd}
              onValueChange={setBadgeToAdd}
              disabled={filteredAvailableBadges.length === 0}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select badge" />
              </SelectTrigger>
              <SelectContent>
                {filteredAvailableBadges.map((badge) => (
                  <SelectItem key={badge.id} value={badge.id}>
                    {`${badge.name} • ${badge.module} • ${badge.origin}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filteredAvailableBadges.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-3 text-muted-foreground text-sm">
                No badge found
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddBadgeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => addBadgeToContext(badgeToAdd)}
              disabled={!badgeToAdd}
            >
              Add Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddExternalBadgeOpen}
        onOpenChange={setIsAddExternalBadgeOpen}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add External Badge</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={externalBadgeDraft.name}
                onChange={(event) =>
                  updateExternalBadgeDraft({ name: event.target.value })
                }
                placeholder="Badge name"
              />
              <Input
                value={externalBadgeDraft.module}
                onChange={(event) =>
                  updateExternalBadgeDraft({ module: event.target.value })
                }
                placeholder="Module"
              />
              <Input
                value={externalBadgeDraft.group}
                onChange={(event) =>
                  updateExternalBadgeDraft({ group: event.target.value })
                }
                placeholder="Group"
              />
              <Input value="External Badge" disabled />
            </div>

            <Input
              value={externalBadgeDraft.condition}
              onChange={(event) =>
                updateExternalBadgeDraft({ condition: event.target.value })
              }
              placeholder="Condition / verification note"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddExternalBadgeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={createExternalBadge}
              disabled={!externalBadgeDraft.name.trim()}
            >
              Add External Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductListingPreview({
  entity,
  getBadgeById,
  ranking
}: {
  entity: EntityPreview
  getBadgeById: (badgeId: string) => BadgeDefinition
  ranking: BadgeRankingConfig[]
}) {
  const renderedBadges = ranking.filter((item) =>
    entity.eligibleBadgeIds.includes(item.badgeId)
  )

  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {renderedBadges.map((item) => {
          const badge = getBadgeById(item.badgeId)
          return <BadgeArtwork key={item.badgeId} badge={badge} size="sm" />
        })}
      </div>

      <div className="mt-5 space-y-4">
        <p className="text-[15px] text-muted-foreground">
          Company:{" "}
          <span className="font-medium text-[#082873] underline underline-offset-2">
            SUNSPACE WINDOW JOINT STOCK COMPANY
          </span>
        </p>

        <div className="max-w-4xl space-y-2">
          <h3 className="font-semibold text-3xl text-slate-950 leading-tight tracking-tight">
            Galaxy Z Fold 6: The 10.1&quot; 4G LTE Powerhouse for Work, Learn &
            Call | 8GB+256GB | Android 15
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-amber-500">
              <StarIcon className="size-4 fill-current" />
              <StarIcon className="size-4 fill-current" />
              <StarIcon className="size-4 fill-current" />
              <StarIcon className="size-4 fill-current" />
              <StarIcon className="size-4 fill-current text-amber-300" />
            </div>
            <span className="text-muted-foreground">(65 danh gia)</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[68px_minmax(0,1fr)]">
          <div className="space-y-3">
            {productPreviewThumbs.map((thumbId) => (
              <div
                key={thumbId}
                className="flex aspect-square items-center justify-center rounded-2xl bg-[#e3e3e3]"
              >
                <PackageCheckIcon className="size-6 text-muted-foreground" />
              </div>
            ))}
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-[28px] bg-[#d9d9d9]">
            <div className="absolute top-5 right-5 flex size-12 items-center justify-center rounded-full bg-black/45 text-white">
              <span className="text-2xl leading-none">♥</span>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-[270px] w-[170px] items-center justify-center">
                <div className="absolute top-10 left-0 h-[190px] w-[105px] rounded-[18px] border border-slate-400 bg-slate-200 shadow-md" />
                <div className="absolute top-0 right-2 flex h-[235px] w-[120px] items-center justify-center rounded-[20px] border border-slate-500 bg-gradient-to-b from-[#f6d2be] to-[#d55a42] text-center font-bold text-3xl text-white leading-[1.05] shadow-lg">
                  SAMSUNG
                  <br />
                  GALAXY
                </div>
                <div className="absolute bottom-4 left-4 h-4 w-12 rounded-full bg-black/10 blur-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-medium text-sm">{value}</p>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="bg-gradient-to-br from-white to-slate-50" size="sm">
      <CardContent className="space-y-1">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </p>
        <p className="font-semibold text-2xl">{value}</p>
      </CardContent>
    </Card>
  )
}

function EntityPreviewCard({
  context,
  entity,
  getBadgeById,
  ranking
}: {
  context: DisplayContext
  entity: EntityPreview
  getBadgeById: (badgeId: string) => BadgeDefinition
  ranking: BadgeRankingConfig[]
}) {
  const renderedBadges = ranking.filter((item) =>
    entity.eligibleBadgeIds.includes(item.badgeId)
  )

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#082873] underline underline-offset-2">
            {entity.name}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 border", targetTone(context.target))}
        >
          {context.target}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {renderedBadges.map((item, index) => {
          const badge = getBadgeById(item.badgeId)
          return (
            <BadgeArtwork
              key={item.badgeId}
              badge={badge}
              contextPriority={item.priority}
              showCompactedSlot
              size="sm"
              visibleSlot={index + 1}
            />
          )
        })}
      </div>
    </div>
  )
}

function BadgeArtwork({
  badge,
  contextPriority,
  showCompactedSlot = false,
  showContextPriority = false,
  size = "md",
  visibleSlot
}: {
  badge: BadgeDefinition
  contextPriority?: number
  showCompactedSlot?: boolean
  showContextPriority?: boolean
  size?: "sm" | "md"
  visibleSlot?: number
}) {
  const artwork = getBadgeArtwork(badge)
  const Icon = artwork.Icon
  const isSmall = size === "sm"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold shadow-sm ring-1",
        isSmall ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-sm",
        artwork.className
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          isSmall ? "size-4" : "size-5",
          artwork.iconClassName
        )}
      >
        <Icon className={isSmall ? "size-3" : "size-3.5"} />
      </span>
      <span>{artwork.label}</span>
      {showContextPriority && contextPriority ? (
        <span className="ml-1 rounded-full bg-white/55 px-1.5 py-0.5 font-semibold text-[10px] text-current leading-none">
          #{contextPriority}
        </span>
      ) : null}
      {showCompactedSlot && visibleSlot ? (
        <span className="ml-1 rounded-full bg-white/55 px-1.5 py-0.5 font-semibold text-[10px] text-current leading-none">
          slot #{visibleSlot}
          {contextPriority && contextPriority !== visibleSlot
            ? ` from #${contextPriority}`
            : ""}
        </span>
      ) : null}
    </span>
  )
}

function formatPublishedAt(value: string | null) {
  if (!value) return "Not published yet"

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}
