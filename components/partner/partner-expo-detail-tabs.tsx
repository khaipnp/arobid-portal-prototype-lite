"use client";

import { useState } from "react";
import { GoLIVEManager } from "@/components/tradexpo/golive-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  PartnerAssignedExpo,
  PartnerExpoExhibitorsWorkspace,
  PartnerExpoOperationsDetail,
} from "@/lib/partner/db";
import type { GoLIVEEvent, StreamSession } from "@/lib/tradexpo/types";
import { PartnerExpoDetailOverview } from "./partner-expo-detail-overview";
import { PartnerExpoExhibitorsTable } from "./partner-expo-exhibitors-table";

export function PartnerExpoDetailTabs({
  expoId,
  assignedExpo,
  operations,
  exhibitorsWorkspace,
  initialGoLIVEEvents,
  initialStreamSessions,
}: {
  expoId: string;
  assignedExpo: PartnerAssignedExpo;
  operations: PartnerExpoOperationsDetail;
  exhibitorsWorkspace: PartnerExpoExhibitorsWorkspace;
  initialGoLIVEEvents: GoLIVEEvent[];
  initialStreamSessions: StreamSession[];
}) {
  const [tab, setTab] = useState("overview");
  const canUseGoLive =
    assignedExpo.assignment.capabilities.includes("manage_golive");

  return (
    <Tabs value={tab} onValueChange={setTab} className="mt-5 gap-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {canUseGoLive ? <TabsTrigger value="golive">GoLIVE</TabsTrigger> : null}
        <TabsTrigger value="exhibitors">Exhibitors</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <PartnerExpoDetailOverview
          assignedExpo={assignedExpo}
          operations={operations}
          exhibitorsWorkspace={exhibitorsWorkspace}
          onViewAllExhibitors={() => setTab("exhibitors")}
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
  );
}
