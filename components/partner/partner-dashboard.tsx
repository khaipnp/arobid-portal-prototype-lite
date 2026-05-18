"use client"

import {
  ActivityIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  Globe2Icon,
  RadioTowerIcon,
  TrendingUpIcon,
  UsersIcon
} from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
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
import { Badge } from "@/components/ui/badge"
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
    label: "Used booths",
    color: "var(--chart-1)"
  },
  unsoldBooths: {
    label: "Available booths",
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

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-55 items-center justify-center rounded-xl border border-dashed bg-muted/20 text-muted-foreground text-sm">
      {label}
    </div>
  )
}

function MetricCard({
  title,
  value,
  note,
  icon,
  eyebrow
}: {
  title: string
  value: string
  note: string
  icon: ReactNode
  eyebrow: string
}) {
  return (
    <Card
      size="sm"
      className="overflow-hidden border-border/70 bg-card/90 shadow-xs"
    >
      <CardHeader className="pb-2">
        <CardDescription className="font-medium text-[0.7rem] uppercase tracking-[0.18em]">
          {eyebrow}
        </CardDescription>
        <CardTitle className="font-semibold text-3xl tabular-nums tracking-tight">
          {value}
        </CardTitle>
        <CardAction className="rounded-xl bg-primary/10 p-2.5 text-primary">
          {icon}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1.5 text-muted-foreground text-xs">
        <div className="font-medium text-foreground text-sm">{title}</div>
        <div className="leading-relaxed">{note}</div>
      </CardContent>
    </Card>
  )
}

function HeroStat({
  label,
  value,
  icon
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-primary-foreground shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-primary-foreground/75 text-xs uppercase tracking-[0.16em]">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-xl tabular-nums tracking-tight">
        {value}
      </div>
    </div>
  )
}

