import Link from "next/link"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireAnyRole, userHasRole } from "@/lib/auth/rbac"
import { listSellerBoothRegistrations } from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function SellerDashboardPage() {
  const userId = await requireAnyRole(["seller", "buyer"])
  const isSeller = await userHasRole(userId, "seller")
  const registrations = await listSellerBoothRegistrations(userId)
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
          href="/seller/orders"
          className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="mt-1 font-semibold text-base">Order History</p>
          <p className="mt-0.5 text-muted-foreground text-sm">
            Review your checkout and payment results.
          </p>
        </Link>
        {isSeller ? (
          <>
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
          </>
        ) : null}
      </div>
    </DashboardShell>
  )
}
