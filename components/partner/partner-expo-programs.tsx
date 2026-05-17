"use client"

import {
  BadgeCheckIcon,
  Building2Icon,
  HandshakeIcon
} from "lucide-react"
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
      <section className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Assigned Programs"
          value={numberFormat.format(summary.assigned)}
          note="Arobid Business creates and assigns expo programs"
          icon={<Building2Icon />}
        />
        <MetricCard
          title="Partnership Models"
          value={numberFormat.format(
            summary.coHost + summary.turnkey + summary.tenant
          )}
          note={`${numberFormat.format(summary.coHost)} co-host / ${numberFormat.format(summary.turnkey)} turnkey / ${numberFormat.format(summary.tenant)} tenant`}
          icon={<HandshakeIcon />}
        />
        <MetricCard
          title="Booth Utilization"
          value={`${summary.booths > 0 ? Math.round((summary.soldBooths / summary.booths) * 100) : 0}%`}
          note={`${numberFormat.format(summary.soldBooths)} / ${numberFormat.format(summary.booths)} booths`}
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
  note,
  icon
}: {
  title: string
  value: string
  note: string
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-muted-foreground text-xs [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        <span>{note}</span>
      </CardContent>
    </Card>
  )
}
