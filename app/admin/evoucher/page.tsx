import { EVoucherManagement } from "@/components/evoucher/evoucher-management"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function EVoucherPage() {
  return (
    <DashboardShell
      title="eVoucher Management"
      description="Issue and manage discount voucher batches. Assign batches to Partners for redistribution to businesses."
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "eVoucher" }]}
    >
      <EVoucherManagement />
    </DashboardShell>
  )
}