function InsightCard({
  label,
  value,
  description,
  icon
}: {
  label: string
  value: string
  description: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
          {label}
        </div>
        <div className="rounded-lg bg-background p-2 text-primary shadow-xs">
          {icon}
        </div>
      </div>
      <div className="font-semibold text-2xl tabular-nums tracking-tight">
        {value}
      </div>
      <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
        {description}
      </p>
    </div>
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
  const hasExpoMetrics = metrics.expoMetrics.length > 0
  const hasCountryData = metrics.countryBreakdown.length > 0
  const hasTierData = metrics.boothTierBreakdown.length > 0
  const demoMiniSiteViews = 2480
  const totalRevenue = metrics.expoMetrics.reduce(
    (sum, item) => sum + item.revenue,
    0
  )
  const totalGoLiveEvents = metrics.expoMetrics.reduce(
    (sum, item) => sum + item.goLiveEvents,
    0
  )
  const totalPeakViewers = metrics.expoMetrics.reduce(
    (sum, item) => sum + item.peakViewers,
    0
  )
  const leadingStatus = metrics.statusBreakdown[0]

  return (
    <div className="space-y-6 px-4 pb-8">
      <section className="overflow-hidden rounded-3xl border bg-primary text-primary-foreground shadow-sm">
        <div className="grid gap-5 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_34rem)] p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-h-52 flex-col justify-between gap-6">
            <div className="space-y-4">
              <Badge className="border-white/20 bg-white/15 text-primary-foreground hover:bg-white/20">
                Analytics hub
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl font-semibold text-3xl tracking-tight sm:text-4xl lg:text-[2.65rem]">
                  Partner Analytics Command Center
                </h1>
                <p className="max-w-2xl text-primary-foreground/75 text-sm leading-6 sm:text-base">
                  Follow capacity, activation, revenue, and live engagement
                  signals across assigned Expo Programs.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-primary-foreground/70 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1">
                Scoped partner data
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                Realtime-ready signals
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                Expo operations health
              </span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <HeroStat
              label="Live expos"
              value={numberFormat.format(metrics.totals.liveExpos)}
              icon={<RadioTowerIcon className="h-3.5 w-3.5" />}
            />
            <HeroStat
              label="Booth usage"
              value={formatPercent(metrics.totals.boothUtilization)}
              icon={<ActivityIcon className="h-3.5 w-3.5" />}
            />
            <HeroStat
              label="Revenue"
              value={currencyFormat.format(totalRevenue)}
              icon={<CircleDollarSignIcon className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          eyebrow="Assigned Expos"
          title="Programs under partner scope"
          value={numberFormat.format(metrics.totals.assignedExpos)}
          note={`${metrics.totals.liveExpos} live now; hidden data stays outside partner scope`}
          icon={<BarChart3Icon className="h-4 w-4" />}
        />
        <MetricCard
          eyebrow="Booth Quota"
          title="Expo booths used"
          value={formatPercent(metrics.totals.boothUtilization)}
          note={`${numberFormat.format(metrics.totals.soldBooths)} / ${numberFormat.format(metrics.totals.totalBooths)} booths consumed`}
          icon={<ActivityIcon className="h-4 w-4" />}
        />
        <MetricCard
          eyebrow="Tenant Mini-site"
          title="Mini-site views"
          value={compactNumber.format(demoMiniSiteViews)}
          note="Prototype traffic signal until public mini-site analytics is connected"
          icon={<Globe2Icon className="h-4 w-4" />}
        />
        <MetricCard
          eyebrow="Activation"
          title="Published exhibitor booths"
          value={numberFormat.format(metrics.totals.publishedBooths)}
          note="Proxy for enterprise activation until association funnel data lands"
          icon={<CheckCircle2Icon className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardDescription>Capacity analytics</CardDescription>
              <CardTitle>Expo Program Capacity</CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary">
                {numberFormat.format(metrics.totals.soldBooths)} used
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {hasExpoMetrics ? (
              <ChartContainer
                config={chartConfig}
                className="h-80 w-full"
                initialDimension={{ width: 760, height: 320 }}
              >
                <BarChart data={expoChartData} margin={{ top: 24, right: 16 }}>
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
                    radius={[0, 0, 6, 6]}
                  />
                  <Bar
                    dataKey="unsoldBooths"
                    stackId="booths"
                    fill="var(--color-unsoldBooths)"
                    radius={[6, 6, 0, 0]}
                  >
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
              <EmptyChart label="No assigned expo program metrics yet." />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardDescription>Operating mix</CardDescription>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.statusBreakdown.length > 0 ? (
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto h-52 max-w-76"
                  initialDimension={{ width: 304, height: 208 }}
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={metrics.statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={82}
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

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <InsightCard
              label="Dominant status"
              value={leadingStatus?.name ?? "No data"}
              description={
                leadingStatus
                  ? `${numberFormat.format(leadingStatus.value)} programs in this lifecycle state.`
                  : "No lifecycle data for scoped programs yet."
              }
              icon={<TrendingUpIcon className="h-4 w-4" />}
            />
            <InsightCard
              label="GoLIVE events"
              value={numberFormat.format(totalGoLiveEvents)}
              description="Event activity across assigned expo programs."
              icon={<RadioTowerIcon className="h-4 w-4" />}
            />
            <InsightCard
              label="Peak viewers"
              value={compactNumber.format(totalPeakViewers)}
              description="Combined peak audience signal from available analytics."
              icon={<UsersIcon className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardDescription>Engagement trend</CardDescription>
              <CardTitle>Analytics Signal Trend</CardTitle>
            </div>
            <CardAction>
              <Badge variant="outline">Viewers + events</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {hasExpoMetrics ? (
              <ChartContainer
                config={chartConfig}
                className="h-72 w-full"
                initialDimension={{ width: 700, height: 288 }}
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
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="goLiveEvents"
                    stroke="var(--color-goLiveEvents)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <EmptyChart label="No analytics signals yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Activation proxies</CardDescription>
            <CardTitle>Enterprise Demand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <BreakdownList
              title="Company geography"
              items={metrics.countryBreakdown}
              empty={!hasCountryData}
            />
            <BreakdownList
              title="Booth tier demand"
              items={metrics.boothTierBreakdown}
              empty={!hasTierData}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Program drilldown</CardDescription>
            <CardTitle>Expo Operations Board</CardTitle>
          </div>
          <CardAction>
            <Badge variant="secondary">
              {numberFormat.format(metrics.expoMetrics.length)} programs
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Quota used</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                  <TableHead className="text-right">Published</TableHead>
                  <TableHead className="text-right">Signals</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.expoMetrics.map((item) => (
                  <TableRow key={item.expoId}>
                    <TableCell className="max-w-72 whitespace-normal py-4 font-medium">
                      <Link
                        href={`/partner/expos/${item.expoId}`}
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
                      {numberFormat.format(item.soldBooths)} /{" "}
                      {numberFormat.format(item.totalBooths)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPercent(item.boothUtilization)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(item.publishedBooths)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {compactNumber.format(item.peakViewers)} viewers ·{" "}
                      {numberFormat.format(item.comments)} comments
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {currencyFormat.format(item.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
                {metrics.expoMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <span>No assigned expo programs available yet.</span>
                        <Link
                          href="/partner/expos"
                          className="rounded-md border px-3 py-2 font-medium text-foreground text-sm underline-offset-4 hover:underline"
                        >
                          Go to Expo Programs
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
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
        <UsersIcon className="h-4 w-4 text-primary" />
        {title}
      </div>
      {empty ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-muted-foreground text-sm">
          No data yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0

            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{item.name}</span>
                  <span className="font-mono text-muted-foreground text-xs tabular-nums">
                    {numberFormat.format(item.value)} · {formatPercent(percent)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${percent}%` }}
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
