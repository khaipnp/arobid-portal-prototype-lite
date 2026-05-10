"use client"

import { CheckIcon, ChevronLeftIcon, MapPinIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { BookingOrderSummary } from "@/components/tradexpo/expo-detail/booking-order-summary"
import { BOOTH_TIERS } from "@/components/tradexpo/expo-detail/data"
import { PaymentProcessingDialog } from "@/components/tradexpo/expo-detail/payment-processing-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import type { Expo as TradexpoExpo } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

type BookingExpo = Pick<TradexpoExpo, "id" | "name" | "slug">

interface HallLocation {
  id: string
  status: "occupied" | "available"
  tier: string
  exhibitor: string | null
}

export function BookingContent({ expo }: { expo: BookingExpo }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTierId = searchParams.get("tier") || "premium"

  const [selectedTierId, setSelectedTierId] = useState(initialTierId)
  const [selectedLocation, setSelectedLocation] = useState<{
    id: string
    hall: string
  } | null>(null)
  const [selectedHall, setSelectedHall] = useState("A")
  const [step, setStep] = useState(1) // 1: Select Location, 2: Confirmation
  const [isProcessing, setIsProcessing] = useState(false)

  const activeTier =
    BOOTH_TIERS.find((t) => t.id === selectedTierId) || BOOTH_TIERS[2]

  const steps = [
    { id: 1, name: "Booth Selection" },
    { id: 2, name: "Confirm Details" },
    { id: 3, name: "Payment" }
  ]

  const halls = useMemo(() => ["A", "B", "C"], [])

  const hallData = useMemo(() => {
    const data: Record<string, HallLocation[]> = {}
    const exhibitors = [
      "VinFast",
      "Hoa Phat",
      "An Cuong",
      "Local Craft",
      "Tech Corp",
      "Global Trade"
    ]

    for (const hall of halls) {
      data[hall] = Array.from({ length: 50 }, (_, i) => {
        const id = `${hall}${i + 1}`
        const isOccupied = Math.random() > 0.7
        let tier = "basic"
        if (i < 10) tier = "premium"
        else if (i < 25) tier = "professional"

        return {
          id,
          status: isOccupied ? ("occupied" as const) : ("available" as const),
          tier,
          exhibitor: isOccupied
            ? exhibitors[Math.floor(Math.random() * exhibitors.length)]
            : null
        }
      })
    }
    return data
  }, [halls])

  const handleProceed = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      setIsProcessing(true)
    }
  }

  const handlePaymentComplete = () => {
    setIsProcessing(false)
    const params = new URLSearchParams()
    params.set("tier", selectedTierId)
    params.set("hall", selectedLocation?.hall || "A")
    params.set("booth", selectedLocation?.id || "--")

    router.push(
      `/expos/${expo.slug || expo.id}/booking/success?${params.toString()}`
    )
  }

  const handleLocationSelect = (
    locId: string,
    locTier: string,
    hall: string
  ) => {
    setSelectedLocation({ id: locId, hall })

    const tierOrder = ["basic", "professional", "premium"]
    const currentIdx = tierOrder.indexOf(selectedTierId)
    const newIdx = tierOrder.indexOf(locTier)

    if (newIdx > currentIdx) {
      setSelectedTierId(locTier)
    }
  }

  const expoDetailPath = `/expos/${expo.slug || expo.id}`

  return (
    <div className="flex flex-col gap-8">
      {/* Header & Steps */}
      <div className="flex flex-col gap-6">
        {selectedLocation ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-fit items-center gap-1 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
              >
                <ChevronLeftIcon className="size-4" />
                Back to Expo Detail
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to leave?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Your current booth selection will be lost. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-legend hover:bg-legend-600"
                  onClick={() => router.push(expoDetailPath)}
                >
                  Leave
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Link
            href={expoDetailPath}
            className="flex w-fit items-center gap-1 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4" />
            Back to Expo Detail
          </Link>
        )}

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <h1 className="font-bold text-3xl text-[#030712] tracking-tight">
            Book a Booth
          </h1>
          <div className="flex items-center gap-3">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full font-bold text-sm shadow-sm transition-all",
                      step === s.id
                        ? "bg-legend text-white ring-4 ring-legend/10"
                        : step > s.id
                          ? "bg-[#ecfdf5] text-[#16a34a]"
                          : "border border-gray-200 bg-white text-gray-400"
                    )}
                  >
                    {step > s.id ? <CheckIcon className="size-5" /> : s.id}
                  </div>
                  <span
                    className={cn(
                      "font-bold text-[10px] uppercase tracking-wider",
                      step === s.id ? "text-legend" : "text-gray-400"
                    )}
                  >
                    {s.name}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-4 h-0.5 w-10 -translate-y-3 rounded-full transition-colors",
                      step > s.id ? "bg-[#16a34a]" : "bg-gray-100"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Main Content */}
        <div className="flex flex-col gap-6">
          {step === 1 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex flex-col gap-1">
                <h2 className="flex items-center gap-2 font-semibold text-foreground text-xl">
                  <MapPinIcon className="size-5 text-legend" />
                  Select Booth Location
                </h2>
                <p className="text-muted-foreground text-sm">
                  Pick a Hall and select an available spot
                </p>
              </div>

              {/* Hall Tabs */}
              <div className="mb-8 flex gap-2 border-b">
                {halls.map((hall) => (
                  <button
                    type="button"
                    key={hall}
                    onClick={() => setSelectedHall(hall)}
                    className={cn(
                      "relative px-6 py-3 font-bold text-sm transition-all",
                      selectedHall === hall
                        ? "text-legend"
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Hall {hall}
                    {selectedHall === hall && (
                      <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-legend" />
                    )}
                    {selectedLocation?.hall === hall && (
                      <div className="absolute top-2 right-2 size-1.5 rounded-full bg-legend" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <div className="mb-8 flex flex-wrap gap-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2.5 font-medium text-gray-600 text-xs">
                    <div className="size-3.5 rounded border-2 border-legend bg-legend/20" />
                    <span>Your Selection</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-medium text-gray-600 text-xs">
                    <div className="size-3.5 rounded border-2 border-gray-200 bg-white" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-medium text-gray-600 text-xs">
                    <div className="size-3.5 rounded border-2 border-gray-100 bg-gray-100" />
                    <span>Occupied</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-5 xl:grid-cols-10">
                  {hallData[selectedHall].map((loc) => {
                    const isOccupied = loc.status === "occupied"
                    const tierOrder = ["basic", "professional", "premium"]
                    const initialIdx = tierOrder.indexOf(initialTierId)
                    const currentIdx = tierOrder.indexOf(loc.tier)
                    const isRestricted = currentIdx < initialIdx
                    const isSelected = selectedLocation?.id === loc.id

                    return (
                      <button
                        type="button"
                        key={loc.id}
                        disabled={isOccupied || isRestricted}
                        onClick={() =>
                          handleLocationSelect(loc.id, loc.tier, selectedHall)
                        }
                        title={isOccupied ? `Booked by: ${loc.exhibitor}` : ""}
                        className={cn(
                          "group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg border font-bold text-xs transition-all",
                          isOccupied
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300"
                            : isRestricted
                              ? "cursor-not-allowed border-gray-200 border-dashed bg-gray-50 text-gray-200"
                              : isSelected
                                ? "z-10 border-legend bg-legend text-white shadow-md"
                                : "border-gray-200 bg-white text-gray-600 hover:border-legend hover:bg-legend/5 hover:text-legend"
                        )}
                      >
                        <span className="text-sm">{loc.id}</span>
                        {isRestricted && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                            <span className="-rotate-45 font-black text-[6px] text-gray-400 uppercase leading-none">
                              Upgrade
                            </span>
                          </div>
                        )}
                        {isOccupied && (
                          <div className="absolute inset-x-0 bottom-0 bg-gray-200/50 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="block truncate px-0.5 text-center text-[6px] text-gray-600">
                              {loc.exhibitor}
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-[#e0f2fe] bg-[#f0f9ff] p-5 text-[#0369a1] text-sm">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#bae6fd]">
                  <span className="font-bold text-[10px]">!</span>
                </div>
                <p className="leading-relaxed">
                  <strong>Strategic Note:</strong> Hall A is the main entrance
                  area. Hall B and C offer specialized zones for high-tech and
                  industrial sectors.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="mb-8 font-semibold text-foreground text-xl">
                Review Order Details
              </h2>
              <div className="flex flex-col gap-8">
                <div className="flex items-start gap-6 rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <div className="relative size-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <Image
                      src={`/landing/${activeTier.image}`}
                      alt={activeTier.name}
                      fill
                      className="object-contain p-3"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#030712] text-lg">
                        {activeTier.name} Booth Package
                      </h3>
                    </div>
                    <p className="max-w-md text-gray-500 text-sm leading-relaxed">
                      {activeTier.description}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[10px] text-gray-400 uppercase">
                          Location
                        </span>
                        <span className="font-bold text-base text-legend">
                          {selectedLocation?.id}
                        </span>
                      </div>
                      <div className="h-8 w-px bg-gray-200" />
                      <div className="flex flex-col">
                        <span className="font-bold text-[10px] text-gray-400 uppercase">
                          Hall
                        </span>
                        <span className="font-bold text-[#1F2937] text-base">
                          {selectedLocation?.hall}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <h4 className="font-bold text-gray-400 text-xs uppercase tracking-[0.2em]">
                    Full Feature Set:
                  </h4>
                  <ul className="grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2">
                    {activeTier.features.map(([feature, strong]) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-gray-600 text-sm"
                      >
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ecfdf5]">
                          <CheckIcon className="size-3 text-[#16a34a]" />
                        </div>
                        <span
                          className={
                            strong ? "font-semibold text-[#1F2937]" : ""
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <BookingOrderSummary
          activeTier={activeTier}
          selectedLocation={selectedLocation?.id || null}
          expoName={expo.name}
          isLocationStep={step === 1}
          onProceed={handleProceed}
        />
      </div>

      {/* Payment Processing Dialog */}
      <PaymentProcessingDialog
        isOpen={isProcessing}
        onComplete={handlePaymentComplete}
      />
    </div>
  )
}
