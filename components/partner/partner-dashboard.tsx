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
  Line,
  LineChart,
  XAxis,
  YAxis
} from "recharts"
import { Button } from "@/components/ui/button"
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
import type { PartnerDashboardMetrics } from "@/lib/partner/db"
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

const dashboardDurations = ["3D", "7D", "15D", "30D"] as const

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

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  })
}

function formatRatio(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

function toTrendKey(value: string, index: number) {
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
        <CardContent className="font-semibold text-3xl tabular-nums tracking-tight">
          {numberFormat.format(value)}
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
    useState<(typeof dashboardDurations)[number]>("3D")
  const operationsSummary = metrics.operationsByDuration[selectedDuration]

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
            <div className="flex rounded-xl bg-muted p-1">
              {dashboardDurations.map((duration) => (
                <Button
                  key={duration}
                  size="sm"
                  variant={selectedDuration === duration ? "default" : "ghost"}
                  className="rounded-lg"
                  onClick={() => setSelectedDuration(duration)}
                >
                  {duration}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              label="RFQs"
              value={operationsSummary.rfqs}
              description="RFQs created in the selected duration"
              icon={<RadioTowerIcon className="size-4" />}
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
  const creditRows = [
    {
      label: "Allocated",
      value: allocatedCredits,
      tone: "bg-primary",
      ratio: 100
    },
    {
      label: "Used",
      value: usedCredits,
      tone: "bg-primary",
      ratio: formatRatio(usedCredits, allocatedCredits)
    },
    {
      label: "Expired",
      value: expiredCredits,
      tone: "bg-muted-foreground/60",
      ratio: formatRatio(expiredCredits, allocatedCredits)
    },
    {
      label: "Balance",
      value: balanceCredits,
      tone: "bg-legend",
      ratio: formatRatio(balanceCredits, allocatedCredits)
    }
  ]

  return (
    <section className="space-y-5 xl:col-span-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-2xl">Trade Activity</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Deal Contexts Trend</CardTitle>
            <CardDescription>
              Chat + RFQ + BFM from Partner Site / Expo Entry
            </CardDescription>
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
              <LineChart
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
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  dataKey="dealContexts"
                  type="monotone"
                  stroke="var(--color-dealContexts)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TradeCredits allocated</CardTitle>
            <CardDescription>
              Credit status breakdown by Partner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="font-semibold text-3xl text-legend tabular-nums tracking-tight">
                {compactNumber.format(allocatedCredits)}
              </div>
              <p className="text-muted-foreground text-sm">allocated credits</p>
            </div>
            <div className="space-y-4">
              {creditRows.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="font-mono text-muted-foreground text-xs tabular-nums">
                      {numberFormat.format(item.value)} ·{" "}
                      {formatPercent(item.ratio)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${item.tone}`}
                      style={{ width: `${Math.min(item.ratio, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RFQ Received</CardTitle>
            <CardDescription>Partner-member RFQs by month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-semibold text-3xl text-legend tabular-nums tracking-tight">
                {numberFormat.format(rfqTotal)}
              </div>
              <p className="text-muted-foreground text-sm">received RFQs</p>
            </div>
            <ChartContainer config={rfqTrendConfig} className="h-56 w-full">
              <LineChart
                accessibilityLayer
                data={rfqTrend}
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
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  dataKey="rfqs"
                  type="monotone"
                  stroke="var(--color-rfqs)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
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
                  <TableHead className="text-right">Total booth</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Unsold</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                  <TableRow key={item.expoId}>
                    <TableCell className="max-w-80 whitespace-normal py-4 font-medium">
                      <Link
                        href={`/partner/expo-program/expos/${item.expoId}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {item.expoName}
                      </Link>
                      <div className="text-muted-foreground text-xs">
                        {formatDate(item.startDate)} -{" "}
                        {formatDate(item.endDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ExpoStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(item.totalBooths)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(item.soldBooths)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(item.unsoldBooths)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
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
