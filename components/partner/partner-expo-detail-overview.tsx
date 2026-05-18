import {
  ActivityIcon,
  Edit3Icon,
  ExternalLinkIcon,
  LockIcon,
  RadioIcon,
  StoreIcon,
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
import type {
  PartnerAssignedExpo,
  PartnerExpoExhibitorsWorkspace,
  PartnerExpoOperationsDetail
} from "@/lib/partner/db"
import { cn } from "@/lib/utils"
import { ExpoStatusBadge } from "../tradexpo/status-badge"
import { PartnerExpoExhibitorsOverviewCard } from "./partner-expo-exhibitors-overview-card"

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
  icon
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
        <CardAction
          className={"rounded-full p-2 bg-muted text-muted-foreground"}
        >
          {icon}
        </CardAction>
      </CardHeader>
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
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm">{tier}</p>
          <p className="text-muted-foreground text-xs">
            {numberFormat.format(published)} Purchased
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm tabular-nums">
            {numberFormat.format(sold)} / {numberFormat.format(capacity)}
          </p>
          <p className="text-muted-foreground text-xs">{utilization}% Sold</p>
        </div>
      </div>
      <Progress value={utilization} />
    </div>
  )
}

export function PartnerExpoDetailOverview({
  assignedExpo,
  operations,
  exhibitorsWorkspace,
  onViewAllExhibitors
}: {
  assignedExpo: PartnerAssignedExpo
  operations: PartnerExpoOperationsDetail
  exhibitorsWorkspace: PartnerExpoExhibitorsWorkspace
  onViewAllExhibitors?: () => void
}) {
  const { expo, assignment, goLiveCount } = assignedExpo
  const publicHref = publicExpoHref(expo.slug)
  const isTurnkey = assignment.partnershipModel === "turnkey"
  const canEditDraft =
    !isTurnkey &&
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
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="grid min-h-75 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <div className="relative min-h-65 overflow-hidden bg-muted">
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
            <div>
              <p className="text-muted-foreground text-xs">GoLIVE</p>
              <p className="font-medium">
                {numberFormat.format(goLiveCount)} sessions
              </p>
            </div>
            {isTurnkey ? (
              <div className="flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900 text-sm">
                <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Configured by Arobid</p>
                  <p className="text-blue-800/80 text-xs">
                    This Turnkey Expo is visible for operations only. Create,
                    configuration, pricing, and publish actions are hidden.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {publicHref ? (
                <Button asChild size="sm">
                  <Link
                    href={publicHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full"
                  >
                    <ExternalLinkIcon />
                    View Expo
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Published Booths"
          value={numberFormat.format(summary.publishedBooths)}
          icon={<StoreIcon />}
        />
        <MetricCard
          title="Product Display"
          value={`${summary.products}`}
          icon={<ActivityIcon />}
        />
        <MetricCard
          title="GoLIVE Reach"
          value={numberFormat.format(summary.peakViewers)}
          icon={<RadioIcon />}
        />
        <MetricCard
          title="Paid Revenue"
          value={currencyFormat.format(summary.revenue)}
          icon={<WalletCardsIcon />}
        />
      </section>

      <section className="flex gap-4">
        <Card className="w-1/2">
          <CardHeader>
            <CardTitle>Booth Tier</CardTitle>
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
        <PartnerExpoExhibitorsOverviewCard
          workspace={exhibitorsWorkspace}
          onViewAll={onViewAllExhibitors}
        />
      </section>
    </div>
  )
}
