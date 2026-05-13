"use client"

import { ChevronRightIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  type CustomerOrderStatus,
  CustomerOrderStatusBadge,
  getCustomerOrderStatusLabel,
  mapOrderStatusForCustomer
} from "@/components/orders/customer-order-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { Order, OrderType } from "@/lib/tradexpo/types"

const PAGE_SIZE = 20
const ALL_STATUSES: Array<"All" | CustomerOrderStatus> = [
  "All",
  "Pending Payment",
  "Paid",
  "Cancel"
]

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "Expired"
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `Payment expires in ${hours}h ${String(minutes).padStart(2, "0")}m`
  }

  return `Payment expires in ${String(minutes).padStart(2, "0")}m ${String(
    seconds
  ).padStart(2, "0")}s`
}

function getRemainingMs(order: Order, nowMs: number) {
  if (order.status !== "Pending Payment" || !order.expiresAt) return null
  return new Date(order.expiresAt).getTime() - nowMs
}

function getOrderTypeLabel(orderType: OrderType) {
  if (orderType === "booth_registration") return "TradeXpo Booth"
  return "B2B Package"
}

function getReferenceText(order: Order) {
  if (order.orderType === "booth_registration") {
    const boothParts = [order.boothRef, order.boothTier].filter(Boolean)
    return {
      primary: order.expoName ?? order.referenceId,
      secondary:
        boothParts.length > 0 ? boothParts.join(" · ") : order.referenceId
    }
  }

  return {
    primary: order.expoName ?? getOrderTypeLabel(order.orderType),
    secondary: order.referenceId
  }
}

export function CustomerOrderHistory({
  initialOrders
}: {
  initialOrders: Order[]
}) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<"All" | CustomerOrderStatus>(
    "All"
  )
  const [page, setPage] = useState(1)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === "All") return initialOrders
    return initialOrders.filter(
      (order) => mapOrderStatusForCustomer(order.status) === statusFilter
    )
  }, [initialOrders, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function openOrder(orderId: string) {
    router.push(`/seller/orders/${orderId}`)
  }

  return (
    <div className="space-y-4 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as "All" | CustomerOrderStatus)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "All"
                  ? "All statuses"
                  : getCustomerOrderStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">
          {filtered.length} order{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Order Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  No orders match the selected status.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((order) => {
                const remainingMs = getRemainingMs(order, nowMs)
                const reference = getReferenceText(order)
                return (
                  <TableRow
                    key={order.id}
                    tabIndex={0}
                    role="link"
                    className="cursor-pointer"
                    onClick={() => openOrder(order.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openOrder(order.id)
                      }
                    }}
                  >
                    <TableCell className="font-medium font-mono text-xs">
                      {order.id}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getOrderTypeLabel(order.orderType)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{reference.primary}</div>
                      <div className="text-muted-foreground text-xs">
                        {reference.secondary}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm tabular-nums">
                      {formatVND(order.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs uppercase">
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CustomerOrderStatusBadge status={order.status} />
                      {remainingMs !== null ? (
                        <div className="mt-1 whitespace-nowrap text-muted-foreground text-xs">
                          {formatRemaining(remainingMs)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <ChevronRightIcon className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
