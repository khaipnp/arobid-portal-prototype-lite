"use client"

import {
  ActivityIcon,
  EyeIcon,
  GaugeIcon,
  InfoIcon,
  RadioTowerIcon,
  TrendingDownIcon,
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
  Line,
  LineChart,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PartnerDashboardMetrics } from "@/lib/partner/db"
import { formatExpoScheduleLabel } from "@/lib/tradexpo/schedule"
import { ExpoStatusBadge } from "../tradexpo/status-badge"
import { Badge } from "../ui/badge"
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

const tierTrendColors = [
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

type MetricComparison = {
  value: string
  tone: "positive" | "negative" | "neutral"
}

function buildPeriodComparison(
  value: number,
  previousValue: number
): MetricComparison {
  if (previousValue === 0) {
    return {
      value: value > 0 ? "New" : "0%",
      tone: value > 0 ? "positive" : "neutral"
    }
  }

  const deltaPercent = Math.round(
    ((value - previousValue) / previousValue) * 100
  )

  return {
    value: `${deltaPercent > 0 ? "+" : ""}${formatPercent(deltaPercent)}`,
    tone:
      deltaPercent > 0 ? "positive" : deltaPercent < 0 ? "negative" : "neutral"
  }
}

function getComparisonToneClass(tone: MetricComparison["tone"]) {
  if (tone === "positive") return "bg-green-200/70 text-green-700"
  if (tone === "negative") return "bg-red-200/70 text-red-700"
  return "bg-muted text-muted-foreground"
}

function toTrendKey(value: string, index: number) {
  return `tier_${index}_${value.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
}

function MetricWidget({
  label,
  value,
  description,
  icon,
  comparison
}: {
  label: string
  value: number
  description: string
  icon: ReactNode
  comparison?: MetricComparison
}) {
  return (
    <TooltipProvider>
      <Card>
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
        <CardContent className="flex flex-1 items-end justify-between gap-2">
          <div className="font-semibold text-3xl tabular-nums leading-none tracking-tight">
            {numberFormat.format(value)}
          </div>
          {comparison ? (
            <Badge
              className={`px-1.5 tabular-nums ${getComparisonToneClass(comparison.tone)}`}
            >
              {comparison.value}{" "}
              {comparison.tone === "positive" ? (
                <TrendingUpIcon strokeWidth="2.5" />
              ) : comparison.tone === "negative" ? (
                <TrendingDownIcon strokeWidth="2.5" />
              ) : null}
            </Badge>
          ) : null}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

export function PartnerDashboard({
  metrics
}: {
  metrics: PartnerDashboardMetrics
}) {
  const [selectedDuration, setSelectedDuration] =
    useState<(typeof dashboardDurations)[number]>("1D")
  const operationsSummary = metrics.operationsByDuration[selectedDuration]
  const previousOperationsSummary =
    metrics.previousOperationsByDuration[selectedDuration]

  return (
    <div className="space-y-6 px-4 py-4">
      <section className="overflow-hidden rounded-4xl border bg-legend text-primary-foreground shadow-md">
        <div className="relative flex gap-8 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_34rem)] p-5 sm:p-10">
          <div className="flex max-w-1/2 flex-col gap-2">
            <h1 className="select-none font-semibold text-2xl tracking-tight sm:text-3xl">
              Partner Analytics Command Center
            </h1>
            <p className="select-none text-primary-foreground/70 text-sm leading-relaxed sm:text-lg">
              Follow capacity, activation, revenue, and live engagement signals
              across assigned Expo Programs.
            </p>
          </div>
          <GaugeIcon
            className="absolute -right-4 -bottom-7 size-48 text-primary-foreground/40"
            strokeWidth="2.5"
          />
        </div>
      </section>

      <div className="grid gap-12 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-2xl">Operations Summary</h2>
            <Tabs
              value={selectedDuration}
              onValueChange={(value) =>
                setSelectedDuration(
                  value as (typeof dashboardDurations)[number]
                )
              }
            >
              <TabsList className="rounded-xl p-1">
                {dashboardDurations.map((duration) => (
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
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricWidget
              label="Visitor Traffic"
              value={operationsSummary.views}
              description="Visitor activity in the selected duration"
              icon={<EyeIcon className="size-4" />}
              comparison={buildPeriodComparison(
                operationsSummary.views,
                previousOperationsSummary.views
              )}
            />
            <MetricWidget
              label="Activated Members"
              value={operationsSummary.activatedEnterprises}
              description="Member activity in the selected duration"
              icon={<UsersIcon className="size-4" />}
              comparison={buildPeriodComparison(
                operationsSummary.activatedEnterprises,
                previousOperationsSummary.activatedEnterprises
              )}
            />
            <MetricWidget
              label="Sold Booth"
              value={operationsSummary.soldBooths}
              description="Booth sold in the selected duration"
              icon={<ActivityIcon className="size-4" />}
              comparison={buildPeriodComparison(
                operationsSummary.soldBooths,
                previousOperationsSummary.soldBooths
              )}
            />
            <MetricWidget
              label="RFQs"
              value={operationsSummary.rfqs}
              description="RFQs created in the selected duration"
              icon={<RadioTowerIcon className="size-4" />}
              comparison={buildPeriodComparison(
                operationsSummary.rfqs,
                previousOperationsSummary.rfqs
              )}
            />
          </div>
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
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Deal Contexts Trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-semibold text-3xl text-legend tabular-nums tracking-tight">
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

        <Card>
          <CardHeader className="border-b">
            <CardTitle>TradeCredits Allocated</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="font-semibold text-3xl text-legend tabular-nums tracking-tight">
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

        <Card>
          <CardHeader className="border-b">
            <CardTitle>RFQ Received</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-semibold text-3xl text-legend tabular-nums tracking-tight">
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
  const tiers = Array.from(
    new Set(metrics.boothTierMonthlyTrend.map((item) => item.tier))
  )
  const tierKeys = tiers.map((tier, index) => ({
    tier,
    key: toTrendKey(tier, index),
    color: tierTrendColors[index % tierTrendColors.length]
  }))
  const trendConfig = tierKeys.reduce<ChartConfig>((acc, item) => {
    acc[item.key] = {
      label: item.tier,
      color: item.color
    }
    return acc
  }, {})
  const trendData = Array.from(
    metrics.boothTierMonthlyTrend.reduce((acc, item) => {
      const month = acc.get(item.monthKey) ?? {
        monthKey: item.monthKey,
        monthLabel: item.monthLabel
      }
      const tierKey = tierKeys.find((tier) => tier.tier === item.tier)?.key
      if (tierKey) {
        month[tierKey] = item.soldBooths
      }
      acc.set(item.monthKey, month)
      return acc
    }, new Map<string, Record<string, string | number>>())
  ).map(([, value]) => value)
  const hasExpoData = inventoryData.length > 0
  const hasTrendData = trendData.length > 0 && tierKeys.length > 0

  return (
    <section className="space-y-5 xl:col-span-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-2xl">Expo and Inventory</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">Booth sold vs unsold</CardTitle>
            <CardDescription>Capacity allocation by Expo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {hasExpoData ? (
              <ChartContainer
                config={inventoryChartConfig}
                className="h-80 w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={inventoryData}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="expoName"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={118}
                    tickFormatter={(value) => String(value).slice(0, 18)}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="soldBooths"
                    stackId="booths"
                    fill="var(--color-soldBooths)"
                    radius={[4, 0, 0, 4]}
                  />
                  <Bar
                    dataKey="unsoldBooths"
                    stackId="booths"
                    fill="var(--color-unsoldBooths)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyInventoryState />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="capitalize">Purchased booth trend</CardTitle>
            <CardDescription>Last 6 months by booth tier</CardDescription>
          </CardHeader>
          <CardContent>
            {hasTrendData ? (
              <ChartContainer config={trendConfig} className="h-80 w-full">
                <LineChart
                  accessibilityLayer
                  data={trendData}
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {tierKeys.map((item) => (
                    <Line
                      key={item.key}
                      dataKey={item.key}
                      type="monotone"
                      stroke={`var(--color-${item.key})`}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            ) : (
              <EmptyInventoryState />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 space-y-5">
        <h2 className="font-semibold text-2xl capitalize">
          Expo inventory board
        </h2>
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
      </div>
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
