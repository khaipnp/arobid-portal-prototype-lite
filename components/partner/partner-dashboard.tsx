"use client"

import {
  ActivityIcon,
  EyeIcon,
  GaugeIcon,
  InfoIcon,
  RadioTowerIcon,
  TrendingUpIcon,
  UsersIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { type ReactNode, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis
} from "recharts"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart"
import {
  type DateRange,
  DateRangePicker
} from "@/components/ui/date-range-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  PartnerDashboardMetrics,
  PartnerDashboardOperationsSummary
} from "@/lib/partner/db"
import { formatExpoScheduleLabel } from "@/lib/tradexpo/schedule"
import { ExpoStatusBadge } from "../tradexpo/status-badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip"

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1
})

const numberFormat = new Intl.NumberFormat("en")

const dashboardDurations = ["1D", "3D", "7D", "15D", "30D"] as const
const dashboardDurationTabs = [...dashboardDurations, "Custom"] as const
const funnelDurations = ["7D", "30D", "90D"] as const
const funnelDurationTabs = [...funnelDurations, "Custom"] as const

const inventoryChartConfig = {
  soldBooths: {
    label: "Sold booths",
    color: "var(--chart-1)"
  },
  unsoldBooths: {
    label: "Unsold booths",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig

const boothTierColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)"
]

const tradeActivityMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

const dealContextsTrendConfig = {
  dealContexts: {
    label: "Deal Contexts",
    color: "var(--chart-5)"
  }
} satisfies ChartConfig

