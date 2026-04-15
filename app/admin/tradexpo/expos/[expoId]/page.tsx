import { notFound } from "next/navigation"
import { ExpoPaymentConfigManager } from "@/components/orders/expo-payment-config"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPlatformPaymentConfig,
  listBankAccounts,
  listExpoPaymentConfigs,
} from "@/lib/orders/db"
import { listExpos } from "@/lib/tradexpo/db/platform-data"
import type { ExpoStatus } from "@/lib/tradexpo/types"

const statusStyles: Record<ExpoStatus, string> = {
  Draft: "border-zinc-300 bg-zinc-100 text-zinc-600",
  "Pending Review": "border-amber-300 bg-amber-100 text-amber-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Ended: "border-blue-300 bg-blue-100 text-blue-700",
  Archived: "border-zinc-300 bg-zinc-100 text-zinc-500",
  Canceled: "border-rose-300 bg-rose-100 text-rose-700",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export const dynamic = "force-dynamic"

export default async function ExpoDetailPage({
  params,
}: {
  params: Promise<{ expoId: string }>
}) {
  const { expoId } = await params
  const expos = await listExpos()
  const expo = expos.find((e) => e.id === expoId)
  if (!expo) notFound()

  const [initialExpoPaymentConfigs, platformPayment, bankAccounts] =
    await Promise.all([
      listExpoPaymentConfigs(),
      getPlatformPaymentConfig(),
      listBankAccounts(),
    ])

  return (
    <DashboardShell
      title={expo.name}
      description={`${expo.ownerEmail} · ${formatDate(expo.startDate)} – ${formatDate(expo.endDate)}`}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Expo List", href: "/admin/tradexpo/expos" },
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
            <TabsTrigger value="payment">Payment Config</TabsTrigger>
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

          <TabsContent value="payment" className="mt-6">
            <div className="max-w-2xl">
              <div className="mb-4">
                <h2 className="font-semibold">Payment Methods</h2>
                <p className="text-muted-foreground text-sm">
                  Configure which payment methods Exhibitors can use when
                  registering booths for this Expo.
                </p>
              </div>
              <ExpoPaymentConfigManager
                expoId={expoId}
                expo={expo}
                initialConfigs={initialExpoPaymentConfigs}
                platformPayment={platformPayment}
                bankAccounts={bankAccounts}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
