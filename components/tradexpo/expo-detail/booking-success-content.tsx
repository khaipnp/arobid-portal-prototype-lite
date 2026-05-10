"use client"

import { CheckIcon, MailIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BoothTierBadge } from "./booth-tier-badge"
import { BOOTH_TIERS } from "./data"

export function BookingSuccessContent({
  expoName,
  expoSlug
}: {
  expoName: string
  expoSlug: string
}) {
  const searchParams = useSearchParams()
  const tierId = searchParams.get("tier") || "premium"
  const hall = searchParams.get("hall") || "A"
  const booth = searchParams.get("booth") || "--"

  const activeTier = BOOTH_TIERS.find((t) => t.id === tierId) || BOOTH_TIERS[2]
  const totalPaid = activeTier.price * 1.1

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-2xl flex-col items-center gap-10">
        {/* Success Header */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-24 items-center justify-center rounded-full bg-[#DCFCE7] shadow-inner">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
              <CheckIcon className="size-8 stroke-[4px]" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="select-none font-bold text-2xl text-foreground tracking-tight">
              Booking Confirmed!
            </h1>
            <p className="select-none font-medium text-muted-foreground">
              Your booth has been successfully reserved for the event.
            </p>
          </div>
        </div>

        {/* Ticket Container */}
        <div className="flex w-full flex-col overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] md:flex-row">
          {/* Left Side: Ticket Info */}
          <div className="flex flex-1 flex-col gap-8 p-8 sm:p-10">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-black text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                  Booking ID
                </span>
                <span className="font-bold text-[#1F2937] text-lg">
                  #BOOTH02112004
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                  Date
                </span>
                <span className="font-semibold text-gray-600 text-sm">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  }).format(new Date())}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 rounded-2xl border border-gray-50 bg-[#F9FAFB] p-5">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white">
                <Image
                  src={`/landing/${activeTier.image}`}
                  alt=""
                  fill
                  className="object-contain p-2"
                />
              </div>
              <div className="flex flex-col gap-2">
                <BoothTierBadge
                  tier={
                    activeTier.id.toLowerCase() as
                      | "basic"
                      | "professional"
                      | "premium"
                  }
                  className="w-fit"
                />
                <p className="line-clamp-2 font-bold text-[#1F2937] text-base leading-tight">
                  {expoName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                  Start Date
                </span>
                <span className="font-bold text-foreground text-sm">
                  05/05/2026
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                  End Date
                </span>
                <span className="font-bold text-foreground text-sm">
                  20/05/2026
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                  Hall
                </span>
                <span className="font-bold text-foreground text-sm">
                  {hall}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                  Booth
                </span>
                <span className="font-bold text-legend text-sm">{booth}</span>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-3 border-gray-200 border-t border-dashed pt-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-legend-50">
                <MailIcon className="size-4 text-legend" />
              </div>
              <p className="text-gray-500 text-xs leading-snug">
                A confirmation email with all details has been sent to{" "}
                <span className="font-bold text-foreground">
                  nadir@company.com
                </span>
              </p>
            </div>
          </div>

          {/* Right Side: Price Summary (Visual accent) */}
          <div className="relative flex w-full flex-col justify-center gap-6 bg-legend p-8 sm:p-10 md:w-3xs">
            {/* Ticket Notch Decorations */}
            <div className="absolute top-1/2 -left-3 hidden size-6 -translate-y-1/2 rounded-full bg-[#f9fafb] md:block" />

            <div className="flex flex-col gap-1 text-white/70">
              <span className="font-bold text-xs uppercase tracking-widest">
                Total Amount
              </span>
              <span className="font-black text-3xl text-white">
                ${totalPaid.toLocaleString()}
              </span>
            </div>

            <div className="space-y-4 border-white/20 border-t pt-6">
              <div className="flex items-center justify-between font-bold text-[10px] text-white/80 uppercase">
                <span>Status</span>
                <span className="rounded bg-white/20 px-2 py-0.5">PAID</span>
              </div>
              <div className="flex items-center justify-between font-bold text-[10px] text-white/80 uppercase">
                <span>Method</span>
                <span>VNPay</span>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <div className="flex h-12 w-full items-center justify-center rounded-lg border border-white/20 bg-white/10">
                <span className="font-bold text-[10px] text-white tracking-[0.3em]">
                  AROBID TRADEXPO
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full max-w-lg flex-col gap-4 sm:flex-row">
          <Link href={`/expos/${expoSlug}`} className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              Back to Expo
            </Button>
          </Link>
          <Link href="/seller" className="flex-1">
            <Button size="lg" className="w-full bg-legend hover:bg-legend-600">
              Customize Booth
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
