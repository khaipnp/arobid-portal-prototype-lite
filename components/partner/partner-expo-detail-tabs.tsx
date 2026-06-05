"use client"

import { useState } from "react"
import { GoLIVEManager } from "@/components/tradexpo/golive-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  PartnerAssignedExpo,
  PartnerExpoExhibitorsWorkspace,
  PartnerExpoOperationsDetail
} from "@/lib/partner/db"
import type {
  ExpoPackageDisplay,
  GoLIVEEvent,
  StreamSession
} from "@/lib/tradexpo/types"
import { PartnerExpoDetailOverview } from "./partner-expo-detail-overview"
import { PartnerExpoExhibitorsTable } from "./partner-expo-exhibitors-table"
import { PartnerExpoPackageOverviewCard } from "./partner-expo-package-overview-card"

export function PartnerExpoDetailTabs({
  expoId,
  assignedExpo,
  operations,
  exhibitorsWorkspace,
  packages,
  initialGoLIVEEvents,
  initialStreamSessions
}: {
  expoId: string
  assignedExpo: PartnerAssignedExpo
  operations: PartnerExpoOperationsDetail
  exhibitorsWorkspace: PartnerExpoExhibitorsWorkspace
  packages: ExpoPackageDisplay[]
  initialGoLIVEEvents: GoLIVEEvent[]
  initialStreamSessions: StreamSession[]
}) {
  const [tab, setTab] = useState("overview")
  const canUseGoLive =
    assignedExpo.assignment.capabilities.includes("manage_golive")
  const canEditDraft =
    assignedExpo.assignment.partnershipModel !== "turnkey" &&
    assignedExpo.expo.status === "Draft" &&
    assignedExpo.assignment.capabilities.includes("edit_expo_content")

  return (
    <Tabs value={tab} onValueChange={setTab} className="mt-5 gap-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="packages">Packages</TabsTrigger>
        <TabsTrigger value="exhibitors">Exhibitors</TabsTrigger>
        {canUseGoLive ? <TabsTrigger value="golive">Events</TabsTrigger> : null}
      </TabsList>

      <TabsContent value="overview">
        <PartnerExpoDetailOverview
          assignedExpo={assignedExpo}
          operations={operations}
          exhibitorsWorkspace={exhibitorsWorkspace}
          onViewAllExhibitors={() => setTab("exhibitors")}
        />
      </TabsContent>

      <TabsContent value="packages">
        <PartnerExpoPackageOverviewCard
          packages={packages}
          canEdit={canEditDraft}
          editHref={`/partner/expos/${assignedExpo.expo.id}/edit`}
        />
      </TabsContent>

      {canUseGoLive ? (
        <TabsContent value="golive">
          <GoLIVEManager
            expoId={expoId}
            initialGoLIVEEvents={initialGoLIVEEvents}
            initialStreamSessions={initialStreamSessions}
          />
        </TabsContent>
      ) : null}

      <TabsContent value="exhibitors">
        <PartnerExpoExhibitorsTable
          expoId={expoId}
          workspace={exhibitorsWorkspace}
        />
      </TabsContent>
    </Tabs>
  )
}
