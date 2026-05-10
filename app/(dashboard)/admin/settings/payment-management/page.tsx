import { PaymentMethodConfig } from "@/components/orders/payment-method-config"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import {
  getPlatformPaymentConfig,
  listExpoPaymentConfigs
} from "@/lib/orders/db"
import { countExpos } from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function PaymentMethodPage() {
  const [initialPlatformPayment, expoPaymentConfigs, totalExpoCount] =
    await Promise.all([
      getPlatformPaymentConfig(),
      listExpoPaymentConfigs(),
      countExpos()
    ])

  return (
    <DashboardShell
      title="Payment Management"
      description="Configure platform-level payment methods for marketplace and Expo checkout."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Payment Management" }
      ]}
    >
      <PaymentMethodConfig
        initialPlatformPayment={initialPlatformPayment}
        expoPaymentConfigs={expoPaymentConfigs}
        totalExpoCount={totalExpoCount}
      />
    </DashboardShell>
  )
}
