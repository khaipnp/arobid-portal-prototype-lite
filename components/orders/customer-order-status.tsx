import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

export type CustomerOrderStatus = "Pending Payment" | "Paid" | "Cancel"

const customerOrderStatusStyles: Record<CustomerOrderStatus, string> = {
  "Pending Payment":
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  Paid: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  Cancel:
    "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
}

const customerOrderStatusLabels: Record<CustomerOrderStatus, string> = {
  "Pending Payment": "Pending Payment",
  Paid: "Paid",
  Cancel: "Cancel"
}

export function mapOrderStatusForCustomer(
  status: OrderStatus
): CustomerOrderStatus {
  if (status === "Pending Payment" || status === "Paid") {
    return status
  }
  return "Cancel"
}

export function getCustomerOrderStatusLabel(status: CustomerOrderStatus) {
  return customerOrderStatusLabels[status]
}

export function CustomerOrderStatusBadge({
  status
}: {
  status: OrderStatus | CustomerOrderStatus
}) {
  const normalizedStatus =
    status === "Pending Payment" || status === "Paid" || status === "Cancel"
      ? status
      : "Cancel"

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto py-0.5 text-xs",
        customerOrderStatusStyles[normalizedStatus]
      )}
    >
      {getCustomerOrderStatusLabel(normalizedStatus)}
    </Badge>
  )
}
