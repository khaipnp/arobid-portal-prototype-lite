import {
  ArrowRight,
  Gem,
  Heart,
  MessageCircle,
  Rocket,
  SearchIcon,
  SparkleIcon,
  Star
} from "lucide-react"
import Image from "next/image"
import type { ComponentProps, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

export function SectionShell({
  children,
  className,
  innerClassName
}: {
  children: ReactNode
  className?: string
  innerClassName?: string
}) {
  return (
    <section className={cn("w-full py-10 lg:py-12", className)}>
      <div className={cn("mx-auto w-full container", innerClassName)}>
        {children}
      </div>
    </section>
  )
}

export function SectionHeading({
  title,
  actions,
  centered = false
}: {
  title: string
  actions?: ReactNode
  centered?: boolean
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        centered && "items-center justify-center text-center md:justify-center"
      )}
    >
      <h2 className="font-medium text-3xl text-[#030712] leading-10 tracking-tight md:text-[32px]">
        {title}
      </h2>
      {actions}
    </div>
  )
}

export function PillTabs({ items }: { items: string[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 md:justify-end md:pb-0">
      {items.map((item, index) => (
        <button
          type="button"
          key={item}
          className={cn(
            "inline-flex h-10 shrink-0 items-center justify-center rounded-full border px-5 font-normal text-sm",
            index === 0
              ? "border-legend bg-[#ffeae1] text-legend"
              : "border-[#e5e7eb] bg-white text-[#1f2937]"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function ViewMoreLink() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 font-medium text-[#1f2937] text-sm"
    >
      View More
      <ArrowRight className="size-4" />
    </button>
  )
}

export function OrangeButton({
  children,
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "h-10 gap-2 rounded-full bg-legend px-5 text-white hover:bg-legend-600",
        className
      )}
      {...props}
    >
      {children}
      <ArrowRight className="size-4" />
    </Button>
  )
}

export function TBSGLogo({
  src,
  className,
  imageClassName
}: {
  src: string
  className?: string
  imageClassName?: string
}) {
  return (
    <div className={cn("relative h-[54px] w-[182px]", className)}>
      <Image
        src={src}
        alt="TBSG"
        fill
        sizes="205px"
        className={cn("object-contain", imageClassName)}
      />
    </div>
  )
}

export function LogoBadge({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-[#f79365] bg-white font-semibold text-legend",
        size === "sm" ? "size-4 text-[5px]" : "size-[50px] text-[11px]"
      )}
    >
      LOGO
    </div>
  )
}

function MembershipBadges() {
  return (
    <div className="flex flex-wrap items-center gap-1 text-[#6b7280] text-xs">
      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#fff0e6] px-1.5 text-[#663014] text-[10px]">
        <Rocket className="size-3" /> Pioneer
      </span>
      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#f3f0ff] px-1.5 text-[#2c0f79] text-[10px]">
        <Gem className="size-3" /> Diamond
      </span>
      <span className="inline-flex items-center gap-0.5">
        <Star className="size-3 fill-[#fbbf24] text-[#fbbf24]" /> 5.0
      </span>
      <span>20 years</span>
      <span className="rounded bg-[#f1f5f9] px-1 text-[#022582]">Exporter</span>
    </div>
  )
}

export function SupplierCard({
  name,
  products
}: {
  name: string
  products: string[]
}) {
  return (
    <article className="flex min-h-[322px] flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-start gap-3">
        <LogoBadge />
        <h3 className="flex-1 pt-2 font-semibold text-[#030712] text-sm leading-5">
          {name}
        </h3>
        <Heart className="size-6 fill-[#d1d5db] text-[#d1d5db]" />
      </div>
      <div className="flex flex-wrap items-center gap-1 text-[#6b7280] text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-[18px] bg-[#da251d] text-center text-[8px] text-yellow-300">
            ★
          </span>
          Vietnam
        </span>
        <span className="font-medium text-[#2563eb]">VERIFIED</span>
      </div>
      <MembershipBadges />
      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6b7280]">Featured products</span>
          <span className="inline-flex items-center gap-1 text-legend text-xs">
            View More <ArrowRight className="size-3" />
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {products.map((image) => (
            <Image
              src={image}
              alt="Featured product"
              key={image}
              width={80}
              height={80}
              sizes="80px"
              className="aspect-square w-full rounded border border-[#e5e7eb] object-cover"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-8 rounded-full border-[#e5e7eb] bg-white text-[#1f2937]"
          >
            <MessageCircle className="size-4" /> Chat Now
          </Button>
          <Button className="h-8 rounded-full bg-legend text-white hover:bg-legend-600">
            Send RFQ
          </Button>
        </div>
      </div>
    </article>
  )
}

export function ProductCard({
  title,
  price,
  supplier,
  image
}: {
  title: string
  price: string
  supplier: string
  image: string
}) {
  return (
    <article className="flex h-[434px] min-w-[230px] flex-col rounded-xl bg-white p-2 shadow-[0_0_12px_rgba(0,0,0,0.08)]">
      <Image
        src={image}
        alt={title}
        width={460}
        height={470}
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
        className="h-[235px] w-full rounded-lg object-cover"
      />
      <div className="flex flex-1 flex-col py-2">
        <h3 className="line-clamp-2 font-normal text-[#121212] text-sm leading-5">
          {title}
        </h3>
        <p className="mt-2 truncate font-semibold text-legend text-sm">
          {price}
        </p>
        <p className="mt-1 text-[#6b7280] text-[10px]">
          MOQ: <span className="text-[#1f2937]">100 unit</span>
        </p>
        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-1">
            <LogoBadge size="sm" />
            <span className="truncate font-semibold text-[#022582] text-xs underline">
              {supplier}
            </span>
          </div>
          <p className="text-[#6b7280] text-xs">Vietnam</p>
          <div className="flex gap-3">
            <Button
              size="icon-sm"
              variant="secondary"
              className="size-8 rounded-full bg-[#f3f4f6]"
              aria-label="Chat"
            >
              <MessageCircle className="size-4" />
            </Button>
            <Button className="h-8 flex-1 rounded-full bg-legend text-white hover:bg-legend-600">
              Send RFQ
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function SearchBar({ inverted = false }: { inverted?: boolean }) {
  return (
    <InputGroup
      className={cn(
        "hidden max-w-md flex-1 lg:flex rounded-full border-legend",
        inverted && "bg-white bg-transparent"
      )}
    >
      <InputGroupInput placeholder="Watch for men, Industrial parts, Solar systems..." />
      <InputGroupButton
        variant="default"
        size="sm"
        className={cn(
          "rounded-full bg-legend px-5 h-9 mr-0.5",
          inverted && "px-3"
        )}
        aria-label="Search"
      >
        {inverted ? (
          <>
            AI Deep Search
            <SparkleIcon className="size-4 text-white" />
          </>
        ) : (
          <SearchIcon className="size-4" strokeWidth={2.5} />
        )}
      </InputGroupButton>
    </InputGroup>
  )
}
