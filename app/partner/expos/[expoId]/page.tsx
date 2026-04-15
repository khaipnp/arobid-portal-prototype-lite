import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { GoLIVEManager } from "@/components/tradexpo/golive-manager"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockExpos } from "@/lib/tradexpo/mock-data"
import type { ExpoStatus } from "@/lib/tradexpo/types"

// Partner sở hữu các expo này trong prototype
const PARTNER_EXPO_IDS = ["expo-003", "expo-015", "expo-001", "expo-004"]

const statusStyles: Record<ExpoStatus, string> = {
  Draft: "border-slate-300 bg-slate-100 text-slate-700",
  "Pending Review": "border-amber-300 bg-amber-100 text-amber-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-700",
  Archived: "border-purple-300 bg-purple-100 text-purple-700",
  Canceled: "border-rose-300 bg-rose-100 text-rose-700",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default async function PartnerExpoDetailPage({
  params,
}: {
  params: Promise<{ expoId: string }>
}) {
  const { expoId } = await params
  const expo = mockExpos.find((e) => e.id === expoId)
  if (!expo || !PARTNER_EXPO_IDS.includes(expoId)) notFound()

  return (
    <DashboardShell
      title={expo.name}
      description={`${formatDate(expo.startDate)} – ${formatDate(expo.endDate)}`}
      breadcrumbs={[
        { label: "Dashboard", href: "/partner" },
        { label: "My Expos", href: "/partner/expos" },
        { label: expo.name },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusStyles[expo.status]}>
            {expo.status}
          </Badge>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="golive">GoLIVE</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="max-w-2xl rounded-lg border p-5">
              <h2 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
                Expo Information
              </h2>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Expo ID</span>
                <span className="font-mono text-xs">{expo.id}</span>

                <span className="text-muted-foreground">Owner</span>
                <span>{expo.ownerEmail}</span>

                <span className="text-muted-foreground">Start Date</span>
                <span>{formatDate(expo.startDate)}</span>

                <span className="text-muted-foreground">End Date</span>
                <span>{formatDate(expo.endDate)}</span>

                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={`w-fit text-xs ${statusStyles[expo.status]}`}
                >
                  {expo.status}
                </Badge>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="golive" className="mt-6">
            <GoLIVEManager expoId={expoId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
