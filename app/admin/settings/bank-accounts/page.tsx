import { BankAccountManager } from "@/components/orders/bank-account-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getPlatformPaymentConfig, listBankAccounts } from "@/lib/orders/db"

export const dynamic = "force-dynamic"

export default async function BankAccountsPage() {
  const [initialBankAccounts, payment] = await Promise.all([
    listBankAccounts(),
    getPlatformPaymentConfig(),
  ])

  return (
    <DashboardShell
      title="Bank Accounts"
      description="Manage bank accounts for VietQR Bank Transfer checkout."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Settings", href: "/admin/settings/payment-method" },
        { label: "Bank Accounts" },
      ]}
    >
      <BankAccountManager
        initialBankAccounts={initialBankAccounts}
        bankTransferEnabled={payment.bankTransferEnabled}
      />
    </DashboardShell>
  )
}
