import { BadgeCheck, Gem, Rocket } from "lucide-react"
import type { ComponentType } from "react"

export const asset = (name: string) => `/landing/${name}`

export const heroStats = [
  ["320+", "Exhibitors"],
  ["25K", "Visitors"],
  ["1000+", "Products"],
  ["80", "RFQs"],
] as const

export const sponsors = [
  ["Google", "sponsor-google.svg"],
  ["Microsoft", "sponsor-microsoft.svg"],
  ["Dropbox", "sponsor-dropbox.svg"],
  ["OpenAI", "sponsor-openai.svg"],
  ["Claude", "sponsor-claude.svg"],
] as const

export const productImages = [
  "figma-product-1.png",
  "figma-product-2.png",
  "figma-product-3.png",
  "figma-product-4.png",
] as const

export const audiences = [
  {
    number: "01",
    title: "The Buyers",
    body: "Real estate developers, main contractors, and architects seeking high-performance materials and infrastructure solutions.",
    tags: ["Real Estate", "Construction", "Architects"],
    offset: "lg:pt-[93px]",
  },
  {
    number: "02",
    title: "The Suppliers",
    body: "Material manufacturers and tech providers digitizing their portfolios to reach 12,000+ high-intent buyers globally.",
    tags: ["Manufacturers", "Tech", "Global"],
    offset: "lg:pt-0",
  },
  {
    number: "03",
    title: "The Partners",
    body: "Trade associations, logistics, and Green Building councils facilitate seamless global construction supply chains.",
    tags: ["Logistics", "Councils", "Associations"],
    offset: "lg:pt-[93px]",
  },
] as const

export const categories = [
  "Surface & Interior Finishing",
  "Structural & Raw Materials",
  "Roofing & Ceiling Systems",
  "Sanitary Ware & Plumbing",
  "HVAC, Lifts & Building MEP",
  "Doors, Windows & Glass Systems",
] as const

export const valueCards: Array<{
  title: string
  icon: ComponentType<{ className?: string }>
  tone: string
  points: string[]
}> = [
  {
    title: "Buyers (Visitors)",
    icon: BadgeCheck,
    tone: "bg-[#ecfdf5] text-[#16a34a]",
    points: [
      "Direct access to verified supply sources from numerous reputable manufacturers.",
      "Explore and evaluate products intuitively through advanced 3D/VR technology.",
      "Connect directly and facilitate trade via integrated video conferencing tools.",
    ],
  },
  {
    title: "Sellers (Exhibitors)",
    icon: Rocket,
    tone: "bg-[#fff7ed] text-[#ed6203]",
    points: [
      "Establish a professional digital presence with world-class virtual booths.",
      "Engage with a vast network of potential global buyers and sourcing specialists.",
      "Maximize cost-efficiency and operational agility compared to traditional models.",
    ],
  },
  {
    title: "Partners",
    icon: Gem,
    tone: "bg-[#ecfeff] text-[#0ea5e9]",
    points: [
      "Enhance brand visibility among high-profile industry audiences and strategic leads.",
      "Gain exclusive partnership benefits and high-level networking opportunities.",
      "Access post-event data analytics and in-depth market intelligence reports.",
    ],
  },
]

export const boothFeatures = [
  ["VIP Floor Area", true],
  ["10 Display Products", true],
  ["5 Advertising Banners", true],
  ["4 Standees", true],
  ["Brand Placement: Full Media Suite", false],
  ["GoLive: Video, Chat & Webinar", false],
  ["Product Listings: Unlimited", false],
  ["Priority Featured Placement", false],
  ["Dedicated Account Manager", true],
] as const
