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
    <section className="container mx-auto bg-white px-5 py-32 text-center">
      <h2 className="font-semibold text-legend text-3xl">
        Standardized Booth Setup Process
      </h2>
      <p className="mt-2 text-foreground text-base">
        A standardized setup flow that transforms buyers' discovery into
        exhibitors' lead growth.
      </p>
      <div className="mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-4">
        {steps.map(([Icon, label], index) => (
          <div
            key={label}
            className="relative flex flex-col items-center gap-5"
          >
            <div className="grid size-18 place-items-center rounded-full bg-white shadow-[0_18px_35px_rgba(0,0,0,0.08)]">
              <Icon
                className={cn(
                  "size-10",
                  [
                    "text-emerald-500",
                    "text-sky-500",
                    "text-violet-500",
                    "text-legend-500"
                  ][index]
                )}
              />
            </div>
            <div className="grid size-6 place-items-center rounded-full bg-muted font-semibold text-legend text-xs">
              {index + 1}
            </div>
            <p className="font-semibold text-xl">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
