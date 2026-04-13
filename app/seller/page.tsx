import Link from "next/link"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { mockExpos, mockSellerRegistrations } from "@/lib/tradexpo/mock-data"

export default function SellerDashboardPage() {
  const myExpoIds = [...new Set(mockSellerRegistrations.map((r) => r.expoId))]
  const liveCount = mockSellerRegistrations.filter(
    (r) => r.status === "Live",
  ).length
  const pendingCount = mockSellerRegistrations.filter(
    (r) => r.status === "Pending Setup",
  ).length

  return (
    <DashboardShell
      title="Supplier Dashboard"
      description="Manage your booths and browse expo events."
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/seller/my-expos"
          className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-3xl font-bold">{myExpoIds.length}</p>
          <p className="mt-1 font-semibold text-base">Expos Joined</p>
          <p className="mt-0.5 text-muted-foreground text-sm">
            Expos where you have purchased a booth.
          </p>
        </Link>
        <Link
          href="/seller/my-expos"
          className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-3xl font-bold text-emerald-600">{liveCount}</p>
          <p className="mt-1 font-semibold text-base">Active Booths</p>
          <p className="mt-0.5 text-muted-foreground text-sm">
            Booths currently live at an ongoing expo.
          </p>
        </Link>
        <Link
          href="/seller/my-expos"
          className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          <p className="mt-1 font-semibold text-base">Pending Setup</p>
          <p className="mt-0.5 text-muted-foreground text-sm">
            Booths awaiting configuration before the expo.
          </p>
        </Link>
      </div>
    </DashboardShell>
  )
}
