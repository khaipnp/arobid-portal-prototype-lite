"use client"

import { ArrowDown, ArrowRight, Heart, Search, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ExpoDetailExhibitor } from "@/lib/tradexpo/db/platform-data"

const EXPO_NAME = "VIFMW"
const asset = (name: string) => `/landing/${name}`

type Props = {
  initialExhibitors: ExpoDetailExhibitor[]
}

export function ExhibitorsSection({ initialExhibitors }: Props) {
  const [search, setSearch] = useState("")
  const [tier, setTier] = useState("all")
  const [items, setItems] = useState(initialExhibitors)
  const [visibleCount, setVisibleCount] = useState(9)

  const tiers = useMemo(() => {
    return Array.from(new Set(initialExhibitors.map((x) => x.boothTier))).sort()
  }, [initialExhibitors])

  useEffect(() => {
    const controller = new AbortController()
    const query = new URLSearchParams({ expoName: EXPO_NAME })
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
  }, [search, tier])

  return (
    <section className="bg-[#f3f4f6] px-4 py-16 md:px-[78px]">
      <div className="mx-auto max-w-[1284px]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold text-[32px] leading-10">Exhibitors</h2>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative md:w-[270px]">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-[#6b7280]" />
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

function ExhibitorCard({ exhibitor }: { exhibitor: ExpoDetailExhibitor }) {
  return (
    <Card className="rounded-xl border-0 bg-white px-5 py-4 shadow-none">
      <div className="flex h-[50px] items-center gap-3">
        <Image
          src={exhibitor.avatarUrl ?? asset("figma-company-logo.png")}
          alt=""
          width={50}
          height={50}
          className="size-[50px] rounded-full object-contain"
        />
        <h3 className="min-w-0 flex-1 font-semibold text-sm leading-5">
          {exhibitor.company}
        </h3>
        <Heart className="size-7 fill-[#d1d5db] text-[#d1d5db]" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[#6b7280] text-xs">
        <span>{exhibitor.country}</span>
        <span>·</span>
        <span className="font-medium text-sky-600">VERIFIED</span>
        <span>·</span>
        <span className="rounded-full bg-[#ffefe6] px-2 font-medium text-[#663014]">
          {exhibitor.boothRef}
        </span>
        <span>·</span>
        <span className="rounded-full bg-[#e4e7ff] px-2 font-medium text-[#2c0f79]">
          {exhibitor.boothTier}
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Star className="size-3 fill-[#f59e0b] text-[#f59e0b]" />
          N/A
        </span>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-[#6b7280] text-sm">Featured products</p>
          <a
            href="#booths"
            className="inline-flex items-center gap-1 font-medium text-[#ed6203] text-xs"
          >
            View More
            <ArrowRight className="size-3.5" />
          </a>
        </div>
        {exhibitor.products.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {exhibitor.products.map((product) => (
              <p
                key={`${exhibitor.id}-${product}`}
                className="truncate rounded border border-[#e5e7eb] px-2 py-1 text-[#1f2937] text-xs"
              >
                {product}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[#9ca3af] text-xs">No product data</p>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-full border-[#e5e7eb] bg-white text-[#1f2937] text-sm"
        >
          Chat Now
        </Button>
        <Button
          type="button"
          className="h-8 rounded-full bg-[#ed6203] text-sm text-white hover:bg-[#d85a02]"
        >
          Send RFQ
        </Button>
      </div>
    </Card>
  )
}

