"use client"

import { ChevronDownIcon, ChevronUpIcon, UsersIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ExpoDetailExhibitor } from "@/lib/tradexpo/db/platform-data"

export function VirtualLobbyExhibitorsOverlay({
  items,
  open
}: {
  items: ExpoDetailExhibitor[]
  open: boolean
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [search, setSearch] = useState("")
  const tierOrder = useMemo(
    () => ["Premium", "Professional", "Basic"] as const,
    []
  )
  const exhibitorsByTier = useMemo(() => {
    const grouped = items.reduce<Record<string, ExpoDetailExhibitor[]>>(
      (acc, item) => {
        const tier = item.boothTier || "Others"
        if (!acc[tier]) acc[tier] = []
        acc[tier].push(item)
        return acc
      },
      {}
    )

    for (const tier of Object.keys(grouped)) {
      grouped[tier].sort((a, b) => a.company.localeCompare(b.company))
    }

    return grouped
  }, [items])

  const tabTiers = useMemo(() => {
    const others = Object.keys(exhibitorsByTier)
      .filter((tier) => !tierOrder.includes(tier as (typeof tierOrder)[number]))
      .sort((a, b) => a.localeCompare(b))
    return [...tierOrder, ...others]
  }, [exhibitorsByTier, tierOrder])

  const defaultTier = tierOrder[0]
  const totalExhibitors = items.length
  const normalizedSearch = search.trim().toLowerCase()
  const filteredByTier = useMemo(() => {
    if (!normalizedSearch) return exhibitorsByTier
    const result: Record<string, ExpoDetailExhibitor[]> = {}
    for (const tier of tabTiers) {
      result[tier] = (exhibitorsByTier[tier] ?? []).filter((exhibitor) => {
        return (
          exhibitor.company.toLowerCase().includes(normalizedSearch) ||
          exhibitor.category.toLowerCase().includes(normalizedSearch)
        )
      })
    }
    return result
  }, [exhibitorsByTier, normalizedSearch, tabTiers])

  useEffect(() => {
    if (!open) {
      setIsCollapsed(false)
      setSearch("")
    }
  }, [open])

  if (!open) return null

  return (
    <div className="pointer-events-auto absolute bottom-2 left-2 z-40 w-sm rounded-4xl border border-muted/20 bg-black/50 p-3 shadow-xl backdrop-blur-2xl">
      <div
        className={`flex items-center justify-between px-1 ${
          isCollapsed ? "" : "border-white/15 border-b"
        }`}
      >
        <span className="inline-flex select-none items-center gap-1 px-2 font-medium text-sm text-primary-foreground">
          <UsersIcon className="size-3.5" />
          Exhibitors
        </span>
        <button
          type="button"
          aria-label={
            isCollapsed ? "Expand exhibitors list" : "Collapse exhibitors list"
          }
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          {isCollapsed ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )}
        </button>
      </div>
      <div className={isCollapsed ? "hidden" : "pt-3"}>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search exhibitor..."
          className="mb-3 h-8 border-white/20 bg-white/10 text-white placeholder:text-white/60 rounded-full"
        />
        <Tabs defaultValue={defaultTier}>
          <TabsList className="w-full">
            {tabTiers.map((tier) => (
              <TabsTrigger key={tier} value={tier}>
                {tier} ({filteredByTier[tier]?.length ?? 0})
              </TabsTrigger>
            ))}
          </TabsList>
          {tabTiers.map((tier) => (
            <TabsContent key={tier} value={tier} className="mt-3">
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {(filteredByTier[tier] ?? []).map((exhibitor) => (
                  <div
                    key={exhibitor.id}
                    className="flex items-center gap-2 rounded-lg bg-white/10 p-2 text-primary-foreground"
                  >
                    {exhibitor.logoUrl ? (
                      <Image
                        src={exhibitor.logoUrl}
                        alt={`${exhibitor.company} logo`}
                        width={512}
                        height={512}
                        className="size-12 shrink-0 rounded-lg bg-white object-contain"
                      />
                    ) : (
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 font-semibold text-[11px] uppercase">
                        {exhibitor.company.slice(0, 1)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{exhibitor.company}</p>
                    </div>
                  </div>
                ))}
                {(filteredByTier[tier] ?? []).length === 0 ? (
                  <p className="rounded-lg bg-white/10 px-3 py-2 text-white/70 text-xs">
                    No exhibitors found.
                  </p>
                ) : null}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
