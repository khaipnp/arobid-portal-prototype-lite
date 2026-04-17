"use client"

import {
  AlertCircleIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  FilterXIcon,
  SearchIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  getOrderStatusLabel,
  OrderStatusBadge,
} from "@/components/orders/order-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  type DateRange,
  DateRangePicker,
} from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  Order,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "@/lib/tradexpo/types"

const PAGE_SIZE = 20
const FILTERS_SESSION_KEY = "admin-order-management-filters"

const ALL_STATUSES: OrderStatus[] = [
  "Pending Payment",
  "Awaiting Confirmation",
  "Paid",
  "Failed",
  "Cancelled",
  "Expired",
  "Rejected",
]

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

export function OrderManagementDashboard({
  initialOrders,
}: {
  initialOrders: Order[]
}) {
  const router = useRouter()
  const [orders] = useState<Order[]>(() =>
    [...initialOrders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  )

  const [search, setSearch] = useState("")
  const [statusFilters, setStatusFilters] = useState<OrderStatus[]>([])
  const [methodFilter, setMethodFilter] = useState<"all" | PaymentMethod>("all")
  const [typeFilter, setTypeFilter] = useState<"all" | OrderType>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [page, setPage] = useState(1)

  useEffect(() => {
    const raw = sessionStorage.getItem(FILTERS_SESSION_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as {
        search?: string
        statusFilters?: OrderStatus[]
        methodFilter?: "all" | PaymentMethod
        typeFilter?: "all" | OrderType
        dateFrom?: string
        dateTo?: string
      }
      setSearch(parsed.search ?? "")
      setStatusFilters(
        Array.isArray(parsed.statusFilters) ? parsed.statusFilters : [],
      )
      setMethodFilter(parsed.methodFilter ?? "all")
      setTypeFilter(parsed.typeFilter ?? "all")
      if (parsed.dateFrom || parsed.dateTo) {
        setDateRange({
          from: parsed.dateFrom ? new Date(parsed.dateFrom) : undefined,
          to: parsed.dateTo ? new Date(parsed.dateTo) : undefined,
        })
      }
    } catch {
      // Ignore invalid stored filters.
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(
      FILTERS_SESSION_KEY,
      JSON.stringify({
        search,
        statusFilters,
        methodFilter,
        typeFilter,
        dateFrom: dateRange?.from?.toISOString(),
        dateTo: dateRange?.to?.toISOString(),
      }),
    )
  }, [search, statusFilters, methodFilter, typeFilter, dateRange])

  const awaitingCount = orders.filter(
    (o) => o.status === "Awaiting Confirmation",
  ).length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter((o) => {
      if (
        q &&
        !o.id.toLowerCase().includes(q) &&
        !o.customerName.toLowerCase().includes(q) &&
        !o.customerEmail.toLowerCase().includes(q)
      )
        return false
      if (statusFilters.length > 0 && !statusFilters.includes(o.status))
        return false
      if (methodFilter !== "all" && o.paymentMethod !== methodFilter)
        return false
      if (typeFilter !== "all" && o.orderType !== typeFilter) return false
      if (dateRange?.from && o.createdAt < dateRange.from.toISOString())
        return false
      if (dateRange?.to) {
        const toEnd = new Date(dateRange.to)
        toEnd.setHours(23, 59, 59, 999)
        if (o.createdAt > toEnd.toISOString()) return false
      }
      return true
    })
  }, [orders, search, statusFilters, methodFilter, typeFilter, dateRange])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  function handleFilterChange() {
    setPage(1)
  }

  const selectedStatusLabel =
    statusFilters.length === 0
      ? "All statuses"
      : statusFilters.length === 1
        ? getOrderStatusLabel(statusFilters[0])
        : `${statusFilters.length} statuses`

  return (
    <div className="space-y-4">
      {awaitingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>
            <strong>{awaitingCount}</strong>{" "}
            {awaitingCount === 1 ? "order" : "orders"} awaiting —
            review and reconcile with your bank statement.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID or customer…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              handleFilterChange()
            }}
            className="pl-8"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-56 justify-between font-normal"
            >
              <span className="truncate">{selectedStatusLabel}</span>
              <ChevronsUpDownIcon className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 space-y-2 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-xs uppercase tracking-wide">
                Status
              </span>
              {statusFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setStatusFilters([])
                    handleFilterChange()
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            {ALL_STATUSES.map((status) => {
              const checked = statusFilters.includes(status)
              return (
                <label
                  key={status}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) => {
                      setStatusFilters((prev) => {
                        if (nextChecked) return [...prev, status]
                        return prev.filter((s) => s !== status)
                      })
                      handleFilterChange()
                    }}
                  />
                  <span className="flex-1">{getOrderStatusLabel(status)}</span>
                  {checked && <CheckIcon className="size-3.5 text-primary" />}
                </label>
              )
            })}
          </PopoverContent>
        </Popover>

        <Select
          value={methodFilter}
          onValueChange={(v) => {
            setMethodFilter(v as typeof methodFilter)
            handleFilterChange()
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="vnpay">VNPay</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v as typeof typeFilter)
            handleFilterChange()
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="booth_registration">
              Booth Registration
            </SelectItem>
            <SelectItem value="b2b_subscription">B2B Subscription</SelectItem>
          </SelectContent>
        </Select>

        <DateRangePicker
          value={dateRange}
          onChange={(r) => {
            setDateRange(r)
            handleFilterChange()
          }}
          placeholder="Date range"
          className="w-64"
        />

        {(search ||
          statusFilters.length > 0 ||
          methodFilter !== "all" ||
          typeFilter !== "all" ||
          dateRange) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearch("")
              setStatusFilters([])
              setMethodFilter("all")
              setTypeFilter("all")
              setDateRange(undefined)
              setPage(1)
            }}
          >
            <FilterXIcon />
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Partner Name</TableHead>
              <TableHead>Order Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-muted-foreground"
                >
                  No orders match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((order) => (
                <TableRow
                  key={order.id}
                  className={
                    order.status === "Awaiting Confirmation"
                      ? "bg-amber-50/60 dark:bg-amber-900/10"
                      : undefined
                  }
                >
                  <TableCell className="font-medium font-mono text-xs">
                    {order.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {order.customerName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {order.customerEmail}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.partnerName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.orderType === "booth_registration"
                      ? "Booth Registration"
                      : "B2B Subscription"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{order.expoName}</div>
                    <div className="text-muted-foreground text-xs">
                      {order.boothRef} · {order.boothTier}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm tabular-nums">
                    {formatVND(order.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {order.paymentMethod === "vnpay"
                        ? "VNPay"
                        : "Bank Transfer"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span>
            {filtered.length} order{filtered.length !== 1 ? "s" : ""} · page{" "}
            {currentPage} of {totalPages}
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
      )}
    </div>
  )
}
