"use client"

import { ActivityIcon, EyeIcon, RadioTowerIcon, UsersIcon } from "lucide-react"
import Link from "next/link"
import { type ReactNode, useState } from "react"
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

const dashboardDurations = ["3D", "7D", "15D", "30D"] as const

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  })
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
      <div className="mb-3 flex items-center gap-2 font-semibold text-primary-foreground/75 text-sm">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-xl tabular-nums tracking-tight">
        {value}
      </div>
    </div>
  )
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
    <div className="rounded-2xl border bg-muted/20 p-4 shadow-xs">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
            {label}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {description}
          </p>
        </div>
        <div className="rounded-xl bg-background p-2 text-primary shadow-xs">
          {icon}
        </div>
      </div>
      <div className="font-semibold text-3xl tabular-nums tracking-tight">
        {numberFormat.format(value)}
      </div>
    </div>
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
  const hasCountryData = metrics.countryBreakdown.length > 0
  const hasTierData = metrics.boothTierBreakdown.length > 0

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
          <div className="flex w-full items-start gap-5 self-start xl:gap-3">
            <div className="grid w-1/2 grid-cols-3 gap-3 xl:grid-cols-1">
              <HeroStat
                label="Visitor traffic"
                value={numberFormat.format(operationsSummary.views)}
                icon={<EyeIcon className="size-4" />}
              />
              <HeroStat
                label="Members"
                value={numberFormat.format(
                  operationsSummary.activatedEnterprises
                )}
                icon={<UsersIcon className="size-4" />}
              />
            </div>

            <div className="grid w-1/2 grid-cols-3 gap-3 xl:grid-cols-1">
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
        <Card className="xl:col-span-3">
          <CardHeader>
            <div className="space-y-1">
              <CardDescription>Partner performance snapshot</CardDescription>
              <CardTitle>Operations Summary</CardTitle>
            </div>
            <CardAction>
              <div className="flex rounded-xl bg-muted p-1">
                {dashboardDurations.map((duration) => (
                  <Button
                    key={duration}
                    size="sm"
                    variant={
                      selectedDuration === duration ? "default" : "ghost"
                    }
                    className="rounded-lg"
                    onClick={() => setSelectedDuration(duration)}
                  >
                    {duration}
                  </Button>
                ))}
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricWidget
                label="Views"
                value={operationsSummary.views}
                description="Visitor truy cập trang trong duration đã chọn"
                icon={<EyeIcon className="size-4" />}
              />
              <MetricWidget
                label="Activated Enterprises"
                value={operationsSummary.activatedEnterprises}
                description="Member hoạt động trong duration đã chọn"
                icon={<UsersIcon className="size-4" />}
              />
              <MetricWidget
                label="Sold Booth"
                value={operationsSummary.soldBooths}
                description="Booth đã bán trong duration đã chọn"
                icon={<ActivityIcon className="size-4" />}
              />
              <MetricWidget
                label="RFQs"
                value={operationsSummary.rfqs}
                description="RFQs được tạo trong duration đã chọn"
                icon={<RadioTowerIcon className="size-4" />}
              />
            </div>
          </CardContent>
        </Card>
        <section>
          <h1>Expo and Inventory</h1>
          <p>Expo usage and booth capacity</p>
        </section>
        <section>
          <h1>Trade Activity</h1>
          <p>RFQ and deal movement</p>
        </section>
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
