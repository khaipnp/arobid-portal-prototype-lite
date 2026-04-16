import { NotificationsPageContent } from "@/components/notifications/notifications-page-content"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function SellerNotificationsPage() {
  return (
    <DashboardShell
      title="Notifications"
      description="Updates and alerts for your supplier activity."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Notifications" },
      ]}
    >
      <NotificationsPageContent userId="seller-1" />
    </DashboardShell>
  )
}
