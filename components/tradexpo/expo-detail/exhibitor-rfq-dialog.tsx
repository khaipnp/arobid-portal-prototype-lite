"use client"

import { CalendarIcon, CheckIcon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type ProductItem = {
  image: string
  label: string
}

type ExhibitorRfqDialogProps = {
  open: boolean
  selectedProduct: ProductItem | null
  onClose: () => void
}

export function ExhibitorRfqDialog({
  open,
  selectedProduct,
  onClose
}: ExhibitorRfqDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-80">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close RFQ dialog"
        onClick={onClose}
      />
      <div className="absolute inset-0 p-3 sm:p-4">
        <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-3xl flex-col rounded-4xl bg-white p-3 shadow-2xl sm:mt-6 sm:h-[calc(100dvh-8rem)] sm:p-4">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-4 rounded-2xl pr-1">
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold text-xl">
                  Request for Quotation
                </h3>
                <div className="space-y-1.5">
                  <label className="font-medium text-sm">Product Name</label>
                  <Input defaultValue={selectedProduct?.label} />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-sm">Description</label>
                  <Textarea
                    className="min-h-28 resize-none"
                    defaultValue={selectedProduct?.label}
                  />
                  <p className="text-muted-foreground text-xs">25/400</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {["Upload product image (1 image)", "Upload attachment"].map(
                    (uploadTitle) => (
                      <div key={uploadTitle} className="space-y-2">
                        <p className="font-medium text-sm">{uploadTitle}</p>
                        <p className="text-muted-foreground text-xs">
                          Format jpg, jpeg, png, max 5mb
                        </p>
                        <button
                          type="button"
                          className="flex h-28 w-full flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20"
                        >
                          <UploadIcon className="mb-2 size-5 text-muted-foreground" />
                          <p className="font-medium text-sm">Upload image</p>
                          <p className="text-muted-foreground text-xs">
                            Format jpg, jpeg, png, max 5mb
                          </p>
                        </button>
                      </div>
                    )
                  )}
                </div>
              </section>

              <section className="space-y-3 border-t border-muted pt-4">
                <h3 className="flex items-center gap-2 font-semibold text-base">
                  Quantity & Pricing
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">Quantity</label>
                    <Input defaultValue="1" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">Unit</label>
                    <Select defaultValue="20ft-flat-rack">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20ft-flat-rack">
                          20ft Flat Rack
                        </SelectItem>
                        <SelectItem value="40ft-container">
                          40ft Container
                        </SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">
                      Destination Country
                    </label>
                    <Input placeholder="Enter destination country" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">
                      Target Price (Optional)
                    </label>
                    <Input defaultValue="1.0000 USD" />
                  </div>
                </div>
              </section>

              <div className="rounded-2xl border border-muted bg-muted/30 p-4">
                <p className="font-medium text-sm">Expired date</p>
                <div className="relative mt-3">
                  <Input defaultValue="9 / 8 / 2026" className="pr-9" />
                  <CalendarIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-900 text-sm">
                <p className="flex gap-2">
                  <span>🕒</span>
                  <span>
                    This RFQ will be automatically closed after{" "}
                    <strong>120 days</strong>, regardless of quotation status.
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pb-1 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-legend text-white hover:bg-legend-600"
            >
              Send RFQ
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
