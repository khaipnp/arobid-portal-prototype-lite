import {
  CalendarDaysIcon,
  Clock3Icon,
  HistoryIcon,
  MailIcon,
  ShieldCheckIcon,
  SparklesIcon
} from "lucide-react"
import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { UserAvatar } from "@/components/user-avatar"
import { requireRole } from "@/lib/auth/rbac"
import { getPartnerEnterpriseMemberDetail } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

const numberFormat = new Intl.NumberFormat("en")
const dateFormat = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric"
})

function formatDate(value: string | null) {
  if (!value) return "—"
  return dateFormat.format(new Date(value))
}

function getEnterpriseInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}

export const dynamic = "force-dynamic"

export default async function PartnerEnterpriseDetailPage({
  params
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const detail = await getPartnerEnterpriseMemberDetail(userId, memberId)
  if (!detail) notFound()

  const { member, activities } = detail

  return (
    <DashboardShell
      title="Member Detail"
      breadcrumbs={[
        { label: "Dashboard", href: "/partner" },
        { label: "Partner Site Management" },
        { label: "Members", href: "/partner/partner-site/enterprises" },
        { label: member.enterpriseName }
      ]}
      showBackButton
    >
      <div className="mt-6 space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border">
          <div className="border-b bg-linear-to-br from-legend/15 via-background to-muted/40 p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <UserAvatar
                  className="h-20 w-20"
                  name={member.enterpriseName}
                  imageUrl={member.logoUrl}
                />
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="capitalize">
                      {member.activationStatus.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <h2 className="max-w-3xl text-balance font-semibold text-3xl tracking-tight md:text-4xl">
                      {member.enterpriseName}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-4 text-muted-foreground text-sm">
                      <span className="inline-flex items-center gap-2">
                        <MailIcon className="h-4 w-4" />
                        {member.contactEmail || "No contact email"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Joined {formatDate(member.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3Icon className="h-4 w-4" />
                        Updated {formatDate(member.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            <HeroStat
              label="Expo participation"
              value={numberFormat.format(member.expoParticipationCount)}
            />
            <HeroStat
              label="RFQs generated"
              value={numberFormat.format(member.rfqGeneratedCount)}
            />
            <HeroStat
              label="Trade signals"
              value={numberFormat.format(member.tradeSignalCount)}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-legend" />
                  Member Profile
                </CardTitle>
                <CardDescription>
                  Association metadata scoped to current partner organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem label="Source" value={member.source} />
                <DetailItem
                  label="Last action"
                  value={member.lastAction ?? "—"}
                />
                <DetailItem
                  label="Accepted date"
                  value={formatDate(member.acceptedAt)}
                />
                <DetailItem
                  label="Removed date"
                  value={formatDate(member.removedAt)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-legend" />
                  Program Metrics
                </CardTitle>
                <CardDescription>
                  Quota, trade signals, and deal context usage.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <MetricCard
                  title="Deal context"
                  value={
                    member.dealContextStage?.replaceAll("_", " ") ??
                    "No context"
                  }
                  note={`${numberFormat.format(member.dealContextEvents)} events`}
                />
                <MetricCard
                  title="Quota allocated"
                  value={numberFormat.format(member.quotaAllocatedQuantity)}
                  note={`${numberFormat.format(member.quotaConsumedQuantity)} consumed`}
                />
                <MetricCard
                  title="Trade signals"
                  value={numberFormat.format(member.tradeSignalCount)}
                  note={`${numberFormat.format(member.rfqGeneratedCount)} RFQs generated`}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-legend" />
                Activity Timeline
              </CardTitle>
              <CardDescription>
                Newest association and deal events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-6 text-center">
                  <HistoryIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium text-sm">
                    No activity recorded
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    New association updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-px before:bg-border">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-7">
                      <span className="absolute top-1.5 left-0 h-4 w-4 rounded-full border-4 border-background bg-legend shadow-sm" />
                      <div className="rounded-xl border bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {activity.type.replaceAll("_", " ")}
                          </Badge>
                          <p className="font-medium text-sm">
                            {activity.title}
                          </p>
                        </div>
                        <p className="mt-2 text-muted-foreground text-xs">
                          {formatDate(activity.createdAt)}
                          {activity.actorLabel
                            ? ` · ${activity.actorLabel}`
                            : ""}
                        </p>
                        {activity.description ? (
                          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                            {activity.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 font-semibold text-2xl tabular-nums">{value}</p>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 font-medium text-sm capitalize">{value}</p>
    </div>
  )
}

function MetricCard({
  title,
  value,
  note
}: {
  title: string
  value: string
  note?: string
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {title}
      </p>
      <p className="mt-2 font-semibold text-xl capitalize tabular-nums">
        {value}
      </p>
      {note ? (
        <p className="mt-1 text-muted-foreground text-xs">{note}</p>
      ) : null}
    </div>
  )
}
