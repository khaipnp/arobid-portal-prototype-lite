import { NotificationsSheetEntry } from "@/components/notifications/notifications-sheet-entry"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function UserNotificationsPage() {
  return (
    <DashboardShell
      title="Notifications"
      description="Updates and alerts for your workspace activity."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Notifications" }
      ]}
    >
      <NotificationsSheetEntry description="Notifications now open in a right-side sheet from the header bell, so you can keep context while checking updates." />
    </DashboardShell>
  )
}
