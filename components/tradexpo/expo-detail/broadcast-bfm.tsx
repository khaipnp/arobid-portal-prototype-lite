"use client"

import { ArrowRight, RadarIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

export type BFMBroadcastItem = {
  id: string
  companyName: string
  productName: string
  ctaHref: string
  logoUrl?: string
}

function trackBroadcastEvent(
  eventName: "broadcast_impression" | "broadcast_click" | "broadcast_dismiss",
  payload: Record<string, string>
) {
  if (typeof window === "undefined") return
  const va = (window as Window & { va?: (...args: unknown[]) => void }).va
  if (!va) return
  va("event", { name: eventName, ...payload })
}

export function BroadcastBFM({ items }: { items: BFMBroadcastItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const activeBroadcast = useMemo(
    () => items[activeIndex],
    [items, activeIndex]
  )

  useEffect(() => {
    if (isPaused || items.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % items.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [isPaused, items.length])

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
        aria-label="Buyer Find and Match broadcast"
        className="fixed inset-x-0 bottom-0 z-50 hidden bg-legend text-white shadow-2xl md:block"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="container mx-auto flex min-h-16 items-center gap-3 px-4 py-3 md:px-0">
          <div
            key={activeBroadcast.id}
            className="flex flex-1 animate-[bfm-slide-up_320ms_ease-out] items-center gap-3"
          >
            <span className="select-none inline-flex h-7 items-center gap-1 rounded-full bg-legend-100 px-2 font-medium text-legend text-xs">
              <RadarIcon className="size-4" />
              Buyer Recommendations
            </span>
            <p className="text-sm leading-5 select-none">
              <span className="font-semibold">
                {activeBroadcast.companyName}
              </span>
              {` is showcasing `}
              <span className="font-semibold">
                {activeBroadcast.productName}
              </span>
              {` in this expo. Find your match now.`}
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
            className="inline-flex h-8 shrink-0 items-center rounded-full bg-white px-4 font-medium text-legend text-sm transition-colors hover:bg-legend-50"
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
