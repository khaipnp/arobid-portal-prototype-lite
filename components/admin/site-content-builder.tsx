"use client"

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  EyeIcon,
  FileTextIcon,
  ImageIcon,
  Layers3Icon,
  LinkIcon,
  MonitorSmartphoneIcon,
  MousePointerClickIcon,
  PlaySquareIcon,
  SlidersHorizontalIcon,
  ToggleLeftIcon,
  TypeIcon
} from "lucide-react"
import Link from "next/link"
import { type ReactNode, useState } from "react"
import {
  MarketplaceHome,
  type MarketplacePreviewConfig
} from "@/components/marketplace/marketplace-home"
import {
  initialBranding,
  initialRelations,
  initialSectionMedia,
  initialSections
} from "@/components/partner/site-preview/constants"
import { SiteLivePreview } from "@/components/partner/site-preview/site-live-preview"
import type {
  EnabledSiteSections,
  SiteBranding,
  SiteSectionMedia,
  TenantRelation
} from "@/components/partner/site-preview/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type FieldType =
  | "Text"
  | "Image"
  | "Video"
  | "CTA"
  | "Link"
  | "Toggle"
  | "Data Source"
  | "Color"
  | "Navigation"
  | "Metric"

type ContentField = {
  id: string
  label: string
  type: FieldType
  appearsIn: string
  source: "Manual" | "Linked" | "Hybrid" | "Template"
  validation: string
  example: string
  maxLength?: number
}

type ExternalManagement = {
  tag: string
  label: string
  note: string
  href?: string
}

type SiteSection = {
  id: string
  name: string
  area: "Header" | "Above fold" | "Body" | "Conversion" | "Footer"
  description: string
  required: boolean
  dataMode: "Manual" | "Linked" | "Hybrid" | "Template"
  previewLabel: string
  previewImage?: string
  externalManagement?: ExternalManagement
  fields: ContentField[]
}

type SiteConfig = {
  id: string
  name: string
  route: string
  type: "Core Marketplace" | "Tenant Site"
  owner: string
  status: "Prototype" | "Draft"
  description: string
  sections: SiteSection[]
}

type PreviewViewport = "desktop" | "mobile"

type FieldGroup = {
  id: string
  label: string
  description?: string
  fields: ContentField[]
}

