import { OrderDetail } from "@/components/orders/order-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <DashboardShell
      title="Order Detail"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Orders", href: "/admin/orders" },
        { label: id },
      ]}
    >
      <OrderDetail orderId={id} />
    </DashboardShell>
  )
}
