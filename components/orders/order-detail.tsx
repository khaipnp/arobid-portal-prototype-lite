"use client"

import {
  ArrowLeftIcon,
  CopyIcon,
  DownloadIcon,
  MailCheckIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  getOrderStatusLabel,
  OrderStatusBadge,
} from "@/components/orders/order-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
  InvoiceStatus,
  Order,
  OrderStatus,
  TransactionLogEntry,
} from "@/lib/tradexpo/types"

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

function statusColor(status: OrderStatus): string {
  if (status === "Paid") return "text-emerald-600"
  if (status === "Failed") return "text-rose-600"
  return "text-muted-foreground"
}

function getInvoiceStatusAppearance(status: InvoiceStatus) {
  switch (status) {
    case "not_requested":
      return { label: "Not requested", className: "text-zinc-600" }
    case "requested_pending_payment":
      return { label: "Pending payment", className: "text-zinc-600" }
    case "requested_paid":
      return { label: "Ready to export", className: "text-amber-700" }
    case "exported":
      return { label: "Exported", className: "text-sky-700" }
    case "issued":
      return { label: "Issued", className: "text-violet-700" }
    case "sent":
      return { label: "Sent", className: "text-emerald-700" }
  }
}

interface OrderDetailProps {
  orderId: string
  initialOrder: Order
  initialTransactionLog: TransactionLogEntry[]
}

