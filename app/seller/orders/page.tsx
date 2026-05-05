import { CustomerOrderHistory } from "@/components/orders/customer-order-history"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { listCustomerBoothRegistrationOrders } from "@/lib/orders/db"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

export const dynamic = "force-dynamic"

export default async function CustomerOrdersPage() {
  const initialOrders =
    await listCustomerBoothRegistrationOrders(CURRENT_USER_ID)

  return (
    <DashboardShell
      title="Order History"
      description="Track your TradeXpo booth-registration orders and VNPay payment outcomes."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Orders" },
      ]}
    >
      <CustomerOrderHistory initialOrders={initialOrders} />
    </DashboardShell>
  )
}
