"use client"

import { CalendarIcon, RadioIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Expo, ExpoStatus, GoLIVEEvent } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

// Partner sở hữu các expo này trong prototype
const PARTNER_EXPO_IDS = ["expo-003", "expo-015", "expo-001", "expo-004"]

const statusStyles: Record<ExpoStatus, string> = {
  Draft: "border-slate-300 bg-slate-100 text-slate-700",
  "Pending Review": "border-amber-300 bg-amber-100 text-amber-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-700",
  Archived: "border-purple-300 bg-purple-100 text-purple-700",
  Canceled: "border-rose-300 bg-rose-100 text-rose-700",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function PartnerExpoList({
  expos: allExpos,
  goLiveEvents,
}: {
  expos: Expo[]
  goLiveEvents: GoLIVEEvent[]
}) {
  const expos = allExpos.filter((e) => PARTNER_EXPO_IDS.includes(e.id))

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {expos.map((expo) => {
        const goLIVECount = goLiveEvents.filter(
          (e) => e.expoId === expo.id && e.status !== "Canceled",
        ).length

        return (
          <div
            key={expo.id}
            className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={expo.thumbnailUrl}
                alt={expo.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <Badge
                variant="outline"
                className={cn(
                  "absolute top-2 right-2 border text-xs",
                  statusStyles[expo.status],
                )}
              >
                {expo.status}
              </Badge>
            </div>

            <div className="space-y-3 p-4">
              <div>
                <h3 className="line-clamp-2 font-semibold text-sm leading-snug">
                  {expo.name}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(expo.startDate)} – {formatDate(expo.endDate)}
                </p>
              </div>

              {goLIVECount > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <RadioIcon className="h-3.5 w-3.5" />
                  <span>
                    {goLIVECount} GoLIVE session{goLIVECount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href={`/partner/expos/${expo.id}`}>Manage Expo</Link>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
