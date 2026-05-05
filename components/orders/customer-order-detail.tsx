"use client"

import { ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Fragment, useEffect, useMemo, useState } from "react"
import {
  getOrderStatusLabel,
  OrderStatusBadge,
} from "@/components/orders/order-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
  Order,
  OrderStatus,
  OrderType,
  TransactionLogEntry,
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "Expired"
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`
  }

  return `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(
    2,
    "0",
  )}s`
}

function bannerForStatus(status: OrderStatus) {
  switch (status) {
    case "Pending Payment":
      return {
        message: "Your payment is still in progress.",
        className: "border-zinc-300 bg-zinc-50 text-zinc-700",
      }
    case "Paid":
      return {
        message: "Payment confirmed.",
        className: "border-emerald-300 bg-emerald-50 text-emerald-800",
      }
    case "Failed":
      return {
        message: "Payment was not completed.",
        className: "border-rose-300 bg-rose-50 text-rose-800",
      }
    case "Cancelled":
      return {
        message: "Payment was cancelled.",
        className: "border-zinc-300 bg-zinc-50 text-zinc-700",
      }
    case "Expired":
      return {
        message: "Your payment window has expired.",
        className: "border-zinc-300 bg-zinc-50 text-zinc-700",
      }
  }
}

function resultMessage(order: Order) {
  switch (order.status) {
    case "Pending Payment":
      return "VNPay has not returned a final payment result for this order yet."
    case "Paid":
      return order.orderType === "booth_registration"
        ? "VNPay confirmed this payment successfully. Your booth booking is recorded."
        : "VNPay confirmed this payment successfully. Your order is recorded."
    case "Failed":
      return "VNPay returned an unsuccessful payment result for this order."
    case "Cancelled":
      return "This payment was cancelled before completion."
    case "Expired":
      return "The VNPay payment window timed out before completion."
  }
}

function statusDotClass(status: OrderStatus) {
  if (status === "Paid") return "bg-emerald-500"
  if (status === "Failed") return "bg-rose-500"
  return "bg-zinc-400"
}

function getOrderTypeLabel(orderType: OrderType) {
  if (orderType === "booth_registration") return "TradeXpo Booth"
  return "B2B Package"
}

function referenceRows(order: Order): { label: string; value: string }[] {
  if (order.orderType === "booth_registration") {
    return [
      { label: "Order Type", value: getOrderTypeLabel(order.orderType) },
      { label: "Expo Name", value: order.expoName ?? order.referenceId },
      { label: "Booth Reference", value: order.boothRef ?? "Not specified" },
      { label: "Tier", value: order.boothTier ?? "Not specified" },
    ]
  }

  return [
    { label: "Order Type", value: getOrderTypeLabel(order.orderType) },
    { label: "Reference", value: order.expoName ?? order.referenceId },
    { label: "Reference ID", value: order.referenceId },
  ]
}

export function CustomerOrderDetail({
  order,
  transactionLog,
}: {
  order: Order
  transactionLog: TransactionLogEntry[]
}) {
  const router = useRouter()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const banner = bannerForStatus(order.status)
  const hasExpiryCountdown =
    order.status === "Pending Payment" && Boolean(order.expiresAt)
  const remainingMs = hasExpiryCountdown
    ? new Date(order.expiresAt as string).getTime() - nowMs
    : null
  const sortedLog = useMemo(
    () =>
      [...transactionLog].sort(
        (a, b) =>
          new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime(),
      ),
    [transactionLog],
  )

  useEffect(() => {
    if (!hasExpiryCountdown) return
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [hasExpiryCountdown])

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to orders"
          onClick={() => router.push("/seller/orders")}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold text-lg">{order.id}</span>
            <OrderStatusBadge status={order.status} />
            <Badge variant="outline" className="text-xs uppercase">
              {order.paymentMethod}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Created {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div
        className={cn("rounded-lg border px-4 py-3 text-sm", banner.className)}
      >
        <div className="font-medium">{banner.message}</div>
        {remainingMs !== null ? (
          <div className="mt-1">
            Remaining time before payment expiry: {formatRemaining(remainingMs)}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
            Reference
          </h2>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            {referenceRows(order).map((row) => (
              <Fragment key={row.label}>
                <span className="text-muted-foreground">{row.label}</span>
                <span>{row.value}</span>
              </Fragment>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
            Payment Result
          </h2>
          <p className="text-sm">{resultMessage(order)}</p>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Payment Method</span>
            <span>VNPay</span>

            <span className="text-muted-foreground">Current Status</span>
            <span>{getOrderStatusLabel(order.status)}</span>

            {order.paidAt ? (
              <>
                <span className="text-muted-foreground">Paid Date</span>
                <span>{formatDate(order.paidAt)}</span>
              </>
            ) : null}
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
          Amount
        </h2>
        <div className="grid gap-y-3 text-sm sm:grid-cols-2">
          <span className="text-muted-foreground">Original Amount</span>
          <span className="font-medium">{formatVND(order.originalAmount)}</span>

          <span className="text-muted-foreground">Discount</span>
          <span className="font-medium">
            {order.discountAmount > 0
              ? `-${formatVND(order.discountAmount)}`
              : formatVND(0)}
          </span>

          <span className="text-muted-foreground">Final Amount</span>
          <span className="font-semibold">{formatVND(order.amount)}</span>
        </div>
      </section>

      <section className="rounded-lg border p-5">
        <h2 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
          Status History
        </h2>
        {sortedLog.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No status history recorded.
          </p>
        ) : (
          <ol className="space-y-0">
            {sortedLog.map((entry, index) => (
              <li key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "mt-1 size-2.5 shrink-0 rounded-full",
                      statusDotClass(entry.status),
                    )}
                  />
                  {index < sortedLog.length - 1 ? (
                    <div className="mt-1 w-px grow bg-border" />
                  ) : null}
                </div>
                <div className="pb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">
                      {getOrderStatusLabel(entry.status)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(entry.processedAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {entry.actor}
                    {entry.note ? ` - ${entry.note}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
