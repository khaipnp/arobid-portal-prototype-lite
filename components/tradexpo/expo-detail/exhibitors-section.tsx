"use client"

import { SearchIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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
import type { ExpoDetailExhibitor } from "@/lib/tradexpo/db/platform-data"
import { ExhibitorCard } from "./exhibitor-card"

type Props = {
  expoName: string
  initialExhibitors: ExpoDetailExhibitor[]
}

export function ExhibitorsSection({ expoName, initialExhibitors }: Props) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [items, setItems] = useState(initialExhibitors)

  const categories = useMemo(() => {
    return Array.from(new Set(initialExhibitors.map((x) => x.category))).sort()
  }, [initialExhibitors])

  const sortedItems = useMemo(() => {
    const tierPriority: Record<string, number> = {
      Premium: 1,
      Professional: 2,
      Basic: 3,
    }

    return [...items].sort(
      (a, b) =>
        (tierPriority[a.boothTier] ?? Number.MAX_SAFE_INTEGER) -
          (tierPriority[b.boothTier] ?? Number.MAX_SAFE_INTEGER) ||
        a.company.localeCompare(b.company),
    )
  }, [items])

  useEffect(() => {
    const controller = new AbortController()
    const query = new URLSearchParams({ expoName })
    if (search.trim()) query.set("search", search.trim())
    if (category !== "all") query.set("category", category)

    fetch(`/api/tradexpo/exhibitors?${query.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((payload: { data?: ExpoDetailExhibitor[] }) => {
        setItems(payload.data ?? [])
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [expoName, search, category])

  return (
    <section className="bg-muted px-4 py-16">
      <div className="container mx-auto">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold text-[32px] leading-10">Exhibitors</h2>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <InputGroup className="rounded-full bg-white">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by exhibitor name..."
              />
            </InputGroup>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full rounded-full bg-white text-sm md:w-44">
                <SelectValue placeholder="All category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All category</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              asChild
              className="rounded-full bg-legend text-sm hover:bg-legend-600"
            >
              <Link href="#booths">Join as Exhibitor</Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sortedItems.map((exhibitor) => (
            <ExhibitorCard key={exhibitor.id} exhibitor={exhibitor} />
          ))}
        </div>
      </div>
    </section>
  )
}
