"use client"

import { CalendarIcon, RadioIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { PartnerAssignedExpo } from "@/lib/partner/db"
import { cn } from "@/lib/utils"
import { ExpoStatusBadge } from "../tradexpo/status-badge"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

export function PartnerExpoList({
  assignedExpos
}: {
  assignedExpos: PartnerAssignedExpo[]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {assignedExpos.map(({ expo, assignment, goLiveCount }) => {
        return (
          <div
            key={expo.id}
            className="group overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-md"
          >
            <Link href={`/partner/expos/${expo.id}`}>
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={expo.thumbnailUrl}
                  alt={expo.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                <div className="absolute top-2 right-2">
                  <ExpoStatusBadge status={expo.status} />
                </div>
              </div>
            </Link>
            <div className="space-y-3 p-4">
              <div>
                <Link
                  href={`/partner/expos/${expo.id}`}
                  className="line-clamp-2 font-semibold text-sm leading-snug"
                >
                  {expo.name}
                </Link>
                <p className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(expo.startDate)} – {formatDate(expo.endDate)}
                </p>
              </div>

              {goLiveCount > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <RadioIcon className="h-3.5 w-3.5" />
                  <span>
                    {goLiveCount} GoLIVE session{goLiveCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
