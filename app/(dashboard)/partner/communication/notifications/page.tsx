import { NotificationsSheetEntry } from "@/components/notifications/notifications-sheet-entry"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function PartnerNotificationsPage() {
  return (
    <DashboardShell
      title="Notifications"
      breadcrumbs={[{ label: "Communication" }, { label: "Notifications" }]}
    >
      <NotificationsSheetEntry />
    </DashboardShell>
  )
}
