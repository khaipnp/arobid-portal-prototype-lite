"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  const [useTradeCredit, setUseTradeCredit] = useState(false)
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

      {/* TradeCredit Section */}
      <div className="flex items-center gap-3">
        <Image
          src="/landing/booking/trade-credit-coin.svg"
          alt=""
          width={24}
          height={24}
        />
        <div className="flex flex-1 flex-col">
          <span className="font-medium text-[#030712] text-sm">
            VND 150 Off
          </span>
          <span className="text-[11px] text-gray-500">
            Applied with your 3 TradeCredit
          </span>
        </div>
        <Switch
          checked={useTradeCredit}
          onCheckedChange={setUseTradeCredit}
          className="data-[state=checked]:bg-legend"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="invoice" />
        <label
          htmlFor="invoice"
          className="cursor-pointer font-medium text-[#030712] text-sm"
        >
          Invoice and Contact Info
        </label>
      </div>

      {/* Price Details */}
      <div className="flex flex-col gap-3 rounded-xl bg-[#F9FAFB] p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Booth Price</span>
            <span className="font-medium text-[#1F2937]">
              ${activeTier.price.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Discount</span>
            <span className="font-medium text-[#1F2937]">
              {discount > 0 ? `-$${(discount / 25000).toLocaleString()}` : "-"}
            </span>
          </div>
        </div>

        <div className="border-gray-300 border-t border-dashed" />

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Total Amount</span>
          <span className="font-medium text-[#1F2937] text-xl">
            ${totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-2 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(val) => setAcceptTerms(val as boolean)}
            className="mt-0.5 data-checked:bg-legend"
          />
          <label
            htmlFor="terms"
            className="cursor-pointer text-foreground text-xs leading-relaxed"
          >
            By clicking, I accept with{" "}
            <Link href="#" className="font-medium underline">
              Terms and Conditions
            </Link>
          </label>
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
