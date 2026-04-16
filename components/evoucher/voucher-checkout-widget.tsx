"use client"

import {
  CheckCircle2Icon,
  TagIcon,
  TicketCheckIcon,
  TicketXIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { VoucherBatch, VoucherCode } from "@/lib/evoucher/types"
import {
  applyDiscount,
  buildVoucherBatchView,
  formatDiscount,
  formatVND,
} from "@/lib/evoucher/utils"
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group"
import { Spinner } from "../ui/spinner"

// Represents what was locked for the current order
interface AppliedVoucher {
  // For single-use: the individual code record
  code: VoucherCode | null
  // For multi-use: the batch (counter-based lock)
  batch: VoucherBatch
  inputCode: string // normalized code string entered
  discountAmount: number
  finalTotal: number
}

interface VoucherCheckoutWidgetProps {
  batches: VoucherBatch[]
  codes: VoucherCode[]
  orderTotal: number
  orderScopeType: "expo" | "service"
  orderScopeId: string
  orderId: string
  onApplied?: (voucher: AppliedVoucher | null) => void
}

export function VoucherCheckoutWidget({
  batches,
  codes,
  orderTotal,
  orderScopeType,
  orderScopeId,
  orderId,
  onApplied,
}: VoucherCheckoutWidgetProps) {
  const [voucherBatches, setVoucherBatches] = useState<VoucherBatch[]>(() =>
    batches.map((batch) => ({ ...batch })),
  )
  const [voucherCodes, setVoucherCodes] = useState<VoucherCode[]>(() =>
    codes.map((code) => ({ ...code })),
  )
  const [inputCode, setInputCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<AppliedVoucher | null>(null)

  function validateAndApply() {
    setError(null)
    const normalized = inputCode.trim().toUpperCase()
    if (!normalized) return
    setLoading(true)

    setTimeout(() => {
      setLoading(false)

      // ── Try single-use first ────────────────────────────────────────────────
      const singleCode = voucherCodes.find((c) => c.code === normalized)

      // ── Try multi-use ──────────────────────────────────────────────────────
      const multiUseBatch = voucherBatches.find(
        (b) => b.codeType === "multi-use" && b.multiUseCode === normalized,
      )

      if (!singleCode && !multiUseBatch) {
        setError("Voucher code not recognized. Please check and try again.")
        return
      }

      const batch = singleCode
        ? voucherBatches.find((b) => b.id === singleCode.batchId)
        : multiUseBatch

      if (!batch) {
        setError("Voucher code not recognized.")
        return
      }

      // ── Individual code status (single-use only) ───────────────────────────
      if (singleCode) {
        if (singleCode.status === "Redeemed") {
          setError("This voucher code has already been used.")
          return
        }
        if (singleCode.status === "Locked") {
          setError(
            "This voucher code is currently reserved by another transaction.",
          )
          return
        }
        if (singleCode.status !== "Available") {
          setError("This voucher code is no longer valid.")
          return
        }
      }

      // ── Batch-level checks (both types) ────────────────────────────────────
      if (batch.isRevoked) {
        setError("This voucher is no longer valid.")
        return
      }

      const now = new Date()
      if (now < new Date(batch.validFrom)) {
        setError("This voucher is not yet active.")
        return
      }
      if (now > new Date(batch.validUntil)) {
        setError("This voucher has expired.")
        return
      }

      if (
        batch.applicableTo !== orderScopeType ||
        batch.targetId !== orderScopeId
      ) {
        setError("This voucher cannot be used for this item.")
        return
      }

      const view = buildVoucherBatchView(batch, voucherCodes)
      if (view.remainingCount <= 0) {
        setError("This voucher has been fully used.")
        return
      }

      // ── Release existing lock if any ──────────────────────────────────────
      if (applied) {
        releaseLock(applied)
      }

      // ── Lock ──────────────────────────────────────────────────────────────
      if (singleCode) {
        singleCode.status = "Locked"
        singleCode.lockedByOrderId = orderId
        setVoucherCodes((prev) => [...prev])
      } else {
        // Multi-use: increment locked counter directly on batch
        batch.multiUseLockedCount += 1
        setVoucherBatches((prev) => [...prev])
      }

      const finalTotal = applyDiscount(
        orderTotal,
        batch.discountType,
        batch.discountValue,
      )
      const discountAmount = orderTotal - finalTotal
      const newApplied: AppliedVoucher = {
        code: singleCode ?? null,
        batch,
        inputCode: normalized,
        discountAmount,
        finalTotal,
      }
      setApplied(newApplied)
      setInputCode("")
      onApplied?.(newApplied)
    }, 600)
  }

  function releaseLock(v: AppliedVoucher) {
    if (v.code) {
      // Single-use
      v.code.status = "Available"
      v.code.lockedByOrderId = undefined
      setVoucherCodes((prev) => [...prev])
    } else {
      // Multi-use
      v.batch.multiUseLockedCount = Math.max(0, v.batch.multiUseLockedCount - 1)
      setVoucherBatches((prev) => [...prev])
    }
  }

  function handleRemove() {
    if (!applied) return
    releaseLock(applied)
    setApplied(null)
    setInputCode("")
    setError(null)
    onApplied?.(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-medium text-sm">
        <TagIcon className="size-4" />
        eVoucher Code
      </div>

      {applied ? (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center gap-2">
            <TicketCheckIcon className="size-4 text-green-600 dark:text-green-400" />
            <div>
              <span className="font-mono font-semibold text-green-800 text-sm dark:text-green-300">
                {applied.inputCode}
              </span>
              {" - "}
              <span className="text-foreground">
                {formatDiscount(
                  applied.batch.discountType,
                  applied.batch.discountValue,
                )}{" "}
                off
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={handleRemove}
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <InputGroup>
          <InputGroupInput
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
          <InputGroupButton
            variant="ghost"
            size="sm"
            onClick={validateAndApply}
            disabled={loading || !inputCode.trim()}
          >
            {loading ? <Spinner /> : "Apply"}
          </InputGroupButton>
        </InputGroup>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <TicketXIcon className="size-4" />
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Order Summary Panel ───────────────────────────────────────────────────────

interface OrderSummaryProps {
  batches: VoucherBatch[]
  codes: VoucherCode[]
  orderLabel: string
  orderTotal: number
  orderScopeType: "expo" | "service"
  orderScopeId: string
  orderId: string
}

type PaymentOutcome = "success" | "failure" | "cancel" | null

export function CheckoutOrderSummary({
  batches,
  codes,
  orderLabel,
  orderTotal,
  orderScopeType,
  orderScopeId,
  orderId,
}: OrderSummaryProps) {
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null,
  )
  const [outcome, setOutcome] = useState<PaymentOutcome>(null)
  const [processing, setProcessing] = useState(false)

  const finalTotal = appliedVoucher?.finalTotal ?? orderTotal
  const discountAmount = appliedVoucher?.discountAmount ?? 0

  function simulatePayment(result: "success" | "failure" | "cancel") {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)

      if (appliedVoucher) {
        if (result === "success") {
          if (appliedVoucher.code) {
            // Single-use: mark Redeemed permanently
            appliedVoucher.code.status = "Redeemed"
            appliedVoucher.code.redeemedAt = new Date().toISOString()
            appliedVoucher.code.lockedByOrderId = undefined
          } else {
            // Multi-use: finalize locked → redeemed
            appliedVoucher.batch.multiUseLockedCount = Math.max(
              0,
              appliedVoucher.batch.multiUseLockedCount - 1,
            )
            appliedVoucher.batch.multiUseRedeemedCount += 1
          }
        } else {
          // Failure / cancel: release lock
          if (appliedVoucher.code) {
            appliedVoucher.code.status = "Available"
            appliedVoucher.code.lockedByOrderId = undefined
          } else {
            appliedVoucher.batch.multiUseLockedCount = Math.max(
              0,
              appliedVoucher.batch.multiUseLockedCount - 1,
            )
          }
        }
      }

      setOutcome(result)
    }, 1200)
  }

  function resetDemo() {
    setAppliedVoucher(null)
    setOutcome(null)
    setProcessing(false)
  }

  if (outcome) {
    return (
      <div className="space-y-4 rounded-lg border p-6">
        {outcome === "success" ? (
          <div className="space-y-2 text-center">
            <CheckCircle2Icon className="mx-auto size-10 text-green-500" />
            <h3 className="font-semibold text-lg">Payment Successful!</h3>
            <p className="text-muted-foreground text-sm">
              Your order has been confirmed.{" "}
              {appliedVoucher && (
                <>
                  Voucher{" "}
                  <span className="font-mono font-semibold">
                    {appliedVoucher.inputCode}
                  </span>{" "}
                  {appliedVoucher.batch.codeType === "single-use"
                    ? "has been redeemed and is no longer available."
                    : "use has been consumed (multi-use counter decremented)."}
                </>
              )}
            </p>
          </div>
        ) : outcome === "failure" ? (
          <div className="space-y-2 text-center">
            <XCircleIcon className="mx-auto size-10 text-destructive" />
            <h3 className="font-semibold text-lg">Payment Failed</h3>
            <p className="text-muted-foreground text-sm">
              Your payment could not be processed.{" "}
              {appliedVoucher && (
                <>
                  Voucher{" "}
                  <span className="font-mono font-semibold">
                    {appliedVoucher.inputCode}
                  </span>{" "}
                  lock has been released — it is available again.
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-center">
            <XCircleIcon className="mx-auto size-10 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Payment Cancelled</h3>
            <p className="text-muted-foreground text-sm">
              You cancelled the payment.{" "}
              {appliedVoucher && (
                <>
                  Voucher{" "}
                  <span className="font-mono font-semibold">
                    {appliedVoucher.inputCode}
                  </span>{" "}
                  lock has been released.
                </>
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
    <div className="space-y-4 rounded-lg border p-6">
      <h3 className="font-semibold text-base">Order Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{orderLabel}</span>
          <span>{formatVND(orderTotal)}</span>
        </div>

        {discountAmount > 0 && appliedVoucher && (
          <div className="flex justify-between text-green-700 dark:text-green-400">
            <span className="flex items-center gap-1">
              Voucher ({appliedVoucher.inputCode})
              <Badge variant="outline" className="py-0 text-xs">
                {formatDiscount(
                  appliedVoucher.batch.discountType,
                  appliedVoucher.batch.discountValue,
                )}{" "}
                off
              </Badge>
              {appliedVoucher.batch.codeType === "multi-use" && (
                <Badge variant="secondary" className="py-0 text-xs">
                  Multi-use
                </Badge>
              )}
            </span>
            <span>−{formatVND(discountAmount)}</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex justify-between font-semibold text-base">
        <span>Total Payable</span>
        <span
          className={
            discountAmount > 0 ? "text-green-700 dark:text-green-400" : ""
          }
        >
          {formatVND(finalTotal)}
        </span>
      </div>

      <VoucherCheckoutWidget
        batches={batches}
        codes={codes}
        orderTotal={orderTotal}
        orderScopeType={orderScopeType}
        orderScopeId={orderScopeId}
        orderId={orderId}
        onApplied={setAppliedVoucher}
      />

      <Separator />

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">
          Simulate payment outcome:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => simulatePayment("success")}
            disabled={processing}
          >
            {processing ? <Spinner /> : "Pay (Success)"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => simulatePayment("failure")}
            disabled={processing}
          >
            Fail
          </Button>
          <Button
            variant="outline"
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
