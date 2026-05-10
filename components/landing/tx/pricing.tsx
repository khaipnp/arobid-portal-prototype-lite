import { Check } from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"

import { asset, plans } from "./data"

export function Pricing() {
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
                : "border-white"
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
  )
}
