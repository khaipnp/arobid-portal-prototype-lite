import { notFound } from "next/navigation"
import { CustomerOrderDetail } from "@/components/orders/customer-order-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import {
  getCustomerOrder,
  listCustomerTransactionLogForOrder,
} from "@/lib/orders/db"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function CustomerOrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getCustomerOrder(id, CURRENT_USER_ID)
  if (!order) notFound()

  const transactionLog = await listCustomerTransactionLogForOrder(
    id,
    CURRENT_USER_ID,
  )

  return (
    <DashboardShell
      title="Order Detail"
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Orders", href: "/seller/orders" },
        { label: id },
      ]}
    >
      <CustomerOrderDetail order={order} transactionLog={transactionLog} />
    </DashboardShell>
  )
}
