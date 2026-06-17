"use client"

import { DownloadIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import type { Message, RfqStatus } from "@/lib/deal-room/types"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<RfqStatus, string> = {
  open: "Open",
  quoted: "Quoted",
  closed: "Closed",
  expired: "Expired"
}

const STATUS_VARIANT: Record<RfqStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  quoted: "bg-amber-100 text-amber-800",
  closed: "bg-green-100 text-green-800",
  expired: "bg-muted text-muted-foreground"
}

const UNIT_LABEL: Record<string, string> = {
  piece: "Piece",
  "20ft-flat-rack": "20ft Flat Rack",
  "40ft-container": "40ft Container"
}

interface Props {
  message: Message
  isOwn: boolean
  currentUserId: string
  onStatusUpdate: (messageId: string, status: "quoted" | "closed") => void
}

export function RfqMessageCard({
  message,
  isOwn,
  currentUserId: _currentUserId,
  onStatusUpdate
}: Props) {
  const meta = message.rfqMetadata
  if (!meta) return null

  const isExpired =
    new Date(meta.expiryDate) < new Date() &&
    (meta.status === "open" || meta.status === "quoted")

  const effectiveStatus: RfqStatus = isExpired ? "expired" : meta.status
  const canAct =
    !isOwn && (effectiveStatus === "open" || effectiveStatus === "quoted")

  return (
    <div
      className={cn(
        "w-80 max-w-full rounded-2xl border bg-background shadow-sm",
        isOwn ? "border-legend/30" : "border-border"
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold text-sm">Request for Quotation</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-medium text-xs",
            STATUS_VARIANT[effectiveStatus]
          )}
        >
          {STATUS_LABEL[effectiveStatus]}
        </span>
      </div>

      {meta.productImageUrl && (
        <div className="border-b">
          <Image
            src={meta.productImageUrl}
            alt={meta.productName}
            width={320}
            height={144}
            className="h-36 w-full rounded-none object-cover"
          />
        </div>
      )}

      <div className="space-y-2.5 px-4 py-3">
        <div>
          <p className="font-semibold text-sm">{meta.productName}</p>
          <p className="mt-0.5 line-clamp-3 text-muted-foreground text-xs">
            {meta.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div>
            <span className="text-muted-foreground">Qty: </span>
            <span className="font-medium">
              {meta.quantity} {UNIT_LABEL[meta.unit] ?? meta.unit}
            </span>
          </div>
          {meta.destinationCountry && (
            <div>
              <span className="text-muted-foreground">Destination: </span>
              <span className="font-medium">{meta.destinationCountry}</span>
            </div>
          )}
          {meta.targetPrice && (
            <div>
              <span className="text-muted-foreground">Target: </span>
              <span className="font-medium">{meta.targetPrice}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Expires: </span>
            <span className="font-medium">
              {new Date(meta.expiryDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {meta.attachmentName && (
          <a
            href={meta.attachmentUrl ?? "#"}
            className="flex items-center gap-1.5 text-blue-600 text-xs hover:underline"
            download={meta.attachmentName}
          >
            <DownloadIcon className="size-3.5" />
            <span className="truncate">{meta.attachmentName}</span>
          </a>
        )}
      </div>

      {canAct && (
        <div className="flex gap-2 border-t px-4 py-3">
          {effectiveStatus === "open" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onStatusUpdate(message.id, "quoted")}
            >
              Mark as Quoted
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-destructive text-xs hover:bg-destructive/10"
            onClick={() => onStatusUpdate(message.id, "closed")}
          >
            Close RFQ
          </Button>
        </div>
      )}
    </div>
  )
}
