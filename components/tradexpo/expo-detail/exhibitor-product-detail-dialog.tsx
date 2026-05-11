"use client"

import {
  MessageCircleIcon,
  StarIcon
} from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExhibitorRfqDialog } from "./exhibitor-rfq-dialog"

type ProductItem = {
  image: string
  label: string
}

type ExhibitorProductDetailDialogProps = {
  exhibitorCompany: string
  products: ProductItem[]
  selectedProduct: ProductItem | null
  onSelectedProductChange: (product: ProductItem | null) => void
  onChatNow?: (product: ProductItem) => void
}

export function ExhibitorProductDetailDialog({
  exhibitorCompany,
  products,
  selectedProduct,
  onSelectedProductChange,
  onChatNow
}: ExhibitorProductDetailDialogProps) {
  const [isRfqDialogOpen, setIsRfqDialogOpen] = useState(false)

  const priceRanges = [
    { range: "100 - 499 pieces", price: "VND 759,005", featured: true },
    { range: "500 - 1,999 pieces", price: "VND 748,851" },
    { range: "2,000 - 4,999 pieces", price: "VND 733,620" },
    { range: ">= 5,000 pieces", price: "VND 708,235" }
  ]

  const variantOptions = [
    "Rosé - 256GB | 12GB",
    "Rosé - 512GB | 12GB",
    "Rosé - 1TB | 12GB",
    "Gray Metal - 1TB | 12GB"
  ]

  if (!selectedProduct) {
    return null
  }

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="Close product details"
        onClick={() => onSelectedProductChange(null)}
      />
      <div className="absolute h-screen w-screen overflow-hidden bg-white p-4 shadow-2xl md:px-16">
        <div className="absolute top-4 right-4 z-10">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => onSelectedProductChange(null)}
          >
            ✕
          </Button>
        </div>
        <div className="grid h-full gap-5 lg:grid-cols-[1fr_440px]">
          <ScrollArea className="h-screen">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#e4e7ff] px-3 py-1 font-medium text-[#022582] text-xs">
                  NEW
                </span>
                <span className="rounded-full bg-legend px-3 py-1 font-medium text-white text-xs">
                  LIVE
                </span>
                <span className="rounded-full bg-[#fee2e2] px-3 py-1 font-medium text-orange-700 text-xs">
                  TOP DEAL
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Company:{" "}
                <span className="font-medium text-[#022582] underline">
                  {exhibitorCompany}
                </span>
              </p>
              <h2 className="pr-8 font-semibold text-lg leading-7 sm:text-xl">
                {selectedProduct.label}
              </h2>
              <div className="flex items-center gap-2 text-[#6b7280] text-xs">
                <div className="flex items-center gap-0.5 text-yellow-500">
                  {["r1", "r2", "r3", "r4", "r5"].map((ratingKey) => (
                    <StarIcon
                      key={ratingKey}
                      className="size-3.5 fill-current"
                    />
                  ))}
                </div>
                <span>(65 reviews)</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[88px_1fr]">
              <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col">
                {products.map((item) => {
                  const active = item.image === selectedProduct.image
                  return (
                    <button
                      key={`dialog-thumb-${item.image}`}
                      type="button"
                      className={`relative size-16.5 shrink-0 overflow-hidden rounded-xl border transition md:size-20 ${
                        active
                          ? "border-legend ring-1 ring-legend/25"
                          : "border-muted hover:border-[#d1d5db]"
                      }`}
                      onClick={() => onSelectedProductChange(item)}
                      aria-label={`Switch to product image: ${item.label}`}
                    >
                      <Image
                        src={item.image}
                        alt={item.label}
                        fill
                        className="object-cover"
                      />
                    </button>
                  )
                })}
              </div>

              <div className="relative order-1 aspect-[16/10] overflow-hidden rounded-2xl border border-muted md:order-2">
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.label}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-6 border-muted border-b px-5">
                <button
                  type="button"
                  className="border-legend border-b-2 py-3 font-medium text-legend text-sm"
                >
                  Product Overview
                </button>
                <button
                  type="button"
                  className="py-3 font-medium text-foreground text-sm"
                >
                  Technical Specifications
                </button>
              </div>

              <div className="space-y-5 p-5">
                <section className="space-y-3">
                  <h4 className="font-semibold text-foreground text-xl">
                    Product Overview
                  </h4>
                  <p className="text-foreground text-sm leading-5">
                    The Galaxy Z Fold 6 features a sophisticated folding design
                    with Snapdragon 8 Gen 3 performance and professional-grade
                    camera capabilities.
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-foreground text-sm leading-5">
                    <li>Galaxy AI is here for smarter multitasking.</li>
                    <li>Thinner and lighter foldable design.</li>
                    <li>Durable frame with optimized hinge structure.</li>
                    <li>8K-ready camera and enhanced image processing.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h4 className="font-semibold text-foreground text-xl">
                    Technical Specifications
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-muted">
                    <div className="grid grid-cols-2">
                      <div className="border-muted border-b bg-[#f9fafb] px-4 py-2 text-sm">
                        Size / Dimensions
                      </div>
                      <div className="border-muted border-b px-4 py-2 text-sm">
                        2094 × 1038 × 35 mm
                      </div>
                      <div className="border-muted border-b bg-[#f9fafb] px-4 py-2 text-sm">
                        Material
                      </div>
                      <div className="border-muted border-b px-4 py-2 text-sm">
                        Monocrystalline Silicon
                      </div>
                      <div className="bg-[#f9fafb] px-4 py-2 text-sm">
                        Production Capacity
                      </div>
                      <div className="px-4 py-2 text-sm">50,000 Pieces</div>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="font-semibold text-base text-foreground">
                    Returns Policy
                  </h4>
                  <div className="rounded-xl border border-muted">
                    <div className="bg-[#f9fafb] px-4 py-3 text-sm">
                      Wholesale Return Policy
                    </div>
                    <ul className="list-disc space-y-1 p-4 pl-8 text-foreground text-sm leading-5">
                      <li>
                        Manufacturing Defects: 30-day full refund or
                        replacement.
                      </li>
                      <li>
                        Shipping Damage: Must report within 48 hours of
                        delivery.
                      </li>
                      <li>
                        Restocking Fee: 15% fee for non-defective returns.
                      </li>
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          </ScrollArea>

          <aside className="h-fit flex-1 space-y-4 rounded-2xl border border-muted p-4">
            <div className="space-y-3">
              <p className="font-medium text-foreground text-sm">Price (MOQ)</p>
              <div className="grid grid-cols-2 gap-3">
                {priceRanges.map((priceItem) => (
                  <div key={priceItem.range} className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {priceItem.range}
                    </p>
                    <p
                      className={`font-semibold text-sm ${
                        priceItem.featured ? "text-legend" : "text-foreground"
                      }`}
                    >
                      {priceItem.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-muted border-t pt-4">
              <p className="font-medium text-foreground text-sm">Variants</p>
              <div className="flex flex-wrap gap-2">
                {variantOptions.map((variant, index) => (
                  <button
                    key={variant}
                    type="button"
                    className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                      index === 0
                        ? "border-legend bg-[#fff7ed] text-[#9a3412]"
                        : "border-muted text-foreground"
                    }`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-muted border-t pt-4">
              <p className="font-medium text-foreground text-sm">Quantity</p>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-32 items-center justify-between rounded-full border border-muted px-2">
                  <button
                    type="button"
                    className="rounded-full bg-[#f3f4f6] px-2 py-1 text-sm"
                  >
                    -
                  </button>
                  <span className="text-sm">100</span>
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-sm"
                  >
                    +
                  </button>
                </div>
                <span className="text-[#6b7280] text-xs">MOQ: 100 pieces</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  if (selectedProduct) {
                    onChatNow?.(selectedProduct)
                  }
                }}
              >
                <MessageCircleIcon className="size-4" />
                Chat Now
              </Button>
              <Button
                type="button"
                className="rounded-full bg-legend text-white hover:bg-legend-600"
                onClick={() => setIsRfqDialogOpen(true)}
              >
                Send RFQ
              </Button>
            </div>
          </aside>
        </div>
      </div>
      <ExhibitorRfqDialog
        open={isRfqDialogOpen}
        selectedProduct={selectedProduct}
        onClose={() => setIsRfqDialogOpen(false)}
      />
    </div>
  )
}
