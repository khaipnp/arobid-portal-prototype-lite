import { BankAccountManager } from "@/components/orders/bank-account-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function BankAccountsPage() {
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
      <BankAccountManager />
    </DashboardShell>
  )
}
