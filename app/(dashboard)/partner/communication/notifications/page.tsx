import { NotificationsPageContent } from "@/components/notifications/notifications-page-content";
import { DashboardShell } from "@/components/tradexpo/dashboard-shell";

export default function PartnerNotificationsPage() {
  return (
    <DashboardShell
      title="Notifications"
      breadcrumbs={[{ label: "Communication" }, { label: "Notifications" }]}
    >
      <NotificationsPageContent />
    </DashboardShell>
  );
}
