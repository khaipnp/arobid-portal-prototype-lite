"use client"

import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  Building2Icon,
  Clock3Icon,
  ExternalLinkIcon,
  EyeIcon,
  GripVerticalIcon,
  ImageIcon,
  InfoIcon,
  Layers3Icon,
  LinkIcon,
  MapPinnedIcon,
  MousePointerClickIcon,
  PencilLineIcon,
  PlusIcon,
  ShuffleIcon,
  SparklesIcon,
  UploadIcon
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { ChangeEvent } from "react"
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
import { Label } from "@/components/ui/label"
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
import { cn } from "@/lib/utils"

type ModuleKey = "Marketplace" | "TradeXpo" | "RFQ" | "BFM" | "Mini-site"
type DisplayRule = "random-first" | "manual-order"
type AssetSlotKey = "desktopVi" | "desktopEn" | "mobileVi" | "mobileEn"
type PreviewVariant =
  | "hero"
  | "sidebar-left"
  | "sidebar-right"
  | "in-content"
  | "bottom"
  | "map-strip"

type Company = {
  id: string
  name: string
  profileUrl: string
  category: string
}

type BannerAssets = Record<AssetSlotKey, string>

type AssetRequirement = {
  key: AssetSlotKey
  label: string
  size: string
}

type BannerItem = {
  id: string
  name: string
  companyId: string
  assets: BannerAssets
  startAt: string
  endAt: string
  isActive: boolean
  sortOrder: number
  durationSeconds: number
  clickCount: number
  impressions: number
  profileVisits: number
}

type Placement = {
  id: string
  trackingId: string
  module: ModuleKey
  page: string
  prototypeHref?: string
  positionName: string
  positionNote: string
  assetRequirements: AssetRequirement[]
  previewVariant: PreviewVariant
  displayRule: DisplayRule
  firstBannerOrder: number
  isEnabled: boolean
  publishedAt: string | null
  banners: BannerItem[]
}

type BannerSeed = Omit<
  BannerItem,
  | "id"
  | "durationSeconds"
  | "assets"
  | "clickCount"
  | "impressions"
  | "profileVisits"
> & {
  imageName: string
  durationSeconds?: number
  clickCount?: number
  impressions?: number
  profileVisits?: number
}

type PlacementSeed = Omit<
  Placement,
  "banners" | "publishedAt" | "firstBannerOrder"
> & {
  firstBannerOrder?: number
  banners: BannerSeed[]
}

type MiniSitePlacementSample = {
  code: string
  key: string
  page: string
  placementOneName: string
  placementTwoName: string
}

type BannerDraft = {
  id: string | null
  name: string
  companyId: string
  assets: BannerAssets
  startAt: string
  endAt: string
  isActive: boolean
  sortOrder: number
  durationSeconds: number
}

type PrototypeReference = {
  href?: string
  label: string
  coverage: "available" | "reference" | "planned"
}

const MAX_BANNERS = 5
const DEFAULT_BANNER_DURATION_SECONDS = 5
const MAX_BANNER_DURATION_SECONDS = 60
const MAP_PREVIEW_CELLS = Array.from(
  { length: 15 },
  (_, index) => `map-cell-${index + 1}`
)
const MODULE_TABS: Array<{ value: "all" | ModuleKey; label: string }> = [
  { value: "all", label: "All placements" },
  { value: "Marketplace", label: "Marketplace" },
  { value: "TradeXpo", label: "TradeXpo" },
  { value: "RFQ", label: "RFQ" },
  { value: "BFM", label: "BFM" },
  { value: "Mini-site", label: "Mini-site" }
]

const companies: Company[] = [
  {
    id: "company-an-cuong",
    name: "An Cuong Wood",
    profileUrl: "/supplier/an-cuong-wood",
    category: "Furniture"
  },
  {
    id: "company-vietgreen",
    name: "VietGreen Packaging",
    profileUrl: "/supplier/vietgreen-packaging",
    category: "Packaging"
  },
  {
    id: "company-vina-organics",
    name: "Vina Organics",
    profileUrl: "/supplier/vina-organics",
    category: "Food & Beverage"
  },
  {
    id: "company-napoli",
    name: "Napoli Coffee",
    profileUrl: "/supplier/napoli-coffee",
    category: "Retail & Franchise"
  },
  {
    id: "company-hoang-thien",
    name: "Hoang Thien Equipment",
    profileUrl: "/supplier/hoang-thien-equipment",
    category: "Industrial"
  },
  {
    id: "company-thien-thanh",
    name: "Thien Thanh Construction",
    profileUrl: "/supplier/thien-thanh-construction",
    category: "Building Materials"
  },
  {
    id: "company-vnpt-hcm",
    name: "VNPT Ho Chi Minh City",
    profileUrl: "/supplier/vnpt-ho-chi-minh-city",
    category: "Technology"
  },
  {
    id: "company-aurora-beauty",
    name: "Aurora Beauty Labs",
    profileUrl: "/supplier/aurora-beauty-labs",
    category: "Beauty"
  }
]

function makeAssetRequirements(
  desktopSize: string,
  mobileSize?: string
): AssetRequirement[] {
  const resolvedMobileSize = mobileSize ?? desktopSize

  const requirements: AssetRequirement[] = [
    {
      key: "desktopVi",
      label: "Desktop VN",
      size: desktopSize
    },
    {
      key: "desktopEn",
      label: "Desktop EN",
      size: desktopSize
    },
    {
      key: "mobileVi",
      label: "Mobile VN",
      size: resolvedMobileSize
    },
    {
      key: "mobileEn",
      label: "Mobile EN",
      size: resolvedMobileSize
    }
  ]

  return requirements
}

