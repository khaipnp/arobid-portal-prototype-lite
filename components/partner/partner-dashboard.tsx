"use client"

import {
  ActivityIcon,
  BarChart3Icon,
  RadioIcon,
  UsersIcon,
  WalletCardsIcon
} from "lucide-react"
import Link from "next/link"
import { type ReactNode, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
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

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1
})

const numberFormat = new Intl.NumberFormat("en")

const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

const chartConfig = {
  soldBooths: {
    label: "Sold booths",
    color: "var(--chart-1)"
  },
  unsoldBooths: {
    label: "Unsold booths",
    color: "var(--chart-3)"
  },
  boothUtilization: {
    label: "Utilization",
    color: "var(--chart-2)"
  },
  peakViewers: {
    label: "Peak viewers",
    color: "var(--chart-4)"
  },
  goLiveEvents: {
    label: "GoLIVE events",
    color: "var(--chart-5)"
  },
  value: {
    label: "Count",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig

const statusColors: Record<string, string> = {
  Draft: "var(--muted-foreground)",
  "Pending Review": "var(--chart-5)",
  Live: "var(--chart-2)",
  Ended: "var(--chart-3)",
  Archived: "var(--chart-4)",
  Canceled: "var(--destructive)"
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatPercentLabel(value: unknown) {
  return formatPercent(typeof value === "number" ? value : Number(value) || 0)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  })
}

function shortName(name: string) {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length <= 2) return name
  return words.slice(0, 2).join(" ")
}

function getClickedExpoId(event: unknown) {
  return (event as { activePayload?: { payload?: { expoId?: string } }[] })
    ?.activePayload?.[0]?.payload?.expoId
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
      {label}
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
  icon: ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
        <CardAction className="rounded-md bg-muted p-2 text-muted-foreground">
          {icon}
        </CardAction>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">
        {note}
      </CardContent>
    </Card>
  )
}

