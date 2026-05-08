"use client"

import { ArrowDown, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { ExhibitorCard } from "@/components/tradexpo/exhibitor-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ExpoDetailExhibitor } from "@/lib/tradexpo/db/platform-data"

type Props = {
  expoName: string
  initialExhibitors: ExpoDetailExhibitor[]
}

export function ExhibitorsSection({ expoName, initialExhibitors }: Props) {
  const [search, setSearch] = useState("")
  const [tier, setTier] = useState("all")
  const [items, setItems] = useState(initialExhibitors)
  const [visibleCount, setVisibleCount] = useState(9)

  const tiers = useMemo(() => {
    return Array.from(new Set(initialExhibitors.map((x) => x.boothTier))).sort()
  }, [initialExhibitors])

  useEffect(() => {
    const controller = new AbortController()
    const query = new URLSearchParams({ expoName })
    if (search.trim()) query.set("search", search.trim())
    if (tier !== "all") query.set("tier", tier)

    fetch(`/api/tradexpo/exhibitors?${query.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((payload: { data?: ExpoDetailExhibitor[] }) => {
        setItems(payload.data ?? [])
        setVisibleCount(9)
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [expoName, search, tier])

  return (
    <section className="bg-[#f3f4f6] px-4 py-16 md:px-[78px]">
      <div className="mx-auto max-w-[1284px]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold text-[32px] leading-10">Exhibitors</h2>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative md:w-[270px]">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6b7280]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by exhibitor name..."
                className="h-10 rounded-full bg-white pr-3 pl-9"
              />
            </div>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="h-10 w-full rounded-full bg-white text-sm md:w-[170px]">
                <SelectValue placeholder="All category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All category</SelectItem>
                {tiers.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              asChild
              className="h-10 rounded-full bg-[#ed6203] px-5 text-sm text-white hover:bg-[#d85a02]"
            >
              <Link href="/seller">Join as Exhibitor</Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.slice(0, visibleCount).map((exhibitor) => (
            <ExhibitorCard key={exhibitor.id} exhibitor={exhibitor} />
          ))}
        </div>
        {items.length > visibleCount ? (
          <div className="mt-8 text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVisibleCount((v) => v + 9)}
              className="h-10 rounded-full bg-white px-6 text-sm"
            >
              View More
              <ArrowDown className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
