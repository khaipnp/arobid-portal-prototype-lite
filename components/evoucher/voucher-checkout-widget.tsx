"use client"

import {
  CheckCircle2Icon,
  Loader2Icon,
  TagIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { mockVoucherBatches, mockVoucherCodes } from "@/lib/evoucher/mock-data"
import type { VoucherBatch, VoucherCode } from "@/lib/evoucher/types"
import {
  applyDiscount,
  buildVoucherBatchView,
  formatDiscount,
  formatVND,
} from "@/lib/evoucher/utils"

interface AppliedVoucher {
  code: VoucherCode
  batch: VoucherBatch
  discountAmount: number
  finalTotal: number
}

interface VoucherCheckoutWidgetProps {
  orderTotal: number
  orderScopeType: "expo" | "service"
  orderScopeId: string
  orderId: string
  onTotalChange?: (finalTotal: number) => void
}

export function VoucherCheckoutWidget({
  orderTotal,
  orderScopeType,
  orderScopeId,
  orderId,
  onTotalChange,
}: VoucherCheckoutWidgetProps) {
  const [inputCode, setInputCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<AppliedVoucher | null>(null)

  // Mutable references to mock state (module-level for prototype)
  function findCode(rawCode: string): VoucherCode | undefined {
    const normalized = rawCode.trim().toUpperCase()
    return mockVoucherCodes.find((c) => c.code === normalized)
  }

  function validateAndApply() {
    setError(null)
    const normalized = inputCode.trim().toUpperCase()
    if (!normalized) return

    setLoading(true)

    // Simulate async validation
    setTimeout(() => {
      setLoading(false)

      // 1. Existence check
      const code = findCode(normalized)
      if (!code) {
        setError("Voucher code not recognized. Please check and try again.")
        return
      }

      // 2. Individual code status
      if (code.status === "Redeemed") {
        setError("This voucher code has already been used.")
        return
      }
      if (code.status === "Locked") {
        setError("This voucher code is currently being used in another transaction.")
        return
      }
      if (code.status !== "Available") {
        setError("This voucher code is no longer valid.")
        return
      }

      // 3. Batch checks
      const batch = mockVoucherBatches.find((b) => b.id === code.batchId)
      if (!batch) {
        setError("Voucher code not recognized.")
        return
      }

      // Batch revoked
      if (batch.isRevoked) {
        setError("This voucher is no longer valid.")
        return
      }

      // Validity window
      const now = new Date()
      const from = new Date(batch.validFrom)
      const until = new Date(batch.validUntil)
      if (now < from) {
        setError("This voucher is not yet active.")
        return
      }
      if (now > until) {
        setError("This voucher has expired.")
        return
      }

      // 4. Scope check
      if (batch.applicableTo !== orderScopeType || batch.targetId !== orderScopeId) {
        setError("This voucher cannot be used for this item.")
        return
      }

      // 5. Quantity check
      const view = buildVoucherBatchView(batch, mockVoucherCodes)
      if (view.remainingCount <= 0) {
        setError("This voucher has been fully used.")
        return
      }

      // All checks passed — release existing lock if any
      if (applied) {
        const prevCode = mockVoucherCodes.find((c) => c.id === applied.code.id)
        if (prevCode) {
          prevCode.status = "Available"
          prevCode.lockedByOrderId = undefined
        }
      }

      // Lock this code
      code.status = "Locked"
      code.lockedByOrderId = orderId

      const finalTotal = applyDiscount(orderTotal, batch.discountType, batch.discountValue)
      const discountAmount = orderTotal - finalTotal

      const newApplied: AppliedVoucher = {
        code,
        batch,
        discountAmount,
        finalTotal,
      }
      setApplied(newApplied)
      setInputCode("")
      onTotalChange?.(finalTotal)
    }, 600)
  }

  function handleRemove() {
    if (!applied) return
    // Release lock
    const code = mockVoucherCodes.find((c) => c.id === applied.code.id)
    if (code) {
      code.status = "Available"
      code.lockedByOrderId = undefined
    }
    setApplied(null)
    setInputCode("")
    setError(null)
    onTotalChange?.(orderTotal)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <TagIcon className="size-4 text-muted-foreground" />
        eVoucher Code
      </div>

      {applied ? (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="size-4 text-green-600 dark:text-green-400" />
            <div>
              <span className="font-mono text-sm font-semibold text-green-800 dark:text-green-300">
                {applied.code.code}
              </span>
              <span className="ml-2 text-muted-foreground text-xs">
                {formatDiscount(applied.batch.discountType, applied.batch.discountValue)} off
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={handleRemove}>
            <XIcon className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            className="font-mono uppercase"
            placeholder="Enter voucher code"
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value.toUpperCase())
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") validateAndApply()
            }}
            disabled={loading}
          />
          <Button
            variant="outline"
            onClick={validateAndApply}
            disabled={loading || !inputCode.trim()}
          >
            {loading ? <Loader2Icon className="size-4 animate-spin" /> : "Apply"}
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-xs">
          <XCircleIcon className="size-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Order Summary Panel ───────────────────────────────────────────────────────

interface OrderSummaryProps {
  orderLabel: string
  orderTotal: number
  orderScopeType: "expo" | "service"
  orderScopeId: string
  orderId: string
}

type PaymentOutcome = "success" | "failure" | "cancel" | null

export function CheckoutOrderSummary({
  orderLabel,
  orderTotal,
  orderScopeType,
  orderScopeId,
  orderId,
}: OrderSummaryProps) {
  const [finalTotal, setFinalTotal] = useState(orderTotal)
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: VoucherCode; batch: VoucherBatch } | null>(null)
  const [outcome, setOutcome] = useState<PaymentOutcome>(null)
  const [processing, setProcessing] = useState(false)

  function handleTotalChange(newTotal: number) {
    setFinalTotal(newTotal)
    if (newTotal < orderTotal) {
      const code = mockVoucherCodes.find((c) => c.status === "Locked" && c.lockedByOrderId === orderId)
      if (code) {
        const batch = mockVoucherBatches.find((b) => b.id === code.batchId) ?? null
        setAppliedVoucher(code && batch ? { code, batch } : null)
      }
    } else {
      setAppliedVoucher(null)
    }
  }

  function simulatePayment(result: "success" | "failure" | "cancel") {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)

      const code = mockVoucherCodes.find(
        (c) => c.status === "Locked" && c.lockedByOrderId === orderId,
      )

      if (result === "success") {
        if (code) {
          code.status = "Redeemed"
          code.redeemedAt = new Date().toISOString()
          code.lockedByOrderId = undefined
        }
      } else {
        // failure or cancel — release
        if (code) {
          code.status = "Available"
          code.lockedByOrderId = undefined
        }
      }

      setOutcome(result)
    }, 1200)
  }

  function resetDemo() {
    setFinalTotal(orderTotal)
    setAppliedVoucher(null)
    setOutcome(null)
    setProcessing(false)
  }

  const discountAmount = orderTotal - finalTotal

  if (outcome) {
    return (
      <div className="rounded-lg border p-6 space-y-4">
        {outcome === "success" ? (
          <div className="text-center space-y-2">
            <CheckCircle2Icon className="mx-auto size-10 text-green-500" />
            <h3 className="font-semibold text-lg">Payment Successful!</h3>
            <p className="text-muted-foreground text-sm">
              Your order has been confirmed.{" "}
              {appliedVoucher && (
                <span>
                  Voucher <span className="font-mono font-semibold">{appliedVoucher.code.code}</span>{" "}
                  has been redeemed and is no longer available.
                </span>
              )}
            </p>
          </div>
        ) : outcome === "failure" ? (
          <div className="text-center space-y-2">
            <XCircleIcon className="mx-auto size-10 text-destructive" />
            <h3 className="font-semibold text-lg">Payment Failed</h3>
            <p className="text-muted-foreground text-sm">
              Your payment could not be processed.{" "}
              {appliedVoucher && (
                <span>
                  Voucher <span className="font-mono font-semibold">{appliedVoucher.code.code}</span>{" "}
                  has been released and is available again.
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <XCircleIcon className="mx-auto size-10 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Payment Cancelled</h3>
            <p className="text-muted-foreground text-sm">
              You cancelled the payment.{" "}
              {appliedVoucher && (
                <span>
                  Voucher <span className="font-mono font-semibold">{appliedVoucher.code.code}</span>{" "}
                  lock has been released.
                </span>
              )}
            </p>
          </div>
        )}
        <Button variant="outline" className="w-full" onClick={resetDemo}>
          Reset Demo
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <h3 className="font-semibold text-base">Order Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{orderLabel}</span>
          <span>{formatVND(orderTotal)}</span>
        </div>

        {discountAmount > 0 && appliedVoucher && (
          <div className="flex justify-between text-green-700 dark:text-green-400">
            <span>
              Voucher ({appliedVoucher.code.code.split("-").slice(-1)[0]}…{" "}
              <Badge variant="outline" className="text-xs py-0">
                {formatDiscount(appliedVoucher.batch.discountType, appliedVoucher.batch.discountValue)} off
              </Badge>
              )
            </span>
            <span>−{formatVND(discountAmount)}</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex justify-between font-semibold text-base">
        <span>Total Payable</span>
        <span className={discountAmount > 0 ? "text-green-700 dark:text-green-400" : ""}>
          {formatVND(finalTotal)}
        </span>
      </div>

      <VoucherCheckoutWidget
        orderTotal={orderTotal}
        orderScopeType={orderScopeType}
        orderScopeId={orderScopeId}
        orderId={orderId}
        onTotalChange={handleTotalChange}
      />

      <Separator />

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">Simulate payment outcome:</p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            onClick={() => simulatePayment("success")}
            disabled={processing}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {processing ? <Loader2Icon className="size-4 animate-spin" /> : "Pay (Success)"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => simulatePayment("failure")}
            disabled={processing}
          >
            Fail
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => simulatePayment("cancel")}
            disabled={processing}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
