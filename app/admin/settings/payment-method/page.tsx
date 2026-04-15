import { PaymentMethodConfig } from "@/components/orders/payment-method-config"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import {
  getPlatformPaymentConfig,
  listBankAccounts,
  listExpoPaymentConfigs,
} from "@/lib/orders/db"
import { listExpos } from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function PaymentMethodPage() {
  const [initialPlatformPayment, bankAccounts, expoPaymentConfigs, expos] =
    await Promise.all([
      getPlatformPaymentConfig(),
      listBankAccounts(),
      listExpoPaymentConfigs(),
      listExpos(),
    ])

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
      <PaymentMethodConfig
        initialPlatformPayment={initialPlatformPayment}
        bankAccounts={bankAccounts}
        expoPaymentConfigs={expoPaymentConfigs}
        totalExpoCount={expos.length}
      />
    </DashboardShell>
  )
}
