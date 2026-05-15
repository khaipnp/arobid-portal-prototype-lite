import {
  BarChart3Icon,
  CircleDashedIcon,
  FileTextIcon,
  LineChartIcon,
  UsersRoundIcon
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type {
  PartnerAnalyticsWorkspace,
  PartnerReportSnapshot
} from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

const reportIcons = {
  expo_overview: BarChart3Icon,
  trade_activity: LineChartIcon,
  industry_insight: FileTextIcon,
  buyer_leads: UsersRoundIcon
}

export function PartnerAnalyticsReportCenter({
  workspace
}: {
  workspace: PartnerAnalyticsWorkspace
}) {
  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {workspace.reports.map((report) => (
          <ReportCard key={report.key} report={report} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Report Source Metrics</CardTitle>
            <CardDescription>
              Automated report inputs from shared platform data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Report usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <MetricRow
                  label="Enterprises supported"
                  value={workspace.summary.enterprises.total}
                  usage="Trade activity"
                />
                <MetricRow
                  label="Expo participation"
                  value={workspace.summary.expoPrograms.assignedExpos}
                  usage="Expo overview"
                />
                <MetricRow
                  label="RFQ generated"
                  value={workspace.summary.overview.rfqGenerated}
                  usage="Buyer leads"
                />
                <MetricRow
                  label="Meetings"
                  value={workspace.sourceMetrics.meetings}
                  usage="Trade activity"
                />
                <MetricRow
                  label="Deal contexts"
                  value={workspace.summary.overview.dealContexts}
                  usage="Trade activity"
                />
                <MetricRow
                  label="Trade value estimate"
                  value={workspace.summary.finance.recordedRevenue}
                  usage="Finance reports"
                  currency
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Funnel</CardTitle>
            <CardDescription>
              Enterprise activation stages used for government reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FunnelRow label="Invited" value={workspace.funnel.invited} />
            <FunnelRow label="Registered" value={workspace.funnel.registered} />
            <FunnelRow
              label="Profile completed"
              value={workspace.funnel.profileCompleted}
            />
            <FunnelRow
              label="Expo activated"
              value={workspace.funnel.expoActivated}
            />
            <FunnelRow
              label="RFQ generated"
              value={workspace.funnel.rfqGenerated}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Top Expo Inputs</CardTitle>
            <CardDescription>
              Ranked by SSOT RFQ activity, revenue, then booth sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workspace.topExpos.length === 0 ? (
              <EmptyState label="No assigned expo data yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expo</TableHead>
                    <TableHead className="text-right">Booths</TableHead>
                    <TableHead className="text-right">RFQ</TableHead>
                    <TableHead className="text-right">Meetings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspace.topExpos.map((expo) => (
                    <TableRow key={expo.expoId}>
                      <TableCell>
                        <p className="font-medium">{expo.expoName}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline">{expo.status}</Badge>
                          <span className="text-muted-foreground text-xs">
                            {expo.boothUtilization}% utilization
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(expo.soldBooths)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(expo.rfqCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(expo.meetings)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currencyFormat.format(expo.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Coverage</CardTitle>
            <CardDescription>
              Source breadth available for automated reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <CoverageRow
              label="Country segments"
              value={workspace.sourceMetrics.countrySegments}
            />
            <CoverageRow
              label="Booth-tier segments"
              value={workspace.sourceMetrics.boothTierSegments}
            />
            <CoverageRow
              label="Open communication threads"
              value={workspace.sourceMetrics.openThreads}
            />
            <CoverageRow
              label="Settlement cycles"
              value={workspace.sourceMetrics.settlementCycles}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function ReportCard({ report }: { report: PartnerReportSnapshot }) {
  const Icon = reportIcons[report.key]

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{report.source}</CardDescription>
            <CardTitle className="mt-1 text-base">{report.title}</CardTitle>
          </div>
          <span className="rounded-md bg-muted p-2 text-foreground">
            <Icon className="h-4 w-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={report.status === "ready" ? "default" : "outline"}>
            {report.status === "ready" ? "Ready" : "Pending"}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {report.metrics
              .reduce((total, metric) => total + metric.value, 0)
              .toLocaleString("en")}{" "}
            signals
          </span>
        </div>
        <p className="text-muted-foreground text-xs">{report.description}</p>
        <div className="grid grid-cols-2 gap-2">
          {report.metrics.map((metric) => (
            <div key={metric.label} className="rounded-md border p-2">
              <p className="text-[11px] text-muted-foreground">
                {metric.label}
              </p>
              <p className="font-medium tabular-nums">
                {numberFormat.format(metric.value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricRow({
  label,
  value,
  usage,
  currency = false
}: {
  label: string
  value: number
  usage: string
  currency?: boolean
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right tabular-nums">
        {currency ? currencyFormat.format(value) : numberFormat.format(value)}
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline">{usage}</Badge>
      </TableCell>
    </TableRow>
  )
}

function FunnelRow({ label, value }: { label: string; value: number }) {
  const capped = Math.min(value * 20, 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="font-medium tabular-nums">
          {numberFormat.format(value)}
        </span>
      </div>
      <Progress value={capped} />
    </div>
  )
}

function CoverageRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">
        {numberFormat.format(value)}
      </span>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
      <CircleDashedIcon className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium">{label}</p>
      <p className="mt-1 max-w-sm text-muted-foreground text-sm">
        Reports will populate when partner programs generate source activity.
      </p>
    </div>
  )
}
