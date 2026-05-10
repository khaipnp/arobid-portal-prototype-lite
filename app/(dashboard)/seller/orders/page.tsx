import { CustomerOrderHistory } from "@/components/orders/customer-order-history"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireAnyRole } from "@/lib/auth/rbac"
import { listCustomerOrders } from "@/lib/orders/db"

export const dynamic = "force-dynamic"

export default async function CustomerOrdersPage() {
  const userId = await requireAnyRole(["seller", "buyer"])
  const initialOrders = await listCustomerOrders(userId)

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
