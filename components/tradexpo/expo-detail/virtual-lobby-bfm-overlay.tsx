"use client"

import { ChevronDownIcon, ChevronUpIcon, RadarIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import type { BFMBroadcastItem } from "./broadcast-bfm"

function trackBroadcastEvent(
  eventName: "broadcast_impression" | "broadcast_click" | "broadcast_dismiss",
  payload: Record<string, string>
) {
  if (typeof window === "undefined") return
  const va = (window as Window & { va?: (...args: unknown[]) => void }).va
  if (!va) return
  va("event", { name: eventName, ...payload })
}

export function VirtualLobbyBfmOverlay({
  items,
  open
}: {
  items: BFMBroadcastItem[]
  open: boolean
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [chatItems, setChatItems] = useState<BFMBroadcastItem[]>([])

  useEffect(() => {
    if (!open || isPaused || items.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [open, isPaused, items.length])

  useEffect(() => {
    setActiveIndex(0)
    setChatItems(items.slice(0, Math.min(4, items.length)))
  }, [items])

  useEffect(() => {
    if (!open || items.length === 0) return
    const nextItem = items[activeIndex % items.length]
    if (!nextItem) return
    setChatItems((prev) => {
      if (prev.length === 0) return [nextItem]
      if (prev[prev.length - 1]?.id === nextItem.id) return prev
      const appended = [...prev, nextItem]
      const maxVisible = Math.min(4, items.length)
      return appended.slice(-maxVisible)
    })
    trackBroadcastEvent("broadcast_impression", {
      broadcast_id: nextItem.id,
      placement: "virtual_lobby_overlay"
    })
  }, [open, activeIndex, items])

  if (!open || chatItems.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute right-2.5 bottom-18 hidden md:block"
    >
      <section
        aria-label="Buyer Find and Match chat feed"
        className="pointer-events-auto w-90 overflow-hidden rounded-3xl border border-muted/20 bg-black/50 text-white shadow-xl backdrop-blur-2xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex items-center gap-2 px-3 py-2 ${
            isCollapsed ? "" : "border-white/15 border-b"
          }`}
        >
          <span className="inline-flex h-6 select-none items-center gap-1 rounded-full bg-legend-100 px-2 font-medium text-legend text-xs">
            <RadarIcon className="size-3.5" />
            BFM
          </span>
          <p className="flex-1 select-none font-semibold text-sm">
            Buyer Recommendations
          </p>
          <button
            type="button"
            aria-label={
              isCollapsed
                ? "Expand buyer recommendations"
                : "Collapse buyer recommendations"
            }
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="cursor-pointer inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            {isCollapsed ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
          </button>
        </div>
        <div
          className={`${isCollapsed ? "hidden" : "flex"} max-h-56 flex-col gap-2 overflow-y-auto px-3 py-3`}
        >
          {chatItems.map((item) => (
            <div
              key={`${item.id}-${item.productName}`}
              className="flex animate-[bfm-slide-up_320ms_ease-out] cursor-pointer items-start gap-2 rounded-lg bg-white/10 px-3 py-2"
            >
              {item.logoUrl ? (
                <Image
                  src={item.logoUrl}
                  alt={`${item.companyName} logo`}
                  width={28}
                  height={28}
                  className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-white object-cover"
                />
              ) : (
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 font-semibold text-[#fbd38d] text-[11px] uppercase">
                  {item.companyName.slice(0, 1)}
                </span>
              )}
              <p className="pt-0.5 text-[13px] leading-5">
                <span className="font-semibold text-[#fbd38d]">
                  {item.companyName}
                </span>
                {` looking for matches around `}
                <span className="font-semibold">{item.productName}</span>
              </p>
            </div>
          ))}
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
    </div>
  )
}