const placementSeeds: PlacementSeed[] = [
  {
    id: "b2b-homepage-hero-01",
    trackingId: "MKT-HOME-01",
    module: "Marketplace",
    page: "Homepage",
    positionName: "Homepage #1",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "hero",
    displayRule: "random-first",
    isEnabled: true,
    banners: [
      {
        name: "Vietnam Summer Sourcing",
        companyId: "company-vina-organics",
        imageName: "summer-sourcing-hero.png",
        startAt: "2026-06-10T08:00",
        endAt: "2026-06-30T23:00",
        isActive: true,
        sortOrder: 1
      },
      {
        name: "Eco Packaging Week",
        companyId: "company-vietgreen",
        imageName: "eco-packaging-week.png",
        startAt: "2026-06-12T08:00",
        endAt: "2026-06-28T22:00",
        isActive: true,
        sortOrder: 2
      },
      {
        name: "Smart Factory Spotlight",
        companyId: "company-hoang-thien",
        imageName: "smart-factory-spotlight.png",
        startAt: "2026-06-14T08:00",
        endAt: "2026-07-04T23:00",
        isActive: true,
        sortOrder: 3
      },
      {
        name: "Featured Beauty Exporters",
        companyId: "company-aurora-beauty",
        imageName: "featured-beauty-exporters.png",
        startAt: "2026-06-18T08:00",
        endAt: "2026-07-08T23:00",
        isActive: true,
        sortOrder: 4
      }
    ]
  },
  {
    id: "b2b-tab-products-sidebar-01",
    trackingId: "MKT-SRCH-01",
    module: "Marketplace",
    page: "Search result",
    positionName: "Search result #1",
    positionNote: "",
    assetRequirements: makeAssetRequirements("300x600"),
    previewVariant: "sidebar-left",
    displayRule: "manual-order",
    isEnabled: true,
    banners: [
      {
        name: "Verified Furniture Picks",
        companyId: "company-an-cuong",
        imageName: "verified-furniture-picks.png",
        startAt: "2026-06-10T08:00",
        endAt: "2026-06-24T23:00",
        isActive: true,
        sortOrder: 1
      },
      {
        name: "High Intent Leads for Builders",
        companyId: "company-thien-thanh",
        imageName: "high-intent-leads-builders.png",
        startAt: "2026-06-11T08:00",
        endAt: "2026-06-27T23:00",
        isActive: true,
        sortOrder: 2
      }
    ]
  },
  {
    id: "b2b-supplier-home-inline-01",
    trackingId: "MKT-EP-HOME",
    module: "Marketplace",
    page: "Company E-profile",
    positionName: "Company E-profile - Home",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "manual-order",
    isEnabled: true,
    banners: []
  },
  {
    id: "b2b-supplier-product-sidebar-01",
    trackingId: "MKT-EP-PROD",
    module: "Marketplace",
    page: "Company E-profile",
    positionName: "Company E-profile - Products",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340"),
    previewVariant: "sidebar-left",
    displayRule: "manual-order",
    isEnabled: true,
    banners: [
      {
        name: "Coffee Franchise Collection",
        companyId: "company-napoli",
        imageName: "coffee-franchise-collection.png",
        startAt: "2026-06-09T08:00",
        endAt: "2026-06-29T23:00",
        isActive: true,
        sortOrder: 1
      }
    ]
  },
  {
    id: "b2b-supplier-contact-bottom-01",
    trackingId: "MKT-EP-CONTACT",
    module: "Marketplace",
    page: "Company E-profile",
    positionName: "Company E-profile - Contact",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "bottom",
    displayRule: "manual-order",
    isEnabled: false,
    banners: []
  },
  {
    id: "b2b-supplier-company-profile-inline-01",
    trackingId: "MKT-EP-DETAIL",
    module: "Marketplace",
    page: "Company E-profile",
    positionName: "Company E-profile - Company detail",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "random-first",
    isEnabled: true,
    banners: [
      {
        name: "Enterprise Showcase",
        companyId: "company-vnpt-hcm",
        imageName: "enterprise-showcase.png",
        startAt: "2026-06-13T09:00",
        endAt: "2026-07-10T23:00",
        isActive: true,
        sortOrder: 1
      },
      {
        name: "Smart Construction Profile",
        companyId: "company-thien-thanh",
        imageName: "smart-construction-profile.png",
        startAt: "2026-06-15T09:00",
        endAt: "2026-07-06T23:00",
        isActive: false,
        sortOrder: 2
      }
    ]
  },
  {
    id: "b2b-product-detail-collapse-inline-01",
    trackingId: "MKT-HOME-02",
    module: "Marketplace",
    page: "Homepage",
    positionName: "Homepage #2",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "manual-order",
    isEnabled: true,
    banners: []
  },
  {
    id: "tradexpo-homepage-hero-01",
    trackingId: "TX-HOME-01",
    module: "TradeXpo",
    page: "Homepage",
    positionName: "Homepage #1",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "hero",
    displayRule: "random-first",
    isEnabled: true,
    banners: [
      {
        name: "Global Expo Season 2026",
        companyId: "company-vnpt-hcm",
        imageName: "global-expo-season-2026.png",
        startAt: "2026-06-10T08:00",
        endAt: "2026-07-20T23:00",
        isActive: true,
        sortOrder: 1
      },
      {
        name: "Furnishing Expo Launch",
        companyId: "company-an-cuong",
        imageName: "furnishing-expo-launch.png",
        startAt: "2026-06-12T08:00",
        endAt: "2026-07-12T23:00",
        isActive: true,
        sortOrder: 2
      },
      {
        name: "Factory Tech Week",
        companyId: "company-hoang-thien",
        imageName: "factory-tech-week.png",
        startAt: "2026-06-18T08:00",
        endAt: "2026-07-18T23:00",
        isActive: true,
        sortOrder: 3
      }
    ]
  },
  {
    id: "tradexpo-expos-page-inline-01",
    trackingId: "TX-HOME-02",
    module: "TradeXpo",
    page: "Homepage",
    positionName: "Homepage #2",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "manual-order",
    isEnabled: true,
    banners: []
  },
  {
    id: "tradexpo-expos-detail-live-inline-01",
    trackingId: "TX-EXPLORE",
    module: "TradeXpo",
    page: "Explore Industry Shows",
    positionName: "Explore Industry Shows",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "random-first",
    isEnabled: true,
    banners: [
      {
        name: "Meet Export-ready Suppliers",
        companyId: "company-vietgreen",
        imageName: "meet-export-ready-suppliers.png",
        startAt: "2026-06-16T08:00",
        endAt: "2026-07-03T23:00",
        isActive: true,
        sortOrder: 1
      },
      {
        name: "Organic Food Showcase",
        companyId: "company-vina-organics",
        imageName: "organic-food-showcase.png",
        startAt: "2026-06-19T08:00",
        endAt: "2026-07-08T23:00",
        isActive: true,
        sortOrder: 2
      }
    ]
  },
  {
    id: "tradexpo-select-booth-tier-inline-01",
    trackingId: "TX-BOOTH",
    module: "TradeXpo",
    page: "Select Booth Tier",
    positionName: "Select Booth Tier",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "manual-order",
    isEnabled: true,
    banners: [
      {
        name: "Reserve Premium Booths",
        companyId: "company-vnpt-hcm",
        imageName: "reserve-premium-booths.png",
        startAt: "2026-06-09T08:00",
        endAt: "2026-06-25T23:00",
        isActive: true,
        sortOrder: 1
      }
    ]
  },
  {
    id: "tradexpo-3d-exhibition-map-strip-01",
    trackingId: "TX-MAP",
    module: "TradeXpo",
    page: "3D Exhibition Map",
    positionName: "3D Exhibition Map",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1269x95"),
    previewVariant: "map-strip",
    displayRule: "manual-order",
    isEnabled: true,
    banners: []
  },
  {
    id: "rfq-homepage-hero-01",
    trackingId: "RFQ-HOME",
    module: "RFQ",
    page: "RFQ Homepage",
    positionName: "RFQ Homepage",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "hero",
    displayRule: "random-first",
    isEnabled: true,
    banners: []
  },
  {
    id: "rfq-create-ai-inline-01",
    trackingId: "RFQ-AI",
    module: "RFQ",
    page: "Create RFQ with AI",
    positionName: "Create RFQ with AI",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "manual-order",
    isEnabled: true,
    banners: []
  },
  {
    id: "rfq-my-quotations-01",
    trackingId: "RFQ-MYQ",
    module: "RFQ",
    page: "My Quotations",
    positionName: "My Quotations",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "manual-order",
    isEnabled: true,
    banners: []
  },
  {
    id: "rfq-detail-my-quotations-01",
    trackingId: "RFQ-MYQ-DETAIL",
    module: "RFQ",
    page: "Detail My Quotations",
    positionName: "Detail My Quotations",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "random-first",
    isEnabled: false,
    banners: []
  },
  {
    id: "rfq-my-rfqs-01",
    trackingId: "RFQ-MYRFQ",
    module: "RFQ",
    page: "My RFQs",
    positionName: "My RFQs",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "manual-order",
    isEnabled: true,
    banners: []
  },
  {
    id: "rfq-detail-my-rfqs-01",
    trackingId: "RFQ-MYRFQ-DETAIL",
    module: "RFQ",
    page: "Detail My RFQs",
    positionName: "Detail My RFQs",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "sidebar-right",
    displayRule: "manual-order",
    isEnabled: true,
    banners: []
  },
  {
    id: "bfm-homepage-hero-01",
    trackingId: "BFM-HOME",
    module: "BFM",
    page: "BFM Homepage",
    positionName: "BFM Homepage",
    positionNote: "",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "hero",
    displayRule: "random-first",
    isEnabled: true,
    banners: []
  },
  {
    id: "tenant-tbsg-homepage-01",
    trackingId: "TEN-TBSG-HOME-01",
    module: "Mini-site",
    page: "TBSG Homepage",
    prototypeHref: "/partner/hdn-taybacsaigon",
    positionName: "TBSG Homepage #1",
    positionNote:
      "Homepage banner slot shown after Buyer Find & Match on the TBSG mini-site.",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "manual-order",
    isEnabled: true,
    banners: [
      {
        name: "TBSG Supplier Spotlight",
        companyId: "company-vietgreen",
        imageName: "tbsg-supplier-spotlight.png",
        startAt: "2026-06-15T08:00",
        endAt: "2026-07-15T23:00",
        isActive: true,
        sortOrder: 1
      }
    ]
  },
  {
    id: "tenant-tbsg-homepage-02",
    trackingId: "TEN-TBSG-HOME-02",
    module: "Mini-site",
    page: "TBSG Homepage",
    prototypeHref: "/partner/hdn-taybacsaigon",
    positionName: "TBSG Homepage #2",
    positionNote:
      "Homepage banner slot shown after the Expo Banner block on the TBSG mini-site.",
    assetRequirements: makeAssetRequirements("1284x340", "300x600"),
    previewVariant: "in-content",
    displayRule: "manual-order",
    isEnabled: true,
    banners: [
      {
        name: "TBSG Partner Campaign",
        companyId: "company-vnpt-hcm",
        imageName: "tbsg-partner-campaign.png",
        startAt: "2026-06-18T08:00",
        endAt: "2026-07-18T23:00",
        isActive: true,
        sortOrder: 1
      }
    ]
  }
]

