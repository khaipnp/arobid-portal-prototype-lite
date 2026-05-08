import { NotificationsPageContent } from "@/components/notifications/notifications-page-content"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

export default function UserNotificationsPage() {
  return (
    <DashboardShell
      title="Notifications"
      description="Updates and alerts for your workspace activity."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Notifications" },
      ]}
    >
      <NotificationsPageContent userId={CURRENT_USER_ID} />
    </DashboardShell>
  )
}
