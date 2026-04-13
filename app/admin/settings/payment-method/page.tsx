import { PaymentMethodConfig } from "@/components/orders/payment-method-config"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function PaymentMethodPage() {
  return (
    <DashboardShell
      title="Platform Default Payment"
      description="Configure the default payment methods for B2B Marketplace purchases and all Expos that have not been individually configured."
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