const miniSitePlacementSamples: MiniSitePlacementSample[] = [
  {
    key: "tnsg",
    code: "TNSG",
    page: "TNSG Homepage",
    placementOneName: "TNSG Supplier Spotlight",
    placementTwoName: "TNSG Program Campaign"
  },
  {
    key: "vnsg",
    code: "VNSG",
    page: "VNSG Homepage",
    placementOneName: "VNSG Gateway Spotlight",
    placementTwoName: "VNSG Partner Campaign"
  }
]

const baseMiniSitePlacements = placementSeeds.filter((placement) =>
  placement.id.startsWith("tenant-tbsg-homepage-")
)

placementSeeds.push(
  ...miniSitePlacementSamples.flatMap((sample) =>
    cloneMiniSitePlacementSeeds(baseMiniSitePlacements, sample)
  )
)

const initialPlacements: Placement[] = placementSeeds.map((placement) => ({
  ...placement,
  firstBannerOrder: placement.firstBannerOrder ?? 1,
  publishedAt: placement.isEnabled ? "2026-06-10T09:00:00+07:00" : null,
  banners: normalizeBannerOrders(
    placement.banners.map((banner, index) => ({
      id: `${placement.id}-banner-${index + 1}`,
      name: banner.name,
      companyId: banner.companyId,
      assets: createSeedAssets(banner.imageName, placement.assetRequirements),
      startAt: banner.startAt,
      endAt: banner.endAt,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      durationSeconds:
        banner.durationSeconds ?? DEFAULT_BANNER_DURATION_SECONDS,
      clickCount: banner.clickCount ?? getSeedClickCount(index),
      impressions: banner.impressions ?? getSeedImpressions(index),
      profileVisits: banner.profileVisits ?? getSeedProfileVisits(index)
    }))
  )
}))

