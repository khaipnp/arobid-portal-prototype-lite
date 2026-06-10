import {
  AlertTriangleIcon,
  CircleDashedIcon,
  ClockIcon,
  EyeIcon,
  MousePointerClickIcon,
  PercentIcon,
  Share2Icon
} from "lucide-react"
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
  PartnerReferralAnalytics,
  PartnerReferralDateRange,
  PartnerReferralShareChannel
} from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")

const percentFormat = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1
})

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short"
})

const dateRangeOptions: {
  value: PartnerReferralDateRange
  label: string
}[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" }
]

const channelOptions: {
  value: PartnerReferralShareChannel | "all"
  label: string
}[] = [
  { value: "all", label: "All channels" },
  { value: "copy", label: "Copy" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "zalo", label: "Zalo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" }
]

const channelLabels: Record<PartnerReferralShareChannel, string> = {
  copy: "Copy",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  zalo: "Zalo",
  whatsapp: "WhatsApp",
  email: "Email"
}

function formatDateTime(value: string | null) {
  if (!value) return "Unavailable"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unavailable"

  return dateTimeFormat.format(date)
}

function formatPercent(value: number) {
  return `${percentFormat.format(value)}%`
}

function analyticsHref({
  expoId,
  range,
  channel
}: {
  expoId: string
  range: PartnerReferralDateRange
  channel: PartnerReferralShareChannel | "all"
}) {
  const params = new URLSearchParams()
  params.set("tab", "referrals")
  params.set("referralRange", range)
  params.set("referralChannel", channel)

  return `/partner/expo-program/expos/${expoId}?${params.toString()}`
}

function MetricTile({
  label,
  value,
  hint,
  icon
}: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardAction className="text-legend">{icon}</CardAction>
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-2xl tabular-nums">{value}</p>
        <p className="mt-1 text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  )
}

function AnalyticsState({
  kind,
  title,
  description
}: {
  kind: "empty" | "unavailable"
  title: string
  description: string
}) {
  const Icon = kind === "empty" ? CircleDashedIcon : AlertTriangleIcon

  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center">
      <Icon className="mb-3 size-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-lg text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  )
}

function FilterGroup({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function ChannelRow({
  label,
  views,
  conversions,
  conversionRate,
  totalViews
}: {
  label: string
  views: number
  conversions: number
  conversionRate: number
  totalViews: number
}) {
  const viewShare = totalViews > 0 ? Math.round((views / totalViews) * 100) : 0

  return (
    <div className="space-y-2 rounded-2xl border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-muted-foreground text-xs">
            {numberFormat.format(views)} views ·{" "}
            {numberFormat.format(conversions)} conversions
          </p>
        </div>
        <Badge variant="outline">{formatPercent(conversionRate)}</Badge>
      </div>
      <Progress value={viewShare} />
      <p className="text-muted-foreground text-xs">
        {formatPercent(viewShare)} of filtered referral traffic
      </p>
    </div>
  )
}

export function PartnerExpoReferralAnalyticsCard({
  expoId,
  analytics
}: {
  expoId: string
  analytics: PartnerReferralAnalytics
}) {
  const hasData = analytics.status === "ready"

  return (
    <Card aria-labelledby="referral-analytics-title">
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle id="referral-analytics-title">
            Referral analytics
          </CardTitle>
          <CardDescription>
            Expo Detail referral traffic, conversion intent, attribution window,
            and channel mix for this assigned Expo.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant={hasData ? "default" : "outline"}>
            {hasData ? "Live data" : "No data"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border bg-muted/30 p-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-2 text-muted-foreground text-sm">
            <ClockIcon className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Last updated</p>
              <p>{formatDateTime(analytics.lastUpdatedAt)}</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[auto_auto]">
            <FilterGroup label="Date range">
              {dateRangeOptions.map((option) => (
                <Button
                  asChild
                  key={option.value}
                  size="sm"
                  variant={
                    analytics.dateRange === option.value ? "default" : "outline"
                  }
                >
                  <Link
                    href={analyticsHref({
                      expoId,
                      range: option.value,
                      channel: analytics.channel
                    })}
                    aria-current={
                      analytics.dateRange === option.value ? "page" : undefined
                    }
                  >
                    {option.label}
                  </Link>
                </Button>
              ))}
            </FilterGroup>
            <FilterGroup label="Channel">
              {channelOptions.map((option) => (
                <Button
                  asChild
                  key={option.value}
                  size="sm"
                  variant={
                    analytics.channel === option.value ? "default" : "outline"
                  }
                >
                  <Link
                    href={analyticsHref({
                      expoId,
                      range: analytics.dateRange,
                      channel: option.value
                    })}
                    aria-current={
                      analytics.channel === option.value ? "page" : undefined
                    }
                  >
                    {option.label}
                  </Link>
                </Button>
              ))}
            </FilterGroup>
          </div>
        </div>

        {analytics.status === "unavailable" ? (
          <AnalyticsState
            kind="unavailable"
            title="Referral data unavailable"
            description="Tracking data or refresh timestamp is not available yet. Metrics stay hidden to avoid misleading reporting."
          />
        ) : analytics.status === "empty" ? (
          <AnalyticsState
            kind="empty"
            title="No referral activity yet"
            description="Referral metrics will populate after visitors land on referral-enabled Expo Detail links and take conversion actions."
          />
        ) : (
          <>
            <section
              className="grid gap-3 md:grid-cols-3"
              aria-label="Referral metric summary"
            >
              <MetricTile
                label="Page views"
                value={numberFormat.format(analytics.pageViews)}
                hint="Referral landings in selected range"
                icon={<EyeIcon />}
              />
              <MetricTile
                label="Conversions"
                value={numberFormat.format(analytics.conversions)}
                hint="Clicks inside 7-day attribution window"
                icon={<MousePointerClickIcon />}
              />
              <MetricTile
                label="Conversion rate"
                value={formatPercent(analytics.conversionRate)}
                hint="Conversions divided by referral page views"
                icon={<PercentIcon />}
              />
            </section>

            <section
              className="space-y-3"
              aria-label="Referral channel breakdown"
            >
              <div className="flex items-center gap-2">
                <Share2Icon className="size-4 text-legend" />
                <h3 className="font-medium text-sm">Channel breakdown</h3>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {analytics.channelBreakdown.map((channel) => (
                  <ChannelRow
                    key={channel.channel}
                    label={channelLabels[channel.channel]}
                    views={channel.views}
                    conversions={channel.conversions}
                    conversionRate={channel.conversionRate}
                    totalViews={analytics.pageViews}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  )
}
