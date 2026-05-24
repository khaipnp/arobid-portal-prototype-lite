"use client"

import { CheckIcon, Loader2Icon, MailIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { BoothTierBadge } from "./booth-tier-badge"

type BookingSuccessDialogProps = {
  isOpen: boolean
  onClose: () => void
  data: {
    activeTier: { id: string; name: string; price: number; image: string }
    selectedLocation: { id: string; hall: string } | null
    expoName: string
    expoSlug: string
  }
}

export function BookingSuccessDialog({
  isOpen,
  onClose,
  data
}: BookingSuccessDialogProps) {
  const [status, setStatus] = useState<"processing" | "success">("processing")
  const router = useRouter()

  useEffect(() => {
    if (isOpen && status === "processing") {
      const timer = setTimeout(() => {
        setStatus("success")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, status])

  const totalPaid = data.activeTier.price * 1.1 // Including 10% fee

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-w-md gap-0 overflow-hidden border-none bg-transparent p-0 shadow-none",
          status === "success" ? "sm:max-w-lg" : "sm:max-w-sm"
        )}
      >
        <DialogTitle className="sr-only">Booking Status</DialogTitle>

        {status === "processing" ? (
          <div className="flex flex-col items-center justify-center gap-6 rounded-3xl bg-white p-12">
            <div className="relative size-20">
              <Loader2Icon className="size-20 animate-spin text-legend" />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-legend">
                $
              </div>
            </div>
            <div className="space-y-2 text-center">
              <h2 className="font-bold text-2xl text-[#030712]">
                Processing Payment
              </h2>
              <p className="max-w-[240px] text-gray-500 text-sm">
                Please wait while we confirm your transaction with the bank...
              </p>
            </div>
          </div>
        ) : (
          <div className="custom-scrollbar flex max-h-[90vh] flex-col items-center gap-6 overflow-y-auto rounded-[32px] bg-white p-6 sm:p-10">
            {/* Success Header */}
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-[#DCFCE7]">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#16A34A] text-white">
                  <CheckIcon className="size-6 stroke-[3px]" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="font-bold text-2xl text-foreground sm:text-3xl">
                  Booking Confirmed!
                </h2>
                <p className="text-[#1F2937] opacity-80">
                  Your booth has been successfully reserved.
                </p>
              </div>
            </div>

            {/* Ticket Card */}
            <div className="flex w-full flex-col gap-5 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4 sm:p-6">
              {/* Ticket ID */}
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">
                    Booking ID
                  </span>
                  <span className="font-bold text-[#1F2937] text-sm">
                    #BOOTH02112004
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-medium text-gray-500 text-xs">
                    Date:
                  </span>
                  <span className="font-medium text-gray-500 text-xs">
                    20/05/2026
                  </span>
                </div>
              </div>

              {/* Main Ticket Info */}
              <div className="flex flex-col gap-5 rounded-xl bg-white p-4 shadow-[0_0_16px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-gray-100">
                    <Image
                      src={`/landing/${data.activeTier.image}`}
                      alt=""
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <BoothTierBadge
                      tier={
                        data.activeTier.id.toLowerCase() as
                          | "basic"
                          | "professional"
                          | "premium"
                      }
                      className="w-fit"
                    />
                    <p className="line-clamp-1 font-bold text-[#1F2937] text-sm">
                      {data.expoName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[10px] text-gray-400 uppercase">
                      Start Date
                    </span>
                    <span className="font-bold text-[#1F2937] text-sm">
                      05/05/2026
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[10px] text-gray-400 uppercase">
                      End Date
                    </span>
                    <span className="font-bold text-[#1F2937] text-sm">
                      20/05/2026
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[10px] text-gray-400 uppercase">
                      Hall
                    </span>
                    <span className="font-bold text-[#1F2937] text-sm">
                      {data.selectedLocation?.hall}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[10px] text-gray-400 uppercase">
                      Booth
                    </span>
                    <span className="font-bold text-[#1F2937] text-sm">
                      {data.selectedLocation?.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 border-gray-200 border-t border-dashed pt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-400">
                      Booth Price
                    </span>
                    <span className="font-bold text-[#1F2937]">
                      ${data.activeTier.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#16A34A]">
                      Discount (Included)
                    </span>
                    <span className="font-bold text-[#16A34A]">-$0</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-medium text-gray-500 text-sm">
                      Total Paid
                    </span>
                    <span className="font-bold text-[#1F2937] text-xl">
                      ${totalPaid.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Note */}
              <div className="flex items-center gap-2 px-2">
                <MailIcon className="size-4 text-legend" />
                <p className="text-[#1F2937] text-xs">
                  Confirmation sent to{" "}
                  <span className="font-bold text-legend">
                    nadir@company.com
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full gap-4">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-full border-gray-200 font-bold text-[#1F2937]"
                onClick={() => router.push(`/tradexpo/expos/${data.expoSlug}`)}
              >
                Back to Expo
              </Button>
              <Button
                className="h-12 flex-1 rounded-full bg-legend font-bold shadow-legend/20 shadow-lg hover:bg-legend-600"
                onClick={() => router.push("/seller")}
              >
                Customize Booth
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
