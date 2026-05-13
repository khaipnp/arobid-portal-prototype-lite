"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BoothTierBadge } from "./booth-tier-badge"

type BookingOrderSummaryProps = {
  activeTier: {
    id: string
    name: string
    price: number
    image: string
  }
  selectedLocation: string | null
  expoName: string
  onProceed: () => void
  isLocationStep: boolean
}

export function BookingOrderSummary({
  activeTier,
  selectedLocation,
  expoName,
  onProceed,
  isLocationStep
}: BookingOrderSummaryProps) {
  const [voucher, setVoucher] = useState("")
  const [useTradeCredit, _setUseTradeCredit] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const discount = useTradeCredit ? 150000 : 0 // Mock discount
  const serviceFee = activeTier.price * 0.1
  const totalAmount = activeTier.price + serviceFee - discount / 25000 // Simplified for demo (assumes price is USD)

  return (
    <div className="sticky top-8 flex h-fit w-full max-w-md flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="select-none font-semibold text-foreground text-xl">
        Order Summary
      </h2>

      {/* Expo Info */}
      <div className="flex items-stretch gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          <Image
            src={`/landing/${activeTier.image}`}
            alt={activeTier.name}
            fill
            className="object-contain p-2"
          />
        </div>
        <div className="flex flex-col gap-1.5 py-0.5">
          <BoothTierBadge
            tier={activeTier.id as "basic" | "professional" | "premium"}
          />
          <p className="line-clamp-2 font-medium text-[#1F2937] text-sm">
            {expoName}
          </p>
        </div>
      </div>

      {/* Hall & Booth Info */}
      <div className="flex items-end gap-4 self-stretch">
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">
            Hall
          </span>
          <span className="font-medium text-base text-foreground">B</span>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">
            Booth
          </span>
          <span className="font-medium text-base text-foreground">
            {selectedLocation || "--"}
          </span>
        </div>
      </div>

      {/* E-Voucher Section */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-foreground text-sm">E-voucher</label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter voucher code"
            value={voucher}
            onChange={(e) => setVoucher(e.target.value)}
            className="rounded-full"
          />
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full bg-legend-100 text-legend hover:bg-legend-200"
          >
            Apply
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="invoice" className="data-checked:bg-legend" />
        <Label
          htmlFor="invoice"
          className="cursor-pointer font-medium text-foreground text-sm"
        >
          Invoice and Contact Info
        </Label>
      </div>

      {/* Price Details */}
      <div className="flex flex-col gap-3 rounded-xl bg-[#F9FAFB] p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Booth Price</span>
            <span className="font-medium text-foreground">
              ${activeTier.price.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium text-foreground">
              {discount > 0 ? `-$${(discount / 25000).toLocaleString()}` : "-"}
            </span>
          </div>
        </div>

        <div className="border-gray-300 border-t border-dashed" />

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Total Amount</span>
          <span className="font-medium text-foreground text-xl">
            ${totalAmount.toLocaleString()}
          </span>
        </div>

        {/* TradeCredit Section */}
        <div className="flex items-center gap-2">
          <Image
            src="/landing/booking/trade-credit-coin.svg"
            alt=""
            width={512}
            height={512}
            className="size-9"
          />
          <div className="flex flex-1 flex-col">
            <span className="text-muted-foreground text-xs">
              Booking successful. You will receive
            </span>
            <span className="font-medium text-foreground text-sm">
              <span className="font-semibold text-legend">150</span> TradeCredit
            </span>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-2 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(val) => setAcceptTerms(val as boolean)}
            className="data-checked:bg-legend"
          />
          <Label
            htmlFor="terms"
            className="cursor-pointer text-foreground text-xs leading-relaxed"
          >
            By clicking, I accept with{" "}
            <Link href="#" className="font-medium underline">
              Terms and Conditions
            </Link>
          </Label>
        </div>
        <Button
          className="h-12 w-full rounded-full bg-legend font-medium text-sm shadow-legend/10 shadow-lg hover:bg-legend-600"
          disabled={(isLocationStep && !selectedLocation) || !acceptTerms}
          onClick={onProceed}
        >
          {isLocationStep ? "Confirm Location" : "Proceed to Payment"}
        </Button>
      </div>
    </div>
  )
}
