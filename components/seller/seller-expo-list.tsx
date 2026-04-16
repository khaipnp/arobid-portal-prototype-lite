"use client"

import {
  CalendarIcon,
  ChevronRightIcon,
  SearchIcon,
  StoreIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  Expo,
  ExpoStatus,
  SellerBoothRegistration,
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

type SellerExpoViewStatus = "Upcoming" | "Live" | "Archive"

const statusStyles: Record<SellerExpoViewStatus, string> = {
  Upcoming: "border-amber-300 bg-amber-100 text-amber-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Archive: "border-zinc-300 bg-zinc-100 text-zinc-700",
}

function toSellerExpoViewStatus(status: ExpoStatus): SellerExpoViewStatus {
  if (status === "Live") return "Live"
  if (status === "Ended" || status === "Archived" || status === "Canceled") {
    return "Archive"
  }
  return "Upcoming"
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso),
  )
}

interface ExpoWithBooths {
  expo: Expo
  registrations: SellerBoothRegistration[]
}

function buildData(
  expos: Expo[],
  registrations: SellerBoothRegistration[],
): ExpoWithBooths[] {
  const grouped = new Map<string, SellerBoothRegistration[]>()
  for (const reg of registrations) {
    const list = grouped.get(reg.expoId) ?? []
    list.push({ ...reg })
    grouped.set(reg.expoId, list)
  }

  return expos
    .flatMap((expo) => {
      const registrations = grouped.get(expo.id)
      if (!registrations) {
        return []
      }

      return [
        {
          expo: { ...expo },
          registrations,
        },
      ]
    })
    .sort(
      (a, b) =>
        new Date(b.expo.startDate).getTime() -
        new Date(a.expo.startDate).getTime(),
    )
}

const ALL_STATUSES: SellerExpoViewStatus[] = ["Upcoming", "Live", "Archive"]

export function SellerExpoList({
  initialExpos,
  initialRegistrations,
}: {
  initialExpos: Expo[]
  initialRegistrations: SellerBoothRegistration[]
}) {
  const [data] = React.useState<ExpoWithBooths[]>(() =>
    buildData(initialExpos, initialRegistrations),
  )
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    SellerExpoViewStatus | "All"
  >("All")

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const filtered = React.useMemo(() => {
    let result = data
    if (debouncedSearch.trim()) {
      const kw = debouncedSearch.trim().toLowerCase()
      result = result.filter(({ expo }) => expo.name.toLowerCase().includes(kw))
    }
    if (statusFilter !== "All") {
      result = result.filter(
        ({ expo }) => toSellerExpoViewStatus(expo.status) === statusFilter,
      )
    }
    return result
  }, [data, debouncedSearch, statusFilter])

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="max-w-sm">
          <InputGroupInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expo name…"
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as SellerExpoViewStatus | "All")
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
          No expos found.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map(({ expo, registrations }) => (
            <ExpoCard key={expo.id} expo={expo} registrations={registrations} />
          ))}
        </div>
      )}
    </div>
  )
}

function ExpoCard({
  expo,
  registrations,
}: {
  expo: Expo
  registrations: SellerBoothRegistration[]
}) {
  const boothCount = registrations.length
  const displayStatus = toSellerExpoViewStatus(expo.status)

  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40">
      <div className="relative hidden shrink-0 overflow-hidden rounded-lg sm:block">
        <Image
          src={expo.thumbnailUrl}
          alt={expo.name}
          width={120}
          height={80}
          className="h-20 w-30 object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-semibold text-base">{expo.name}</h2>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-xs", statusStyles[displayStatus])}
          >
            {displayStatus}
          </Badge>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatDate(expo.startDate)} – {formatDate(expo.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <StoreIcon className="h-3.5 w-3.5" />
            {boothCount} booth{boothCount !== 1 ? "s" : ""} purchased
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {registrations.map((reg) => (
            <span
              key={reg.id}
              className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs"
            >
              {reg.boothRef} · {reg.boothTier}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/seller/my-expos/${expo.id}`}>
            Manage
            <ChevronRightIcon className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
