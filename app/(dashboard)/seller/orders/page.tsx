import { CustomerOrderHistory } from "@/components/orders/customer-order-history"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { listCustomerOrders } from "@/lib/orders/db"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

export const dynamic = "force-dynamic"

export default async function CustomerOrdersPage() {
  const initialOrders = await listCustomerOrders(CURRENT_USER_ID)

  return (
    <DashboardShell
      title="Order History"
      description="Track orders you placed on Arobid and review payment outcomes."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Orders" }
      ]}
    >
      <CustomerOrderHistory initialOrders={initialOrders} />
    </DashboardShell>
  )
}
