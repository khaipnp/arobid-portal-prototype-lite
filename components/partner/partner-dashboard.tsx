"use client"

import {
  ActivityIcon,
  BarChart3Icon,
  Building2Icon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ExternalLinkIcon,
  FileClockIcon,
  Globe2Icon,
  ShieldCheckIcon,
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
    <div className="flex h-55 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
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
    <Card size="sm" className="overflow-hidden">
      <CardHeader>
        <CardDescription>{eyebrow}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
        <CardAction className="rounded-md bg-muted p-2 text-muted-foreground">
          {icon}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1 text-muted-foreground text-xs">
        <div className="font-medium text-foreground text-sm">{title}</div>
        <div>{note}</div>
      </CardContent>
    </Card>
  )
}

function CapabilityTile({
  title,
  description,
  status,
  href,
  icon,
  muted = false
}: {
  title: string
  description: string
  status: string
  href?: string
  icon: ReactNode
  muted?: boolean
}) {
  const content = (
    <div className="flex h-full gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40">
      <div className="mt-0.5 rounded-md bg-muted p-2 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="font-medium text-sm">{title}</div>
          <Badge variant={muted ? "outline" : "secondary"}>{status}</Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {description}
        </p>
      </div>
      {href ? (
        <ExternalLinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
      ) : null}
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
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

  return (
    <div className="space-y-4 px-4">
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-muted/50">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Partner Overview</Badge>
              <Badge variant="outline">Scoped SSOT data</Badge>
              <Badge variant="outline">Report-only finance controls</Badge>
            </div>
            <div className="max-w-3xl space-y-2">
              <h2 className="font-semibold text-2xl tracking-tight md:text-3xl">
                Partner operating command center
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
                Monitor assigned expo programs, booth quota usage, audience
                signals, and reporting surfaces without exposing unassigned
                Arobid platform data.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-background/75 p-4">
            <div className="flex items-center gap-2 font-medium text-sm">
              <ShieldCheckIcon className="h-4 w-4 text-primary" />
              MVP capability surface
            </div>
            <div className="mt-4 grid gap-2">
              <CapabilityTile
                title="Expo Programs"
                description="Assigned expo operations and booth distribution."
                status="Active"
                href="/partner/expos"
                icon={<ClipboardListIcon className="h-4 w-4" />}
              />
              <CapabilityTile
                title="Enterprises & Members"
                description="Tenant-associated companies remain scoped SSOT records."
                status="Scoped"
                href="/partner/enterprises"
                icon={<Building2Icon className="h-4 w-4" />}
              />
              <CapabilityTile
                title="Analytics & Reports"
                description="Read-only summaries filtered to assigned partner scope."
                status="Report"
                href="/partner/analytics"
                icon={<TrendingUpIcon className="h-4 w-4" />}
              />
              <CapabilityTile
                title="Mini-site analytics"
                description="Prototype traffic view for tenant branded mini-site."
                status="Prototype"
                href="/partner/site-management"
                icon={<FileClockIcon className="h-4 w-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
        <Card>
          <CardHeader>
            <CardTitle>Expo Program Capacity</CardTitle>
            <CardDescription>
              Booth quota consumed versus available inventory across assigned
              programs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasExpoMetrics ? (
              <ChartContainer
                config={chartConfig}
                className="h-80 w-full"
                initialDimension={{ width: 720, height: 320 }}
              >
                <BarChart data={expoChartData} margin={{ top: 20, right: 16 }}>
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
                  />
                  <Bar
                    dataKey="unsoldBooths"
                    stackId="booths"
                    fill="var(--color-unsoldBooths)"
                    radius={[4, 4, 0, 0]}
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

        <Card>
          <CardHeader>
            <CardTitle>Operating Status Mix</CardTitle>
            <CardDescription>
              Lifecycle distribution for assigned Expo Programs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.statusBreakdown.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="mx-auto h-80 max-w-90"
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
            <CardTitle>Analytics Signal Trend</CardTitle>
            <CardDescription>
              Latest GoLIVE reach and event activity available for assigned
              expos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasExpoMetrics ? (
              <ChartContainer
                config={chartConfig}
                className="h-70 w-full"
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
              <EmptyChart label="No analytics signals yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enterprise Activation Proxies</CardTitle>
            <CardDescription>
              Geography and booth tier demand from scoped expo registrations.
            </CardDescription>
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
          <CardTitle>Expo Operations Board</CardTitle>
          <CardDescription>
            Assigned programs ranked by operating health and monetization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
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
                  <TableCell className="max-w-70 whitespace-normal font-medium">
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
