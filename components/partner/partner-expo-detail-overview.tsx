import {
  ActivityIcon,
  Building2Icon,
  CalendarDaysIcon,
  Edit3Icon,
  ExternalLinkIcon,
  RadioIcon,
  StoreIcon,
  UsersIcon,
  WalletCardsIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type {
  PartnerAssignedExpo,
  PartnerExpoOperationsDetail
} from "@/lib/partner/db"
import { cn } from "@/lib/utils"
import { ExpoStatusBadge } from "../tradexpo/status-badge"

const numberFormat = new Intl.NumberFormat("en")

const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

const partnerModelLabel: Record<string, string> = {
  co_host: "Co-host",
  turnkey: "Turnkey",
  tenant: "Tenant"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

function formatDateTime(iso?: string) {
  if (!iso) return "Not scheduled"
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function getTimelineLabel(startDate: string, endDate: string) {
  const now = Date.now()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (now < start) return "Upcoming"
  if (now > end) return "Archived"
  return "In progress"
}

function getDaysLabel(startDate: string, endDate: string) {
  const dayMs = 24 * 60 * 60 * 1000
  const now = Date.now()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()

  if (now < start) {
    return `${Math.ceil((start - now) / dayMs)} days to start`
  }

  if (now <= end) {
    return `${Math.max(0, Math.ceil((end - now) / dayMs))} days remaining`
  }

  return `${Math.ceil((now - end) / dayMs)} days since close`
}

function publicExpoHref(slug?: string) {
  return slug ? `/expos/${slug}` : null
}

function MetricCard({
  title,
  value,
  note,
  icon,
  accent = "bg-muted"
}: {
  title: string
  value: string
  note: string
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
        <CardAction
          className={cn("rounded-md p-2 text-muted-foreground", accent)}
        >
          {icon}
        </CardAction>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">
        {note}
      </CardContent>
    </Card>
  )
}

function TierRow({
  tier,
  capacity,
  sold,
  published
}: {
  tier: string
  capacity: number
  sold: number
  published: number
}) {
  const utilization = capacity > 0 ? Math.round((sold / capacity) * 100) : 0

  return (
    <div className="space-y-2 rounded-lg border bg-background/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm">{tier}</p>
          <p className="text-muted-foreground text-xs">
            {numberFormat.format(published)} published
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm tabular-nums">
            {numberFormat.format(sold)} / {numberFormat.format(capacity)}
          </p>
          <p className="text-muted-foreground text-xs">{utilization}% sold</p>
        </div>
      </div>
      <Progress value={utilization} />
    </div>
  )
}

export function PartnerExpoDetailOverview({
  assignedExpo,
  operations
}: {
  assignedExpo: PartnerAssignedExpo
  operations: PartnerExpoOperationsDetail
}) {
  const { expo, assignment, goLiveCount } = assignedExpo
  const publicHref = publicExpoHref(expo.slug)
  const canEditDraft =
    expo.status === "Draft" &&
    assignment.capabilities.includes("edit_expo_content")
  const timelineLabel = getTimelineLabel(expo.startDate, expo.endDate)
  const daysLabel = getDaysLabel(expo.startDate, expo.endDate)
  const primaryCapability = assignment.capabilities
    .slice(0, 4)
    .map((capability) => capability.replaceAll("_", " "))
  const summary = operations.summary

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="grid min-h-[300px] lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
            <div className="relative min-h-[260px] overflow-hidden bg-muted">
              <Image
                src={expo.thumbnailUrl}
                alt={expo.name}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 48vw, 100vw"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/45 to-transparent" />
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <ExpoStatusBadge status={expo.status} />
                <Badge
                  variant="outline"
                  className="border-white/30 bg-black/35 text-white"
                >
                  {timelineLabel}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 p-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                    <span>{expo.timezone ?? "Asia/Bangkok"}</span>
                  </div>
                  <h2 className="font-semibold text-2xl leading-tight">
                    {expo.name}
                  </h2>
                  {expo.description ? (
                    <p className="line-clamp-3 text-muted-foreground text-sm">
                      {expo.description}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Start</p>
                    <p className="font-medium text-sm">
                      {formatDate(expo.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">End</p>
                    <p className="font-medium text-sm">
                      {formatDate(expo.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Window</p>
                    <p className="font-medium text-sm">{daysLabel}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {publicHref ? (
                  <Button asChild size="sm">
                    <Link href={publicHref}>
                      <ExternalLinkIcon />
                      Public page
                    </Link>
                  </Button>
                ) : null}
                {canEditDraft ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/partner/expos/${expo.id}/edit`}>
                      <Edit3Icon />
                      Edit draft
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Partner Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Model</p>
                <p className="font-medium">
                  {partnerModelLabel[assignment.partnershipModel] ??
                    assignment.partnershipModel}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Role</p>
                <p className="font-medium">
                  {assignment.membershipRole.replaceAll("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Owner</p>
                <p className="truncate font-medium">{expo.ownerEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">GoLIVE</p>
                <p className="font-medium">
                  {numberFormat.format(goLiveCount)} sessions
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="font-medium text-sm">Capabilities</p>
              <div className="flex flex-wrap gap-1.5">
                {primaryCapability.map((capability) => (
                  <Badge key={capability} variant="secondary">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Booth Utilization"
          value={`${summary.boothUtilization}%`}
          note={`${numberFormat.format(summary.soldBooths)} / ${numberFormat.format(summary.totalBooths)} booths sold`}
          icon={<ActivityIcon className="h-4 w-4" />}
          accent="bg-emerald-500/10 text-emerald-700"
        />
        <MetricCard
          title="Published Booths"
          value={numberFormat.format(summary.publishedBooths)}
          note={`${numberFormat.format(summary.products)} products listed`}
          icon={<StoreIcon className="h-4 w-4" />}
          accent="bg-blue-500/10 text-blue-700"
        />
        <MetricCard
          title="GoLIVE Reach"
          value={numberFormat.format(summary.peakViewers)}
          note={`${numberFormat.format(summary.goLiveEvents)} events / ${numberFormat.format(summary.comments)} comments`}
          icon={<RadioIcon className="h-4 w-4" />}
          accent="bg-violet-500/10 text-violet-700"
        />
        <MetricCard
          title="Paid Revenue"
          value={currencyFormat.format(summary.revenue)}
          note={`${numberFormat.format(summary.visitors)} paying visitors`}
          icon={<WalletCardsIcon className="h-4 w-4" />}
          accent="bg-amber-500/10 text-amber-700"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Booth Tier Mix</CardTitle>
            <CardDescription>
              Capacity, sold booths, and published booth readiness.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {operations.tierBreakdown.map((tier) => (
              <TierRow key={tier.tier} {...tier} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hall Capacity</CardTitle>
            <CardDescription>
              Booth distribution by configured expo hall.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {operations.hallBreakdown.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hall</TableHead>
                    <TableHead className="text-right">Basic</TableHead>
                    <TableHead className="text-right">Professional</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.hallBreakdown.map((hall) => (
                    <TableRow key={hall.id}>
                      <TableCell className="font-medium">{hall.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(hall.basicQty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(hall.professionalQty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(hall.premiumQty)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {numberFormat.format(hall.capacity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
                No hall capacity configured.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Operational Snapshot</CardTitle>
            <CardDescription>
              Readiness signals across inventory, content, and live operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <SnapshotBlock
              icon={<Building2Icon className="h-4 w-4" />}
              label="Unsold booths"
              value={numberFormat.format(summary.unsoldBooths)}
              note="Available inventory"
            />
            <SnapshotBlock
              icon={<UsersIcon className="h-4 w-4" />}
              label="Active sessions"
              value={numberFormat.format(summary.liveSessions)}
              note="Live now"
            />
            <SnapshotBlock
              icon={<CalendarDaysIcon className="h-4 w-4" />}
              label="Schedule"
              value={timelineLabel}
              note={`${formatDateTime(expo.startAt)} start`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booth Status</CardTitle>
            <CardDescription>Registration states in this expo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {operations.registrationStatusBreakdown.length > 0 ? (
              operations.registrationStatusBreakdown.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 px-3 py-2"
                >
                  <span className="text-sm">{item.status}</span>
                  <span className="font-mono text-muted-foreground text-xs tabular-nums">
                    {numberFormat.format(item.value)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
                No booth registrations yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function SnapshotBlock({
  icon,
  label,
  value,
  note
}: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-lg border bg-background/50 p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-semibold text-xl">{value}</p>
      <p className="mt-1 text-muted-foreground text-xs">{note}</p>
    </div>
  )
}
