"use client"

import { CalendarIcon, RadioIcon, SearchIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import type { PartnerAssignedExpo } from "@/lib/partner/db"
import type { ExpoStatus } from "@/lib/tradexpo/types"
import { ExpoStatusBadge } from "../tradexpo/status-badge"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

const EXPO_STATUSES: (ExpoStatus | "All")[] = [
  "All",
  "Draft",
  "Pending Review",
  "Live",
  "Archived",
  "Canceled"
]

export function PartnerExpoList({
  assignedExpos
}: {
  assignedExpos: PartnerAssignedExpo[]
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<ExpoStatus | "All">(
    "All"
  )

  const filteredExpos = React.useMemo(() => {
    return assignedExpos.filter(({ expo }) => {
      const matchesSearch = expo.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "All" || expo.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [assignedExpos, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <InputGroup className="max-w-3xs rounded-full">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search expos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as ExpoStatus | "All")
          }
        >
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {EXPO_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredExpos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {filteredExpos.map(({ expo, goLiveCount }) => {
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
                        {goLiveCount} GoLIVE session
                        {goLiveCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <SearchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-semibold text-lg">No expos found</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            We couldn't find any expos matching your search or filters.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("All")
            }}
            className="mt-2"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}
