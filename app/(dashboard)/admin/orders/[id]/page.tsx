import { notFound } from "next/navigation"
import { OrderDetail } from "@/components/orders/order-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { listOrders, listTransactionLogForOrder } from "@/lib/orders/db"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const orders = await listOrders()
  const order = orders.find((o) => o.id === id)
  if (!order) notFound()

  const initialTransactionLog = await listTransactionLogForOrder(id)

  return (
    <DashboardShell
      title="Order Detail"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Orders", href: "/admin/orders" },
        { label: id }
      ]}
      showBackButton
    >
      <OrderDetail
        orderId={id}
        initialOrder={order}
        initialTransactionLog={initialTransactionLog}
      />
    </DashboardShell>
  )
}