export function OrderDetail({
  orderId,
  initialOrder,
  initialTransactionLog,
}: OrderDetailProps) {
  const router = useRouter()
  const [order, setOrder] = useState<Order>(() => initialOrder)
  const [log, setLog] = useState<TransactionLogEntry[]>(() =>
    [...initialTransactionLog].sort(
      (a, b) =>
        new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime(),
    ),
  )
  const [toast, setToast] = useState<string | null>(null)
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function processInvoiceAction(action: "export" | "issue" | "send") {
    try {
      setIsProcessingInvoice(true)
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!response.ok) {
        throw new Error("Unable to update invoice")
      }
      const data = (await response.json()) as {
        order: Order
        logEntry: TransactionLogEntry
      }
      setOrder(data.order)
      setLog((prev) =>
        [...prev, data.logEntry].sort(
          (a, b) =>
            new Date(a.processedAt).getTime() -
            new Date(b.processedAt).getTime(),
        ),
      )
      showToast(
        action === "export"
          ? "Invoice data exported."
          : action === "issue"
            ? "Invoice marked as issued."
            : "Invoice marked as sent.",
      )
    } catch {
      showToast("Unable to update invoice request.")
    } finally {
      setIsProcessingInvoice(false)
    }
  }

  async function copyBillingInfo() {
    const snapshot = order.billingInfoSnapshot
    if (!snapshot) return
    const lines = [
      snapshot.companyName ? `Company: ${snapshot.companyName}` : null,
      snapshot.fullName ? `Name: ${snapshot.fullName}` : null,
      `Invoice email: ${snapshot.invoiceEmail}`,
      `Tax code: ${snapshot.taxCode}`,
      `Address: ${snapshot.address}`,
      snapshot.phoneNumber ? `Phone: ${snapshot.phoneNumber}` : null,
    ].filter(Boolean)

    await navigator.clipboard.writeText(lines.join("\n"))
    showToast("Billing information copied.")
  }

  const invoiceAppearance = getInvoiceStatusAppearance(order.invoiceStatus)

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/orders")}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-lg">
                {order.id}
              </span>
              <OrderStatusBadge status={order.status} />
              <Badge variant="outline" className="text-xs">
                VNPay
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Created {formatDate(order.createdAt)}
              {order.expiresAt && order.status === "Pending Payment" && (
                <> · Expires {formatDate(order.expiresAt)}</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Info */}
        <div className="space-y-4 rounded-lg border p-5">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
            Order Information
          </h2>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Order Type</span>
            <span className="capitalize">
              {order.orderType === "booth_registration"
                ? "Booth Registration"
                : "B2B Subscription"}
            </span>

            <span className="text-muted-foreground">Reference</span>
            <span>{order.expoName}</span>

            <span className="text-muted-foreground">Booth Reference</span>
            <span>{order.boothRef}</span>

            <span className="text-muted-foreground">Booth Tier</span>
            <span>{order.boothTier}</span>

            {order.partnerName && (
              <>
                <span className="text-muted-foreground">Partner Name</span>
                <span>{order.partnerName}</span>
              </>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-4 rounded-lg border p-5">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
            Customer
          </h2>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Name</span>
            <span>{order.customerName}</span>

            <span className="text-muted-foreground">Email</span>
            <span className="break-all">{order.customerEmail}</span>

            <span className="text-muted-foreground">Company</span>
            <span>{order.customerCompany}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
          Amount Breakdown
        </h2>
        <div className="grid gap-y-3 text-sm sm:grid-cols-2">
          <span className="text-muted-foreground">Original Amount</span>
          <span className="font-medium">{formatVND(order.originalAmount)}</span>

          {order.discountAmount > 0 && (
            <>
              <span className="text-muted-foreground">Số tiền giảm trừ</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                -{formatVND(order.discountAmount)}
              </span>
            </>
          )}

          <span className="text-muted-foreground">Final Amount Paid</span>
          <span className="font-semibold">{formatVND(order.amount)}</span>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
            Invoice Request
          </h2>
          <Badge
            variant="outline"
            className={`text-xs ${invoiceAppearance.className}`}
          >
            {invoiceAppearance.label}
          </Badge>
        </div>

        {!order.invoiceRequested || !order.billingInfoSnapshot ? (
          <p className="text-muted-foreground text-sm">
            Customer did not request an invoice for this order.
          </p>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Invoice type</span>
                <span className="capitalize">{order.invoiceType}</span>

                <span className="text-muted-foreground">Paid date</span>
                <span>{order.paidAt ? formatDate(order.paidAt) : "—"}</span>

                <span className="text-muted-foreground">Invoice email</span>
                <span className="break-all">
                  {order.billingInfoSnapshot.invoiceEmail}
                </span>

                <span className="text-muted-foreground">Tax code (MST)</span>
                <span>{order.billingInfoSnapshot.taxCode}</span>
              </div>

              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">
                  {order.invoiceType === "business" ? "Company" : "Full name"}
                </span>
                <span>
                  {order.billingInfoSnapshot.companyName ??
                    order.billingInfoSnapshot.fullName}
                </span>

                <span className="text-muted-foreground">Address</span>
                <span>{order.billingInfoSnapshot.address}</span>

                <span className="text-muted-foreground">Phone</span>
                <span>{order.billingInfoSnapshot.phoneNumber ?? "—"}</span>
              </div>
            </div>

            <div className="grid gap-2 rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Exported</span>
                <span>
                  {order.exportedAt
                    ? `${formatDate(order.exportedAt)} · ${order.exportedBy}`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Issued</span>
                <span>
                  {order.issuedAt
                    ? `${formatDate(order.issuedAt)} · ${order.issuedBy}`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Sent</span>
                <span>
                  {order.sentAt
                    ? `${formatDate(order.sentAt)} · ${order.sentBy}`
                    : "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={copyBillingInfo}>
                <CopyIcon className="size-4" />
                Copy billing info
              </Button>
              <Button
                onClick={() => processInvoiceAction("export")}
                disabled={
                  isProcessingInvoice ||
                  order.status !== "Paid" ||
                  order.invoiceStatus !== "requested_paid"
                }
              >
                <DownloadIcon className="size-4" />
                Export invoice data
              </Button>
              <Button
                variant="outline"
                onClick={() => processInvoiceAction("issue")}
                disabled={
                  isProcessingInvoice || order.invoiceStatus !== "exported"
                }
              >
                Mark as issued
              </Button>
              <Button
                variant="outline"
                onClick={() => processInvoiceAction("send")}
                disabled={
                  isProcessingInvoice || order.invoiceStatus !== "issued"
                }
              >
                <MailCheckIcon className="size-4" />
                Mark as sent
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Transaction Log */}
      <div className="rounded-lg border p-5">
        <h2 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
          Transaction Log
        </h2>
        {log.length === 0 ? (
          <p className="text-muted-foreground text-sm">No log entries yet.</p>
        ) : (
          <ol className="space-y-0">
            {log.map((entry, i) => (
              <li key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`mt-1 size-2.5 shrink-0 rounded-full ${
                      entry.status === "Paid"
                        ? "bg-emerald-500"
                        : entry.status === "Failed"
                          ? "bg-rose-500"
                          : "bg-zinc-400"
                    }`}
                  />
                  {i < log.length - 1 && (
                    <div className="mt-1 w-px grow bg-border" />
                  )}
                </div>
                <div className="pb-5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium text-sm ${statusColor(entry.status)}`}
                    >
                      {getOrderStatusLabel(entry.status)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      · {formatDate(entry.processedAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {entry.actor}
                    {entry.note && ` — ${entry.note}`}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-50 max-w-sm rounded-lg border bg-background px-4 py-3 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
