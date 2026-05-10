import Link from "next/link"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { listSellerBoothRegistrations } from "@/lib/tradexpo/db/platform-data"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

export const dynamic = "force-dynamic"

export default async function SellerDashboardPage() {
  const registrations = await listSellerBoothRegistrations(CURRENT_USER_ID)
  const myExpoIds = [...new Set(registrations.map((r) => r.expoId))]
  const liveCount = registrations.filter((r) => r.status === "Live").length
  const pendingCount = registrations.filter(
    (r) => r.status === "Pending Setup"
  ).length

  return (
    <DashboardShell
      title="User Workspace Dashboard"
      description="Manage your booths and browse expo events."
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/seller/my-expos"
          className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="font-bold text-3xl">{myExpoIds.length}</p>
          <p className="mt-1 font-semibold text-base">Expos Joined</p>
          <p className="mt-0.5 text-muted-foreground text-sm">
            Expos where you have purchased a booth.
          </p>
        </Link>
        <Link
          href="/seller/my-expos"
          className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="font-bold text-3xl text-emerald-600">{liveCount}</p>
          <p className="mt-1 font-semibold text-base">Active Booths</p>
          <p className="mt-0.5 text-muted-foreground text-sm">
            Booths currently live at an ongoing expo.
          </p>
        </Link>
        <Link
          href="/seller/my-expos"
          className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="font-bold text-3xl text-amber-600">{pendingCount}</p>
          <p className="mt-1 font-semibold text-base">Pending Setup</p>
          <p className="mt-0.5 text-muted-foreground text-sm">
            Booths awaiting configuration before the expo.
          </p>
        </Link>
      </div>
    </DashboardShell>
  )
}
