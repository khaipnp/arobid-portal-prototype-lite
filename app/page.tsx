"use client";

import {
  ArrowRight,
  BadgeCheck,
  Box,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  Grid2X2,
  Heart,
  Minus,
  Plane,
  Play,
  Plus,
  Sparkles,
  Store,
  Users,
  Video,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { TxFooter } from "@/components/landing/tx-footer";
import { TxHeader } from "@/components/landing/tx-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const asset = (name: string) => `/landing/${name}`;

const categories = [
  "All Events",
  "Agriculture",
  "Construction",
  "Electronics",
  "Energy",
  "Fashion",
  "Food",
  "Home",
  "Lighting",
  "Machinery",
  "Materials",
];

const expos = [
  {
    title:
      "Vietnam International Furniture Manufacturing & Wood Expo (VIFMW) #1",
    image: "figma-expo-card.png",
    status: "Live",
    tags: ["Hot pick"],
    stats: ["320+", "25K", "800"],
    action: "Virtual Lobby",
  },
  {
    title: "Vietnam International Wood & Furniture Expo (VIFF) #1",
    image: "expo-2.jpg",
    status: "Upcoming",
    tags: ["Hot pick", "Featured"],
    stats: ["0", "0", "1000+"],
    action: "Join as Exhibitor",
    highlighted: true,
  },
  {
    title: "Vietnam International Furniture & Wood Industry Expo (VIFW) #1",
    image: "expo-3.jpg",
    status: "Live",
    tags: ["Hot pick"],
    stats: ["100+", "24K", "900+"],
    action: "Virtual Lobby",
  },
  {
    title: "Vietnam International Timber & Furniture Expo (VITF) #1",
    image: "expo-4.jpg",
    status: "Archived",
    tags: [],
    stats: ["850", "12.5K", "450+"],
    action: "Virtual Lobby",
    disabled: true,
  },
  {
    title:
      "Arobid TradeXpo 2026: Vietnam International Wood Products & Furniture Expo",
    image: "expo-5.jpg",
    status: "Live",
    tags: ["Hot pick"],
    stats: ["89", "8.2K", "1.2K"],
    action: "Virtual Lobby",
  },
  {
    title: "Vietnam International Woodworking & Furniture Expo (VIWFEX) #1",
    image: "expo-6.jpg",
    status: "Live",
    tags: ["Featured"],
    stats: ["210", "15K", "150"],
    action: "Virtual Lobby",
  },
  {
    title: "Vietnam International Interior Furniture & Wood Expo (VIIFW) #1",
    image: "expo-7.jpg",
    status: "Live",
    tags: ["Hot pick"],
    stats: ["320+", "25K", "800"],
    action: "Virtual Lobby",
  },
  {
    title: "Vietnam International Wood & Interior Design Expo (VIWID) #1",
    image: "expo-8.jpg",
    status: "Archived",
    tags: ["Featured"],
    stats: ["56", "150", "890"],
    action: "Virtual Lobby",
    disabled: true,
  },
  {
    title: "Vietnam International Furniture, Timber & Wood Expo (VIFTW) #1",
    image: "expo-9.jpg",
    status: "Upcoming",
    tags: ["Hot pick"],
    stats: ["0", "0", "1000+"],
    action: "Join as Exhibitor",
  },
];

const plans = [
  {
    name: "Basic",
    image: "booth-basic.jpg",
    price: "VND 8.000.000",
    description:
      "Ideal for businesses establishing a professional digital presence to connect with global partners.",
    features: [
      "Standard Floor Area",
      "2 Display Products",
      "1 Advertising Banner",
      "1 Standee",
      "Brand Placement: Video",
      "GoLive: Video & Chat",
      "Product Listing: 10",
    ],
  },
  {
    name: "Professional",
    image: "booth-pro.jpg",
    price: "VND 20.000.000",
    featured: true,
    description:
      "Designed for businesses transforming their virtual booth into a powerful marketing engine to attract high-value partners.",
    features: [
      "150% Standard Floor Area",
      "8 Display Products",
      "15 Advertising Banners",
      "1 Video Display Screen (10s)",
      "2 Standees",
      "Brand Placement: 3D",
      "GoLive: Video & Chat",
      "Product Listing: 20",
    ],
  },
  {
    name: "Premium",
    image: "booth-premium.jpg",
    price: "VND 35.000.000",
    description:
      "The ultimate choice for industry leaders aiming to become the exhibition's centerpiece while asserting global prestige.",
    features: [
      "300% Standard Floor Area",
      "16 Display Products",
      "25 Advertising Banners",
      "1 Video Screens (20s)",
      "2 Standees",
      "Brand Placement: 3D",
      "GoLive: Video & Chat",
      "Product Listing: 50",
    ],
  },
];

const faqs = [
  {
    question: "How long does it take to set up my Virtual Booth after booking?",
    answer:
      "Most booths can be prepared within a few working days once booth content, brand assets, and product information are provided.",
  },
  {
    question: "How does booking a booth activate the AI Matching feature?",
    answer:
      "Once your booth is live, our engine scans your product data and automatically recommends your booth to 95% of high-intent buyers with matching sourcing needs.",
  },
  {
    question:
      "How does a Virtual Booth compare to a physical one in terms of cost?",
    answer:
      "A Virtual Booth reduces setup, travel, logistics, and staffing costs while keeping the core exposure and lead-generation workflow online.",
  },
  {
    question: "Do I get technical support if I'm not tech-savvy?",
    answer:
      "Yes. Arobid support can guide booth content preparation, publishing, and daily operation so teams can focus on trading activity.",
  },
];

export default function Page() {
  const [openFaq, setOpenFaq] = useState(1);

  return (
    <main className="min-h-screen bg-white text-[#030712] [font-family:var(--font-tight)]">
      <TxHeader />
      <Hero />
      <Exhibitions />
      <Introduction />
      <Pricing />
      <BoothSteps />
      <Ecosystem />
      <Partners />
      <Sponsors />
      <Faqs openFaq={openFaq} setOpenFaq={setOpenFaq} />
      <TxFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[617px] overflow-hidden">
      <Image
        src={asset("hero-bg.jpg")}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 h-[350px] bg-gradient-to-b from-black/0 to-black/80 backdrop-blur-[2px]" />
      <div className="relative mx-auto flex min-h-[617px] max-w-[1440px] items-end justify-between gap-8 px-5 pb-10 md:px-[78px] md:pb-14">
        <div className="max-w-[720px] pb-8 text-white">
          <p className="font-medium text-sm drop-shadow-lg">
            20 MAY - 22 MAY, 2026
          </p>
          <h1 className="mt-2 max-w-[678px] font-medium text-4xl leading-[1.15] tracking-normal drop-shadow-xl md:text-[36px]">
            Vietnam International Furniture Manufacturing & Wood Expo (VIFMW) #1
          </h1>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/seller"
              className="inline-flex h-10 w-[178px] items-center justify-center gap-2 rounded-full bg-[#ed6203] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_#f37b42]"
            >
              <Box className="size-5" />
              Virtual Lobby
            </Link>
            <Link
              href="/expos/vifmw-2026"
              className="inline-flex h-10 w-[178px] items-center justify-center rounded-full border border-white bg-white/10 font-medium text-white backdrop-blur"
            >
              View Detail
            </Link>
          </div>
          <div className="mt-6 flex items-end gap-4">
            <div className="font-normal text-lg">
              01<span className="align-baseline text-[10px]">/05</span>
            </div>
            <div className="mb-2 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-white/80" />
              <span className="h-1.5 w-6 rounded-full bg-white" />
              <span className="size-1.5 rounded-full bg-white/80" />
              <span className="size-1.5 rounded-full bg-white/80" />
              <span className="size-1.5 rounded-full bg-white/80" />
            </div>
          </div>
        </div>
        <article className="mb-8 hidden size-[218px] overflow-hidden rounded-2xl bg-white p-1 shadow-2xl lg:block">
          <Image
            src={asset("hero-card.jpg")}
            alt=""
            width={210}
            height={118}
            className="h-[118px] w-full rounded-xl object-cover"
          />
          <div className="p-2">
            <p className="font-medium text-[#6b7280] text-xs">
              20 MAY - 22 MAY, 2026
            </p>
            <h2 className="mt-1 font-medium text-sm leading-5">
              Vietnam International Paper & Stationery Expo (VPAPS) #1
            </h2>
          </div>
        </article>
      </div>
    </section>
  );
}

function Exhibitions() {
  return (
    <section id="shows" className="bg-white px-5 py-16 md:px-20">
      <h2 className="text-center font-semibold text-[32px] leading-10">
        Explore Industry Shows
      </h2>
      <div className="mt-10 flex gap-4 overflow-x-auto pb-1">
        {categories.map((category, index) => (
          <button
            type="button"
            key={category}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm",
              index === 0
                ? "border border-[#ed6203] bg-[#ffeae1] text-[#ed6203]"
                : "bg-[#f9fafb] text-[#1f2937]",
            )}
          >
            <Grid2X2 className="size-4" />
            {category}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {expos.map((expo) => (
          <ExpoCard key={expo.title} expo={expo} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 text-sm"
        >
          View More
          <ArrowRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

function ExpoCard({ expo }: { expo: (typeof expos)[number] }) {
  const statusTone =
    expo.status === "Live"
      ? "bg-[#16a34a]"
      : expo.status === "Upcoming"
        ? "bg-[#f59e0b]"
        : "bg-[#9ca3af]";
  const countdownLabel = expo.status === "Upcoming" ? "Starts in" : "Ends in";

  return (
    <Card className="overflow-hidden rounded-2xl bg-white p-2 shadow-[0_0_12px_rgba(0,0,0,0.08)]">
      <div className="relative h-[222px] overflow-hidden rounded-xl">
        <Image
          src={asset(expo.image)}
          alt=""
          fill
          sizes="(min-width: 1280px) 396px, (min-width: 768px) 50vw, 100vw"
          className="size-full bg-[#e6edf3] object-contain"
        />
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "h-7 gap-1.5 rounded-full border-0 pr-3 pl-1.5 font-medium text-white text-xs",
              statusTone,
            )}
          >
            <Video className="size-4" />
            {expo.status}
          </Badge>
          {expo.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-7 gap-1.5 rounded-full border-0 bg-white/80 pr-3 pl-1.5 font-normal text-[#1f2937] text-xs"
            >
              {tag === "Hot pick" ? (
                <Heart className="size-5 fill-rose-100 text-rose-300" />
              ) : (
                <Sparkles className="size-3 text-sky-500" />
              )}
              {tag}
            </Badge>
          ))}
        </div>
        <Heart className="absolute top-3 right-3 size-7 text-white/65" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 rounded-b-xl bg-black/40 px-3 py-2 text-white backdrop-blur">
          <div className="rounded-lg bg-white/30 p-2 text-white">
            <CalendarDays className="size-5" />
          </div>
          <div className="min-w-0 flex-1 text-xs leading-4">
            <p className="text-white/90">Duration</p>
            <p className="font-medium">20 MAY - 22 MAY, 2026</p>
          </div>
          <div className="hidden text-right text-xs leading-4 sm:block">
            <p className="text-white/90">{countdownLabel}</p>
            <p className="font-medium">1d : 20h : 5m</p>
          </div>
        </div>
      </div>
      <CardContent className="flex flex-col gap-4 px-5 py-4">
        <div>
          <h3 className="line-clamp-2 min-h-14 font-medium text-lg leading-7">
            {expo.title}
          </h3>
          <p className="mt-1 text-[#6b7280] text-xs">
            Healtthcare • Biohacking • Retail
          </p>
        </div>
        <div className="grid grid-cols-3 gap-5 border-[#e5e7eb] border-t pt-4 text-center">
          {["Exhibitors", "Visitors", "Products/Services"].map(
            (label, index) => (
              <div key={label}>
                <p className="font-medium text-[#ed6203] text-base leading-6">
                  {expo.stats[index]}
                </p>
                <p className="text-[#6b7280] text-xs">{label}</p>
              </div>
            ),
          )}
        </div>
        {expo.disabled ? (
          <Button
            disabled
            className="h-10 w-full bg-[#d1d5db] font-semibold text-[#9ca3af] hover:bg-[#d1d5db]"
          >
            {expo.action}
          </Button>
        ) : (
          <Button
            asChild
            className="h-10 w-full bg-[#ed6203] font-semibold text-white hover:bg-[#dd5a02]"
          >
            <Link href="/expos/vifmw-2026">{expo.action}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Introduction() {
  return (
    <section className="relative overflow-hidden bg-white px-5 py-16 text-center md:px-[78px]">
      <div className="absolute inset-x-0 top-0 mx-auto aspect-square max-w-[1120px] rounded-full bg-[radial-gradient(circle,rgba(237,98,3,0.14),rgba(255,255,255,0)_62%)]" />
      <div className="relative">
        <h2 className="font-semibold text-[32px] leading-10">AI-Powered</h2>
        <p className="font-semibold text-[#ed6203] text-[32px] leading-10">
          Virtual Trade Ecosystem
        </p>
        <p className="mt-2 text-[#1f2937]">
          Delivering qualified leads for Sellers, smart sourcing for Buyers, and
          custom event solutions for Partners.
        </p>
        <div className="relative mx-auto mt-10 max-w-[912px] rounded-3xl border border-white bg-white/50 p-2 shadow-sm backdrop-blur">
          <Image
            src={asset("intro-video.jpg")}
            alt=""
            width={896}
            height={505}
            className="aspect-[896/505] w-full rounded-2xl object-cover"
          />
          <button
            type="button"
            className="absolute inset-0 m-auto grid size-16 place-items-center rounded-full bg-white/55 text-white backdrop-blur"
          >
            <Play className="ml-1 size-8 fill-white" />
          </button>
        </div>
        <div className="mx-auto mt-6 grid max-w-[896px] grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["95%", "AI Matching Precision"],
            ["90%", "Cost Optimization"],
            ["100%", "Verified Business Entities"],
            ["60%", "Faster Decision Making"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-[#e5e7eb] last:border-r-0 md:border-r"
            >
              <p className="font-semibold text-[#ed6203] text-[32px] leading-10">
                {value}
              </p>
              <p className="text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section
      id="pricing"
      className="overflow-hidden bg-[linear-gradient(180deg,#fff_3%,#ffe0d2_54%,#fff_109%)] px-5 py-16 md:px-[78px]"
    >
      <h2 className="text-center font-semibold text-[#ed6203] text-[32px] leading-10">
        Virtual Booth Solutions
      </h2>
      <div className="mx-auto mt-10 grid max-w-[1284px] gap-10 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={cn(
              "relative overflow-hidden rounded-2xl border-2 bg-white/80 p-2 backdrop-blur-sm",
              plan.featured
                ? "border-[#ed6203] shadow-[0_0_24px_rgba(0,0,0,0.08)]"
                : "border-white",
            )}
          >
            <div className="relative h-[166px] overflow-hidden rounded-xl">
              <Image
                src={asset(plan.image)}
                alt=""
                fill
                sizes="(min-width: 1024px) 386px, 100vw"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 grid place-items-center">
                <span className="rounded-full bg-black/45 px-4 py-3 text-white text-xl backdrop-blur">
                  3D
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-xl">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-[#6b7280] text-xs leading-4">
                {plan.description}
              </p>
              <div className="mt-4 flex items-baseline gap-4">
                <span className="text-xs">Only from</span>
                <span className="font-semibold text-3xl">{plan.price}</span>
              </div>
            </div>
            <div className="rounded-xl border border-[#f3f4f6] bg-white p-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="size-4 text-emerald-600" />
                    <span
                      className={
                        feature.match(/^[0-9]|Product Listing/)
                          ? "font-semibold"
                          : undefined
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-6 h-10 w-full rounded-full bg-[#f3f4f6] font-medium text-sm"
              >
                Explore Exhibitions
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BoothSteps() {
  const steps = [
    [Zap, "Find Your Show"],
    [BadgeCheck, "Pick Your Spot"],
    [CircleDollarSign, "Pick Solution Plan"],
    [Plane, "Start Global Trading"],
  ] as const;

  return (
    <section className="bg-white px-5 py-12 text-center md:px-[78px]">
      <h2 className="font-semibold text-[#ed6203] text-xl">
        Standardized Booth Setup Process
      </h2>
      <p className="mt-2 text-[#6b7280] text-sm">
        A standardized setup flow that transforms buyers' discovery into
        exhibitors' lead growth.
      </p>
      <div className="mx-auto mt-10 grid max-w-[1284px] gap-6 md:grid-cols-4">
        {steps.map(([Icon, label], index) => (
          <div
            key={label}
            className="relative flex flex-col items-center gap-5"
          >
            <div className="grid size-[72px] place-items-center rounded-full bg-white shadow-[0_18px_35px_rgba(0,0,0,0.08)]">
              <Icon
                className={cn(
                  "size-10",
                  [
                    "text-emerald-500",
                    "text-sky-500",
                    "text-violet-500",
                    "text-orange-500",
                  ][index],
                )}
              />
            </div>
            <div className="grid size-6 place-items-center rounded-full bg-[#ffeae1] font-medium text-[#ed6203] text-xs">
              {index + 1}
            </div>
            <p className="font-semibold text-xl">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Ecosystem() {
  return (
    <section
      id="ecosystem"
      className="grid min-h-[713px] items-center gap-5 overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#fff_0,#e4e7ff_100%)] px-5 py-12 md:px-[78px] lg:grid-cols-[384px_1fr]"
    >
      <div>
        <h2 className="font-bold text-[#2d2d2d] text-[32px] leading-10">
          Comprehensive Trade Ecosystem
        </h2>
        <p className="mt-6 text-[#1f2937] leading-6">
          Bridging the gap between Sellers, Buyers, and Partners on one seamless
          platform.
        </p>
      </div>
      <div className="relative mx-auto h-[560px] w-full max-w-[880px]">
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid size-[300px] place-items-center rounded-full border-2 border-[#ff5a00] bg-[#ff5a00]">
            <div className="grid size-[188px] place-items-center rounded-full bg-white text-center font-bold text-4xl">
              Trade<span className="text-[#ff5a00]">X</span>po
            </div>
          </div>
          <div className="absolute size-[470px] rounded-full border border-[#ff5a00]" />
          <div className="absolute size-[610px] rounded-full bg-white/20" />
        </div>
        <EcosystemCard
          className="top-[210px] left-4 md:left-[112px]"
          icon={<Store />}
          title="Sellers (Exhibitors)"
          body="Reach 50,000+ global buyers."
          action="Book a Booth"
        />
        <EcosystemCard
          className="top-8 right-4 md:right-6"
          icon={<Users />}
          title="Buyers (Visitors)"
          body="Register to sync calendar."
          action="Add to Calendar"
        />
        <EcosystemCard
          className="right-10 bottom-10 md:right-[82px]"
          icon={<Building2 />}
          title="Partners"
          body="Custom-budget Shows & Bulk Packages"
          action="Become a Partner"
        />
      </div>
    </section>
  );
}

function EcosystemCard({
  className,
  icon,
  title,
  body,
  action,
}: {
  className: string;
  icon: ReactNode;
  title: string;
  body: string;
  action: string;
}) {
  return (
    <article
      className={cn(
        "absolute w-[248px] rounded-xl border border-white bg-white/60 p-6 shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-center gap-3 font-semibold">
        <span className="text-[#00b871]">{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-sm">{body}</p>
      <button
        type="button"
        className="mt-5 inline-flex h-8 items-center gap-1 rounded-full bg-[#ed6203] px-4 font-medium text-sm text-white"
      >
        {action}
        <ArrowRight className="size-4" />
      </button>
    </article>
  );
}

function Partners() {
  const strategic = [
    "V",
    "VTTA",
    "ITPC",
    "HCMC",
    "CSED",
    "ISC",
    "HMEA",
    "VIFSA",
    "WISA",
    "KORETOVIET",
  ];
  const alliance = [
    "ACCG",
    "OCEAN USA",
    "VIC",
    "Viet",
    "EcoHub",
    "Camel",
    "Kocham",
    "High West",
    "Jardin",
    "Bamboo",
  ];

  return (
    <section className="bg-white px-5 py-16 text-center md:px-[78px]">
      <h2 className="font-bold text-[32px] leading-10">Partners</h2>
      <p className="mt-10 font-medium">Strategic Partners</p>
      <div className="mx-auto mt-6 flex max-w-[900px] flex-wrap justify-center gap-x-[70px] gap-y-8">
        {strategic.map((name) => (
          <LogoTile key={name} name={name} />
        ))}
      </div>
      <p className="mt-12 font-medium">
        Alliance Partners - Procurement Partners - Top Brands
      </p>
      <div className="mt-6 flex gap-10 overflow-hidden">
        {[
          ...alliance.map((name) => `first-${name}`),
          ...alliance.map((name) => `second-${name}`),
        ].map((id) => (
          <LogoTile key={id} name={id.replace(/^(first|second)-/, "")} small />
        ))}
      </div>
    </section>
  );
}

function LogoTile({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-lg bg-white font-bold shadow-sm",
        small ? "size-16 text-[11px]" : "size-20 text-sm",
      )}
    >
      <span className="text-[#ed6203]">{name}</span>
    </div>
  );
}

function Sponsors() {
  const sponsors = [
    ["Google", "sponsor-google.svg"],
    ["Microsoft", "sponsor-microsoft.svg"],
    ["Dropbox", "sponsor-dropbox.svg"],
    ["OpenAI", "sponsor-openai.svg"],
    ["Claude", "sponsor-claude.svg"],
  ];

  return (
    <section className="bg-white px-5 pb-10 md:px-[78px]">
      <div className="border-[#e5e7eb] border-t pt-10 text-center">
        <p className="font-medium">Get sponsored by companies such as:</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {sponsors.map(([name, image]) => (
            <Image
              key={name}
              src={asset(image)}
              alt={name}
              width={163}
              height={32}
              className="h-8 max-w-[163px] object-contain"
            />
          ))}
          <span className="font-bold text-2xl">HubSpot</span>
        </div>
      </div>
    </section>
  );
}

function Faqs({
  openFaq,
  setOpenFaq,
}: {
  openFaq: number;
  setOpenFaq: (index: number) => void;
}) {
  return (
    <section className="bg-[#f9fafb] px-5 py-16 md:px-[78px]">
      <h2 className="text-center font-bold text-[32px] leading-10">
        Frequently asked questions
      </h2>
      <div className="mx-auto mt-10 max-w-[1066px]">
        <div className="grid border-[#e5e7eb] border-b text-center md:grid-cols-3">
          {["For Sellers", "For Buyers", "For Partners"].map((tab, index) => (
            <button
              type="button"
              key={tab}
              className={cn(
                "h-12 text-sm",
                index === 0 && "border-[#ed6203] border-b-2 text-[#ed6203]",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-5">
          {faqs.map((faq, index) => {
            const open = openFaq === index;
            return (
              <button
                key={faq.question}
                type="button"
                onClick={() => setOpenFaq(open ? -1 : index)}
                className={cn(
                  "w-full rounded-lg px-6 py-5 text-left text-sm",
                  open
                    ? "bg-white shadow-[0_0_24px_rgba(0,0,0,0.08)]"
                    : "bg-[#f9fafb]",
                )}
              >
                <span className="flex items-center justify-between gap-4 font-medium">
                  {faq.question}
                  {open ? (
                    <Minus className="size-5 text-[#6b7280]" />
                  ) : (
                    <Plus className="size-5 text-[#6b7280]" />
                  )}
                </span>
                {open && (
                  <span className="mt-3 block text-[#1f2937] leading-5">
                    {faq.answer}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
