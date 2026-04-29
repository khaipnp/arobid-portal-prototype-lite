import { PaymentMethodConfig } from "@/components/orders/payment-method-config"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { listExpoPaymentConfigs } from "@/lib/orders/db"
import { countExpos } from "@/lib/tradexpo/db/platform-data"
import { getPlatformPaymentConfig } from "@/lib/orders/db"

export const dynamic = "force-dynamic"

export default async function PaymentMethodPage() {
  const [initialPlatformPayment, expoPaymentConfigs, totalExpoCount] =
    await Promise.all([
      getPlatformPaymentConfig(),
      listExpoPaymentConfigs(),
      countExpos(),
    ])

  return (
    <DashboardShell
      title="Payment Settings"
      description="Configure platform-level payment methods for marketplace and Expo checkout."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Payment Settings" },
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