const configurableSites: SiteConfig[] = [
  {
    id: "arobid-marketplace",
    name: "Arobid B2B Marketplace",
    route: "/marketplace",
    type: "Core Marketplace",
    owner: "Arobid Admin",
    status: "Prototype",
    description:
      "Core marketplace homepage with platform branding, navigation, category discovery, TradeXpo, Buyer Find & Match, products, suppliers, partner network, RFQ, banner ads, and footer content.",
    sections: [
      {
        id: "marketplace-header",
        name: "Header and Navigation",
        area: "Header",
        description:
          "Top logo and search hint only. Core entry points, navigation labels, language, and currency remain owned by marketplace template and system navigation.",
        required: true,
        dataMode: "Manual",
        previewLabel: "Logo + search hint",
        previewImage: "/marketplace/arobid-marketplace-logo.png",
        fields: [
          {
            id: "logo",
            label: "Marketplace logo",
            type: "Image",
            appearsIn: "Top-left header",
            source: "Manual",
            validation: "PNG, SVG, WebP, or JPG. Recommended transparent logo.",
            example: "/marketplace/arobid-marketplace-logo.png"
          },
          {
            id: "search-placeholder",
            label: "Search placeholder",
            type: "Text",
            appearsIn: "Header search input",
            source: "Manual",
            validation: "Maximum 120 characters.",
            example: "Watch for men, industrial parts, solar systems..."
          }
        ]
      },
      {
        id: "marketplace-seo",
        name: "SEO Metadata by Route",
        area: "Header",
        description:
          "Route-level title and meta description used for social link previews and search snippets across marketplace surfaces.",
        required: false,
        dataMode: "Manual",
        previewLabel: "Homepage, TradeXpo, and BFM meta tags",
        fields: [
          {
            id: "home-title-en",
            label: "Homepage title (EN)",
            type: "Text",
            appearsIn: "https://arobid.com/en",
            source: "Manual",
            validation:
              "Recommended 50 to 65 characters. Use the public page title only.",
            example:
              "Arobid.com | AI-Powered Trade & Investment Infrastructure",
            maxLength: 65
          },
          {
            id: "home-description-en",
            label: "Homepage meta description (EN)",
            type: "Text",
            appearsIn: "https://arobid.com/en",
            source: "Manual",
            validation:
              "Recommended 140 to 170 characters for snippet quality.",
            example:
              "Connect businesses, opportunities, and ecosystems through an AI-powered & Data-driven infrastructure designed for global trade and investment growth.",
            maxLength: 170
          },
          {
            id: "home-title-vi",
            label: "Homepage title (VI)",
            type: "Text",
            appearsIn: "https://arobid.com/vi",
            source: "Manual",
            validation:
              "Recommended 50 to 65 characters. Use the public page title only.",
            example:
              "Arobid.com | Hạ tầng Xúc tiến Thương mại & Đầu tư vận hành bởi AI",
            maxLength: 65
          },
          {
            id: "home-description-vi",
            label: "Homepage meta description (VI)",
            type: "Text",
            appearsIn: "https://arobid.com/vi",
            source: "Manual",
            validation:
              "Recommended 140 to 170 characters for snippet quality.",
            example:
              "Kết nối doanh nghiệp, cơ hội và hệ sinh thái thông qua hạ tầng vận hành bởi AI, kết nối bởi dữ liệu, thúc đẩy tăng trưởng thương mại và đầu tư toàn cầu.",
            maxLength: 170
          },
          {
            id: "tradexpo-title-en",
            label: "TradeXpo title (EN)",
            type: "Text",
            appearsIn: "TradeXpo public landing page (EN)",
            source: "Manual",
            validation:
              "Recommended 50 to 65 characters. Use the public page title only.",
            example: "Arobid TradeXpo | Digital Trade Promotion Infrastructure",
            maxLength: 65
          },
          {
            id: "tradexpo-description-en",
            label: "TradeXpo meta description (EN)",
            type: "Text",
            appearsIn: "TradeXpo public landing page (EN)",
            source: "Manual",
            validation:
              "Recommended 140 to 170 characters for snippet quality.",
            example:
              "Scale trade promotion beyond physical events through AI-powered virtual expos and global business matching.",
            maxLength: 170
          },
          {
            id: "tradexpo-title-vi",
            label: "TradeXpo title (VI)",
            type: "Text",
            appearsIn: "TradeXpo public landing page (VI)",
            source: "Manual",
            validation:
              "Recommended 50 to 65 characters. Use the public page title only.",
            example: "Arobid TradeXpo | Hạ tầng Xúc tiến Thương mại Số",
            maxLength: 65
          },
          {
            id: "tradexpo-description-vi",
            label: "TradeXpo meta description (VI)",
            type: "Text",
            appearsIn: "TradeXpo public landing page (VI)",
            source: "Manual",
            validation:
              "Recommended 140 to 170 characters for snippet quality.",
            example:
              "Mở rộng hoạt động xúc tiến thương mại vượt ra ngoài giới hạn triển lãm truyền thống bằng triển lãm số và kết nối doanh nghiệp, vận hành bởi AI.",
            maxLength: 170
          },
          {
            id: "bfm-title-en",
            label: "Buyer Find & Match title (EN)",
            type: "Text",
            appearsIn: "https://arobid.com/en/buyer-find-and-match",
            source: "Manual",
            validation:
              "Recommended 50 to 65 characters. Use the public page title only.",
            example: "Buyer Find & Match | AI-Powered Global Buyer Discovery",
            maxLength: 65
          },
          {
            id: "bfm-description-en",
            label: "Buyer Find & Match meta description (EN)",
            type: "Text",
            appearsIn: "https://arobid.com/en/buyer-find-and-match",
            source: "Manual",
            validation:
              "Recommended 140 to 170 characters for snippet quality.",
            example:
              "Move beyond directories. Let AI identify, prioritize, and connect you with potential buyers worldwide.",
            maxLength: 170
          },
          {
            id: "bfm-title-vi",
            label: "Buyer Find & Match title (VI)",
            type: "Text",
            appearsIn: "https://arobid.com/vi/buyer-find-and-match",
            source: "Manual",
            validation:
              "Recommended 50 to 65 characters. Use the public page title only.",
            example:
              "Buyer Find & Match | Hạ tầng Tìm kiếm & Kết nối Người mua Toàn cầu",
            maxLength: 65
          },
          {
            id: "bfm-description-vi",
            label: "Buyer Find & Match meta description (VI)",
            type: "Text",
            appearsIn: "https://arobid.com/vi/buyer-find-and-match",
            source: "Manual",
            validation:
              "Recommended 140 to 170 characters for snippet quality.",
            example:
              "Vượt xa danh bạ doanh nghiệp thông thường. Để AI xác định, sàng lọc và kết nối với các người mua tiềm năng trên toàn cầu.",
            maxLength: 170
          }
        ]
      },
      {
        id: "marketplace-hero",
        name: "Hero Banner",
        area: "Above fold",
        description: "Live homepage hero banner and above-fold visual content.",
        required: true,
        dataMode: "Manual",
        previewLabel: "Hero banner copy + visual",
        previewImage: "/marketplace/hero.webp",
        fields: [
          {
            id: "hero-image",
            label: "Hero background image",
            type: "Image",
            appearsIn: "Full-width hero background",
            source: "Manual",
            validation: "Desktop image recommended 1920x900 or higher.",
            example: "/marketplace/hero.webp"
          },
          {
            id: "eyebrow",
            label: "Hero eyebrow",
            type: "Text",
            appearsIn: "Pill above hero title",
            source: "Manual",
            validation: "Maximum 60 characters.",
            example: "Arobid Marketplace"
          },
          {
            id: "headline",
            label: "Hero headline",
            type: "Text",
            appearsIn: "Main H1 in hero",
            source: "Manual",
            validation: "Maximum 90 characters.",
            example: "Welcome to Arobid.com"
          }
        ]
      },
      {
        id: "marketplace-hero-cards",
        name: "Above-fold Quick Cards",
        area: "Above fold",
        description:
          "Quick shortcut cards for core marketplace actions. Copy, CTA labels, and links should stay aligned with the product template.",
        required: false,
        dataMode: "Template",
        previewLabel: "3 quick action cards",
        externalManagement: {
          tag: "Locked",
          label: "Template locked",
          note: "These cards expose fixed marketplace functions such as onboarding, TradeXpo, and Buyer Find & Match. They should not be edited from homepage content management."
        },
        fields: []
      },
      {
        id: "marketplace-industries",
        name: "Top Industries",
        area: "Body",
        description:
          "Category shortcut grid for discovery. Item list, ordering, and imagery should follow category taxonomy and discovery rules.",
        required: false,
        dataMode: "Linked",
        previewLabel: "9 category shortcut tiles",
        externalManagement: {
          tag: "Categories",
          label: "Category-driven section",
          note: "This section should be derived from marketplace category taxonomy and discovery logic, not edited as homepage copy."
        },
        fields: []
      },
      {
        id: "marketplace-banner-carousel",
        name: "Banner Ads #1",
        area: "Body",
        description:
          "Rotating banner inventory from the live homepage, including desktop and mobile variants.",
        required: false,
        dataMode: "Hybrid",
        previewLabel: "Desktop/mobile banner inventory",
        externalManagement: {
          tag: "Banner Ads",
          href: "/admin/settings/banner-ads",
          label: "Banner Ads Management",
          note: "Banner media, schedule, and placement rules for this section are managed in Banner Ads."
        },
        fields: []
      },
      {
        id: "marketplace-recommended-categories",
        name: "Recommended Categories",
        area: "Body",
        description:
          "Personalized discovery row. Recommendation logic and category picks should not be edited as homepage content.",
        required: false,
        dataMode: "Linked",
        previewLabel: "Horizontal category cards",
        externalManagement: {
          tag: "Discovery",
          label: "Recommendation-driven section",
          note: "Recommended categories should come from discovery logic or curated taxonomy rules, not ad hoc homepage editing."
        },
        fields: []
      },
      {
        id: "marketplace-tradexpo",
        name: "Arobid TradeXpo",
        area: "Body",
        description:
          "Featured expo cards with live status, dates, title, category, image, and stats.",
        required: false,
        dataMode: "Manual",
        previewLabel: "Featured expo cards",
        fields: [
          {
            id: "heading",
            label: "Section heading",
            type: "Text",
            appearsIn: "TradeXpo section heading",
            source: "Manual",
            validation: "Maximum 100 characters.",
            example: "Arobid TradeXpo"
          },
          {
            id: "description",
            label: "Section description",
            type: "Text",
            appearsIn: "TradeXpo section description",
            source: "Manual",
            validation: "Maximum 220 characters.",
            example:
              "Activate global trade flow through digital exhibition infrastructure."
          }
        ]
      },
      {
        id: "marketplace-bfm",
        name: "Buyer Find & Match",
        area: "Conversion",
        description:
          "Core Buyer Find & Match conversion block for AI matching, benefits, CTA, and visual.",
        required: false,
        dataMode: "Manual",
        previewLabel: "BFM conversion block",
        previewImage: "/marketplace/buyer-match.png",
        fields: [
          {
            id: "description",
            label: "Section description",
            type: "Text",
            appearsIn: "BFM supporting copy",
            source: "Manual",
            validation: "Maximum 220 characters.",
            example:
              "Instantly connecting standardized supplier data with verified buyer intent for absolute precision in global sourcing."
          },
          {
            id: "cta-label",
            label: "Button label",
            type: "CTA",
            appearsIn: "BFM primary button",
            source: "Manual",
            validation: "Maximum 40 characters.",
            example: "Get Matches Now"
          },
          {
            id: "media",
            label: "BFM media",
            type: "Image",
            appearsIn: "BFM visual panel",
            source: "Manual",
            validation: "Image or video URL. Recommended size 600 x 340.",
            example: "/marketplace/buyer-match.png"
          }
        ]
      },
      {
        id: "marketplace-banner-inline-2",
        name: "Banner Ads #2",
        area: "Body",
        description: "Inline banner placement shown below Buyer Find & Match.",
        required: false,
        dataMode: "Hybrid",
        previewLabel: "Inline banner placement",
        externalManagement: {
          tag: "Banner Ads",
          href: "/admin/settings/banner-ads",
          label: "Banner Ads Management",
          note: "Banner media, schedule, and placement rules for this section are managed in Banner Ads."
        },
        fields: []
      },
      {
        id: "marketplace-products",
        name: "Product Discovery Blocks",
        area: "Body",
        description:
          "Product ranking blocks shown around Buyer Find & Match, including ranking, new arrivals, trending, and Arobid's Choice.",
        required: false,
        dataMode: "Linked",
        previewLabel: "Curated product cards",
        externalManagement: {
          tag: "Products",
          label: "Product data-driven section",
          note: "Product cards, ranking labels, and badges should come from product catalog and ranking logic instead of homepage text configuration."
        },
        fields: []
      },
      {
        id: "marketplace-suppliers",
        name: "Recommended Suppliers",
        area: "Body",
        description:
          "Supplier cards with logo, country, tags, favorite action, and profile CTA.",
        required: false,
        dataMode: "Linked",
        previewLabel: "Supplier card grid",
        externalManagement: {
          tag: "Suppliers",
          label: "Supplier data-driven section",
          note: "Supplier cards should be driven by verified supplier data and ranking, not homepage content editing."
        },
        fields: []
      },
      {
        id: "marketplace-rfq-ai",
        name: "RFQ Hub",
        area: "Conversion",
        description:
          "RFQ conversion block for turning buyer intent into structured RFQs.",
        required: false,
        dataMode: "Manual",
        previewLabel: "RFQ headline + CTA",
        fields: [
          {
            id: "rfq-headline",
            label: "Section headline",
            type: "Text",
            appearsIn: "RFQ Hub section heading",
            source: "Manual",
            validation: "Maximum 110 characters.",
            example: "Turn RFQs into\nDeals with AI"
          },
          {
            id: "rfq-description",
            label: "Section description",
            type: "Text",
            appearsIn: "RFQ Hub supporting copy",
            source: "Manual",
            validation: "Maximum 240 characters.",
            example:
              "Converting buyer intent into structured RFQs with intelligent precision and consistency at scale."
          },
          {
            id: "rfq-cta",
            label: "Button label",
            type: "CTA",
            appearsIn: "RFQ Hub primary button",
            source: "Manual",
            validation: "Maximum 40 characters.",
            example: "Access to RFQ Hub"
          }
        ]
      },
      {
        id: "marketplace-trust-cta",
        name: "Strategic Partners",
        area: "Conversion",
        description:
          "Strategic partner support section for finance, logistics, and legal infrastructure.",
        required: false,
        dataMode: "Manual",
        previewLabel: "Strategic partners heading + description",
        fields: [
          {
            id: "headline",
            label: "Section headline",
            type: "Text",
            appearsIn: "Strategic Partners section heading",
            source: "Manual",
            validation: "Maximum 110 characters.",
            example: "Infrastructure Support for Seamless Digital Trade"
          },
          {
            id: "description",
            label: "Section description",
            type: "Text",
            appearsIn: "Strategic Partners section description",
            source: "Manual",
            validation: "Maximum 240 characters.",
            example:
              "We unite industry leaders in finance, logistics, and law to safeguard your trade flow - from 3D virtual sourcing to secure global delivery."
          }
        ]
      },
      {
        id: "marketplace-footer",
        name: "Footer",
        area: "Footer",
        description:
          "Marketplace footer editorial copy. Legal, navigation, and corporate identity remain owned by the global template.",
        required: true,
        dataMode: "Manual",
        previewLabel: "Footer editorial copy",
        fields: [
          {
            id: "footer-description",
            label: "Footer subscription title",
            type: "Text",
            appearsIn: "Footer subscription area",
            source: "Manual",
            validation: "Maximum 220 characters.",
            example: "Market Insights & B2B Trends from Arobid"
          }
        ]
      }
    ]
  },
  {
    id: "tbsg-tenant",
    name: "TBSG / Taybacsaigon",
    route: "/partner/hdn-taybacsaigon",
    type: "Tenant Site",
    owner: "Arobid Admin + Partner Owner",
    status: "Draft",
    description:
      "Client-specific tenant mini-site configured on top of Arobid homepage modules, with its own branding, section visibility, media slots, relations, and publish workflow.",
    sections: [
      {
        id: "tbsg-branding",
        name: "Global Branding",
        area: "Header",
        description:
          "Tenant identity reused across header, hero, CTA, and footer.",
        required: true,
        dataMode: "Manual",
        previewLabel: "Tenant name, logo, colors",
        previewImage:
          "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/logo-tbsg.png",
        fields: [
          {
            id: "tenant-name",
            label: "Public display name",
            type: "Text",
            appearsIn: "Header, hero, footer, SEO title",
            source: "Manual",
            validation: "Required. Maximum 80 characters.",
            example: "Tay Bac Sai Gon"
          },
          {
            id: "tagline",
            label: "Tagline",
            type: "Text",
            appearsIn: "Hero and CTA sections",
            source: "Manual",
            validation: "Maximum 180 characters.",
            example: "Your trusted gateway to digital trade exhibitions."
          },
          {
            id: "logo",
            label: "Tenant logo",
            type: "Image",
            appearsIn: "Header, footer, preview cards",
            source: "Manual",
            validation: "PNG/SVG/WebP. Recommended transparent logo.",
            example:
              "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/logo-tbsg.png"
          },
          {
            id: "brand-color",
            label: "Primary and accent colors",
            type: "Color",
            appearsIn: "Buttons, badges, highlights",
            source: "Manual",
            validation: "Hex color only.",
            example: "#f97316"
          }
        ]
      },
      {
        id: "tbsg-header",
        name: "Header Navigation",
        area: "Header",
        description:
          "Tenant navigation and top-level actions for category, TradeXpo, suppliers, deals, member benefits, and About.",
        required: true,
        dataMode: "Manual",
        previewLabel: "Tenant navigation",
        fields: [
          {
            id: "nav-items",
            label: "Navigation items",
            type: "Navigation",
            appearsIn: "Header nav bar",
            source: "Manual",
            validation: "Each nav item requires label, destination, and order.",
            example:
              "All Categories, TradeXpo, Suppliers, eVoucher Deals, For Members, About TBSG"
          },
          {
            id: "header-cta",
            label: "Header CTA",
            type: "CTA",
            appearsIn: "Right side of header",
            source: "Manual",
            validation: "CTA must map to a valid route or external URL.",
            example: "Join now"
          }
        ]
      },
      {
        id: "tbsg-seo",
        name: "SEO Metadata by Locale",
        area: "Header",
        description:
          "Locale-level title and meta description for the public TBSG landing pages.",
        required: false,
        dataMode: "Manual",
        previewLabel: "EN and VI meta tags",
        fields: [
          {
            id: "title-en",
            label: "Landing page title (EN)",
            type: "Text",
            appearsIn: "https://arobid.com/partner/en/hdn-taybacsaigon",
            source: "Manual",
            validation:
              "Recommended 50 to 65 characters. Use the public page title only.",
            example: "TBSG Business Hub - AI & Data-Powered Business Ecosystem",
            maxLength: 65
          },
          {
            id: "description-en",
            label: "Landing page meta description (EN)",
            type: "Text",
            appearsIn: "https://arobid.com/partner/en/hdn-taybacsaigon",
            source: "Manual",
            validation:
              "Recommended 140 to 170 characters for snippet quality.",
            example:
              "Connect, promote and grow with trusted business partners. Access B2B opportunities, Buyer Find & Match and digital trade events through the TBSG ecosystem.",
            maxLength: 170
          },
          {
            id: "title-vi",
            label: "Landing page title (VI)",
            type: "Text",
            appearsIn: "https://arobid.com/partner/vi/hdn-taybacsaigon",
            source: "Manual",
            validation:
              "Recommended 50 to 65 characters. Use the public page title only.",
            example:
              "TBSG Business Hub - Hệ Sinh Thái Doanh Nghiệp Vận Hành Bởi AI & Dữ Liệu",
            maxLength: 65
          },
          {
            id: "description-vi",
            label: "Landing page meta description (VI)",
            type: "Text",
            appearsIn: "https://arobid.com/partner/vi/hdn-taybacsaigon",
            source: "Manual",
            validation:
              "Recommended 140 to 170 characters for snippet quality.",
            example:
              "Kết nối, quảng bá và phát triển cùng cộng đồng đối tác doanh nghiệp uy tín. Tiếp cận cơ hội giao thương B2B, Buyer Find & Match và sự kiện thương mại số.",
            maxLength: 170
          }
        ]
      },
      {
        id: "tbsg-hero",
        name: "Hero Banner",
        area: "Above fold",
        description:
          "Main tenant hero banner with image/video media, headline, search, and primary CTA.",
        required: true,
        dataMode: "Manual",
        previewLabel: "Hero media + headline",
        previewImage:
          "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/hero-city.png",
        fields: [
          {
            id: "hero-media",
            label: "Hero image or video",
            type: "Image",
            appearsIn: "Hero visual area",
            source: "Manual",
            validation:
              "Use a landscape hero image or video with centered focal point. Recommended 1920 x 1080 or higher. Keep key content away from the edges for mobile crop.",
            example:
              "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/hero-city.png"
          },
          {
            id: "hero-title",
            label: "Hero title",
            type: "Text",
            appearsIn: "Main hero headline",
            source: "Manual",
            validation:
              "Required. Maximum 36 characters to keep the hero headline readable across desktop and mobile.",
            example: "TBSG Business HUB",
            maxLength: 36
          },
          {
            id: "hero-copy",
            label: "Hero description",
            type: "Text",
            appearsIn: "Hero supporting copy",
            source: "Manual",
            validation: "Maximum 110 characters. Keep to one concise sentence.",
            example:
              "Accelerate global growth with AI-powered trade connections and market access",
            maxLength: 110
          },
          {
            id: "search-placeholder",
            label: "Search placeholder",
            type: "Text",
            appearsIn: "Tenant search bar",
            source: "Manual",
            validation: "Maximum 28 characters.",
            example: "Search Keyword",
            maxLength: 28
          }
        ]
      },
      {
        id: "tbsg-community",
        name: "Community and Value Cards",
        area: "Body",
        description: "Tenant community metrics and service feature cards.",
        required: false,
        dataMode: "Hybrid",
        previewLabel: "Metrics + feature cards",
        fields: [
          {
            id: "stats",
            label: "Community stats",
            type: "Metric",
            appearsIn: "Metric row under community section",
            source: "Hybrid",
            validation:
              "Manual numbers for MVP; later can be calculated from tenant data.",
            example: "1,200+ Active Members, 12,000+ Products"
          },
          {
            id: "feature-cards",
            label: "Feature cards",
            type: "Text",
            appearsIn: "Community card grid",
            source: "Manual",
            validation:
              "Each card requires title, description, image, size, and display order.",
            example: "AI Buyer Find & Match, RFQ Center, Expo Booking"
          },
          {
            id: "section-toggle",
            label: "Section visibility",
            type: "Toggle",
            appearsIn: "Section renderer",
            source: "Manual",
            validation: "Hidden sections must not occupy blank space.",
            example: "Enabled"
          }
        ]
      },
      {
        id: "tbsg-categories",
        name: "Browse by Categories",
        area: "Body",
        description: "Tenant category shortcut section with labels and images.",
        required: false,
        dataMode: "Hybrid",
        previewLabel: "Category tiles",
        fields: [
          {
            id: "category-items",
            label: "Category items",
            type: "Data Source",
            appearsIn: "Category tile grid",
            source: "Hybrid",
            validation:
              "Admin can select curated categories; source records should come from category module.",
            example: "Women's Clothing, Men's Clothing, Sportwear"
          },
          {
            id: "category-media",
            label: "Category images",
            type: "Image",
            appearsIn: "Each category tile",
            source: "Manual",
            validation: "Each category needs fallback image.",
            example: "8 category image slots"
          }
        ]
      },
      {
        id: "tbsg-bfm",
        name: "Buyer Find & Match",
        area: "Conversion",
        description:
          "Tenant Buyer Find & Match block aligned with the Arobid marketplace pattern.",
        required: true,
        dataMode: "Manual",
        previewLabel: "BFM copy + media",
        previewImage:
          "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/buyer-match-ui.png",
        fields: [
          {
            id: "description",
            label: "Section description",
            type: "Text",
            appearsIn: "BFM supporting copy",
            source: "Manual",
            validation: "Maximum 135 characters. Keep to one sentence.",
            example:
              "Instantly connecting standardized supplier data with verified buyer intent for absolute precision in global sourcing.",
            maxLength: 135
          },
          {
            id: "cta-label",
            label: "Button label",
            type: "CTA",
            appearsIn: "BFM action button",
            source: "Manual",
            validation: "Maximum 24 characters.",
            example: "Get Matches Now",
            maxLength: 24
          },
          {
            id: "media",
            label: "BFM media",
            type: "Image",
            appearsIn: "BFM media panel",
            source: "Manual",
            validation:
              "Image or video URL. Recommended 1200 x 680 or higher. Landscape media only with centered focal area.",
            example:
              "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/buyer-match-ui.png"
          }
        ]
      },
      {
        id: "tbsg-banner-1",
        name: "Banner Ads #1",
        area: "Body",
        description:
          "Client-specific banner placement configured directly inside the TBSG site builder.",
        required: false,
        dataMode: "Manual",
        previewLabel: "4 localized asset slots",
        fields: [
          {
            id: "desktop-vi",
            label: "Desktop VN asset",
            type: "Image",
            appearsIn: "Desktop Vietnamese banner slot",
            source: "Manual",
            validation:
              "Recommended 2568 x 680 or 1284 x 340. Keep key text and logos inside the center-safe area.",
            example:
              "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1440&q=80"
          },
          {
            id: "desktop-en",
            label: "Desktop EN asset",
            type: "Image",
            appearsIn: "Desktop English banner slot",
            source: "Manual",
            validation:
              "Recommended 2568 x 680 or 1284 x 340. Keep key text and logos inside the center-safe area.",
            example:
              "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1440&q=80"
          },
          {
            id: "mobile-vi",
            label: "Mobile VN asset",
            type: "Image",
            appearsIn: "Mobile Vietnamese banner slot",
            source: "Manual",
            validation:
              "Recommended 600 x 1200 or 300 x 600. Use a vertical composition and keep text centered.",
            example:
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=768&q=80"
          },
          {
            id: "mobile-en",
            label: "Mobile EN asset",
            type: "Image",
            appearsIn: "Mobile English banner slot",
            source: "Manual",
            validation:
              "Recommended 600 x 1200 or 300 x 600. Use a vertical composition and keep text centered.",
            example:
              "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=768&q=80"
          }
        ]
      },
      {
        id: "tbsg-suppliers",
        name: "Featured and Recommended Suppliers",
        area: "Body",
        description:
          "Supplier card sections for highlighted and recommended tenant companies.",
        required: false,
        dataMode: "Linked",
        previewLabel: "Supplier cards",
        fields: [
          {
            id: "section-title",
            label: "Section titles",
            type: "Text",
            appearsIn: "Supplier section headings",
            source: "Manual",
            validation: "Separate title for Featured and Recommended sections.",
            example: "Featured Suppliers, Recommended Suppliers"
          },
          {
            id: "supplier-source",
            label: "Supplier source",
            type: "Data Source",
            appearsIn: "Supplier cards",
            source: "Linked",
            validation:
              "Supplier records must come from tenant enterprise/company association.",
            example: "Linked tenant member companies"
          },
          {
            id: "supplier-media",
            label: "Supplier card media",
            type: "Image",
            appearsIn: "Supplier card thumbnails",
            source: "Hybrid",
            validation: "Use company logo/product image fallback.",
            example: "3 supplier image slots"
          }
        ]
      },
      {
        id: "tbsg-products",
        name: "Hot and New Products",
        area: "Body",
        description:
          "Tenant product listing sections for hot products and new products.",
        required: false,
        dataMode: "Linked",
        previewLabel: "Product grids",
        fields: [
          {
            id: "hot-products-title",
            label: "Hot Products title",
            type: "Text",
            appearsIn: "Hot Products section",
            source: "Manual",
            validation: "Maximum 80 characters.",
            example: "Hot Products"
          },
          {
            id: "new-products-title",
            label: "New Products title",
            type: "Text",
            appearsIn: "New Products section",
            source: "Manual",
            validation: "Maximum 80 characters.",
            example: "New Products"
          },
          {
            id: "product-source",
            label: "Product source",
            type: "Data Source",
            appearsIn: "Product cards",
            source: "Linked",
            validation:
              "Products should be filtered by tenant/member company mapping.",
            example: "Linked tenant product catalog"
          },
          {
            id: "product-media",
            label: "Product media override",
            type: "Image",
            appearsIn: "Product card image slot",
            source: "Hybrid",
            validation: "Manual override allowed only for marketing slots.",
            example: "5 product image slots"
          }
        ]
      },
      {
        id: "tbsg-deals",
        name: "eVoucher and Deals",
        area: "Body",
        description: "Tenant eVoucher promotional deal grid.",
        required: false,
        dataMode: "Manual",
        previewLabel: "Deal cards",
        fields: [
          {
            id: "deal-slot-1",
            label: "Deal slot 1",
            type: "Image",
            appearsIn: "Primary deal card",
            source: "Manual",
            validation:
              "Recommended 900 x 900 or higher. Square image only for the main deal card.",
            example:
              "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80"
          },
          {
            id: "deal-slot-2",
            label: "Deal slot 2",
            type: "Image",
            appearsIn: "Secondary deal card 1",
            source: "Manual",
            validation:
              "Recommended 820 x 412 or higher. Wide image only for secondary deal cards.",
            example:
              "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80"
          },
          {
            id: "deal-slot-3",
            label: "Deal slot 3",
            type: "Image",
            appearsIn: "Secondary deal card 2",
            source: "Manual",
            validation:
              "Recommended 820 x 412 or higher. Wide image only for secondary deal cards.",
            example:
              "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
          },
          {
            id: "deal-slot-4",
            label: "Deal slot 4",
            type: "Image",
            appearsIn: "Secondary deal card 3",
            source: "Manual",
            validation:
              "Recommended 820 x 412 or higher. Wide image only for secondary deal cards.",
            example:
              "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"
          },
          {
            id: "deal-slot-5",
            label: "Deal slot 5",
            type: "Image",
            appearsIn: "Secondary deal card 4",
            source: "Manual",
            validation:
              "Recommended 820 x 412 or higher. Wide image only for secondary deal cards.",
            example:
              "https://images.unsplash.com/photo-1522202222206-b7505069a3f0?auto=format&fit=crop&w=900&q=80"
          }
        ]
      },
      {
        id: "tbsg-expo",
        name: "Expo Banner",
        area: "Body",
        description:
          "Tenant expo promotional banner used when there is no live exhibition carousel.",
        required: false,
        dataMode: "Manual",
        previewLabel: "Expo banner copy + media",
        previewImage:
          "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/expo-banner-bg.png",
        fields: [
          {
            id: "expo-title",
            label: "Section headline",
            type: "Text",
            appearsIn: "Expo banner heading",
            source: "Manual",
            validation: "Maximum 56 characters.",
            example: "Discover Upcoming Trade Events",
            maxLength: 56
          },
          {
            id: "expo-description",
            label: "Section description",
            type: "Text",
            appearsIn: "Expo banner description",
            source: "Manual",
            validation:
              "Maximum 130 characters. Keep to one or two short lines.",
            example:
              "Explore trade expos, connect with global businesses, and discover new opportunities on TradeXpo.",
            maxLength: 130
          },
          {
            id: "expo-cta",
            label: "Button label",
            type: "CTA",
            appearsIn: "Expo banner CTA button",
            source: "Manual",
            validation: "Maximum 24 characters.",
            example: "Explore TradeXpo",
            maxLength: 24
          },
          {
            id: "expo-media",
            label: "Expo media",
            type: "Video",
            appearsIn: "Expo banner visual area",
            source: "Manual",
            validation:
              "Image or video URL. Recommended 1154 x 608 or higher with centered focal area.",
            example:
              "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/expo-banner-bg.png"
          }
        ]
      },
      {
        id: "tbsg-banner-2",
        name: "Banner Ads #2",
        area: "Body",
        description:
          "Second client-specific banner placement configured directly inside the TBSG site builder.",
        required: false,
        dataMode: "Manual",
        previewLabel: "4 localized asset slots",
        fields: [
          {
            id: "desktop-vi",
            label: "Desktop VN asset",
            type: "Image",
            appearsIn: "Desktop Vietnamese banner slot",
            source: "Manual",
            validation:
              "Recommended 2568 x 680 or 1284 x 340. Keep key text and logos inside the center-safe area.",
            example:
              "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1440&q=80"
          },
          {
            id: "desktop-en",
            label: "Desktop EN asset",
            type: "Image",
            appearsIn: "Desktop English banner slot",
            source: "Manual",
            validation:
              "Recommended 2568 x 680 or 1284 x 340. Keep key text and logos inside the center-safe area.",
            example:
              "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1440&q=80"
          },
          {
            id: "mobile-vi",
            label: "Mobile VN asset",
            type: "Image",
            appearsIn: "Mobile Vietnamese banner slot",
            source: "Manual",
            validation:
              "Recommended 600 x 1200 or 300 x 600. Use a vertical composition and keep text centered.",
            example:
              "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=768&q=80"
          },
          {
            id: "mobile-en",
            label: "Mobile EN asset",
            type: "Image",
            appearsIn: "Mobile English banner slot",
            source: "Manual",
            validation:
              "Recommended 600 x 1200 or 300 x 600. Use a vertical composition and keep text centered.",
            example:
              "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=768&q=80"
          }
        ]
      },
      {
        id: "tbsg-news-video",
        name: "Why Join?",
        area: "Body",
        description:
          "Why Join section with supporting media and outbound news URLs.",
        required: false,
        dataMode: "Manual",
        previewLabel: "Why join + news + media",
        previewImage:
          "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/why-join-video.png",
        fields: [
          {
            id: "title",
            label: "Section headline",
            type: "Text",
            appearsIn: "Why Join section",
            source: "Manual",
            validation: "Maximum 40 characters.",
            example: "Why join TBSG?",
            maxLength: 40
          },
          {
            id: "description",
            label: "Section description",
            type: "Text",
            appearsIn: "Why Join supporting copy",
            source: "Manual",
            validation:
              "Maximum 150 characters total. Use up to 3 short lines for cleaner spacing.",
            example:
              "Connecting business partners.\nSupporting business transformation.\nExpanding global trade channels.",
            maxLength: 150
          },
          {
            id: "cta-label",
            label: "Button label",
            type: "CTA",
            appearsIn: "Why Join button",
            source: "Manual",
            validation: "Maximum 24 characters.",
            example: "Join TBSG now",
            maxLength: 24
          },
          {
            id: "media",
            label: "Media",
            type: "Video",
            appearsIn: "Video card area",
            source: "Manual",
            validation:
              "Image or video URL. Recommended 1280 x 720 or higher. Use landscape media with a centered focal area.",
            example:
              "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/image/tenant-landing/why-join-video.png"
          },
          {
            id: "news-urls",
            label: "News URL list",
            type: "Text",
            appearsIn: "News list",
            source: "Manual",
            validation: "Up to 5 URLs. One URL per line.",
            example:
              "https://arobid.com/en/news/tbsg-business-network\nhttps://arobid.com/en/news/tradexpo-opportunities\nhttps://arobid.com/en/news/member-growth-program"
          }
        ]
      },
      {
        id: "tbsg-services",
        name: "Service Tiles and Feature Cards",
        area: "Body",
        description:
          "Service blocks for RFQ Center, AI service, support, and member benefits.",
        required: false,
        dataMode: "Manual",
        previewLabel: "Service tiles",
        fields: [
          {
            id: "service-tiles",
            label: "Service tile list",
            type: "Text",
            appearsIn: "Service tile cards",
            source: "Manual",
            validation:
              "Each tile requires title, description, button label, image, and link.",
            example: "RFQ Center, AI Buyer Find & Match, Business Support"
          },
          {
            id: "service-media",
            label: "Service tile media",
            type: "Image",
            appearsIn: "Service tile image area",
            source: "Manual",
            validation: "Image per service tile.",
            example: "3 service image slots"
          }
        ]
      },
      {
        id: "tbsg-partners",
        name: "Partners and Sponsors",
        area: "Body",
        description:
          "Tenant partner and sponsor logo cloud managed from relation entries.",
        required: false,
        dataMode: "Hybrid",
        previewLabel: "Partner logo strip",
        fields: [
          {
            id: "relation-list",
            label: "Partner/sponsor entries",
            type: "Data Source",
            appearsIn: "Partner logo section",
            source: "Hybrid",
            validation:
              "Each entry requires name, type, tier, logo, website, and active status.",
            example: "Partner, Sponsor"
          },
          {
            id: "active-status",
            label: "Entry active status",
            type: "Toggle",
            appearsIn: "Partner logo rendering",
            source: "Manual",
            validation: "Inactive entries are hidden from live site.",
            example: "Enabled"
          }
        ]
      },
      {
        id: "tbsg-cta",
        name: "Final CTA",
        area: "Conversion",
        description:
          "Final conversion banner with editable copy and background media.",
        required: false,
        dataMode: "Manual",
        previewLabel: "CTA copy + background",
        fields: [
          {
            id: "title",
            label: "Section headline",
            type: "Text",
            appearsIn: "Final CTA heading",
            source: "Manual",
            validation: "Maximum 60 characters.",
            example: "Ready to grow your business globally?",
            maxLength: 60
          },
          {
            id: "description",
            label: "Section description",
            type: "Text",
            appearsIn: "Final CTA supporting copy",
            source: "Manual",
            validation:
              "Maximum 140 characters. Keep to one or two short lines.",
            example:
              "Connect with thousands of businesses in the TBSG community to scale your reach and shape your future.",
            maxLength: 140
          },
          {
            id: "cta-label",
            label: "Button label",
            type: "CTA",
            appearsIn: "Final CTA button",
            source: "Manual",
            validation: "Maximum 24 characters.",
            example: "Join TBSG now",
            maxLength: 24
          },
          {
            id: "background-media",
            label: "Background media",
            type: "Image",
            appearsIn: "Final CTA banner background",
            source: "Manual",
            validation:
              "Banner image or video URL. Recommended 1920 x 880 or higher. Keep the main subject away from the centered text zone.",
            example:
              "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1440&q=80"
          }
        ]
      },
      {
        id: "tbsg-footer",
        name: "Footer",
        area: "Footer",
        description:
          "Tenant footer logo, columns, contact details, website, and legal links.",
        required: true,
        dataMode: "Hybrid",
        previewLabel: "Footer links + contact",
        fields: [
          {
            id: "footer-columns",
            label: "Footer columns",
            type: "Navigation",
            appearsIn: "Footer link groups",
            source: "Manual",
            validation: "Broken links must be hidden or disabled.",
            example: "For Buyers, For Suppliers, Support"
          },
          {
            id: "public-address",
            label: "Public address",
            type: "Text",
            appearsIn: "Footer contact block",
            source: "Manual",
            validation: "Maximum 220 characters.",
            example: "Ho Chi Minh City, Vietnam"
          },
          {
            id: "public-website",
            label: "Public website",
            type: "Link",
            appearsIn: "Footer contact block",
            source: "Manual",
            validation: "Must be valid HTTPS URL.",
            example: "https://arobid.com"
          }
        ]
      }
    ]
  }
]

