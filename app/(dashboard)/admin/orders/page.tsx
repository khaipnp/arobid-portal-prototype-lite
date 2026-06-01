import { OrderManagementDashboard } from "@/components/orders/order-management-dashboard";
import { DashboardShell } from "@/components/tradexpo/dashboard-shell";
import { listOrders } from "@/lib/orders/db";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const initialOrders = await listOrders();

  return (
    <DashboardShell
      title="Order Management"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Orders" }]}
    >
      <OrderManagementDashboard initialOrders={initialOrders} />
    </DashboardShell>
  );
}
