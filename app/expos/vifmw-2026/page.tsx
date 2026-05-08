import {
  ArrowRight,
  BadgeCheck,
  Box,
  Check,
  ChevronRight,
  Gem,
  Home,
  Rocket,
  Send,
  Video,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { ComponentType } from "react"

import { ExhibitorsSection } from "@/app/expos/vifmw-2026/exhibitors-section"
import { TxFooter } from "@/components/landing/tx-footer"
import { TxHeader } from "@/components/landing/tx-header"
import {
  listExpoDetailExhibitorsByName,
} from "@/lib/tradexpo/db/platform-data"
import { cn } from "@/lib/utils"

const asset = (name: string) => `/landing/${name}`

const heroStats = [
  ["320+", "Exhibitors"],
  ["25K", "Visitors"],
  ["1000+", "Products"],
  ["80", "RFQs"],
]

const sponsors = [
  ["Google", "sponsor-google.svg"],
  ["Microsoft", "sponsor-microsoft.svg"],
  ["Dropbox", "sponsor-dropbox.svg"],
  ["OpenAI", "sponsor-openai.svg"],
  ["Claude", "sponsor-claude.svg"],
]

const productImages = [
  "figma-product-1.png",
  "figma-product-2.png",
  "figma-product-3.png",
  "figma-product-4.png",
]

const audiences = [
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
]

const categories = [
  "Surface & Interior Finishing",
  "Structural & Raw Materials",
  "Roofing & Ceiling Systems",
  "Sanitary Ware & Plumbing",
  "HVAC, Lifts & Building MEP",
  "Doors, Windows & Glass Systems",
]

const valueCards: Array<{
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

const boothFeatures = [
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

export default async function Page() {
  const exhibitors = await listExpoDetailExhibitorsByName("VIFMW")
  return (
    <main className="min-h-screen bg-white text-[#030712] [font-family:var(--font-tight)]">
      <TxHeader />
      <Breadcrumb />
      <Hero />
      <About />
      <Sponsors />
      <ExhibitorsSection initialExhibitors={exhibitors} />
      <Audience />
      <Categories />
      <ParticipantValues />
      <BoothTier />
      <TxFooter />
    </main>
  )
}

function Breadcrumb() {
  return (
    <nav className="mx-auto flex h-[52px] max-w-[1284px] items-center gap-1 px-4 text-[#1f2937] text-sm md:px-0">
      <Home className="size-4" />
      <ChevronRight className="size-4 text-[#9ca3af]" />
      <span>Expo Detail</span>
    </nav>
  )
}

function Hero() {
  return (
    <section className="bg-linear-to-b from-white via-[#ffe0d2] via-[26%] to-white pb-0">
      <div className="relative mx-auto min-h-[616px] max-w-[1284px] overflow-hidden rounded-2xl">
        <Image
          src={asset("figma-hero.png")}
          alt=""
          fill
          priority
          sizes="(min-width: 1280px) 1284px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-[390px] bg-linear-to-b from-black/0 to-black/80 backdrop-blur-[5px]" />
        <div className="absolute top-6 left-4 rounded-full bg-[#e4e7ff] px-2 py-1 font-medium text-[#022582] text-xs md:top-[244px] md:left-10">
          Global Strategic Network
        </div>
        <div className="absolute right-7 bottom-6 hidden w-[271px] md:block">
          <div className="mx-auto flex w-max items-center gap-3 rounded-full bg-[#01175c] py-1.5 pr-5 pl-1.5">
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[#16a34a] px-3 font-medium text-white text-xs">
              <Video className="size-3" />
              Live
            </span>
            <span className="text-sm text-white">Event ends in</span>
          </div>
          <div className="mt-[-10px] rounded-xl border border-[#f3f4f6] bg-white px-6 pt-7 pb-5 shadow-lg">
            <div className="flex items-center justify-between text-center">
              {[
                ["12", "Days"],
                ["03", "Hours"],
                ["24", "Min"],
                ["00", "Sec"],
              ].map(([value, label], index) => (
                <div key={label} className="contents">
                  {index > 0 && <span className="font-medium">:</span>}
                  <div>
                    <p className="font-medium text-2xl leading-8">{value}</p>
                    <p className="text-[#6b7280] text-xs">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-[-2px] grid grid-cols-[1fr_auto_1fr] items-end rounded-xl border border-[#f3f4f6] bg-white px-4 py-3 shadow-lg">
            <div>
              <p className="text-[#6b7280] text-xs">Start</p>
              <p className="font-medium text-sm">April 15, 2026</p>
            </div>
            <span className="grid h-4 w-5 place-items-center rounded-full bg-[#ed6203] text-white">
              <ArrowRight className="size-3" />
            </span>
            <div className="text-right">
              <p className="text-[#6b7280] text-xs">End</p>
              <p className="font-medium text-sm">April 17, 2026</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-7 max-w-[720px] text-white md:left-10">
          <h1 className="max-w-[684px] font-medium text-[32px] leading-[1.18] tracking-normal md:text-[36px] md:leading-[44px]">
            Vietnam International Furniture Manufacturing & Wood Expo (VIFMW) #1
          </h1>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link
              href="/seller"
              className="inline-flex h-10 w-[178px] items-center justify-center gap-2 rounded-full bg-[#ed6203] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_#f37b42]"
            >
              <Box className="size-5" />
              Virtual Lobby
            </Link>
            <Link
              href="/seller"
              className="inline-flex h-10 w-[178px] items-center justify-center rounded-full border border-white bg-white/10 font-medium text-white backdrop-blur"
            >
              Join as Exhibitor
            </Link>
          </div>
          <div className="mt-9 grid max-w-[630px] grid-cols-2 gap-y-4 divide-white/20 md:grid-cols-4 md:divide-x">
            {heroStats.map(([value, label]) => (
              <div key={label} className="first:pl-0 md:px-5">
                <p className="font-medium text-2xl leading-8">{value}</p>
                <p className="text-[#9ca3af] text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function About() {
  return (
    <section className="relative mx-auto grid max-w-[1284px] gap-8 px-4 py-16 md:grid-cols-[1fr_1.1fr] md:px-0">
      <h2 className="font-semibold text-[32px] leading-10">About VICONS</h2>
      <div>
        <p className="max-w-[519px] text-[#1f2937] text-sm leading-6">
          At the 1st Vietnam International Construction & Building Materials
          Expo, businesses can demonstrate their large-scale production capacity
          and compliance with rigorous technical standards such as ISO 9001, CE,
          ASTM, JIS, and green building certifications like LEED and BREEAM.
          Through interactive 3D/VR models, suppliers can intuitively showcase
          their full portfolio, ranging from structural steel and raw materials
          to finishing materials and modern M&E systems.
        </p>
        <a
          href="#booths"
          className="mt-4 inline-flex items-center gap-1 font-medium text-[#ed6203] text-sm"
        >
          View more
          <ArrowRight className="size-4" />
        </a>
      </div>
      <Link
        href="/seller/deal-room"
        className="absolute right-3 bottom-6 hidden flex-col items-center gap-1 rounded-full bg-white p-2 text-center text-[#ed6203] text-xs shadow-md lg:flex"
      >
        <span className="grid size-10 place-items-center rounded-full bg-[#ffefe6]">
          <Send className="size-5" />
        </span>
        Chat
      </Link>
    </section>
  )
}

function Sponsors() {
  return (
    <section
      id="sponsors"
      className="mx-auto max-w-[1284px] px-4 pb-10 md:px-0"
    >
      <div className="border-[#e5e7eb] border-t pt-10 text-center">
        <p className="font-medium text-[#1f2937]">
          Get sponsored by companies such as:
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {sponsors.map(([name, image]) => (
            <Image
              key={name}
              src={asset(image)}
              alt={name}
              width={150}
              height={32}
              className="h-7 max-w-[150px] object-contain"
            />
          ))}
          <span className="font-bold text-2xl">HubSpot</span>
        </div>
      </div>
    </section>
  )
}

function Audience() {
  return (
    <section className="mx-auto max-w-[1284px] px-4 py-16 md:px-0">
      <h2 className="text-center font-semibold text-[32px] leading-10">
        Who Should Attend?
      </h2>
      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {audiences.map((audience) => (
          <article
            key={audience.number}
            className={cn("flex gap-6", audience.offset)}
          >
            <p className="pt-10 font-medium text-[#9ba5ff] text-[32px] leading-10">
              {audience.number}
            </p>
            <div>
              <h3 className="font-semibold text-xl leading-7">
                {audience.title}
              </h3>
              <p className="mt-1 text-[#1f2937] text-sm leading-5">
                {audience.body}
              </p>
              <div className="mt-6 flex flex-wrap gap-1">
                {audience.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[#1f2937] text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Categories() {
  return (
    <section className="mx-auto max-w-[1284px] px-4 pb-16 text-center md:px-0">
      <h2 className="font-semibold text-[32px] leading-10">
        Exhibited Categories
      </h2>
      <p className="mt-2 text-[#1f2937]">
        Navigating the complete spectrum of construction materials and
        architectural solutions.
      </p>
      <div className="mt-10 grid gap-6 text-left md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category, index) => (
          <div
            key={category}
            className="flex h-20 items-center gap-4 rounded-lg border border-[#f3f4f6] bg-white p-2"
          >
            <div className="relative size-16 overflow-hidden rounded">
              <Image
                src={asset(productImages[index % productImages.length])}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <p className="font-medium text-lg">{category}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ParticipantValues() {
  return (
    <section className="bg-[#f9fafb] px-4 py-16 md:px-[78px]">
      <div className="mx-auto max-w-[1284px] text-center">
        <h2 className="font-semibold text-[32px] leading-10">
          Exclusive Values for Each Participant
        </h2>
        <p className="mt-2 text-[#1f2937]">
          Specialized digital solutions to maximize trade efficiency and
          technical connectivity for all participants.
        </p>
        <div className="mt-10 grid gap-6 text-left lg:grid-cols-3">
          {valueCards.map(({ title, icon: Icon, tone, points }) => (
            <article key={title} className="rounded-xl bg-white p-6">
              <div
                className={cn(
                  "grid size-[58px] place-items-center rounded-lg",
                  tone,
                )}
              >
                <Icon className="size-7" />
              </div>
              <h3 className="mt-4 font-semibold text-xl leading-7">{title}</h3>
              <div className="mt-4 border-[#e5e7eb] border-t pt-4">
                <ul className="space-y-4">
                  {points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#16a34a]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function BoothTier() {
  return (
    <section id="booths" className="mx-auto max-w-[1284px] px-4 py-16 md:px-0">
      <h2 className="text-center font-semibold text-[32px] leading-10">
        Type of 3D Booths
      </h2>
      <p className="mt-2 text-center text-[#1f2937]">
        Choose a professional exhibition space tailored to your business scale.
      </p>
      <div className="mt-10 grid border-[#e5e7eb] border-b text-center md:grid-cols-3">
        {["Basic", "Professional", "Premium"].map((tab) => (
          <button
            type="button"
            key={tab}
            className={cn(
              "h-12 font-medium text-sm",
              tab === "Premium" && "border-[#ed6203] border-b-2 text-[#ed6203]",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.06fr]">
        <div>
          <h3 className="font-semibold text-2xl leading-8">Premium Booth</h3>
          <p className="mt-2 text-[#6b7280] text-sm leading-5">
            Ultimate exhibition experience with maximum visibility and advanced
            features for enterprise-level presence.
          </p>
          <p className="mt-7 font-medium text-2xl leading-8">
            Contact for Pricing
          </p>
          <div className="mt-5 grid gap-x-6 gap-y-2 md:grid-cols-2">
            {boothFeatures.map(([feature, strong]) => (
              <div key={feature} className="flex items-center gap-3 text-sm">
                <Check className="size-4 text-[#16a34a]" />
                <span className={strong ? "font-semibold" : undefined}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              className="h-10 rounded-full bg-[#f3f4f6] px-6 font-medium text-[#1f2937] text-sm"
            >
              Explore Exhibitions
            </button>
            <button
              type="button"
              className="h-10 rounded-full bg-[#ed6203] px-10 font-medium text-sm text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_#f37b42]"
            >
              Book Now
            </button>
          </div>
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-2xl bg-[#f3f4f6]">
          <p className="absolute top-8 left-1/2 -translate-x-1/2 font-semibold text-xl">
            Premium
          </p>
          <Image
            src={asset("figma-booth-premium.png")}
            alt="Premium 3D booth"
            width={500}
            height={437}
            loading="eager"
            className="absolute top-[58px] left-1/2 w-[250px] -translate-x-1/2 object-contain md:w-[300px]"
          />
          <div className="absolute top-1/2 left-1/2 grid size-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[20px] bg-black/60 text-white backdrop-blur-sm">
            <Box className="size-10" />
          </div>
        </div>
      </div>
      <div className="relative mt-16 min-h-[272px] overflow-hidden rounded-2xl bg-black">
        <Image
          src={asset("figma-promo.png")}
          alt=""
          fill
          loading="eager"
          sizes="(min-width: 1280px) 1282px, 100vw"
          className="object-cover"
        />
        <div className="relative z-10 max-w-[560px] px-8 py-10 text-white md:px-14 md:py-14">
          <p className="font-semibold text-[34px] leading-[1.15] md:text-[40px] md:leading-[48px]">
            Your road to big deals starts at the 2026 Expos.
          </p>
          <Link
            href="/seller"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-[#ed6203] px-6 font-medium text-sm text-white"
          >
            <Send className="size-4" />
            Register Booth Lite
          </Link>
        </div>
      </div>
    </section>
  )
}
