import { NotificationsPageContent } from "@/components/notifications/notifications-page-content"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function PartnerNotificationsPage() {
  return (
    <DashboardShell
      title="Notifications"
      description="Updates and alerts for partner portal operations."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Notifications" }
      ]}
    >
      <NotificationsPageContent />
    </DashboardShell>
  )
}
