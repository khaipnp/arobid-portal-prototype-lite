import Link from "next/link"

import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { Button } from "@/components/ui/button"

export default function TradeXpoDashboardPage() {
  return (
    <DashboardShell
      title="TradeXpo Module Dashboard"
      description="Manage hall templates, booth templates, and 3D slot configurations in one place."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "TradeXpo" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-base font-semibold">Hall Template Library</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, publish, deactivate, and localize hall templates for organizers.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/tradexpo/hall-templates">Open Hall Library</Link>
          </Button>
        </section>

        <section>
          <h2 className="text-base font-semibold">Booth Template Library</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage booth templates by booth type for exhibitor-facing selection.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/tradexpo/booth-templates">Open Booth Library</Link>
          </Button>
        </section>
      </div>
    </DashboardShell>
  )
}
