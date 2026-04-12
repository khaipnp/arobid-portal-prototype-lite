import { PaymentMethodConfig } from "@/components/orders/payment-method-config"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function PaymentMethodPage() {
  return (
    <DashboardShell
      title="Payment Method"
      description="Configure the active payment method for all customer checkouts."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Settings", href: "/admin/settings/payment-method" },
        { label: "Payment Method" },
      ]}
    >
      <PaymentMethodConfig />
    </DashboardShell>
  )
}
