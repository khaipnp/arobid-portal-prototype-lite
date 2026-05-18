import {
  BarChart3Icon,
  BoxesIcon,
  Building2Icon,
  HandshakeIcon,
  RadioIcon,
  SendIcon,
  StoreIcon,
  UsersIcon,
  ZapIcon
} from "lucide-react"
import type { ComponentType } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import type { PartnerPortalSummary } from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

export function PartnerOverviewCommand({
  summary
}: {
  summary: PartnerPortalSummary
}) {
  const kpis = [
    {
      label: "Enterprises activated",
      value: numberFormat.format(summary.overview.enterprisesActivated),
      note: "Expo participation funnel",
      icon: UsersIcon
    },
    {
      label: "Expo booths used",
      value: numberFormat.format(summary.overview.expoBoothsUsed),
      note: "Enterprise activity",
      icon: StoreIcon
    },
    {
      label: "Invite campaigns",
      value: numberFormat.format(summary.overview.activeInviteCampaigns),
      note: "Partner scoped activation",
      icon: SendIcon
    },
    {
      label: "RFQ generated",
      value: numberFormat.format(summary.overview.rfqGenerated),
      note: "Trade demand",
      icon: ZapIcon
    },
    {
      label: "Deal contexts",
      value: numberFormat.format(summary.overview.dealContexts),
      note: "SSOT deal contexts",
      icon: HandshakeIcon
    },
    {
      label: "Bundle sales",
      value: numberFormat.format(summary.overview.bundleSales),
      note: "Bundle adoption",
      icon: BoxesIcon
    },
    {
      label: "Partner revenue",
      value: currencyFormat.format(summary.overview.partnerRevenue),
      note: "Revenue summary",
      icon: RadioIcon
    }
  ]

  const statusCards = [
    {
      label: "Partner Organization",
      value: summary.organization?.name ?? "Unavailable",
      note: summary.organization
        ? `${summary.organization.model.replaceAll("_", " ")} · ${summary.organization.status}`
        : "No active partner organization",
      icon: Building2Icon
    },
    {
      label: "Associated companies",
      value: numberFormat.format(summary.enterprises.total),
      note: `${numberFormat.format(summary.enterprises.expoActivated)} active · ${numberFormat.format(summary.enterprises.invited)} pending`,
      icon: UsersIcon
    },
    {
      label: "Assigned Expos / Programs",
      value: numberFormat.format(summary.expoPrograms.assignedExpos),
      note: `${numberFormat.format(summary.expoPrograms.coHost)} co-host · ${numberFormat.format(summary.expoPrograms.turnkey)} turnkey`,
      icon: StoreIcon
    },
    {
      label: "Analytics summary",
      value: numberFormat.format(
        summary.overview.rfqGenerated + summary.overview.dealContexts
      ),
      note: "Latest available aggregate",
      icon: BarChart3Icon
    }
  ]

  return (
    <div className="space-y-3 px-4 pb-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((card) => (
          <OverviewCard key={card.label} {...card} />
        ))}
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {kpis.map((kpi) => (
          <OverviewCard key={kpi.label} {...kpi} />
        ))}
      </section>
    </div>
  )
}

function OverviewCard({
  label,
  value,
  note,
  icon: Icon
}: {
  label: string
  value: string
  note: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card size="sm" className="min-w-0">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="truncate font-semibold text-xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{note}</span>
      </CardContent>
    </Card>
  )
}