export function PartnerDashboard({
  metrics
}: {
  metrics: PartnerDashboardMetrics
}) {
  const expoChartData = metrics.expoMetrics.map((item) => ({
    ...item,
    label: shortName(item.expoName)
  }))
  const [selectedExpoId, setSelectedExpoId] = useState(
    metrics.expoMetrics[0]?.expoId ?? ""
  )

  const selectedExpo = useMemo(
    () =>
      metrics.expoMetrics.find((item) => item.expoId === selectedExpoId) ??
      metrics.expoMetrics[0],
    [metrics.expoMetrics, selectedExpoId]
  )

  const hasExpoMetrics = metrics.expoMetrics.length > 0
  const hasCountryData = metrics.countryBreakdown.length > 0
  const hasTierData = metrics.boothTierBreakdown.length > 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Assigned Expos"
          value={numberFormat.format(metrics.totals.assignedExpos)}
          note={`${metrics.totals.liveExpos} live now`}
          icon={<BarChart3Icon className="h-4 w-4" />}
        />
        <MetricCard
          title="Booth Utilization"
          value={formatPercent(metrics.totals.boothUtilization)}
          note={`${numberFormat.format(metrics.totals.soldBooths)} / ${numberFormat.format(metrics.totals.totalBooths)} booths sold`}
          icon={<ActivityIcon className="h-4 w-4" />}
        />
        <MetricCard
          title="GoLIVE Reach"
          value={compactNumber.format(metrics.totals.peakViewers)}
          note={`${numberFormat.format(metrics.totals.goLiveEvents)} sessions / ${numberFormat.format(metrics.totals.comments)} comments`}
          icon={<RadioIcon className="h-4 w-4" />}
        />
        <MetricCard
          title="Paid Revenue"
          value={currencyFormat.format(metrics.totals.revenue)}
          note={`${numberFormat.format(metrics.totals.publishedBooths)} booths published`}
          icon={<WalletCardsIcon className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Expo Inventory and Booth Sales</CardTitle>
            <CardDescription>
              Compare booth capacity, sold booths, and utilization across expos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasExpoMetrics ? (
              <ChartContainer
                config={chartConfig}
                className="h-80 w-full"
                initialDimension={{ width: 720, height: 320 }}
              >
                <BarChart
                  data={expoChartData}
                  margin={{ top: 20, right: 16 }}
                  onClick={(event) => {
                    const expoId = getClickedExpoId(event)
                    if (expoId) setSelectedExpoId(expoId)
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tickMargin={10}
                  />
                  <YAxis tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="soldBooths"
                    stackId="booths"
                    fill="var(--color-soldBooths)"
                    radius={[0, 0, 4, 4]}
                    className="cursor-pointer"
                  >
                    {expoChartData.map((item) => (
                      <Cell
                        key={`sold-${item.expoId}`}
                        fill="var(--color-soldBooths)"
                        opacity={item.expoId === selectedExpoId ? 1 : 0.45}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="unsoldBooths"
                    stackId="booths"
                    fill="var(--color-unsoldBooths)"
                    radius={[4, 4, 0, 0]}
                    className="cursor-pointer"
                  >
                    {expoChartData.map((item) => (
                      <Cell
                        key={`unsold-${item.expoId}`}
                        fill="var(--color-unsoldBooths)"
                        opacity={item.expoId === selectedExpoId ? 1 : 0.35}
                      />
                    ))}
                    <LabelList
                      dataKey="boothUtilization"
                      position="top"
                      formatter={formatPercentLabel}
                      className="fill-foreground font-medium"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChart label="No assigned expo metrics yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expo Status Mix</CardTitle>
            <CardDescription>
              Current lifecycle distribution for partner-owned events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.statusBreakdown.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="mx-auto h-[320px] max-w-[360px]"
                initialDimension={{ width: 360, height: 320 }}
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={metrics.statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={104}
                    paddingAngle={2}
                  >
                    {metrics.statusBreakdown.map((item) => (
                      <Cell
                        key={item.name}
                        fill={statusColors[item.name] ?? "var(--chart-1)"}
                      />
                    ))}
                    <LabelList
                      dataKey="name"
                      position="outside"
                      className="fill-muted-foreground text-xs"
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChart label="No status data yet." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>GoLIVE and Visitor Signals</CardTitle>
            <CardDescription>
              Peak viewers and scheduled GoLIVE activity by expo date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasExpoMetrics ? (
              <ChartContainer
                config={chartConfig}
                className="h-[280px] w-full"
                initialDimension={{ width: 680, height: 280 }}
              >
                <LineChart data={expoChartData} margin={{ top: 16, right: 16 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="startDate"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatDate}
                    tickMargin={10}
                  />
                  <YAxis tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.expoName ?? ""
                        }
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="peakViewers"
                    stroke="var(--color-peakViewers)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="goLiveEvents"
                    stroke="var(--color-goLiveEvents)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <EmptyChart label="No GoLIVE activity yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience and Booth Mix</CardTitle>
            <CardDescription>
              Exhibitor geography and booth tier demand.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <BreakdownList
              title="Country"
              items={metrics.countryBreakdown}
              empty={!hasCountryData}
            />
            <BreakdownList
              title="Booth tier"
              items={metrics.boothTierBreakdown}
              empty={!hasTierData}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expo Operations Board</CardTitle>
          <CardDescription>
            Assigned expos ranked by operational health and monetization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expo Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Booths</TableHead>
                <TableHead className="text-right">Utilization</TableHead>
                <TableHead className="text-right">Published</TableHead>
                <TableHead className="text-right">Visitor</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.expoMetrics.map((item) => (
                <TableRow key={item.expoId}>
                  <TableCell className="max-w-[280px] whitespace-normal font-medium">
                    <Link
                      href={`/partner/expos/${item.expoId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {item.expoName}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ExpoStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(item.soldBooths)} /{" "}
                    {numberFormat.format(item.totalBooths)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(item.boothUtilization)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(item.publishedBooths)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(item.peakViewers)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {currencyFormat.format(item.revenue)}
                  </TableCell>
                </TableRow>
              ))}
              {metrics.expoMetrics.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No assigned expos available for this partner.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function BreakdownList({
  title,
  items,
  empty
}: {
  title: string
  items: { name: string; value: number }[]
  empty: boolean
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 font-medium text-sm">
        <UsersIcon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      {empty ? (
        <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
          No data yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0

            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="font-mono text-muted-foreground text-xs tabular-nums">
                    {numberFormat.format(item.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(percent, 4)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
