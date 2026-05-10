import { BadgeCheck, CircleDollarSign, Plane, Zap } from "lucide-react"

import { cn } from "@/lib/utils"

export function BoothSteps() {
  const steps = [
    [Zap, "Find Your Show"],
    [BadgeCheck, "Pick Your Spot"],
    [CircleDollarSign, "Pick Solution Plan"],
    [Plane, "Start Global Trading"]
  ] as const

  return (
    <section className="container bg-white px-5 py-12 text-center">
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
                    "text-orange-500"
                  ][index]
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
  )
}