export function BannerAdsManagement() {
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const [placements, setPlacements] = useState(initialPlacements)
  const [activeModule, setActiveModule] =
    useState<(typeof MODULE_TABS)[number]["value"]>("all")
  const [activePage, setActivePage] = useState("all")
  const [selectedPlacementId, setSelectedPlacementId] = useState(
    initialPlacements[0]?.id ?? ""
  )
  const [activeView, setActiveView] = useState<"list" | "detail">("list")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [draft, setDraft] = useState<BannerDraft>(createEmptyDraft(1))
  const [dialogError, setDialogError] = useState("")
  const isMiniSiteSurface = activeModule === "Mini-site"

  const availablePages = useMemo(() => {
    const scoped =
      activeModule === "all"
        ? placements
        : placements.filter((placement) => placement.module === activeModule)

    return Array.from(new Set(scoped.map((placement) => placement.page))).sort(
      (left, right) => left.localeCompare(right)
    )
  }, [activeModule, placements])

  const filteredPlacements = useMemo(() => {
    const moduleScoped =
      activeModule === "all"
        ? placements
        : placements.filter((placement) => placement.module === activeModule)

    const scoped =
      !isMiniSiteSurface || activePage === "all"
        ? moduleScoped
        : moduleScoped.filter((placement) => placement.page === activePage)

    return scoped.sort((left, right) => {
      if (left.module !== right.module) {
        return left.module.localeCompare(right.module)
      }
      return left.trackingId.localeCompare(right.trackingId)
    })
  }, [activeModule, activePage, isMiniSiteSurface, placements])

  const selectedPlacement =
    placements.find((placement) => placement.id === selectedPlacementId) ??
    filteredPlacements[0]
  const selectedPrototypeReference = selectedPlacement
    ? getPrototypeReference(selectedPlacement)
    : null
  const relatedPlacements = selectedPlacement
    ? placements
        .filter(
          (placement) =>
            placement.module === selectedPlacement.module &&
            placement.page === selectedPlacement.page
        )
        .sort((left, right) => left.trackingId.localeCompare(right.trackingId))
    : []

  const totalActiveBanners = placements.reduce(
    (count, placement) => count + getActiveBannerCount(placement),
    0
  )
  const randomPlacements = placements.filter(
    (placement) => placement.displayRule === "random-first"
  ).length
  const manualPlacements = placements.length - randomPlacements
  const placementsWithInventory = placements.filter(
    (placement) => placement.banners.length > 0
  ).length

  useEffect(() => {
    const moduleParam = searchParams.get("module")
    const pageParam = searchParams.get("page")
    const placementParam =
      searchParams.get("placementId") ??
      searchParams.get("placement") ??
      searchParams.get("trackingId")

    const nextModule = MODULE_TABS.some((tab) => tab.value === moduleParam)
      ? (moduleParam as (typeof MODULE_TABS)[number]["value"])
      : "all"

    const moduleScoped =
      nextModule === "all"
        ? initialPlacements
        : initialPlacements.filter(
            (placement) => placement.module === nextModule
          )

    const nextPage =
      nextModule === "Mini-site" &&
      pageParam &&
      moduleScoped.some((placement) => placement.page === pageParam)
        ? pageParam
        : "all"

    const pageScoped =
      nextPage === "all"
        ? moduleScoped
        : moduleScoped.filter((placement) => placement.page === nextPage)

    const nextPlacement =
      (placementParam
        ? (pageScoped.find(
            (placement) =>
              placement.id === placementParam ||
              placement.trackingId === placementParam
          ) ??
          moduleScoped.find(
            (placement) =>
              placement.id === placementParam ||
              placement.trackingId === placementParam
          ))
        : null) ??
      pageScoped[0] ??
      moduleScoped[0] ??
      initialPlacements[0]

    setActiveModule(nextModule)
    setActivePage(nextPage)
    setSelectedPlacementId(nextPlacement?.id ?? "")
    setActiveView("list")
  }, [searchParamsKey])

  function handleModuleChange(
    nextModule: (typeof MODULE_TABS)[number]["value"]
  ) {
    setActiveModule(nextModule)
    setActivePage("all")
    setActiveView("list")
    const nextPlacement =
      nextModule === "all"
        ? placements[0]
        : placements.find((placement) => placement.module === nextModule)
    if (nextPlacement) {
      setSelectedPlacementId(nextPlacement.id)
    }
  }

  function handlePageChange(nextPage: string) {
    setActivePage(nextPage)
    setActiveView("list")

    const moduleScoped =
      activeModule === "all"
        ? placements
        : placements.filter((placement) => placement.module === activeModule)
    const nextPlacement =
      nextPage === "all"
        ? moduleScoped[0]
        : moduleScoped.find((placement) => placement.page === nextPage)

    if (nextPlacement) {
      setSelectedPlacementId(nextPlacement.id)
    }
  }

  function updatePlacement(
    placementId: string,
    patch: Partial<Omit<Placement, "id" | "banners">>
  ) {
    setPlacements((current) =>
      current.map((placement) => {
        if (placement.id !== placementId) return placement
        return {
          ...placement,
          ...patch
        }
      })
    )
  }

  function openPlacementDetail(placementId: string) {
    setSelectedPlacementId(placementId)
    setActiveView("detail")
  }

  function updateBanner(
    placementId: string,
    bannerId: string,
    patch: Partial<BannerItem>
  ) {
    setPlacements((current) =>
      current.map((placement) => {
        if (placement.id !== placementId) return placement
        return {
          ...placement,
          banners: normalizeBannerOrders(
            placement.banners.map((banner) =>
              banner.id === bannerId ? { ...banner, ...patch } : banner
            )
          )
        }
      })
    )
  }

  function moveBannerDisplayOrder(
    placementId: string,
    bannerId: string,
    direction: -1 | 1
  ) {
    setPlacements((current) =>
      current.map((placement) => {
        if (placement.id !== placementId) return placement

        const orderedBanners = getOrderedBanners(placement)
        const currentIndex = orderedBanners.findIndex(
          (banner) => banner.id === bannerId
        )
        const targetIndex = currentIndex + direction

        if (
          currentIndex < 0 ||
          targetIndex < 0 ||
          targetIndex >= orderedBanners.length
        ) {
          return placement
        }

        const currentBanner = orderedBanners[currentIndex]
        const targetBanner = orderedBanners[targetIndex]

        return {
          ...placement,
          firstBannerOrder: clampOrderForCount(
            placement.firstBannerOrder,
            placement.banners.length
          ),
          banners: placement.banners.map((banner) => {
            if (banner.id === currentBanner.id) {
              return { ...banner, sortOrder: targetBanner.sortOrder }
            }
            if (banner.id === targetBanner.id) {
              return { ...banner, sortOrder: currentBanner.sortOrder }
            }
            return banner
          })
        }
      })
    )
  }

  function updateFirstBannerOrder(nextOrder: number) {
    if (!selectedPlacement) return

    updatePlacement(selectedPlacement.id, {
      firstBannerOrder: clampOrderForCount(
        nextOrder,
        selectedPlacement.banners.length
      )
    })
  }

  function openCreateBanner() {
    if (!selectedPlacement) return
    setDialogError("")
    setDraft(createEmptyDraft(selectedPlacement.banners.length + 1))
    setIsDialogOpen(true)
  }

  function publishPlacement() {
    if (!selectedPlacement) return

    updatePlacement(selectedPlacement.id, {
      isEnabled: true,
      publishedAt: new Date().toISOString()
    })
  }

  function openEditBanner(banner: BannerItem) {
    setDialogError("")
    setDraft({
      id: banner.id,
      name: banner.name,
      companyId: banner.companyId,
      assets: {
        ...banner.assets
      },
      startAt: banner.startAt,
      endAt: banner.endAt,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      durationSeconds: banner.durationSeconds
    })
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setDialogError("")
  }

  function handleAssetFileChange(key: AssetSlotKey) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      setDraft((current) => ({
        ...current,
        assets: {
          ...current.assets,
          [key]: file.name
        }
      }))
    }
  }

  function saveBanner() {
    if (!selectedPlacement) return

    const trimmedName = draft.name.trim()
    if (!trimmedName) {
      setDialogError("Banner name is required.")
      return
    }
    const hasMissingAsset = selectedPlacement.assetRequirements.some(
      (requirement) => !draft.assets[requirement.key]?.trim()
    )
    if (hasMissingAsset) {
      setDialogError("Please upload all required banner assets.")
      return
    }
    if (!draft.startAt || !draft.endAt) {
      setDialogError("Start time and end time are required.")
      return
    }
    if (new Date(draft.startAt).getTime() >= new Date(draft.endAt).getTime()) {
      setDialogError("End time must be later than start time.")
      return
    }
    if (!draft.id && selectedPlacement.banners.length >= MAX_BANNERS) {
      setDialogError("This placement already has the maximum of 5 banners.")
      return
    }

    const nextBanner: BannerItem = {
      id: draft.id ?? `${selectedPlacement.id}-banner-${Date.now()}`,
      name: trimmedName,
      companyId: draft.companyId,
      assets: normalizeAssets(draft.assets),
      startAt: draft.startAt,
      endAt: draft.endAt,
      isActive: draft.isActive,
      sortOrder: clampSortOrder(draft.sortOrder),
      durationSeconds: clampBannerDurationSeconds(draft.durationSeconds),
      clickCount:
        selectedPlacement.banners.find((banner) => banner.id === draft.id)
          ?.clickCount ?? 0,
      impressions:
        selectedPlacement.banners.find((banner) => banner.id === draft.id)
          ?.impressions ?? 0,
      profileVisits:
        selectedPlacement.banners.find((banner) => banner.id === draft.id)
          ?.profileVisits ?? 0
    }

    setPlacements((current) =>
      current.map((placement) => {
        if (placement.id !== selectedPlacement.id) return placement

        const nextBanners = draft.id
          ? placement.banners.map((banner) =>
              banner.id === draft.id ? nextBanner : banner
            )
          : [...placement.banners, nextBanner]

        return {
          ...placement,
          banners: normalizeBannerOrders(nextBanners)
        }
      })
    )

    setIsDialogOpen(false)
    setDialogError("")
  }

  return (
    <div className="mt-6 space-y-6">
      {activeView === "list" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Placements"
              value={placements.length}
              icon={<Layers3Icon className="size-4 text-sky-600" />}
            />
            <MetricCard
              label="Placements with banners"
              value={placementsWithInventory}
              icon={<ImageIcon className="size-4 text-orange-600" />}
            />
            <MetricCard
              label="Active banners"
              value={totalActiveBanners}
              icon={<SparklesIcon className="size-4 text-emerald-600" />}
            />
            <MetricCard
              label="Display rules"
              value={`${randomPlacements}/${manualPlacements}`}
              icon={<ShuffleIcon className="size-4 text-violet-600" />}
            />
          </div>

          <div
            className={cn(
              "grid gap-4",
              isMiniSiteSurface
                ? "md:grid-cols-2 xl:max-w-2xl"
                : "w-full xl:max-w-xs"
            )}
          >
            <Field>
              <Label>Surface</Label>
              <Select
                value={activeModule}
                onValueChange={(value) =>
                  handleModuleChange(
                    value as (typeof MODULE_TABS)[number]["value"]
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_TABS.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {isMiniSiteSurface ? (
              <Field>
                <Label>Page</Label>
                <Select value={activePage} onValueChange={handlePageChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All pages</SelectItem>
                    {availablePages.map((page) => (
                      <SelectItem key={page} value={page}>
                        {page}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
          </div>

          <Card className="border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinnedIcon className="size-5 text-legend" />
                Banner Placements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Surface</TableHead>
                      <TableHead className="w-[150px]">Page</TableHead>
                      <TableHead className="w-[160px]">ID</TableHead>
                      <TableHead className="min-w-[260px]">
                        Position name
                      </TableHead>
                      <TableHead className="w-[110px] text-center">
                        Banners
                      </TableHead>
                      <TableHead className="w-[130px]">Display rule</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlacements.length > 0 ? (
                      filteredPlacements.map((placement) => {
                        const isSelected =
                          placement.id === selectedPlacement?.id
                        return (
                          <TableRow
                            key={placement.id}
                            className={cn(
                              "cursor-pointer align-top hover:bg-muted/40",
                              isSelected && "bg-muted/60"
                            )}
                            onClick={() => openPlacementDetail(placement.id)}
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={moduleTone(placement.module)}
                              >
                                {placement.module}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {placement.page}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {placement.trackingId}
                            </TableCell>
                            <TableCell className="space-y-1 whitespace-normal">
                              <p className="font-medium text-foreground">
                                {placement.positionName}
                              </p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">
                                {placement.banners.length}/{MAX_BANNERS}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <RuleBadge rule={placement.displayRule} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge active={placement.isEnabled} />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No placements found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : selectedPlacement ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-2xl tracking-tight">
                  Placement Detail
                </h2>
                <Badge
                  variant="outline"
                  className={moduleTone(selectedPlacement.module)}
                >
                  {selectedPlacement.module}
                </Badge>
                <StatusBadge active={selectedPlacement.isEnabled} />
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="space-y-6">
              <Card className="border-foreground/10">
                <CardHeader>
                  <CardTitle>{selectedPlacement.positionName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoPill
                      label="ID"
                      value={selectedPlacement.trackingId}
                      icon={
                        <LinkIcon className="size-3.5 text-muted-foreground" />
                      }
                    />
                    <InfoPill
                      label="Max banners"
                      value={`${MAX_BANNERS} fixed`}
                      icon={
                        <Layers3Icon className="size-3.5 text-muted-foreground" />
                      }
                    />
                    <InfoPill
                      label="Required size"
                      value={getSizeRequirementSummary(selectedPlacement)}
                      icon={
                        <ImageIcon className="size-3.5 text-muted-foreground" />
                      }
                    />
                    <InfoPill
                      label="Total clicks"
                      value={formatNumber(getTotalClicks(selectedPlacement))}
                      icon={
                        <MousePointerClickIcon className="size-3.5 text-muted-foreground" />
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <div className="rounded-xl border bg-muted/30 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-sm">Placement enabled</p>
                        <Switch
                          checked={selectedPlacement.isEnabled}
                          onCheckedChange={(isEnabled) =>
                            updatePlacement(selectedPlacement.id, { isEnabled })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-foreground/10">
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                  <CardTitle>Banner Inventory</CardTitle>
                  <Button
                    size="sm"
                    onClick={openCreateBanner}
                    disabled={selectedPlacement.banners.length >= MAX_BANNERS}
                  >
                    <PlusIcon className="size-4" />
                    Add banner
                  </Button>
                </CardHeader>
                <CardContent>
                  <DisplayOrderPanel
                    placement={selectedPlacement}
                    onDisplayRuleChange={(displayRule) =>
                      updatePlacement(selectedPlacement.id, { displayRule })
                    }
                    onFirstBannerOrderChange={updateFirstBannerOrder}
                  />

                  {selectedPlacement.banners.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {getOrderedBanners(selectedPlacement).map(
                        (banner, index) => {
                          const company = getCompany(banner.companyId)
                          return (
                            <div
                              key={banner.id}
                              className="rounded-2xl border bg-white p-4 shadow-sm"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-foreground text-sm">
                                      {banner.name}
                                    </p>
                                    <StatusBadge active={banner.isActive} />
                                  </div>
                                  <p className="text-muted-foreground text-xs">
                                    {getUploadedAssetCount(
                                      banner.assets,
                                      selectedPlacement.assetRequirements
                                    )}
                                    /
                                    {selectedPlacement.assetRequirements.length}{" "}
                                    assets
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <RankingControls
                                    label={banner.name}
                                    order={banner.sortOrder}
                                    canMoveUp={index > 0}
                                    canMoveDown={
                                      index <
                                      selectedPlacement.banners.length - 1
                                    }
                                    onMoveUp={() =>
                                      moveBannerDisplayOrder(
                                        selectedPlacement.id,
                                        banner.id,
                                        -1
                                      )
                                    }
                                    onMoveDown={() =>
                                      moveBannerDisplayOrder(
                                        selectedPlacement.id,
                                        banner.id,
                                        1
                                      )
                                    }
                                  />
                                  <Switch
                                    checked={banner.isActive}
                                    onCheckedChange={(isActive) =>
                                      updateBanner(
                                        selectedPlacement.id,
                                        banner.id,
                                        {
                                          isActive
                                        }
                                      )
                                    }
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditBanner(banner)}
                                  >
                                    <PencilLineIcon className="size-4" />
                                    Edit
                                  </Button>
                                </div>
                              </div>

                              <BannerMetricGrid banner={banner} />

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <InfoPill
                                  label="Assets"
                                  value={`${getUploadedAssetCount(
                                    banner.assets,
                                    selectedPlacement.assetRequirements
                                  )}/${selectedPlacement.assetRequirements.length} files`}
                                  icon={
                                    <ImageIcon className="size-3.5 text-muted-foreground" />
                                  }
                                />
                                <InfoPill
                                  label="Target company"
                                  value={company?.name ?? "Not set"}
                                  icon={
                                    <Building2Icon className="size-3.5 text-muted-foreground" />
                                  }
                                />
                                <InfoPill
                                  label="Target URL"
                                  value={company?.profileUrl ?? "-"}
                                  icon={
                                    <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
                                  }
                                />
                                <InfoPill
                                  label="Duration"
                                  value={`${banner.durationSeconds} seconds`}
                                  icon={
                                    <Clock3Icon className="size-3.5 text-muted-foreground" />
                                  }
                                />
                                <InfoPill
                                  label="Start"
                                  value={formatDateTime(banner.startAt)}
                                  icon={
                                    <Clock3Icon className="size-3.5 text-muted-foreground" />
                                  }
                                />
                                <InfoPill
                                  label="End"
                                  value={formatDateTime(banner.endAt)}
                                  icon={
                                    <Clock3Icon className="size-3.5 text-muted-foreground" />
                                  }
                                />
                              </div>
                            </div>
                          )
                        }
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed bg-white px-4 py-10 text-center text-muted-foreground text-sm">
                      No banners
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-foreground/10 bg-gradient-to-b from-slate-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <InfoIcon className="size-5 text-sky-600" />
                    Preview & publish
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={publishPlacement}
                      disabled={selectedPlacement.banners.length === 0}
                    >
                      {selectedPlacement.publishedAt ? "Republish" : "Publish"}
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    <InfoPill
                      label="Preview source"
                      value={getCoverageLabel(
                        selectedPrototypeReference?.coverage
                      )}
                      icon={
                        <EyeIcon className="size-3.5 text-muted-foreground" />
                      }
                    />
                    <InfoPill
                      label="Last published"
                      value={formatPublishedAt(selectedPlacement.publishedAt)}
                      icon={
                        <Clock3Icon className="size-3.5 text-muted-foreground" />
                      }
                    />
                    <InfoPill
                      label="Duration"
                      value="Configured per banner"
                      icon={
                        <Clock3Icon className="size-3.5 text-muted-foreground" />
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Placement Preview</DialogTitle>
          </DialogHeader>

          {selectedPlacement ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <PlacementPreview
                placement={selectedPlacement}
                relatedPlacements={relatedPlacements}
                onSelectPlacement={setSelectedPlacementId}
              />

              <div className="space-y-3">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="font-medium text-foreground text-sm">
                    {selectedPlacement.positionName}
                  </p>
                  <p className="mt-1 font-mono text-muted-foreground text-xs">
                    {selectedPlacement.trackingId}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <RuleBadge rule={selectedPlacement.displayRule} />
                    <StatusBadge active={selectedPlacement.isEnabled} />
                  </div>
                </div>

                <InfoPill
                  label="Required size"
                  value={getSizeRequirementSummary(selectedPlacement)}
                  icon={
                    <ImageIcon className="size-3.5 text-muted-foreground" />
                  }
                />

                <InfoPill
                  label="Duration"
                  value={getDurationSummary(selectedPlacement.banners)}
                  icon={
                    <Clock3Icon className="size-3.5 text-muted-foreground" />
                  }
                />

                <InfoPill
                  label="Total clicks"
                  value={formatNumber(getTotalClicks(selectedPlacement))}
                  icon={
                    <MousePointerClickIcon className="size-3.5 text-muted-foreground" />
                  }
                />

                <InfoPill
                  label="Last published"
                  value={formatPublishedAt(selectedPlacement.publishedAt)}
                  icon={
                    <UploadIcon className="size-3.5 text-muted-foreground" />
                  }
                />

                <div className="rounded-2xl border bg-white p-4">
                  <p className="font-medium text-foreground text-sm">
                    Active banners
                  </p>
                  <div className="mt-3 space-y-2">
                    {selectedPlacement.banners.length > 0 ? (
                      getDisplayBanners(selectedPlacement).map((banner) => (
                        <div
                          key={banner.id}
                          className="rounded-xl border bg-muted/30 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-sm">{banner.name}</p>
                            <StatusBadge active={banner.isActive} />
                          </div>
                          <p className="mt-1 text-muted-foreground text-xs">
                            {getUploadedAssetCount(
                              banner.assets,
                              selectedPlacement.assetRequirements
                            )}
                            /{selectedPlacement.assetRequirements.length} assets
                            • {banner.durationSeconds} seconds •{" "}
                            {formatNumber(banner.impressions)} impressions •{" "}
                            {formatNumber(banner.clickCount)} clicks •{" "}
                            {formatPercent(getCtr(banner))} CTR •{" "}
                            {formatNumber(banner.profileVisits)} visits
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        No banners
                      </p>
                    )}
                  </div>
                </div>

                {selectedPrototypeReference?.href ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      href={selectedPrototypeReference.href}
                      target="_blank"
                    >
                      <ExternalLinkIcon className="size-4" />
                      {selectedPrototypeReference.label}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>

          {selectedPlacement ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">
                  {selectedPlacement.positionName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {selectedPlacement.trackingId} • Max {MAX_BANNERS} banners •
                  Rule: {getRuleLabel(selectedPlacement.displayRule)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {getSizeRequirementSummary(selectedPlacement)}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <RequiredLabel htmlFor="banner-name">
                    Banner name
                  </RequiredLabel>
                  <Input
                    id="banner-name"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    placeholder="Homepage promo wave 01"
                  />
                </Field>

                <Field>
                  <Label htmlFor="banner-company">Target company</Label>
                  <Select
                    value={draft.companyId}
                    onValueChange={(companyId) =>
                      setDraft((current) => ({
                        ...current,
                        companyId
                      }))
                    }
                  >
                    <SelectTrigger id="banner-company" className="w-full">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {selectedPlacement.assetRequirements.map((requirement) => (
                  <Field key={requirement.key}>
                    <RequiredLabel htmlFor={`banner-${requirement.key}`}>
                      {requirement.label}
                    </RequiredLabel>
                    <div className="rounded-2xl border border-dashed bg-muted/20 p-3">
                      <p className="text-muted-foreground text-xs">
                        {requirement.size}
                      </p>
                      <label
                        htmlFor={`banner-${requirement.key}`}
                        className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        <UploadIcon className="size-4" />
                        Choose file
                      </label>
                      <input
                        id={`banner-${requirement.key}`}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleAssetFileChange(requirement.key)}
                      />
                      <p className="mt-2 text-muted-foreground text-xs">
                        {draft.assets[requirement.key] || "No file"}
                      </p>
                    </div>
                  </Field>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label htmlFor="banner-target-url">Target URL</Label>
                  <Input
                    id="banner-target-url"
                    value={
                      companies.find(
                        (company) => company.id === draft.companyId
                      )?.profileUrl ?? ""
                    }
                    readOnly
                    placeholder="No company selected"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <RequiredLabel htmlFor="banner-start">
                    Start datetime
                  </RequiredLabel>
                  <Input
                    id="banner-start"
                    type="datetime-local"
                    value={draft.startAt}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        startAt: event.target.value
                      }))
                    }
                  />
                </Field>

                <Field>
                  <RequiredLabel htmlFor="banner-end">
                    End datetime
                  </RequiredLabel>
                  <Input
                    id="banner-end"
                    type="datetime-local"
                    value={draft.endAt}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        endAt: event.target.value
                      }))
                    }
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <RequiredLabel htmlFor="banner-duration">
                    Duration time
                  </RequiredLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="banner-duration"
                      type="number"
                      min={1}
                      max={MAX_BANNER_DURATION_SECONDS}
                      step={1}
                      inputMode="numeric"
                      value={draft.durationSeconds}
                      onChange={(event) => {
                        const nextValue = Number.parseInt(
                          event.target.value,
                          10
                        )
                        if (Number.isNaN(nextValue)) return

                        setDraft((current) => ({
                          ...current,
                          durationSeconds: clampBannerDurationSeconds(nextValue)
                        }))
                      }}
                      className="w-28"
                    />
                    <span className="text-muted-foreground text-sm">
                      seconds
                    </span>
                  </div>
                </Field>

                <div className="rounded-2xl border bg-muted/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-sm">Banner active</p>
                    <Switch
                      checked={draft.isActive}
                      onCheckedChange={(isActive) =>
                        setDraft((current) => ({
                          ...current,
                          isActive
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {dialogError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive text-sm">
                  {dialogError}
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={saveBanner}>
              {draft.id ? "Save changes" : "Create banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({
  label,
  value,
  helper,
  icon
}: {
  label: string
  value: number | string
  helper?: string
  icon: React.ReactNode
}) {
  return (
    <Card className="bg-gradient-to-br from-white to-slate-50" size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {label}
          </p>
          {icon}
        </div>
        <p className="font-semibold text-2xl">{value}</p>
        {helper ? (
          <p className="text-muted-foreground text-xs">{helper}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>
}

function RequiredLabel({
  htmlFor,
  children
}: {
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="ml-1 text-destructive">*</span>
    </Label>
  )
}

function DisplayOrderPanel({
  placement,
  onDisplayRuleChange,
  onFirstBannerOrderChange
}: {
  placement: Placement
  onDisplayRuleChange: (value: DisplayRule) => void
  onFirstBannerOrderChange: (nextOrder: number) => void
}) {
  const orderedBanners = getOrderedBanners(placement)
  if (orderedBanners.length === 0) return null

  const displaySequence = getDisplayBanners(placement)

  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground text-sm">Display order</p>
          <p className="mt-1 text-muted-foreground text-xs">
            {orderedBanners.length}/{MAX_BANNERS} banners
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[220px_220px_minmax(0,1fr)]">
        <ConfigSelect
          label="Display rule"
          value={placement.displayRule}
          options={[
            {
              value: "random-first",
              label: "Random first, then follow order"
            },
            {
              value: "manual-order",
              label: "Start from selected order"
            }
          ]}
          onChange={(displayRule) =>
            onDisplayRuleChange(displayRule as DisplayRule)
          }
        />

        <Field>
          <Label>Start from</Label>
          {placement.displayRule === "manual-order" ? (
            <Select
              value={String(placement.firstBannerOrder)}
              onValueChange={(value) => onFirstBannerOrderChange(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getOrderOptions(orderedBanners).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-xl border bg-background px-3 py-2 text-sm">
              Random
            </div>
          )}
        </Field>

        <Field>
          <Label>Display sequence</Label>
          <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-xl border bg-background px-3 py-2">
            {displaySequence.map((banner) => (
              <Badge key={banner.id} variant="secondary">
                #{banner.sortOrder}
              </Badge>
            ))}
          </div>
        </Field>
      </div>
    </div>
  )
}

function RankingControls({
  label,
  order,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown
}: {
  label: string
  order: number
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <GripVerticalIcon className="size-4 text-muted-foreground" />
      <Badge variant="secondary">#{order}</Badge>
      <div className="flex overflow-hidden rounded-lg border bg-background">
        <button
          type="button"
          className="border-r p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          aria-label={`Move ${label} up`}
        >
          <ArrowUpIcon className="size-3.5" />
        </button>
        <button
          type="button"
          className="p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          aria-label={`Move ${label} down`}
        >
          <ArrowDownIcon className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function ConfigSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function InfoPill({
  label,
  value,
  icon
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wide">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 font-medium text-foreground text-sm">{value}</p>
    </div>
  )
}

function BannerMetricGrid({ banner }: { banner: BannerItem }) {
  const metrics = [
    {
      label: "Impressions",
      value: formatNumber(banner.impressions)
    },
    {
      label: "Clicks",
      value: formatNumber(banner.clickCount)
    },
    {
      label: "CTR",
      value: formatPercent(getCtr(banner))
    },
    {
      label: "Profile visits",
      value: formatNumber(banner.profileVisits)
    }
  ]

  return (
    <div className="mt-4 grid gap-2 md:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border bg-muted/20 px-3 py-2"
        >
          <p className="text-[11px] text-muted-foreground uppercase">
            {metric.label}
          </p>
          <p className="mt-1 font-semibold text-foreground text-sm">
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  )
}

function RuleBadge({ rule }: { rule: DisplayRule }) {
  if (rule === "random-first") {
    return (
      <Badge
        variant="outline"
        className="border-violet-200 bg-violet-50 text-violet-700"
      >
        <ShuffleIcon className="size-3" />
        Random first
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-orange-200 bg-orange-50 text-orange-700"
    >
      <ArrowUpDownIcon className="size-3" />
      Selected first
    </Badge>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700"
    >
      Active
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-slate-200 bg-slate-100 text-slate-600"
    >
      Inactive
    </Badge>
  )
}

function PlacementPreview({
  placement,
  relatedPlacements,
  onSelectPlacement
}: {
  placement: Placement
  relatedPlacements: Placement[]
  onSelectPlacement: (placementId: string) => void
}) {
  const prototypeReference = getPrototypeReference(placement)

  return (
    <div className="space-y-3 rounded-2xl border bg-slate-950/95 p-4 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-white/70 text-xs">{placement.positionName}</p>
          <CoverageBadge coverage={prototypeReference.coverage} />
        </div>
        {prototypeReference.href ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={prototypeReference.href} target="_blank">
              <ExternalLinkIcon className="size-4" />
              {prototypeReference.label}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-4 text-slate-950">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="h-3 w-28 rounded-full bg-slate-200" />
          <div className="h-3 w-16 rounded-full bg-slate-100" />
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 grid gap-3">
            <div className="h-10 rounded-2xl bg-white shadow-sm" />
            <div className="h-14 rounded-2xl bg-slate-100" />
          </div>

          <div className="grid gap-3">
            <div className="h-14 rounded-2xl bg-white/90 shadow-sm" />
            <div className="h-16 rounded-2xl bg-slate-100" />
            <div className="grid gap-3 md:grid-cols-[150px_1fr_130px]">
              <div className="h-44 rounded-2xl bg-white shadow-sm" />
              <div className="space-y-3">
                <div className="h-12 rounded-2xl bg-white shadow-sm" />
                <div className="h-12 rounded-2xl bg-white shadow-sm" />
                <div className="h-12 rounded-2xl bg-white shadow-sm" />
              </div>
              <div className="h-44 rounded-2xl bg-white shadow-sm" />
            </div>
            <div className="h-18 rounded-2xl bg-white shadow-sm" />
            <div className="grid grid-cols-5 gap-2 rounded-2xl bg-slate-100 p-3">
              {MAP_PREVIEW_CELLS.map((cellId) => (
                <div
                  key={cellId}
                  className="aspect-square rounded-md bg-white"
                />
              ))}
            </div>
            <div className="h-14 rounded-2xl bg-white shadow-sm" />
          </div>

          {relatedPlacements.map((relatedPlacement) => (
            <button
              type="button"
              key={relatedPlacement.id}
              onClick={() => onSelectPlacement(relatedPlacement.id)}
              className={cn(
                "absolute rounded-2xl border text-left transition-all",
                hotspotLayout(relatedPlacement.previewVariant),
                relatedPlacement.id === placement.id
                  ? "border-orange-300 bg-orange-200/90 shadow-lg ring-2 ring-orange-400/35"
                  : "border-sky-300 bg-sky-200/85 hover:bg-sky-200"
              )}
              title={relatedPlacement.positionName}
            >
              <span className="absolute top-2 left-2 rounded-full bg-slate-950 px-2 py-0.5 font-semibold text-[11px] text-white">
                {extractHotspotLabel(relatedPlacement.positionName)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2">
          <div className="rounded-2xl border bg-slate-50 px-3 py-2">
            <p className="font-medium text-[13px]">Hotspots on this page</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {relatedPlacements.map((relatedPlacement) => (
                <button
                  key={relatedPlacement.id}
                  type="button"
                  onClick={() => onSelectPlacement(relatedPlacement.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    relatedPlacement.id === placement.id
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700"
                  )}
                >
                  {extractHotspotLabel(relatedPlacement.positionName)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CoverageBadge({
  coverage
}: {
  coverage: PrototypeReference["coverage"]
}) {
  if (coverage === "available") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
      >
        Live sample available
      </Badge>
    )
  }

  if (coverage === "reference") {
    return (
      <Badge
        variant="outline"
        className="border-sky-400/30 bg-sky-400/10 text-sky-100"
      >
        Reference sample only
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-white/15 bg-white/5 text-white/70"
    >
      Mock preview only
    </Badge>
  )
}

function hotspotLayout(variant: PreviewVariant) {
  const layouts: Record<PreviewVariant, string> = {
    hero: "left-5 right-5 top-18 h-18",
    "sidebar-left": "left-4 top-40 h-44 w-28 md:w-32",
    "sidebar-right": "right-4 top-40 h-44 w-24 md:w-28",
    "in-content": "left-8 right-8 top-76 h-16",
    bottom: "bottom-8 left-8 right-8 h-16",
    "map-strip": "left-8 right-8 top-[21.5rem] h-8"
  }

  return layouts[variant]
}

function extractHotspotLabel(positionName: string) {
  const match = positionName.match(/#\d+/)
  if (match) return match[0]

  const segments = positionName.split(" - ").map((segment) => segment.trim())
  return segments.at(-1) ?? positionName
}

function getPrototypeReference(placement: Placement): PrototypeReference {
  if (placement.module === "Marketplace" && placement.page === "Homepage") {
    return {
      href: "/marketplace",
      label: "Open marketplace sample",
      coverage: "available"
    }
  }

  if (placement.module === "TradeXpo" && placement.page === "Homepage") {
    return {
      href: "/tradexpo",
      label: "Open TradeXpo sample",
      coverage: "available"
    }
  }

  if (placement.module === "Marketplace") {
    return {
      href: "/marketplace",
      label: "Open marketplace reference",
      coverage: "reference"
    }
  }

  if (placement.module === "TradeXpo") {
    return {
      href: "/tradexpo",
      label: "Open TradeXpo reference",
      coverage: "reference"
    }
  }

  if (placement.module === "BFM") {
    return {
      href: "/",
      label: "Open landing reference",
      coverage: "reference"
    }
  }

  if (placement.module === "Mini-site" && placement.page === "TBSG Homepage") {
    return {
      href: placement.prototypeHref,
      label: `Open ${placement.page.replace(" Homepage", "")} tenant sample`,
      coverage: placement.prototypeHref ? "available" : "reference"
    }
  }

  if (placement.module === "Mini-site") {
    return {
      href: placement.prototypeHref,
      label: `Open ${placement.page.replace(" Homepage", "")} tenant reference`,
      coverage: placement.prototypeHref ? "available" : "reference"
    }
  }

  return {
    label: "Mock preview only",
    coverage: "planned"
  }
}

function getActiveBannerCount(placement: Placement) {
  return placement.banners.filter((banner) => banner.isActive).length
}

function getTotalClicks(placement: Placement) {
  return placement.banners.reduce(
    (total, banner) => total + banner.clickCount,
    0
  )
}

function getOrderedBanners(placement: Placement) {
  return placement.banners.slice().sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }
    return left.name.localeCompare(right.name)
  })
}

function getDisplayBanners(placement: Placement) {
  const orderedBanners = getOrderedBanners(placement)
  if (placement.displayRule === "random-first" || orderedBanners.length === 0) {
    return orderedBanners
  }

  const firstIndex =
    clampOrderForCount(placement.firstBannerOrder, orderedBanners.length) - 1
  return [
    ...orderedBanners.slice(firstIndex),
    ...orderedBanners.slice(0, firstIndex)
  ]
}

function getDurationSummary(banners: BannerItem[]) {
  if (banners.length === 0) return "-"

  const uniqueDurations = Array.from(
    new Set(banners.map((banner) => banner.durationSeconds))
  ).sort((left, right) => left - right)

  if (uniqueDurations.length === 1) {
    return `${uniqueDurations[0]} seconds`
  }

  return "Mixed"
}

function getSizeRequirementSummary(placement: Placement) {
  const desktopSize = placement.assetRequirements.find((requirement) =>
    requirement.key.startsWith("desktop")
  )?.size
  const mobileSize = placement.assetRequirements.find((requirement) =>
    requirement.key.startsWith("mobile")
  )?.size

  if (desktopSize && mobileSize) {
    return `D ${desktopSize} • M ${mobileSize}`
  }

  if (desktopSize) return `D ${desktopSize}`
  if (mobileSize) return `M ${mobileSize}`
  return "-"
}

function getUploadedAssetCount(
  assets: BannerAssets,
  requirements: AssetRequirement[]
) {
  return requirements.filter((requirement) => assets[requirement.key]?.trim())
    .length
}

function normalizeBannerOrders(banners: BannerItem[]) {
  return banners
    .slice()
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }
      return left.name.localeCompare(right.name)
    })
    .map((banner, index) => ({
      ...banner,
      sortOrder: index + 1
    }))
}

function getOrderOptions(banners: BannerItem[]) {
  return Array.from({ length: banners.length }, (_, index) => {
    const order = index + 1
    return {
      value: String(order),
      label: `#${order}`
    }
  })
}

function createEmptyDraft(sortOrder: number): BannerDraft {
  return {
    id: null,
    name: "",
    companyId: "",
    assets: createEmptyAssets(),
    startAt: "2026-06-10T08:00",
    endAt: "2026-06-30T23:00",
    isActive: true,
    sortOrder: clampSortOrder(sortOrder),
    durationSeconds: DEFAULT_BANNER_DURATION_SECONDS
  }
}

function createEmptyAssets(): BannerAssets {
  return {
    desktopVi: "",
    desktopEn: "",
    mobileVi: "",
    mobileEn: ""
  }
}

function normalizeAssets(assets: Partial<BannerAssets>): BannerAssets {
  return {
    ...createEmptyAssets(),
    ...assets
  }
}

function createSeedAssets(
  imageName: string,
  requirements: AssetRequirement[]
): BannerAssets {
  const nextAssets = createEmptyAssets()
  const lastDotIndex = imageName.lastIndexOf(".")
  const baseName =
    lastDotIndex > -1 ? imageName.slice(0, lastDotIndex) : imageName
  const extension =
    lastDotIndex > -1 ? imageName.slice(lastDotIndex + 1) : "png"

  requirements.forEach((requirement) => {
    nextAssets[requirement.key] =
      `${baseName}-${assetFileSuffix(requirement.key)}.${extension}`
  })

  return nextAssets
}

function assetFileSuffix(key: AssetSlotKey) {
  const suffixMap: Record<AssetSlotKey, string> = {
    desktopVi: "desktop-vi",
    desktopEn: "desktop-en",
    mobileVi: "mobile-vi",
    mobileEn: "mobile-en"
  }

  return suffixMap[key]
}

function clampSortOrder(value: number) {
  if (value < 1) return 1
  if (value > MAX_BANNERS) return MAX_BANNERS
  return value
}

function clampOrderForCount(value: number, count: number) {
  if (count <= 0) return 1
  if (value < 1) return 1
  if (value > count) return count
  return value
}

function clampBannerDurationSeconds(value: number) {
  if (value < 1) return 1
  if (value > MAX_BANNER_DURATION_SECONDS) return MAX_BANNER_DURATION_SECONDS
  return value
}

function getCompany(companyId: string) {
  return companies.find((company) => company.id === companyId)
}

function getRuleLabel(rule: DisplayRule) {
  return rule === "random-first"
    ? "Random first, then follow order"
    : "Start from selected order"
}

function getSeedClickCount(index: number) {
  const seedCounts = [1240, 860, 520, 310, 145]
  return seedCounts[index] ?? 0
}

function getSeedImpressions(index: number) {
  const seedCounts = [58_400, 42_100, 31_800, 19_600, 8_900]
  return seedCounts[index] ?? 0
}

function getSeedProfileVisits(index: number) {
  const seedCounts = [720, 460, 280, 170, 80]
  return seedCounts[index] ?? 0
}

function cloneMiniSitePlacementSeeds(
  basePlacements: PlacementSeed[],
  sample: MiniSitePlacementSample
) {
  return basePlacements.map((placement, index) => {
    const nextPlacement = mapBannerStringValues(
      JSON.parse(JSON.stringify(placement)) as PlacementSeed,
      (value) =>
        value
          .replaceAll(
            "tenant-tbsg-homepage-01",
            `tenant-${sample.key}-homepage-01`
          )
          .replaceAll(
            "tenant-tbsg-homepage-02",
            `tenant-${sample.key}-homepage-02`
          )
          .replaceAll("TEN-TBSG-HOME-01", `TEN-${sample.code}-HOME-01`)
          .replaceAll("TEN-TBSG-HOME-02", `TEN-${sample.code}-HOME-02`)
          .replaceAll("TBSG Homepage", sample.page)
          .replaceAll("TBSG", sample.code)
          .replaceAll("tbsg-", `${sample.key}-`)
    )

    nextPlacement.page = sample.page
    nextPlacement.positionName = `${sample.page} #${index + 1}`
    nextPlacement.prototypeHref = undefined

    if (nextPlacement.banners[0]) {
      nextPlacement.banners[0].name =
        index === 0 ? sample.placementOneName : sample.placementTwoName
      nextPlacement.banners[0].imageName = `${sample.key}-homepage-${index + 1}.png`
    }

    return nextPlacement
  })
}

function mapBannerStringValues<T>(
  value: T,
  replace: (value: string) => string
): T {
  if (typeof value === "string") {
    return replace(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapBannerStringValues(item, replace)) as T
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(([key, item]) => [
      key,
      mapBannerStringValues(item, replace)
    ])

    return Object.fromEntries(entries) as T
  }

  return value
}

function getCtr(banner: BannerItem) {
  if (banner.impressions <= 0) return 0
  return banner.clickCount / banner.impressions
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "percent"
  }).format(value)
}

function getCoverageLabel(
  coverage: PrototypeReference["coverage"] | undefined
) {
  if (coverage === "available") return "Live sample available"
  if (coverage === "reference") return "Reference sample only"
  return "Mock preview only"
}

function formatDateTime(value: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)
}

function formatPublishedAt(value: string | null) {
  if (!value) return "Not published yet"
  return formatDateTime(value)
}

function moduleTone(module: ModuleKey) {
  const tones: Record<ModuleKey, string> = {
    Marketplace: "border-sky-200 bg-sky-50 text-sky-700",
    TradeXpo: "border-violet-200 bg-violet-50 text-violet-700",
    RFQ: "border-amber-200 bg-amber-50 text-amber-700",
    BFM: "border-emerald-200 bg-emerald-50 text-emerald-700",
    "Mini-site": "border-rose-200 bg-rose-50 text-rose-700"
  }

  return tones[module]
}
