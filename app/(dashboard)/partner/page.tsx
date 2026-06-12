import { Suspense } from "react"
import { PartnerDashboard } from "@/components/partner/partner-dashboard"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { getPartnerDashboardMetrics } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerDashboardPage() {
  const userId = await requireRole("partner")
  await requirePartnerTab(userId, "overview")

  return (
    <DashboardShell breadcrumbs={[{ label: "Dashboard" }]}>
      <Suspense fallback={<PartnerDashboardFallback />}>
        <PartnerDashboardContent userId={userId} />
      </Suspense>
    </DashboardShell>
  )
}

async function PartnerDashboardContent({ userId }: { userId: string }) {
  await ensurePlatformSchema()
  const metrics = await getPartnerDashboardMetrics(userId)

  return <PartnerDashboard metrics={metrics} />
}

function PartnerDashboardFallback() {
  return (
    <div className="space-y-6 px-4 py-4" aria-busy="true">
      <section className="overflow-hidden rounded-4xl border bg-legend text-primary-foreground shadow-md">
        <div className="relative flex gap-8 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_34rem)] p-5 sm:p-8">
          <div className="flex max-w-1/2 flex-col gap-2">
            <h1 className="select-none font-semibold text-2xl tracking-tight sm:text-2xl">
              Partner Analytics Command Center
            </h1>
            <p className="max-w-md select-none text-primary-foreground/70 text-sm leading-snug sm:text-base">
              Follow capacity, activation, revenue, and live engagement signals
              across assigned Expo Programs.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-8 w-60 rounded-lg bg-muted" />
          <div className="h-10 w-72 rounded-xl bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {["traffic", "members", "booths", "deal-room"].map((metric) => (
            <div
              key={metric}
              className="h-34 rounded-2xl border bg-card p-5 shadow-xs"
            >
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mt-12 h-8 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
