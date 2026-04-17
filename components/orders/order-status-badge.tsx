import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

const statusStyles: Record<OrderStatus, string> = {
  "Pending Payment":
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  "Awaiting Confirmation":
    "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  Paid: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  Failed:
    "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
  Cancelled:
    "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  Expired:
    "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  Rejected:
    "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
}

const statusLabels: Record<OrderStatus, string> = {
  "Pending Payment": "Pending",
  "Awaiting Confirmation": "Awaiting",
  Paid: "Paid",
  Failed: "Failed",
  Cancelled: "Cancelled",
  Expired: "Expired",
  Rejected: "Rejected",
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return statusLabels[status]
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("h-auto py-0.5 text-xs", statusStyles[status])}
    >
      {getOrderStatusLabel(status)}
    </Badge>
  )
}
