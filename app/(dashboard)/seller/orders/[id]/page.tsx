import { notFound } from "next/navigation"
import { CustomerOrderDetail } from "@/components/orders/customer-order-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireAnyRole } from "@/lib/auth/rbac"
import {
  getCustomerOrder,
  listCustomerTransactionLogForOrder
} from "@/lib/orders/db"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function CustomerOrderDetailPage({ params }: Props) {
  const { id } = await params
  const userId = await requireAnyRole(["seller", "buyer"])
  const order = await getCustomerOrder(id, userId)
  if (!order) notFound()

  const transactionLog = await listCustomerTransactionLogForOrder(id, userId)

  return (
    <DashboardShell
      title="Order Detail"
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Orders", href: "/seller/orders" },
        { label: id }
      ]}
    >
      <CustomerOrderDetail order={order} transactionLog={transactionLog} />
    </DashboardShell>
  )
}