const fieldTypeIcons: Record<FieldType, ReactNode> = {
  Text: <TypeIcon className="size-3.5" />,
  Image: <ImageIcon className="size-3.5" />,
  Video: <PlaySquareIcon className="size-3.5" />,
  CTA: <MousePointerClickIcon className="size-3.5" />,
  Link: <LinkIcon className="size-3.5" />,
  Toggle: <ToggleLeftIcon className="size-3.5" />,
  "Data Source": <Layers3Icon className="size-3.5" />,
  Color: <SlidersHorizontalIcon className="size-3.5" />,
  Navigation: <ArrowRightIcon className="size-3.5" />,
  Metric: <FileTextIcon className="size-3.5" />
}

export function SiteContentBuilder() {
  const [selectedSiteId, setSelectedSiteId] = useState(configurableSites[0].id)
  const [selectedSectionId, setSelectedSectionId] = useState(
    configurableSites[0].sections[0].id
  )
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const [publishedSections, setPublishedSections] = useState<
    Record<string, boolean>
  >({})
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewViewport, setPreviewViewport] =
    useState<PreviewViewport>("desktop")

  const selectedSite =
    configurableSites.find((site) => site.id === selectedSiteId) ??
    configurableSites[0]
  const visibleSections = getBuilderVisibleSections(selectedSite)
  const metadataSections = getBuilderMetadataSections(selectedSite)
  const editableSections = [...metadataSections, ...visibleSections]
  const selectedSection =
    editableSections.find((section) => section.id === selectedSectionId) ??
    visibleSections[0] ??
    metadataSections[0] ??
    selectedSite.sections[0]
  const stats = getSiteStats(selectedSite, editableSections)
  const selectedSectionStatus = getSectionStatus(
    selectedSite.id,
    selectedSection.id,
    publishedSections
  )
  const isManagedSection = Boolean(selectedSection.externalManagement)

  function selectSite(siteId: string) {
    const site = configurableSites.find((item) => item.id === siteId)
    if (!site) return
    const nextVisibleSections = getBuilderVisibleSections(site)
    const nextMetadataSections = getBuilderMetadataSections(site)
    setSelectedSiteId(site.id)
    setSelectedSectionId(
      (nextVisibleSections[0] ?? nextMetadataSections[0] ?? site.sections[0]).id
    )
  }

  function setDraftValue(
    siteId: string,
    sectionId: string,
    field: ContentField,
    value: string
  ) {
    const statusKey = getSectionStatusKey(siteId, sectionId)

    setDraftValues((current) => ({
      ...current,
      [getDraftKey(siteId, sectionId, field.id)]: value
    }))
    setPublishedSections((current) => ({ ...current, [statusKey]: false }))
  }

  function getDraftValue(
    siteId: string,
    sectionId: string,
    field: ContentField
  ) {
    return getFieldPreviewValue(siteId, sectionId, field, draftValues)
  }

  function publishSelectedSection() {
    setPublishedSections((current) => ({
      ...current,
      [getSectionStatusKey(selectedSite.id, selectedSection.id)]: true
    }))
  }

  return (
    <div className="mt-5 space-y-5">
      <section className="flex justify-end rounded-xl border bg-background p-4">
        <SectionActionButtons
          isPublished={selectedSectionStatus === "Published"}
          publishDisabled={isManagedSection}
          onPreview={() => setIsPreviewOpen(true)}
          onPublish={publishSelectedSection}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Sections"
          value={stats.sections}
          caption="Mapped on selected site"
        />
        <MetricCard
          label="Config fields"
          value={stats.fields}
          caption="Editable or linked fields"
        />
        <MetricCard
          label="Text fields"
          value={stats.textFields}
          caption="Marketing copy and labels"
        />
        <MetricCard
          label="Media slots"
          value={stats.mediaFields}
          caption="Image or video locations"
        />
        <MetricCard
          label="Linked data"
          value={stats.linkedFields}
          caption="Products, suppliers, expos"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="xl:sticky xl:top-16 xl:self-start">
          <CardHeader>
            <CardTitle className="text-base">Site and sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {configurableSites.map((site) => (
                <button
                  type="button"
                  key={site.id}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors hover:bg-muted/60",
                    selectedSite.id === site.id &&
                      "border-primary bg-primary/5 shadow-sm"
                  )}
                  onClick={() => selectSite(site.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{site.name}</div>
                      <div className="mt-1 text-muted-foreground text-xs">
                        {site.route}
                      </div>
                    </div>
                    <Badge variant="outline">{site.type}</Badge>
                  </div>
                </button>
              ))}
            </div>

            {metadataSections.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Metadata setup</Label>
                  <span className="text-muted-foreground text-xs">
                    {metadataSections.length} group
                    {metadataSections.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-2">
                  {metadataSections.map((section) => (
                    <button
                      type="button"
                      key={section.id}
                      className={cn(
                        "flex w-full gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60",
                        selectedSection.id === section.id &&
                          "border-primary bg-primary/5"
                      )}
                      onClick={() => setSelectedSectionId(section.id)}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full bg-muted font-medium text-xs",
                          selectedSection.id === section.id &&
                            "bg-primary text-primary-foreground"
                        )}
                      >
                        <FileTextIcon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-sm">
                          {section.name}
                        </span>
                        <span className="mt-1 block text-muted-foreground text-xs">
                          {section.fields.length} fields
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content sections</Label>
                <span className="text-muted-foreground text-xs">
                  {visibleSections.length} sections
                </span>
              </div>
              <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
                {visibleSections.map((section, index) => (
                  <button
                    type="button"
                    key={section.id}
                    className={cn(
                      "flex w-full gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60",
                      selectedSection.id === section.id &&
                        "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedSectionId(section.id)}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full bg-muted font-medium text-xs",
                        selectedSection.id === section.id &&
                          "bg-primary text-primary-foreground"
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-sm">
                        {section.name}
                      </span>
                      <span className="mt-1 block text-muted-foreground text-xs">
                        {section.externalManagement
                          ? section.externalManagement.label
                          : `${section.fields.length} fields`}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  {selectedSection.name}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedSection.externalManagement ? (
              <ExternalManagementNotice section={selectedSection} />
            ) : (
              <>
                <FieldGroupEditor
                  getDraftValue={getDraftValue}
                  onChange={(field, value) =>
                    setDraftValue(
                      selectedSite.id,
                      selectedSection.id,
                      field,
                      value
                    )
                  }
                  section={selectedSection}
                  siteId={selectedSite.id}
                />

                <div className="border-t pt-5">
                  <SectionActionButtons
                    isPublished={selectedSectionStatus === "Published"}
                    onPreview={() => setIsPreviewOpen(true)}
                    onPublish={publishSelectedSection}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <SitePreviewDialog
        draftValues={draftValues}
        open={isPreviewOpen}
        selectedSectionId={selectedSection.id}
        site={selectedSite}
        viewport={previewViewport}
        onOpenChange={setIsPreviewOpen}
        onSectionSelect={setSelectedSectionId}
        onViewportChange={setPreviewViewport}
      />
    </div>
  )
}

function SitePreviewDialog({
  draftValues,
  onOpenChange,
  onSectionSelect,
  onViewportChange,
  open,
  selectedSectionId,
  site,
  viewport
}: {
  draftValues: Record<string, string>
  onOpenChange: (open: boolean) => void
  onSectionSelect: (sectionId: string) => void
  onViewportChange: (viewport: PreviewViewport) => void
  open: boolean
  selectedSectionId: string
  site: SiteConfig
  viewport: PreviewViewport
}) {
  const selectedSection =
    [
      ...getBuilderMetadataSections(site),
      ...getBuilderVisibleSections(site)
    ].find((section) => section.id === selectedSectionId) ?? site.sections[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen max-h-none w-screen max-w-none grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-none p-0 sm:max-w-screen">
        <DialogHeader className="border-b px-5 py-4 pr-14">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <DialogTitle>Preview: {site.name}</DialogTitle>
              <DialogDescription>{site.route}</DialogDescription>
            </div>
            <div className="flex w-fit rounded-lg border bg-muted p-1">
              <Button
                size="sm"
                type="button"
                variant={viewport === "desktop" ? "default" : "ghost"}
                onClick={() => onViewportChange("desktop")}
              >
                <EyeIcon />
                Desktop
              </Button>
              <Button
                size="sm"
                type="button"
                variant={viewport === "mobile" ? "default" : "ghost"}
                onClick={() => onViewportChange("mobile")}
              >
                <MonitorSmartphoneIcon />
                Mobile
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0 overflow-auto bg-[#eef2f6] p-4">
            <SitePreviewSurface
              draftValues={draftValues}
              selectedSectionId={selectedSection.id}
              site={site}
              viewport={viewport}
              onSectionSelect={onSectionSelect}
            />
          </div>

          <aside className="min-h-0 overflow-auto border-l bg-background p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedSection.name}
                </h3>
              </div>

              {selectedSection.externalManagement ? (
                <ExternalManagementNotice section={selectedSection} />
              ) : (
                <FieldGroupPreview
                  draftValues={draftValues}
                  section={selectedSection}
                  siteId={site.id}
                />
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SitePreviewSurface({
  draftValues,
  onSectionSelect,
  selectedSectionId,
  site,
  viewport
}: {
  draftValues: Record<string, string>
  onSectionSelect?: (sectionId: string) => void
  selectedSectionId: string
  site: SiteConfig
  viewport: PreviewViewport
}) {
  const marketplacePreview =
    site.id === "arobid-marketplace"
      ? createMarketplacePreviewConfig(site, draftValues)
      : null
  const tenantPreviewState =
    site.id === "tbsg-tenant"
      ? createTenantPreviewState(site, draftValues)
      : null

  if (tenantPreviewState) {
    return (
      <div
        className={cn(
          "mx-auto min-h-full transition-all",
          viewport === "desktop" ? "max-w-6xl" : "max-w-[390px]"
        )}
      >
        <SiteLivePreview
          branding={tenantPreviewState.branding}
          relations={tenantPreviewState.relations}
          sectionMedia={tenantPreviewState.sectionMedia}
          sections={tenantPreviewState.sections}
        />
      </div>
    )
  }

  if (marketplacePreview) {
    return (
      <div
        className={cn(
          "mx-auto min-h-full overflow-hidden rounded-xl border bg-white shadow-sm transition-all",
          viewport === "desktop" ? "max-w-6xl" : "max-w-[390px]"
        )}
      >
        <MarketplaceHome preview={marketplacePreview} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "mx-auto min-h-full overflow-hidden rounded-xl border bg-white shadow-sm transition-all",
        viewport === "desktop" ? "max-w-6xl" : "max-w-[390px]"
      )}
    >
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-white px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 truncate rounded-md bg-muted px-3 py-1 text-muted-foreground text-xs">
          {site.route}
        </span>
      </div>

      <div className="grid gap-0">
        {site.sections.map((section, index) => {
          const isSelected = section.id === selectedSectionId
          const previewText = getSectionPreviewText(
            site.id,
            section,
            draftValues
          )

          return (
            <button
              type="button"
              key={section.id}
              className={cn(
                "group w-full border-b px-4 py-4 text-left transition-colors hover:bg-primary/5",
                section.area === "Above fold" && "min-h-32 bg-white",
                section.area === "Body" && "min-h-24 bg-white",
                section.area === "Conversion" && "min-h-28 bg-muted/30",
                section.area === "Footer" && "bg-muted/40",
                isSelected && "ring-2 ring-primary ring-inset"
              )}
              onClick={() => onSectionSelect?.(section.id)}
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={isSelected ? "default" : "secondary"}>
                    {index + 1}
                  </Badge>
                  <span className="font-semibold">{section.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {section.fields.length} fields
                  </span>
                </div>
                <p className="line-clamp-2 text-muted-foreground text-sm">
                  {previewText}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SectionActionButtons({
  isPublished,
  onPreview,
  onPublish,
  publishDisabled = false
}: {
  isPublished: boolean
  onPreview: () => void
  onPublish: () => void
  publishDisabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={onPreview}>
        <EyeIcon />
        Preview
      </Button>
      <Button
        type="button"
        variant={isPublished ? "secondary" : "default"}
        disabled={publishDisabled}
        onClick={onPublish}
      >
        Publish
      </Button>
    </div>
  )
}

function ExternalManagementNotice({ section }: { section: SiteSection }) {
  if (!section.externalManagement) return null

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="font-medium text-sm">
        {section.externalManagement.label}
      </div>
      <p className="mt-1 text-muted-foreground text-sm">
        {section.externalManagement.note}
      </p>
      {section.externalManagement.href ? (
        <Link
          className="mt-3 inline-flex items-center gap-1 font-medium text-legend text-sm hover:underline"
          href={section.externalManagement.href}
        >
          Open {section.externalManagement.label}
          <ArrowUpRightIcon className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

function PreviewFieldValueCard({
  field,
  value
}: {
  field: ContentField
  value: string
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium text-sm">
            {fieldTypeIcons[field.type]}
            {field.label}
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
        {formatFieldValue(field, value)}
      </div>
      <p className="mt-2 text-muted-foreground text-xs">{field.validation}</p>
    </div>
  )
}

function MetricCard({
  caption,
  label,
  value
}: {
  caption: string
  label: string
  value: number
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-muted-foreground text-sm">{label}</div>
        <div className="mt-2 font-semibold text-3xl">{value}</div>
        <div className="mt-1 text-muted-foreground text-xs">{caption}</div>
      </CardContent>
    </Card>
  )
}

function FieldEditor({
  field,
  onChange,
  value
}: {
  field: ContentField
  onChange: (value: string) => void
  value: string
}) {
  const fieldId = `field-${field.id}`
  const currentLength = value.length

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Label className="flex items-center gap-2" htmlFor={fieldId}>
            {fieldTypeIcons[field.type]}
            {field.label}
          </Label>
        </div>
        {typeof field.maxLength === "number" ? (
          <div className="shrink-0 text-muted-foreground text-xs">
            {currentLength} / {field.maxLength}
          </div>
        ) : null}
      </div>

      <div className="rounded-md bg-muted/70 px-3 py-2">
        <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
          Current value
        </div>
        <div className="mt-1 whitespace-pre-wrap break-words text-sm">
          {formatFieldValue(field, value)}
        </div>
      </div>

      {renderFieldInput(field, fieldId, value, onChange)}

      <p className="text-muted-foreground text-xs">{field.validation}</p>
    </div>
  )
}

function FieldGroupEditor({
  getDraftValue,
  onChange,
  section,
  siteId
}: {
  getDraftValue: (
    siteId: string,
    sectionId: string,
    field: ContentField
  ) => string
  onChange: (field: ContentField, value: string) => void
  section: SiteSection
  siteId: string
}) {
  const groups = getFieldGroups(section)

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div className="space-y-3" key={group.id}>
          {groups.length > 1 ? (
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <div className="font-medium text-sm">{group.label}</div>
              {group.description ? (
                <div className="mt-1 text-muted-foreground text-xs">
                  {group.description}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-4">
            {group.fields.map((field) => (
              <FieldEditor
                field={field}
                key={field.id}
                value={getDraftValue(siteId, section.id, field)}
                onChange={(value) => onChange(field, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FieldGroupPreview({
  draftValues,
  section,
  siteId
}: {
  draftValues: Record<string, string>
  section: SiteSection
  siteId: string
}) {
  const groups = getFieldGroups(section)

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div className="space-y-3" key={group.id}>
          {groups.length > 1 ? (
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <div className="font-medium text-sm">{group.label}</div>
              {group.description ? (
                <div className="mt-1 text-muted-foreground text-xs">
                  {group.description}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="grid gap-3">
            {group.fields.map((field) => (
              <PreviewFieldValueCard
                field={field}
                key={field.id}
                value={getFieldPreviewValue(
                  siteId,
                  section.id,
                  field,
                  draftValues
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderFieldInput(
  field: ContentField,
  fieldId: string,
  value: string,
  onChange: (value: string) => void
) {
  if (field.type === "Toggle") {
    return (
      <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2">
        <span className="text-sm">
          {value === "Disabled" ? "Hidden" : "Visible"}
        </span>
        <Switch
          checked={value !== "Disabled"}
          id={fieldId}
          onCheckedChange={(checked) =>
            onChange(checked ? "Enabled" : "Disabled")
          }
        />
      </div>
    )
  }

  if (field.type === "Data Source") {
    return (
      <NativeSelect
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value={field.example}>{field.example}</option>
        <option value="Manual curation">Manual curation</option>
        <option value="Linked module data">Linked module data</option>
        <option value="Hybrid manual + linked data">
          Hybrid manual + linked data
        </option>
      </NativeSelect>
    )
  }

  if (field.type === "Color") {
    return (
      <div className="flex gap-2">
        <Input
          className="h-10 w-14 p-1"
          id={fieldId}
          type="color"
          value={isHexColor(value) ? value : "#f97316"}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          maxLength={field.maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }

  if (field.type === "Image" || field.type === "Video") {
    return (
      <div className="flex gap-2">
        <Input
          id={fieldId}
          placeholder={field.example}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button type="button" variant="outline">
          {field.type === "Video" ? <PlaySquareIcon /> : <ImageIcon />}
          Upload
        </Button>
      </div>
    )
  }

  if (
    value.includes("\n") ||
    value.length > 80 ||
    field.type === "Navigation"
  ) {
    return (
      <Textarea
        id={fieldId}
        maxLength={field.maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  return (
    <Input
      id={fieldId}
      maxLength={field.maxLength}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function getSiteStats(
  site: SiteConfig,
  sections = getBuilderVisibleSections(site)
) {
  const fields = sections.flatMap((section) => section.fields)

  return {
    sections: sections.length,
    fields: fields.length,
    textFields: fields.filter((field) =>
      ["Text", "CTA", "Navigation", "Metric"].includes(field.type)
    ).length,
    mediaFields: fields.filter((field) =>
      ["Image", "Video"].includes(field.type)
    ).length,
    linkedFields: fields.filter((field) =>
      ["Linked", "Hybrid"].includes(field.source)
    ).length
  }
}

function getBuilderVisibleSections(site: SiteConfig) {
  if (site.id === "tbsg-tenant") {
    const visibleSectionIds = [
      "tbsg-hero",
      "tbsg-bfm",
      "tbsg-banner-1",
      "tbsg-deals",
      "tbsg-expo",
      "tbsg-banner-2",
      "tbsg-news-video",
      "tbsg-cta"
    ]

    return visibleSectionIds
      .map((sectionId) =>
        site.sections.find((section) => section.id === sectionId)
      )
      .filter((section): section is SiteSection => Boolean(section))
  }

  return site.sections.filter(
    (section) =>
      !section.id.endsWith("-seo") &&
      section.area !== "Footer" &&
      (section.fields.length > 0 || Boolean(section.externalManagement?.href))
  )
}

function getBuilderMetadataSections(site: SiteConfig) {
  return site.sections.filter((section) => section.id.endsWith("-seo"))
}

function getFieldGroups(section: SiteSection): FieldGroup[] {
  if (section.id === "marketplace-seo") {
    return [
      {
        id: "marketplace-homepage",
        label: "Marketplace",
        description: "Homepage metadata for /en and /vi.",
        fields: section.fields.filter((field) => field.id.startsWith("home-"))
      },
      {
        id: "marketplace-tradexpo",
        label: "TradeXpo",
        description: "Public TradeXpo landing page metadata by locale.",
        fields: section.fields.filter((field) =>
          field.id.startsWith("tradexpo-")
        )
      },
      {
        id: "marketplace-bfm",
        label: "Buyer Find & Match",
        description: "BFM landing page metadata for EN and VI.",
        fields: section.fields.filter((field) => field.id.startsWith("bfm-"))
      }
    ].filter((group) => group.fields.length > 0)
  }

  if (section.id === "tbsg-seo") {
    return [
      {
        id: "tbsg-en",
        label: "TBSG EN",
        description:
          "Metadata for https://arobid.com/partner/en/hdn-taybacsaigon",
        fields: section.fields.filter((field) => field.id.endsWith("-en"))
      },
      {
        id: "tbsg-vi",
        label: "TBSG VI",
        description:
          "Metadata for https://arobid.com/partner/vi/hdn-taybacsaigon",
        fields: section.fields.filter((field) => field.id.endsWith("-vi"))
      }
    ].filter((group) => group.fields.length > 0)
  }

  return [
    {
      id: section.id,
      label: section.name,
      fields: section.fields
    }
  ]
}

function createMarketplacePreviewConfig(
  site: SiteConfig,
  draftValues: Record<string, string>
): MarketplacePreviewConfig {
  const read = (sectionId: string, fieldId: string, fallback = "") =>
    getBuilderFieldValue(site, draftValues, sectionId, fieldId, fallback)
  const searchPlaceholder = read(
    "marketplace-header",
    "search-placeholder",
    "Watch for men, industrial parts, solar systems..."
  )

  return {
    header: {
      logoSrc: firstMediaReference(read("marketplace-header", "logo")),
      searchPlaceholder
    },
    hero: {
      imageSrc: firstMediaReference(read("marketplace-hero", "hero-image")),
      eyebrow: read("marketplace-hero", "eyebrow"),
      headline: read("marketplace-hero", "headline"),
      searchPlaceholder
    },
    tradeXpo: {
      title: read("marketplace-tradexpo", "heading"),
      description: read("marketplace-tradexpo", "description")
    },
    bfm: {
      description: read("marketplace-bfm", "description"),
      ctaLabel: read("marketplace-bfm", "cta-label"),
      mediaSrc: firstMediaReference(read("marketplace-bfm", "media"))
    },
    rfqHub: {
      title: read("marketplace-rfq-ai", "rfq-headline"),
      description: read("marketplace-rfq-ai", "rfq-description"),
      ctaLabel: read("marketplace-rfq-ai", "rfq-cta")
    },
    trustCta: {
      title: read("marketplace-trust-cta", "headline"),
      description: read("marketplace-trust-cta", "description")
    }
  }
}

function getSectionStatus(
  siteId: string,
  sectionId: string,
  publishedSections: Record<string, boolean>
) {
  return publishedSections[getSectionStatusKey(siteId, sectionId)]
    ? "Published"
    : "Draft"
}

function createTenantPreviewState(
  site: SiteConfig,
  draftValues: Record<string, string>
): {
  branding: SiteBranding
  relations: TenantRelation[]
  sectionMedia: SiteSectionMedia
  sections: EnabledSiteSections
} {
  const read = (sectionId: string, fieldId: string, fallback = "") =>
    getBuilderFieldValue(site, draftValues, sectionId, fieldId, fallback)

  const tenantName = read("tbsg-branding", "tenant-name")
  const tagline = read("tbsg-branding", "tagline")
  const logoUrl = firstMediaReference(read("tbsg-branding", "logo"))
  const brandColor = read("tbsg-branding", "brand-color")
  const heroMedia = toMediaReferences(read("tbsg-hero", "hero-media"), 1)
  const bfmMedia = toMediaReferences(read("tbsg-bfm", "media"), 1)
  const bannerAds1Media = [
    firstMediaReference(read("tbsg-banner-1", "desktop-vi")),
    firstMediaReference(read("tbsg-banner-1", "desktop-en")),
    firstMediaReference(read("tbsg-banner-1", "mobile-vi")),
    firstMediaReference(read("tbsg-banner-1", "mobile-en"))
  ]
  const dealMedia = [
    firstMediaReference(read("tbsg-deals", "deal-slot-1")),
    firstMediaReference(read("tbsg-deals", "deal-slot-2")),
    firstMediaReference(read("tbsg-deals", "deal-slot-3")),
    firstMediaReference(read("tbsg-deals", "deal-slot-4")),
    firstMediaReference(read("tbsg-deals", "deal-slot-5"))
  ]
  const expoMedia = toMediaReferences(
    read("tbsg-expo", "expo-media", getSectionPreviewImage(site, "tbsg-expo")),
    1
  )
  const bannerAds2Media = [
    firstMediaReference(read("tbsg-banner-2", "desktop-vi")),
    firstMediaReference(read("tbsg-banner-2", "desktop-en")),
    firstMediaReference(read("tbsg-banner-2", "mobile-vi")),
    firstMediaReference(read("tbsg-banner-2", "mobile-en"))
  ]
  const whyJoinMedia = toMediaReferences(read("tbsg-news-video", "media"), 1)
  const ctaMedia = toMediaReferences(read("tbsg-cta", "background-media"), 1)
  const defaultTenantName = "TBSG / Taybacsaigon"
  const defaultTagline =
    "Connect members, suppliers, buyers, and trade opportunities through Arobid."

  return {
    branding: {
      ...initialBranding,
      tenantName: tenantName || defaultTenantName,
      tagline: tagline || defaultTagline,
      logoUrl,
      bannerUrl: heroMedia[0] ?? "",
      primaryColor: isHexColor(brandColor) ? brandColor : "#f97316",
      heroEyebrow: "TBSG / Taybacsaigon",
      heroTitle: read(
        "tbsg-hero",
        "hero-title",
        tenantName || defaultTenantName
      ),
      heroCopy: read("tbsg-hero", "hero-copy", tagline || defaultTagline),
      searchPlaceholder: read(
        "tbsg-hero",
        "search-placeholder",
        "Search suppliers, products, expos..."
      ),
      headerCtaLabel: read("tbsg-header", "header-cta", "Join now"),
      navItems: toTextList(
        read(
          "tbsg-header",
          "nav-items",
          "All Categories, TradeXpo, Suppliers, eVoucher Deals, For Members, About TBSG"
        )
      ),
      bfmTitle: "Buyer Find & Match",
      bfmCopy: read(
        "tbsg-bfm",
        "description",
        "Instantly connecting standardized supplier data with verified buyer intent for absolute precision in global sourcing."
      ),
      bfmCtaLabel: read("tbsg-bfm", "cta-label", "Get Matches Now"),
      expoTitle: read(
        "tbsg-expo",
        "expo-title",
        "Discover Upcoming Trade Events"
      ),
      expoDescription: read(
        "tbsg-expo",
        "expo-description",
        "Explore trade expos, connect with global businesses, and discover new opportunities on TradeXpo."
      ),
      expoCtaLabel: read("tbsg-expo", "expo-cta", "Explore TradeXpo"),
      whyJoinTitle: read("tbsg-news-video", "title", "Why join TBSG?"),
      whyJoinDescription: read(
        "tbsg-news-video",
        "description",
        "Connecting business partners.\nSupporting business transformation.\nExpanding global trade channels."
      ),
      whyJoinCtaLabel: read("tbsg-news-video", "cta-label", "Join TBSG now"),
      whyJoinNewsUrls: toTextList(read("tbsg-news-video", "news-urls")),
      finalCtaTitle: read(
        "tbsg-cta",
        "title",
        "Ready to grow your business globally?"
      ),
      finalCtaDescription: read(
        "tbsg-cta",
        "description",
        "Connect with thousands of businesses in the TBSG community to scale your reach and shape your future."
      ),
      finalCtaLabel: read("tbsg-cta", "cta-label", "Join TBSG now"),
      ctaOption: "contact_tenant",
      publicEmail: initialBranding.publicEmail,
      publicPhone: initialBranding.publicPhone,
      serviceBundleText: initialBranding.serviceBundleText
    },
    relations: createTenantPreviewRelations(site, draftValues),
    sectionMedia: {
      ...initialSectionMedia,
      banner: heroMedia,
      bannerAds1: bannerAds1Media,
      bfm: bfmMedia,
      deals: dealMedia,
      hotProducts: initialSectionMedia.hotProducts,
      expoCarousel: expoMedia,
      bannerAds2: bannerAds2Media,
      newProducts: initialSectionMedia.newProducts,
      promo: whyJoinMedia,
      cta: ctaMedia
    },
    sections: {
      ...initialSections,
      bannerAds1: isTenantBuilderSectionVisible(
        site,
        draftValues,
        "tbsg-banner-1"
      ),
      bannerAds2: isTenantBuilderSectionVisible(
        site,
        draftValues,
        "tbsg-banner-2"
      ),
      community: false,
      categories: false,
      featuredSuppliers: false,
      deals: isTenantBuilderSectionVisible(site, draftValues, "tbsg-deals"),
      hotProducts: false,
      expoCarousel: isTenantBuilderSectionVisible(
        site,
        draftValues,
        "tbsg-expo"
      ),
      newProducts: false,
      recommendedSuppliers: false,
      promo: isTenantBuilderSectionVisible(
        site,
        draftValues,
        "tbsg-news-video"
      ),
      featureCards: false,
      partners: false,
      cta: isTenantBuilderSectionVisible(site, draftValues, "tbsg-cta")
    }
  }
}

function getBuilderFieldValue(
  site: SiteConfig,
  draftValues: Record<string, string>,
  sectionId: string,
  fieldId: string,
  fallback = ""
) {
  const field = site.sections
    .find((section) => section.id === sectionId)
    ?.fields.find((item) => item.id === fieldId)
  if (!field) return fallback

  return draftValues[getDraftKey(site.id, sectionId, field.id)] ?? field.example
}

function isTenantBuilderSectionVisible(
  site: SiteConfig,
  draftValues: Record<string, string>,
  sectionId: string
) {
  const section = site.sections.find((item) => item.id === sectionId)
  const toggleField = section?.fields.find((field) => field.type === "Toggle")
  if (!toggleField) return true

  return (
    (draftValues[getDraftKey(site.id, sectionId, toggleField.id)] ??
      toggleField.example) !== "Disabled"
  )
}

function createTenantPreviewRelations(
  site: SiteConfig,
  draftValues: Record<string, string>
): TenantRelation[] {
  const relationFieldId = "relation-list"
  const relationDraft =
    draftValues[getDraftKey(site.id, "tbsg-partners", relationFieldId)]
  if (!relationDraft) return initialRelations

  return toTextList(relationDraft).map((name, index) => ({
    id: `builder-relation-${index}`,
    name,
    type: index % 2 === 0 ? ("partner" as const) : ("sponsor" as const),
    tier: index % 2 === 0 ? "Strategic Partner" : "Sponsor",
    logoUrl: "",
    websiteUrl: "https://arobid.com",
    active: true
  }))
}

function toTextList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toMediaReferences(value: string, slotCount: number) {
  const references = toTextList(value).filter(isMediaReference)
  if (references.length === 0)
    return Array.from({ length: slotCount }, () => "")

  return Array.from(
    { length: slotCount },
    (_, index) => references[index] ?? references[0]
  )
}

function firstMediaReference(value: string) {
  return toMediaReferences(value, 1)[0] ?? ""
}

function getSectionPreviewImage(site: SiteConfig, sectionId: string) {
  return (
    site.sections.find((section) => section.id === sectionId)?.previewImage ??
    ""
  )
}

function isMediaReference(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("data:image/") ||
    value.startsWith("data:video/")
  )
}

function getSectionPreviewText(
  siteId: string,
  section: SiteSection,
  draftValues: Record<string, string>
) {
  const primaryField = section.fields.find(
    (field) => field.type === "Text" || field.type === "CTA"
  )

  if (!primaryField) return section.previewLabel

  return (
    getFieldPreviewValue(siteId, section.id, primaryField, draftValues) ||
    section.previewLabel
  )
}

function getFieldPreviewValue(
  siteId: string,
  sectionId: string,
  field: ContentField,
  draftValues: Record<string, string>
) {
  return draftValues[getDraftKey(siteId, sectionId, field.id)] ?? field.example
}

function formatFieldValue(field: ContentField, value: string) {
  if (!value.trim()) return "No value"
  if (field.type === "Toggle") {
    return value === "Disabled" ? "Hidden" : "Visible"
  }

  return value
}

function getDraftKey(siteId: string, sectionId: string, fieldId: string) {
  return `${siteId}:${sectionId}:${fieldId}`
}

function getSectionStatusKey(siteId: string, sectionId: string) {
  return `${siteId}:${sectionId}:published`
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}
