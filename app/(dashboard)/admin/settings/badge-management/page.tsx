import { BadgeManagementConfig } from "@/components/badges/badge-management-config"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function AdminBadgeManagementPage() {
  return (
    <DashboardShell
      title="Badge Management"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Settings" },
        { label: "Badge Management" }
      ]}
    >
      <BadgeManagementConfig />
    </DashboardShell>
  )
}
