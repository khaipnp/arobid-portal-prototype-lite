import {
  BoxesIcon,
  HandshakeIcon,
  RadioIcon,
  StoreIcon,
  UsersIcon,
  WalletCardsIcon,
  ZapIcon
} from "lucide-react"
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
      label: "TradeCredits allocated",
      value: numberFormat.format(summary.overview.tradeCreditsAllocated),
      note: "Credits usage",
      icon: WalletCardsIcon
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

  return (
    <section className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-7">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.label} size="sm" className="min-w-0">
            <CardHeader>
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="truncate font-semibold text-xl tabular-nums">
                {kpi.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-muted-foreground text-xs">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{kpi.note}</span>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
