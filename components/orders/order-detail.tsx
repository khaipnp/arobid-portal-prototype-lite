"use client"

import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
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
  if (status === "Awaiting Confirmation") return "text-amber-600"
  if (status === "Failed" || status === "Rejected") return "text-rose-600"
  return "text-muted-foreground"
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function handleConfirm() {
    if (!order) return
    const now = new Date().toISOString()
    const updated: Order = { ...order, status: "Paid", updatedAt: now }
    setOrder(updated)
    setLog((prev) => [
      ...prev,
      {
        id: `tx-${orderId}-confirm`,
        orderId,
        type: "payment",
        status: "Paid",
        actor: "Admin (admin@arobid.com)",
        note: "Payment confirmed after bank statement verification",
        processedAt: now,
      },
    ])
    setShowConfirmDialog(false)
    showToast("Payment confirmed. Customer has been notified.")
  }

  function handleReject() {
    if (!order || !rejectionReason.trim()) return
    const now = new Date().toISOString()
    const expiresAt = new Date(
      new Date(now).getTime() + 72 * 3600_000,
    ).toISOString()
    const updated: Order = {
      ...order,
      status: "Pending Payment",
      expiresAt,
      updatedAt: now,
    }
    setOrder(updated)
    setLog((prev) => [
      ...prev,
      {
        id: `tx-${orderId}-reject`,
        orderId,
        type: "payment",
        status: "Rejected",
        actor: "Admin (admin@arobid.com)",
        rejectionReason: rejectionReason.trim(),
        processedAt: now,
      },
      {
        id: `tx-${orderId}-retry`,
        orderId,
        type: "status_change",
        status: "Pending Payment",
        actor: "System",
        note: "Order reverted to Pending Payment — 72h retry window started",
        processedAt: now,
      },
    ])
    setShowRejectDialog(false)
    setRejectionReason("")
    showToast("Payment rejected. Customer has been notified and can retry.")
  }

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
            </div>
            <p className="text-muted-foreground text-sm">
              Created {formatDate(order.createdAt)}
              {order.expiresAt &&
                (order.status === "Pending Payment" ||
                  order.status === "Awaiting Confirmation") && (
                  <> · Expires {formatDate(order.expiresAt)}</>
                )}
            </p>
          </div>
        </div>

        {order.status === "Awaiting Confirmation" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircleIcon className="size-4" />
              Reject Payment
            </Button>
            <Button onClick={() => setShowConfirmDialog(true)}>
              <CheckCircleIcon className="size-4" />
              Confirm Payment
            </Button>
          </div>
        )}
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
              {order.orderType.replace("_", " ")}
            </span>

            <span className="text-muted-foreground">Expo</span>
            <span>{order.expoName}</span>

            <span className="text-muted-foreground">Booth Reference</span>
            <span>{order.boothRef}</span>

            <span className="text-muted-foreground">Booth Tier</span>
            <span>{order.boothTier}</span>

            <span className="text-muted-foreground">Payment Method</span>
            <Badge variant="outline" className="w-fit text-xs">
              {order.paymentMethod === "vnpay" ? "VNPay" : "Bank Transfer"}
            </Badge>

            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatVND(order.amount)}</span>
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
                        : entry.status === "Awaiting Confirmation"
                          ? "bg-amber-400"
                          : entry.status === "Failed" ||
                              entry.status === "Rejected"
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
                      {entry.status}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      · {formatDate(entry.processedAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {entry.actor}
                    {entry.note && ` — ${entry.note}`}
                  </p>
                  {entry.rejectionReason && (
                    <p className="mt-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700 text-xs dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
                      Reason: {entry.rejectionReason}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Confirm Payment Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm payment of <strong>{formatVND(order.amount)}</strong> for
              order <strong>{order.id}</strong>? This will mark the order as{" "}
              <strong>Paid</strong> and notify the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Payment Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">
              Rejecting order <strong>{order.id}</strong> will revert the booth
              to Available and notify the customer. They can retry within a
              fresh 72-hour window.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="rejection-reason">
                Rejection reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g. No matching transfer found for this order."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-50 max-w-sm rounded-lg border bg-background px-4 py-3 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
