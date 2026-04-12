import { OrderManagementDashboard } from "@/components/orders/order-management-dashboard"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function OrdersPage() {
  return (
    <DashboardShell
      title="Order Management"
      description="Monitor all platform orders, filter by status, and reconcile bank transfer payments."
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Orders" }]}
    >
      <OrderManagementDashboard />
    </DashboardShell>
  )
}
