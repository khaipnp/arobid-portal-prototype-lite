"use client"

import { ArrowRight, RadarIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type BFMBroadcastItem = {
  id: string
  buyerName: string
  category: string
  location: string
  ctaHref: string
}

const BFM_BROADCASTS: BFMBroadcastItem[] = [
  {
    id: "bfm-buyer-01",
    buyerName: "Nordic Build Supply",
    category: "Construction Materials",
    location: "Denmark",
    ctaHref: "/bfm"
  },
  {
    id: "bfm-buyer-02",
    buyerName: "Apex Interior Group",
    category: "Furniture & Interiors",
    location: "Singapore",
    ctaHref: "/bfm"
  },
  {
    id: "bfm-buyer-03",
    buyerName: "Kansai Smart Habitat",
    category: "Smart Building Solutions",
    location: "Japan",
    ctaHref: "/bfm"
  }
]

function trackBroadcastEvent(
  eventName: "broadcast_impression" | "broadcast_click" | "broadcast_dismiss",
  payload: Record<string, string>
) {
  if (typeof window === "undefined") return
  const va = (window as Window & { va?: (...args: unknown[]) => void }).va
  if (!va) return
  va("event", { name: eventName, ...payload })
}

export function BroadcastBFM() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const activeBroadcast = useMemo(
    () => BFM_BROADCASTS[activeIndex],
    [activeIndex]
  )

  useEffect(() => {
    if (isPaused || BFM_BROADCASTS.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % BFM_BROADCASTS.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [isPaused])

  useEffect(() => {
    if (!activeBroadcast) return
    trackBroadcastEvent("broadcast_impression", {
      broadcast_id: activeBroadcast.id,
      placement: "expo_detail_bottom_sticky"
    })
  }, [activeBroadcast])

  if (!activeBroadcast) return null

  return (
    <>
      <section
        aria-live="polite"
        className="fixed inset-x-0 bottom-0 z-50 hidden border-[#fed7aa] border-t bg-legend text-white shadow-2xl md:block"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="container mx-auto flex min-h-16 items-center gap-3 px-4 py-3 md:px-0">
          <div
            key={activeBroadcast.id}
            className="flex flex-1 animate-[bfm-slide-up_320ms_ease-out] items-center gap-3"
          >
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-legend-100 px-2 font-medium text-legend text-xs">
              <RadarIcon className="size-4" />
              BFM
            </span>
            <p className="text-sm leading-5">
              <span className="font-semibold">{activeBroadcast.buyerName}</span>
              {` is looking for `}
              <span className="font-semibold">{activeBroadcast.category}</span>
              {` suppliers in this expo · `}
              <span className="text-primary-foreground">
                {activeBroadcast.location}
              </span>
            </p>
          </div>
          <Link
            href={activeBroadcast.ctaHref}
            onClick={() =>
              trackBroadcastEvent("broadcast_click", {
                broadcast_id: activeBroadcast.id,
                placement: "expo_detail_bottom_sticky",
                target: activeBroadcast.ctaHref
              })
            }
            className="inline-flex h-8 shrink-0 items-center rounded-full bg-white px-4 font-medium text-sm text-legend transition-colors hover:bg-legend-50"
          >
            Open Buyer Find & Match
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
      <style jsx global>{`
        @keyframes bfm-slide-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
