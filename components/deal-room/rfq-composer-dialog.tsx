"use client"

import { CalendarIcon, PaperclipIcon, UploadIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CharacterCount } from "@/components/ui/character-count"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { RfqMetadata } from "@/lib/deal-room/types"

const MAX_DESCRIPTION_LENGTH = 400
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES = new Set(["jpg", "jpeg", "png", "webp"])
const ATTACHMENT_TYPES = new Set(["pdf", "doc", "docx", "xlsx", "csv"])

function getDefaultExpiry(): string {
  const d = new Date()
  d.setDate(d.getDate() + 120)
  return d.toISOString().slice(0, 10)
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "#")
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

interface Props {
  open: boolean
  onClose: () => void
  onSendRfq: (metadata: RfqMetadata) => void
}

export function RfqComposerDialog({ open, onClose, onSendRfq }: Props) {
  const [productName, setProductName] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState("piece")
  const [destinationCountry, setDestinationCountry] = useState("")
  const [targetPrice, setTargetPrice] = useState("")
  const [expiryDate, setExpiryDate] = useState(getDefaultExpiry)
  const [productImageUrl, setProductImageUrl] = useState<string | undefined>()
  const [productImageName, setProductImageName] = useState<string | undefined>()
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>()
  const [attachmentName, setAttachmentName] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!IMAGE_TYPES.has(ext)) {
      setError("Image must be JPG, JPEG, PNG, or WEBP.")
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be under 5 MB.")
      return
    }
    setError(null)
    const url = await fileToDataUrl(file)
    setProductImageUrl(url)
    setProductImageName(file.name)
    e.target.value = ""
  }

  async function handleAttachmentChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ATTACHMENT_TYPES.has(ext)) {
      setError("Attachment must be PDF, DOC, DOCX, XLSX, or CSV.")
      return
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setError("Attachment must be under 5 MB.")
      return
    }
    setError(null)
    setAttachmentUrl("#")
    setAttachmentName(file.name)
    e.target.value = ""
  }

  function handleSubmit() {
    if (!productName.trim()) {
      setError("Product name is required.")
      return
    }
    if (!description.trim()) {
      setError("Description is required.")
      return
    }
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty < 1) {
      setError("Quantity must be at least 1.")
      return
    }
    if (!expiryDate) {
      setError("Expiry date is required.")
      return
    }
    setError(null)
    onSendRfq({
      productName: productName.trim(),
      description: description.trim(),
      productImageUrl,
      attachmentUrl,
      attachmentName,
      quantity: qty,
      unit,
      destinationCountry: destinationCountry.trim() || undefined,
      targetPrice: targetPrice.trim() || undefined,
      expiryDate,
      status: "open"
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-80">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close RFQ dialog"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-start justify-center p-3 sm:p-4">
        <div className="relative mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-3xl flex-col rounded-4xl bg-white p-3 shadow-2xl sm:mt-6 sm:p-4">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-4">
              <h3 className="font-semibold text-xl">Request for Quotation</h3>

              <section className="space-y-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-sm">Product Name</label>
                  <Input
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-sm">Description</label>
                  <Textarea
                    className="min-h-28 resize-none"
                    placeholder="Describe your requirements..."
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <CharacterCount
                    currentLength={description.length}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">
                      Upload product image (1 image)
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Format jpg, jpeg, png, webp, max 5 MB
                    </p>
                    {productImageUrl ? (
                      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {productImageName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setProductImageUrl(undefined)
                            setProductImageName(undefined)
                          }}
                        >
                          <XIcon className="size-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex h-28 w-full flex-col items-center justify-center rounded-lg border border-muted-foreground/40 border-dashed bg-muted/20"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <UploadIcon className="mb-2 size-5 text-muted-foreground" />
                        <p className="font-medium text-sm">Upload image</p>
                        <input
                          ref={imageInputRef}
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={handleImageChange}
                        />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-sm">Upload attachment</p>
                    <p className="text-muted-foreground text-xs">
                      Format pdf, doc, docx, xlsx, csv, max 5 MB
                    </p>
                    {attachmentName ? (
                      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {attachmentName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachmentUrl(undefined)
                            setAttachmentName(undefined)
                          }}
                        >
                          <XIcon className="size-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex h-28 w-full flex-col items-center justify-center rounded-lg border border-muted-foreground/40 border-dashed bg-muted/20"
                        onClick={() => attachmentInputRef.current?.click()}
                      >
                        <UploadIcon className="mb-2 size-5 text-muted-foreground" />
                        <p className="font-medium text-sm">Upload file</p>
                        <input
                          ref={attachmentInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xlsx,.csv"
                          onChange={handleAttachmentChange}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-3 border-muted border-t pt-4">
                <h3 className="font-semibold text-base">
                  Quantity &amp; Pricing
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">Unit</label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="20ft-flat-rack">
                          20ft Flat Rack
                        </SelectItem>
                        <SelectItem value="40ft-container">
                          40ft Container
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">
                      Destination Country
                    </label>
                    <Input
                      placeholder="Enter destination country"
                      value={destinationCountry}
                      onChange={(e) => setDestinationCountry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">
                      Target Price (Optional)
                    </label>
                    <Input
                      placeholder="e.g. 1.0000 USD"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <div className="rounded-2xl border border-muted bg-muted/30 p-4">
                <p className="font-medium text-sm">Expiry date</p>
                <div className="relative mt-3">
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="pr-9"
                  />
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

              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-2 pb-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-legend text-white hover:bg-legend-600"
              onClick={handleSubmit}
            >
              Send RFQ
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
