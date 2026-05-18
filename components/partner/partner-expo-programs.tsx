"use client"

import { BadgeCheckIcon, Building2Icon } from "lucide-react"
import { useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import type { PartnerAccess } from "@/lib/partner/access"
import type { PartnerExpoProgramsWorkspace } from "@/lib/partner/db"
import { PartnerExpoList } from "./partner-expo-list"

const numberFormat = new Intl.NumberFormat("en")

export function PartnerExpoPrograms({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerExpoProgramsWorkspace
}) {
  const summary = useMemo(() => {
    return workspace.assignedExpos.reduce(
      (acc, item) => {
        acc.assigned += 1
        if (item.assignment.partnershipModel === "co_host") acc.coHost += 1
        if (item.assignment.partnershipModel === "turnkey") acc.turnkey += 1
        if (item.assignment.partnershipModel === "tenant") acc.tenant += 1
        acc.booths += item.totalBooths
        acc.soldBooths += item.soldBooths
        return acc
      },
      {
        assigned: 0,
        coHost: 0,
        turnkey: 0,
        tenant: 0,
        booths: 0,
        soldBooths: 0
      }
    )
  }, [workspace.assignedExpos])

  return (
    <div className="space-y-4">
      <section className="grid gap-3 px-4 sm:grid-cols-2">
        <MetricCard
          title="Assigned Programs"
          value={numberFormat.format(
            summary.coHost + summary.turnkey + summary.tenant
          )}
          icon={<Building2Icon />}
        />

        <MetricCard
          title="Booth Utilization"
          value={`${summary.booths > 0 ? Math.round((summary.soldBooths / summary.booths) * 100) : 0}%`}
          icon={<BadgeCheckIcon />}
        />
      </section>

      <PartnerExpoList
        access={access}
        assignedExpos={workspace.assignedExpos}
      />
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-sm">{title}</span>
          <span className="font-medium text-2xl">{value}</span>
        </div>
        <div className="rounded-full bg-muted p-3 text-foreground [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
