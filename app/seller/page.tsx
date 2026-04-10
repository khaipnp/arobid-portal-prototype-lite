import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function SellerDashboardPage() {
  return (
    <DashboardShell
      title="Supplier Dashboard"
      description="Manage your booths and browse expo events."
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-base">My Booths</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            View and manage your active and archived booth setups.
          </p>
        </section>
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-base">Browse Events</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Discover upcoming expos and register your booth.
          </p>
        </section>
      </div>
    </DashboardShell>
  )
}
