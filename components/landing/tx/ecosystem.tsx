import { ArrowRight, Building2, Store, Users } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function Ecosystem() {
  return (
    <section
      id="ecosystem"
      className="grid min-h-178 items-center gap-5 overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#fff_0,#e4e7ff_100%)]"
    >
      <div className="container mx-auto flex items-center">
        <div>
          <h2 className="font-bold text-foreground text-4xl">
            Comprehensive <span className="text-legend">Trade Ecosystem</span>
          </h2>
          <p className="mt-6 text-foreground leading-6">
            Bridging the gap between Sellers, Buyers, and Partners on one
            seamless platform.
          </p>
        </div>
        <div className="relative mx-auto h-140 w-full max-w-4xl">
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
      </div>
    </section>
  )
}

function EcosystemCard({
  className,
  icon,
  title,
  body,
  action
}: {
  className: string
  icon: ReactNode
  title: string
  body: string
  action: string
}) {
  return (
    <article
      className={cn(
        "absolute w-[248px] rounded-xl border border-white bg-white/60 p-6 shadow-2xl backdrop-blur-md",
        className
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
  )
}
