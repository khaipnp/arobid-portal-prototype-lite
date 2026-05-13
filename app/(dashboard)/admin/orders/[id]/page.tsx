import { notFound } from "next/navigation"
import { OrderDetail } from "@/components/orders/order-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getOrderById, listTransactionLogForOrder } from "@/lib/orders/db"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getOrderById(id)
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
