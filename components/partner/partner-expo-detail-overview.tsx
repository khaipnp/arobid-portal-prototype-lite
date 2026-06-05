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
import { PartnerExpoExhibitorsOverviewCard } from "./partner-expo-exhibitors-overview-card"

const numberFormat = new Intl.NumberFormat("en")

const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

const _partnerModelLabel: Record<string, string> = {
  co_host: "Co-host",
  turnkey: "Turnkey",
  tenant: "Tenant"
}

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short"
})

function formatDateTime(iso?: string | null) {
  if (!iso) return "TBA"

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "TBA"

  return dateTimeFormat.format(date)
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
  return slug ? `tradexpo/expos/${slug}` : null
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
        <CardTitle>{title}</CardTitle>
        <CardAction className="text-legend">{icon}</CardAction>
      </CardHeader>
      <CardContent className="font-semibold text-lg tabular-nums">
        {value}
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
  const { expo, assignment } = assignedExpo
  const publicHref = publicExpoHref(expo.slug)
  const isTurnkey = assignment.partnershipModel === "turnkey"
  const canEditDraft =
    !isTurnkey &&
    expo.status === "Draft" &&
    assignment.capabilities.includes("edit_expo_content")
  const timelineLabel = getTimelineLabel(
    expo.startDate ?? "",
    expo.endDate ?? ""
  )
  const canViewPublicExpo =
    timelineLabel === "Upcoming" || expo.status === "Live"
  const daysLabel = getDaysLabel(expo.startDate ?? "", expo.endDate ?? "")
  const summary = operations.summary

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-4xl border">
        <div className="grid lg:grid-cols-2">
          <Image
            src={expo.thumbnailUrl}
            alt={expo.name}
            className="aspect-video max-h-72 object-cover"
            width="1600"
            height="900"
            priority
          />

          <div className="flex flex-1 flex-col justify-between gap-6 p-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
                  <span>{expo.timezone ?? "Asia/Bangkok"}</span>
                  <div className="flex flex-wrap gap-2">
                    {publicHref && canViewPublicExpo ? (
                      <Button asChild size="sm" variant="link">
                        <Link
                          href={publicHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full"
                        >
                          <ExternalLinkIcon className="size-3" />
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
                <h2 className="font-semibold text-lg leading-tight">
                  {expo.name}
                </h2>
                {expo.description ? (
                  <p className="line-clamp-4 text-muted-foreground text-sm">
                    {expo.description}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <p className="font-medium text-sm">{expo.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Start</p>
                  <p className="font-medium text-sm">
                    {formatDateTime(expo.startAt ?? expo.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">End</p>
                  <p className="font-medium text-sm">
                    {formatDateTime(expo.endAt ?? expo.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Remain</p>
                  <p className="font-medium text-sm">{daysLabel}</p>
                </div>
              </div>
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
          </div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
          title="Share"
          value={numberFormat.format(summary.peakViewers)}
          icon={<RadioIcon />}
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

      <section className="grid gap-4 xl:grid-cols-2">
        <Card size="sm">
          <CardHeader className="border-b">
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
