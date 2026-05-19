"use client"

import {
  ActivityIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  EyeIcon,
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
    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-xs">
      <CardHeader className="pb-2">
        <CardDescription className="font-medium text-sm">
          {eyebrow}
        </CardDescription>
        <CardTitle className="font-semibold text-3xl tabular-nums tracking-tight">
          {value}
        </CardTitle>
        <CardAction className="rounded-xl bg-muted p-2.5 text-foreground">
          {icon}
        </CardAction>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">
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
      <div className="mb-3 flex items-center gap-2 text-primary-foreground/75 text-sm font-semibold">
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

  return (
    <div className="space-y-6 px-4 py-4">
      <section className="overflow-hidden rounded-3xl border bg-legend text-primary-foreground shadow-sm">
        <div className="grid gap-5 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_34rem)] p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-h-52 flex-col justify-between gap-6">
            <div className="space-y-4">
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
          </div>
          <div className="w-full flex items-start gap-5 self-start xl:gap-3">
            <div className="w-1/2 grid grid-cols-3 gap-3 xl:grid-cols-1">
              <HeroStat
                label="Viisitor traffic"
                value={numberFormat.format(metrics.totals.liveExpos)}
                icon={<EyeIcon className="size-4" />}
              />
              <HeroStat
                label="Members"
                value={numberFormat.format(metrics.totals.liveExpos)}
                icon={<UsersIcon className="size-4" />}
              />
            </div>

            <div className="w-1/2 grid grid-cols-3 gap-3 xl:grid-cols-1">
              <HeroStat
                label="Live expos"
                value={numberFormat.format(metrics.totals.liveExpos)}
                icon={<RadioTowerIcon className="size-4" />}
              />
              <HeroStat
                label="Booth usage"
                value={formatPercent(metrics.totals.boothUtilization)}
                icon={<ActivityIcon className="size-4" />}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="col-span-2 overflow-x-auto rounded-2xl border">
          <Table className="min-w-2/3">
            <TableHeader>
              <TableRow>
                <TableHead>Expo Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quota used</TableHead>
                <TableHead className="text-right">Utilization</TableHead>
                <TableHead className="text-right">Published</TableHead>
                <TableHead className="text-right">Views</TableHead>
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
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatPercent(item.boothUtilization)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(item.publishedBooths)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {compactNumber.format(item.peakViewers)}
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
