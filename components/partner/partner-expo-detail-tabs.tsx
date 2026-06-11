"use client"

import { useState } from "react"
import { GoLIVEManager } from "@/components/tradexpo/golive-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  PartnerAssignedExpo,
  PartnerExpoExhibitorsWorkspace,
  PartnerExpoOperationsDetail,
  PartnerReferralAnalytics
} from "@/lib/partner/db"
import type {
  ExpoPackageDisplay,
  GoLIVEEvent,
  StreamSession
} from "@/lib/tradexpo/types"
import { PartnerExpoDetailOverview } from "./partner-expo-detail-overview"
import { PartnerExpoExhibitorsTable } from "./partner-expo-exhibitors-table"
import { PartnerExpoPackageOverviewCard } from "./partner-expo-package-overview-card"
import { PartnerExpoReferralAnalyticsCard } from "./partner-expo-referral-analytics-card"

export function PartnerExpoDetailTabs({
  expoId,
  initialTab,
  assignedExpo,
  operations,
  exhibitorsWorkspace,
  packages,
  referralAnalytics,
  initialGoLIVEEvents,
  initialStreamSessions
}: {
  expoId: string
  initialTab?: "overview" | "referrals"
  assignedExpo: PartnerAssignedExpo
  operations: PartnerExpoOperationsDetail
  exhibitorsWorkspace: PartnerExpoExhibitorsWorkspace
  packages: ExpoPackageDisplay[]
  referralAnalytics: PartnerReferralAnalytics
  initialGoLIVEEvents: GoLIVEEvent[]
  initialStreamSessions: StreamSession[]
}) {
  const [tab, setTab] = useState<string>(initialTab ?? "overview")
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
        <TabsTrigger value="referrals">Referrals</TabsTrigger>
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

      <TabsContent value="referrals">
        <PartnerExpoReferralAnalyticsCard
          expoId={expoId}
          analytics={referralAnalytics}
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
