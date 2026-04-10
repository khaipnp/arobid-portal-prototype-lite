import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function PartnerDashboardPage() {
  return (
    <DashboardShell
      title="Partner Dashboard"
      description="Manage your expo events and exhibitors."
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-base">My Events</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            View and manage your upcoming and past expo events.
          </p>
        </section>
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-base">Exhibitors</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage exhibitor invitations and applications for your events.
          </p>
        </section>
      </div>
    </DashboardShell>
  )
}