const rfqTrendConfig = {
  rfqs: {
    label: "RFQ",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig

const tradeCreditChartConfig = {
  used: {
    label: "Used",
    color: "var(--chart-1)"
  },
  expired: {
    label: "Expired",
    color: "var(--chart-3)"
  },
  balance: {
    label: "Balance",
    color: "var(--chart-5)"
  }
} satisfies ChartConfig

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatRatio(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

function getCustomDashboardDuration(
  range: DateRange | undefined
): (typeof dashboardDurations)[number] {
  if (!range?.from) return "1D"

  const to = range.to ?? range.from
  const fromDay = Date.UTC(
    range.from.getFullYear(),
    range.from.getMonth(),
    range.from.getDate()
  )
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  const daySpan = Math.max(
    1,
    Math.round(Math.abs(toDay - fromDay) / 86_400_000) + 1
  )

  return dashboardDurations.reduce((closest, duration) => {
    const closestDays = Number.parseInt(closest, 10)
    const durationDays = Number.parseInt(duration, 10)

    return Math.abs(durationDays - daySpan) < Math.abs(closestDays - daySpan)
      ? duration
      : closest
  })
}

type PartnerDashboardDurationFilter = (typeof dashboardDurationTabs)[number]
type PartnerActivationFunnelDuration = (typeof funnelDurations)[number]
type PartnerActivationFunnelTab = (typeof funnelDurationTabs)[number]

type FunnelStage = {
  label: string
  value: number
  description: string
  href: string
  colorClass: string
}

function getCustomFunnelDuration(
  range: DateRange | undefined
): PartnerActivationFunnelDuration {
  if (!range?.from) return "7D"

  const to = range.to ?? range.from
  const fromDay = Date.UTC(
    range.from.getFullYear(),
    range.from.getMonth(),
    range.from.getDate()
  )
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  const daySpan = Math.max(
    1,
    Math.round(Math.abs(toDay - fromDay) / 86_400_000) + 1
  )

  return funnelDurations.reduce((closest, duration) => {
    const closestDays = Number.parseInt(closest, 10)
    const durationDays = Number.parseInt(duration, 10)
    return Math.abs(durationDays - daySpan) < Math.abs(closestDays - daySpan)
      ? duration
      : closest
  })
}

function getFunnelOperationsSummary(
  metrics: PartnerDashboardMetrics,
  duration: PartnerActivationFunnelDuration
): PartnerDashboardOperationsSummary {
  const summary =
    duration === "90D"
      ? metrics.operationsByDuration["30D"]
      : metrics.operationsByDuration[duration]
  const multiplier = duration === "90D" ? 3 : 1

  return {
    views: Math.round(summary.views * multiplier),
    activatedEnterprises: Math.round(summary.activatedEnterprises * multiplier),
    soldBooths: Math.round(summary.soldBooths * multiplier),
    rfqs: Math.round(summary.rfqs * multiplier)
  }
}

function buildFunnelStages(
  metrics: PartnerDashboardMetrics,
  duration: PartnerActivationFunnelDuration
): FunnelStage[] {
  const current = getFunnelOperationsSummary(metrics, duration)

  const invited = Math.max(
    current.views,
    current.activatedEnterprises + current.soldBooths + current.rfqs
  )
  const verified = Math.min(invited, current.activatedEnterprises)
  const profileCompleted = Math.min(
    verified,
    Math.max(current.soldBooths, Math.round(verified * 0.17))
  )

  return [
    {
      label: "Invited",
      value: invited,
      description: "Distinct invited enterprise identities in partner scope",
      href: "/partner/partner-site/invitations",
      colorClass: "from-sky-500 to-cyan-400"
    },
    {
      label: "Verified/Seller onboarding",
      value: verified,
      description:
        "Seller onboarding completed with General Information submitted",
      href: "/partner/partner-site/enterprises",
      colorClass: "from-violet-500 to-fuchsia-400"
    },
    {
      label: "Profile completed > 80%",
      value: profileCompleted,
      description: "eProfile valid filled fields strictly greater than 80%",
      href: "/partner/partner-site/enterprises",
      colorClass: "from-emerald-500 to-lime-400"
    }
  ]
}

function toChartKey(value: string, index: number) {
  return `tier_${index}_${value.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
}

function MetricWidget({
  label,
  value,
  description,
  icon
}: {
  label: string
  value: number
  description: string
  icon: ReactNode
}) {
  return (
    <TooltipProvider>
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center gap-1.5">
            <CardTitle>{label}</CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>{description}</TooltipContent>
            </Tooltip>
          </div>
          <CardAction className="text-legend">{icon}</CardAction>
        </CardHeader>
        <CardContent className="flex flex-1 items-end">
          <div className="font-semibold text-3xl tabular-nums leading-none tracking-tight">
            {numberFormat.format(value)}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

function PartnerActivationFunnel({ stages }: { stages: FunnelStage[] }) {
  const maxValue = Math.max(...stages.map((stage) => stage.value), 0)
  const hasFunnelData = maxValue > 0

  return (
    <Card size="sm" className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Enterprise activation drop-off</CardTitle>
          <CardDescription>
            Invitation to verified onboarding to eProfile completion
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {stages.map((stage) => {
          const width = hasFunnelData
            ? Math.max(20, Math.round((stage.value / maxValue) * 100))
            : 100

          return (
            <Link
              key={stage.label}
              href={stage.href}
              className="group block rounded-2xl bg-card/80 px-4 transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Open ${stage.label} module`}
            >
              <div className="grid gap-12 md:grid-cols-[15rem_1fr] md:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    {stage.label}
                  </div>
                </div>

                <div className="flex min-h-16 items-center">
                  <div
                    className={`flex h-10 items-center justify-between rounded-r-full rounded-l-2xl px-4 shadow-sm transition-transform ${hasFunnelData ? `bg-gradient-to-r text-white ${stage.colorClass}` : "bg-muted text-muted-foreground"}`}
                    style={{ width: `${width}%` }}
                  >
                    <span className="font-semibold text-lg tabular-nums">
                      {numberFormat.format(stage.value)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function PartnerDashboard({
  metrics
}: {
  metrics: PartnerDashboardMetrics
}) {
  const [selectedDuration, setSelectedDuration] =
    useState<PartnerDashboardDurationFilter>("1D")
  const [customDateRange, setCustomDateRange] = useState<DateRange>()
  const [selectedFunnelDuration, setSelectedFunnelDuration] =
    useState<PartnerActivationFunnelTab>("7D")
  const [funnelCustomDateRange, setFunnelCustomDateRange] =
    useState<DateRange>()
  const effectiveDashboardDuration =
    selectedDuration === "Custom"
      ? getCustomDashboardDuration(customDateRange)
      : selectedDuration
  const operationsSummary =
    metrics.operationsByDuration[effectiveDashboardDuration]
  const effectiveFunnelDuration: PartnerActivationFunnelDuration =
    selectedFunnelDuration === "Custom"
      ? getCustomFunnelDuration(funnelCustomDateRange)
      : selectedFunnelDuration
  const funnelStages = buildFunnelStages(metrics, effectiveFunnelDuration)

  return (
    <div className="space-y-6 px-4 py-4">
      <section className="overflow-hidden rounded-4xl border bg-legend text-primary-foreground shadow-md">
        <div className="relative flex gap-8 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_34rem)] p-5 sm:p-8">
          <div className="flex max-w-1/2 flex-col gap-2">
            <h1 className="select-none font-semibold text-2xl tracking-tight sm:text-2xl">
              Partner Analytics Command Center
            </h1>
            <p className="max-w-md select-none text-primary-foreground/70 text-sm leading-snug sm:text-base">
              Follow capacity, activation, revenue, and live engagement signals
              across assigned Expo Programs.
            </p>
          </div>
          <GaugeIcon
            className="absolute -right-3.5 -bottom-6 size-32 text-primary-foreground/40 sm:size-40"
            strokeWidth="2.5"
          />
        </div>
      </section>

      <div className="grid gap-12 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-2xl">Operations Summary</h2>
            <div className="flex flex-col gap-2 sm:items-end">
              <Tabs
                value={selectedDuration}
                onValueChange={(value) =>
                  setSelectedDuration(value as PartnerDashboardDurationFilter)
                }
              >
                <TabsList className="rounded-xl p-1">
                  {dashboardDurationTabs.map((duration) => (
                    <TabsTrigger
                      key={duration}
                      value={duration}
                      className="rounded-lg px-3"
                    >
                      {duration}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {selectedDuration === "Custom" && (
                <DateRangePicker
                  value={customDateRange}
                  onChange={setCustomDateRange}
                  placeholder="From date - to date"
                  className="w-full sm:w-[20rem]"
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricWidget
              label="Visitor Traffic"
              value={operationsSummary.views}
              description="Visitor activity in the selected duration"
              icon={<EyeIcon className="size-4" />}
            />
            <MetricWidget
              label="Activated Members"
              value={operationsSummary.activatedEnterprises}
              description="Member activity in the selected duration"
              icon={<UsersIcon className="size-4" />}
            />
            <MetricWidget
              label="Sold Booth"
              value={operationsSummary.soldBooths}
              description="Booth sold in the selected duration"
              icon={<ActivityIcon className="size-4" />}
            />
            <MetricWidget
              label="Deal Room"
              value={operationsSummary.rfqs}
              description="RFQs & Chat created in the selected duration"
              icon={<RadioTowerIcon className="size-4" />}
            />
          </div>
        </div>
        <div className="space-y-5 xl:col-span-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="font-semibold text-2xl">
                Partner Activation Funnel
              </h2>
              <p className="text-muted-foreground text-sm">
                Sequential enterprise drop-off from invitation to verified
                onboarding and profile completion.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Tabs
                value={selectedFunnelDuration}
                onValueChange={(value) =>
                  setSelectedFunnelDuration(value as PartnerActivationFunnelTab)
                }
              >
                <TabsList className="rounded-xl p-1">
                  {funnelDurationTabs.map((duration) => (
                    <TabsTrigger
                      key={duration}
                      value={duration}
                      className="rounded-lg px-3"
                    >
                      {duration}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {selectedFunnelDuration === "Custom" && (
                <DateRangePicker
                  value={funnelCustomDateRange}
                  onChange={setFunnelCustomDateRange}
                  placeholder="From date - to date"
                  className="w-full sm:w-[20rem]"
                />
              )}
            </div>
          </div>

          <PartnerActivationFunnel stages={funnelStages} />
        </div>
        <ExpoInventorySection metrics={metrics} />
        <TradeActivitySection metrics={metrics} />
      </div>
    </div>
  )
}

function TradeActivitySection({
  metrics
}: {
  metrics: PartnerDashboardMetrics
}) {
  const thirtyDayRfqs = metrics.operationsByDuration["30D"].rfqs
  const rfqTotal = Math.max(thirtyDayRfqs, 396)
  const dealContextTotal = Math.max(Math.round(rfqTotal * 0.31), 124)
  const allocatedCredits = Math.max(metrics.totals.totalBooths * 100, 18_400)
  const usedCredits = Math.max(metrics.totals.soldBooths * 100, 7_200)
  const expiredCredits = Math.max(
    metrics.totals.publishedBooths > 0
      ? Math.round(metrics.totals.publishedBooths * 12)
      : 0,
    600
  )
  const balanceCredits = Math.max(
    allocatedCredits - usedCredits - expiredCredits,
    10_600
  )
  const dealContextsTrend = buildTradeTrend(
    dealContextTotal,
    "dealContexts",
    [0.34, 0.42, 0.56, 0.72, 0.9, 1]
  )
  const rfqTrend = buildTradeTrend(
    rfqTotal,
    "rfqs",
    [0.48, 0.54, 0.65, 0.77, 0.91, 1]
  )
  const creditDistribution = [
    {
      status: "used",
      value: usedCredits,
      ratio: formatRatio(usedCredits, allocatedCredits),
      fill: "var(--color-used)"
    },
    {
      status: "expired",
      value: expiredCredits,
      ratio: formatRatio(expiredCredits, allocatedCredits),
      fill: "var(--color-expired)"
    },
    {
      status: "balance",
      value: balanceCredits,
      ratio: formatRatio(balanceCredits, allocatedCredits),
      fill: "var(--color-balance)"
    }
  ]

  return (
    <section className="space-y-5 xl:col-span-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-2xl">Trade Activity</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle>Deal Contexts Trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-semibold text-2xl text-legend tabular-nums tracking-tight">
                {numberFormat.format(dealContextTotal)}
              </div>
              <p className="text-muted-foreground text-sm">Deal Contexts</p>
            </div>
            <ChartContainer
              config={dealContextsTrendConfig}
              className="h-56 w-full"
            >
              <BarChart
                accessibilityLayer
                data={dealContextsTrend}
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                {/*<ChartLegend content={<ChartLegendContent />} />*/}
                <Bar
                  dataKey="dealContexts"
                  fill="var(--color-dealContexts)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle>TradeCredits Allocated</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="font-semibold text-2xl text-legend tabular-nums tracking-tight">
                {compactNumber.format(allocatedCredits)}
              </div>
              <p className="text-muted-foreground text-sm capitalize">
                allocated credits
              </p>
            </div>
            <ChartContainer
              config={tradeCreditChartConfig}
              className="h-56 w-full"
            >
              <PieChart accessibilityLayer>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      nameKey="status"
                      formatter={(value, name, item) => {
                        const ratio = item.payload?.ratio
                        return (
                          <div className="flex min-w-32 items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              {tradeCreditChartConfig[
                                name as keyof typeof tradeCreditChartConfig
                              ]?.label ?? name}
                            </span>
                            <span className="font-medium font-mono text-foreground tabular-nums">
                              {numberFormat.format(Number(value))} ·{" "}
                              {formatPercent(Number(ratio))}
                            </span>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="status" />}
                />
                <Pie
                  data={creditDistribution}
                  dataKey="value"
                  innerRadius={52}
                  nameKey="status"
                  outerRadius={82}
                  paddingAngle={2}
                  strokeWidth={2}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle>RFQ Received</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-semibold text-2xl text-legend tabular-nums tracking-tight">
                {numberFormat.format(rfqTotal)}
              </div>
              <p className="text-muted-foreground text-sm capitalize">
                received RFQs
              </p>
            </div>

            <ChartContainer
              config={rfqTrendConfig}
              className="h-full max-h-64 w-full"
            >
              <RadarChart accessibilityLayer data={rfqTrend}>
                <ChartTooltip content={<ChartTooltipContent />} />
                {/*<ChartLegend content={<ChartLegendContent />} />*/}
                <PolarAngleAxis dataKey="month" tickLine={false} />
                <PolarGrid />
                <Radar
                  dataKey="rfqs"
                  fill="var(--color-rfqs)"
                  fillOpacity={0.24}
                  stroke="var(--color-rfqs)"
                  strokeWidth={2}
                  dot={{ r: 3, fillOpacity: 1 }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function buildTradeTrend(
  total: number,
  key: "dealContexts" | "rfqs",
  multipliers: number[]
) {
  return tradeActivityMonths.map((month, index) => ({
    month,
    [key]: Math.max(1, Math.round(total * multipliers[index]))
  }))
}

function ExpoInventorySection({
  metrics
}: {
  metrics: PartnerDashboardMetrics
}) {
  const inventoryData = metrics.expoMetrics.map((item) => ({
    ...item,
    soldPercent: formatRatio(item.soldBooths, item.totalBooths),
    unsoldPercent: formatRatio(item.unsoldBooths, item.totalBooths)
  }))
  const inventoryTotals = inventoryData.reduce(
    (totals, item) => ({
      soldBooths: totals.soldBooths + item.soldBooths,
      unsoldBooths: totals.unsoldBooths + item.unsoldBooths
    }),
    { soldBooths: 0, unsoldBooths: 0 }
  )
  const inventoryPieData = [
    {
      boothStatus: "soldBooths",
      boothCount: inventoryTotals.soldBooths,
      fill: "var(--color-soldBooths)"
    },
    {
      boothStatus: "unsoldBooths",
      boothCount: inventoryTotals.unsoldBooths,
      fill: "var(--color-unsoldBooths)"
    }
  ]
  const boothTierPieData = metrics.boothTierBreakdown.map((item, index) => {
    const tierKey = toChartKey(item.name, index)

    return {
      tierKey,
      tierName: item.name,
      boothCount: item.value,
      color: boothTierColors[index % boothTierColors.length],
      fill: `var(--color-${tierKey})`
    }
  })
  const boothTierConfig = boothTierPieData.reduce<ChartConfig>((acc, item) => {
    acc[item.tierKey] = {
      label: item.tierName,
      color: item.color
    }
    return acc
  }, {})
  const hasExpoData = inventoryData.length > 0
  const hasBoothTierData = boothTierPieData.length > 0

  return (
    <section className="space-y-5 xl:col-span-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-2xl">Expo and Inventory</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle className="capitalize">Booth sold vs unsold</CardTitle>
            <CardDescription>Total booth inventory status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {hasExpoData ? (
              <ChartContainer
                config={inventoryChartConfig}
                className="h-80 w-full"
              >
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent hideLabel nameKey="boothStatus" />
                    }
                  />
                  <Pie
                    data={inventoryPieData}
                    dataKey="boothCount"
                    nameKey="boothStatus"
                    innerRadius={64}
                    outerRadius={108}
                    paddingAngle={2}
                    label={({ value }) => numberFormat.format(Number(value))}
                    labelLine={false}
                  >
                    {inventoryPieData.map((item) => (
                      <Cell key={item.boothStatus} fill={item.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="boothStatus" />}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyInventoryState />
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle>Purchased booths by tier</CardTitle>
            <CardDescription>All-time purchased booth count</CardDescription>
          </CardHeader>
          <CardContent>
            {hasBoothTierData ? (
              <ChartContainer config={boothTierConfig} className="h-80 w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent hideLabel nameKey="tierKey" />
                    }
                  />
                  <Pie
                    data={boothTierPieData}
                    dataKey="boothCount"
                    nameKey="tierKey"
                    innerRadius={64}
                    outerRadius={108}
                    paddingAngle={2}
                    label={({ value }) => numberFormat.format(Number(value))}
                    labelLine={false}
                  >
                    {boothTierPieData.map((item) => (
                      <Cell key={item.tierKey} fill={item.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="tierKey" />}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyInventoryState />
            )}
          </CardContent>
        </Card>
      </div>

      {hasExpoData ? (
        <div className="overflow-x-auto rounded-2xl border">
          <Table className="min-w-2/3">
            <TableHeader>
              <TableRow>
                <TableHead>Expo Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total booth</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Unsold</TableHead>
                <TableHead>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryData.map((item) => (
                <TableRow key={item.expoId}>
                  <TableCell className="max-w-96 whitespace-normal py-4 font-medium">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/partner/expo-program/expos/${item.expoId}`}
                        className="group block w-24 shrink-0 overflow-hidden rounded-lg border bg-muted"
                        aria-label={`View ${item.expoName} details`}
                      >
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.expoName}
                          width={1600}
                          height={900}
                          className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </Link>
                      <div className="min-w-0">
                        <Link
                          href={`/partner/expo-program/expos/${item.expoId}`}
                        >
                          {item.expoName}
                        </Link>
                        <div className="text-muted-foreground text-xs">
                          {formatExpoScheduleLabel(item)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ExpoStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {numberFormat.format(item.totalBooths)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {numberFormat.format(item.soldBooths)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {numberFormat.format(item.unsoldBooths)}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {formatPercent(item.boothUtilization)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyInventoryState />
      )}
    </section>
  )
}

function EmptyInventoryState() {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center text-muted-foreground text-sm">
      <TrendingUpIcon className="mb-3 size-5 text-primary" />
      No assigned expo inventory available yet.
    </div>
  )
}
