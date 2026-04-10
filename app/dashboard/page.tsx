import Link from "next/link"

import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <DashboardShell
      title="Admin Dashboard"
      description="Access module workspaces and manage feature libraries for TradeXpo."
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-base">TradeXpo Workspace</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Entry point for hall templates, booth templates, and slot
            configuration.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/tradexpo">Open TradeXpo Module</Link>
          </Button>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-base">Hall & Booth Libraries</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Prototype implementation with mock status lifecycle and validation
            rules.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/tradexpo/hall-templates">
                Hall Templates
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/tradexpo/booth-templates">
                Booth Templates
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
