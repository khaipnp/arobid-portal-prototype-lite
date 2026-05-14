import type { LucideIcon } from "lucide-react"
import {
  BadgeCheckIcon,
  Building2Icon,
  CircleDashedIcon,
  ClipboardListIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  WalletCardsIcon
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { PartnerPortalSummary } from "@/lib/partner/db"
import { formatPartnerModel, formatPartnerType } from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

type Metric = {
  label: string
  value: string
  note: string
  icon: LucideIcon
}

type Row = {
  label: string
  value: string
  status?: string
}

export function PartnerPortalSection({
  summary,
  eyebrow,
  title,
  description,
  metrics,
  rows,
  emptyTitle,
  emptyDescription,
  primaryHref,
  primaryLabel
}: {
  summary: PartnerPortalSummary
  eyebrow: string
  title: string
  description: string
  metrics: Metric[]
  rows: Row[]
  emptyTitle: string
  emptyDescription: string
  primaryHref?: string
  primaryLabel?: string
}) {
  const hasRows = rows.some((row) => row.value !== "0")
  const organization = summary.organization

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardDescription>{eyebrow}</CardDescription>
                <CardTitle className="mt-1 text-2xl">{title}</CardTitle>
              </div>
              {primaryHref && primaryLabel ? (
                <Button asChild size="sm">
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {description}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Partner Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Organization</p>
              <p className="font-medium">
                {organization?.name ?? "No active partner organization"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {organization ? (
                <>
                  <Badge variant="secondary">
                    {formatPartnerType(organization.partnerType)}
                  </Badge>
                  <Badge variant="outline">
                    {formatPartnerModel(organization.model)}
                  </Badge>
                  <Badge variant="outline">
                    {organization.membershipRole.replaceAll("_", " ")}
                  </Badge>
                </>
              ) : (
                <Badge variant="outline">No scope</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operating Status</CardTitle>
            <CardDescription>
              DB-backed totals for current partner organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasRows ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.value}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {row.status ?? "Tracked"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
                <CircleDashedIcon className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">{emptyTitle}</p>
                <p className="mt-1 max-w-md text-muted-foreground text-sm">
                  {emptyDescription}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <ControlPrinciples />
      </section>
    </div>
  )
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon

  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {metric.value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-start gap-3 text-muted-foreground text-xs">
        <span className="rounded-md bg-muted p-2 text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <span>{metric.note}</span>
      </CardContent>
    </Card>
  )
}

function ControlPrinciples() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Controls</CardTitle>
        <CardDescription>Partner Portal keeps Arobid as SSOT.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ControlItem
          icon={ShieldCheckIcon}
          title="Context-based interaction"
          value={75}
        />
        <ControlItem
          icon={WalletCardsIcon}
          title="Platform payment control"
          value={60}
        />
        <ControlItem
          icon={BadgeCheckIcon}
          title="Partner revenue transparency"
          value={50}
        />
        <ControlItem
          icon={ClipboardListIcon}
          title="Quota tracking"
          value={65}
        />
      </CardContent>
    </Card>
  )
}

function ControlItem({
  icon: Icon,
  title,
  value
}: {
  icon: LucideIcon
  title: string
  value: number
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{title}</span>
      </div>
      <Progress value={value} />
    </div>
  )
}

export const partnerPortalIcons = {
  building: Building2Icon,
  clipboard: ClipboardListIcon,
  message: MessageSquareIcon,
  wallet: WalletCardsIcon
}
