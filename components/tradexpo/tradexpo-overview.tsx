"use client"

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArchiveIcon,
  BellIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  FileClockIcon,
  LayoutTemplateIcon,
  RadioIcon,
  SparkleIcon,
  ToyBrickIcon,
  XIcon,
  ZapIcon
} from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  AdminNotification,
  BoothTemplate,
  Expo,
  ExpoStatus,
  HallTemplate,
  ModelAsset,
  NotificationKind
} from "@/lib/tradexpo/types"
import {
  getAssetMap,
  getBoothTemplateStatus,
  getHallTemplateStatus
} from "@/lib/tradexpo/utils"
import { cn } from "@/lib/utils"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card"

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso)
  )
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── stat cards ──────────────────────────────────────────────────────────────

const EXPO_STATUS_ORDER: ExpoStatus[] = [
  "Live",
  "Pending Review",
  "Draft",
  "Archived",
  "Canceled"
]

const STATUS_COLOR: Record<ExpoStatus, string> = {
  Live: "bg-emerald-500",
  "Pending Review": "bg-amber-400",
  Draft: "bg-slate-400",
  Archived: "bg-purple-400",
  Canceled: "bg-rose-400"
}

const STATUS_TEXT: Record<ExpoStatus, string> = {
  Live: "text-emerald-700",
  "Pending Review": "text-amber-700",
  Draft: "text-slate-600",
  Archived: "text-purple-700",
  Canceled: "text-rose-700"
}

function ExpoStatsCard({ expos }: { expos: Expo[] }) {
  const counts = React.useMemo(() => {
    const map: Partial<Record<ExpoStatus, number>> = {}
    for (const expo of expos) {
      map[expo.status] = (map[expo.status] ?? 0) + 1
    }
    return map
  }, [expos])

  const liveCount = counts.Live ?? 0
  const pendingCount = counts["Pending Review"] ?? 0

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
              <CircleDotIcon className="h-4 w-4" />
              Total Expos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-end gap-3">
              <span className="font-bold text-4xl leading-none">
                {expos.length}
              </span>
              <div className="mb-1 flex flex-wrap gap-1">
                {liveCount > 0 && (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-emerald-700 text-xs"
                  >
                    <RadioIcon className="mr-1 h-3 w-3" />
                    {liveCount} Live
                  </Badge>
                )}
                {pendingCount > 0 && (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-amber-700 text-xs"
                  >
                    {pendingCount} Pending
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {EXPO_STATUS_ORDER.map((status) => {
                const count = counts[status] ?? 0
                if (count === 0) return null
                const pct = (count / expos.length) * 100
                return (
                  <div
                    key={status}
                    title={`${status}: ${count}`}
                    className={cn("h-full", STATUS_COLOR[status])}
                    style={{ width: `${pct}%` }}
                  />
                )
              })}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {EXPO_STATUS_ORDER.map((status) => {
                const count = counts[status] ?? 0
                if (count === 0) return null
                return (
                  <span
                    key={status}
                    className={cn("text-xs", STATUS_TEXT[status])}
                  >
                    {status} {count}
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent>
        <h3>
          <SparkleIcon /> UI Note
        </h3>{" "}
        <br />
        <p className="text-sm">{expos.length} total expos</p>
        <p className="text-muted-foreground text-xs italic">
          IMPORTANT: Don't display on UI
        </p>
      </HoverCardContent>
    </HoverCard>
  )
}

function LiveNowCard({ expos }: { expos: Expo[] }) {
  const live = expos.filter((e) => e.status === "Live")
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
          <RadioIcon className="h-4 w-4 text-emerald-500" />
          Live Now
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <span className="font-bold text-4xl text-emerald-600 leading-none">
          {live.length}
        </span>
        {live.length > 0 ? (
          <ul className="space-y-0.5">
            {live.slice(0, 3).map((expo) => (
              <li
                key={expo.id}
                className="truncate text-muted-foreground text-xs"
              >
                <Link
                  href={`/admin/tradexpo/expos/${expo.id}`}
                  className="hover:underline"
                >
                  {expo.name}
                </Link>
              </li>
            ))}
            {live.length > 3 && (
              <li className="text-muted-foreground text-xs">
                +{live.length - 3} more
              </li>
            )}
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs">
            No expos live right now.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function PendingReviewCard({ expos }: { expos: Expo[] }) {
  const pending = expos.filter((e) => e.status === "Pending Review")
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
          <FileClockIcon className="h-4 w-4 text-amber-500" />
          Pending Review
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="flex items-end gap-2">
          <span
            className={cn(
              "font-bold text-4xl leading-none",
              pending.length > 0 ? "text-amber-600" : "text-foreground"
            )}
          >
            {pending.length}
          </span>
          {pending.length > 0 && (
            <span className="mb-1 animate-pulse text-amber-500 text-xs">
              needs action
            </span>
          )}
        </div>
        {pending.length > 0 ? (
          <Button size="xs" variant="outline" asChild>
            <Link href="/admin/tradexpo/expos?status=Pending+Review">
              Review all
            </Link>
          </Button>
        ) : (
          <p className="text-muted-foreground text-xs">All caught up.</p>
        )}
      </CardContent>
    </Card>
  )
}

function TemplatesCard({
  assets,
  hallTemplates,
  boothTemplates
}: {
  assets: ModelAsset[]
  hallTemplates: HallTemplate[]
  boothTemplates: BoothTemplate[]
}) {
  const assetMap = React.useMemo(() => getAssetMap(assets), [assets])

  const hallReady = hallTemplates.filter(
    (t) => getHallTemplateStatus(t, assetMap) === "Published"
  ).length

  const boothReady = boothTemplates.filter(
    (t) => getBoothTemplateStatus(t, assetMap) === "Published"
  ).length

  const hallFailed = hallTemplates.filter(
    (t) => getHallTemplateStatus(t, assetMap) === "Failed"
  ).length

  const boothFailed = boothTemplates.filter(
    (t) => getBoothTemplateStatus(t, assetMap) === "Failed"
  ).length

  const hasIssues = hallFailed > 0 || boothFailed > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
          <LayoutTemplateIcon className="h-4 w-4" />
          Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="flex items-center gap-1 text-muted-foreground text-xs">
              <LayoutTemplateIcon className="h-3 w-3" /> Hall
            </p>
            <p className="mt-1 font-semibold text-sm">
              {hallReady}/{hallTemplates.length}{" "}
              <span className="font-normal text-muted-foreground text-xs">
                published
              </span>
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="flex items-center gap-1 text-muted-foreground text-xs">
              <ToyBrickIcon className="h-3 w-3" /> Booth
            </p>
            <p className="mt-1 font-semibold text-sm">
              {boothReady}/{boothTemplates.length}{" "}
              <span className="font-normal text-muted-foreground text-xs">
                published
              </span>
            </p>
          </div>
        </div>
        {hasIssues && (
          <p className="flex items-center gap-1 text-rose-600 text-xs">
            <AlertCircleIcon className="h-3.5 w-3.5" />
            {hallFailed + boothFailed} template(s) with failed assets
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── reminders ───────────────────────────────────────────────────────────────

function RemindersPanel({
  expos,
  assets,
  hallTemplates,
  boothTemplates
}: {
  expos: Expo[]
  assets: ModelAsset[]
  hallTemplates: HallTemplate[]
  boothTemplates: BoothTemplate[]
}) {
  const assetMap = React.useMemo(() => getAssetMap(assets), [assets])

  const pendingApproval = expos.filter((e) => e.status === "Pending Review")

  const startingSoon = expos
    .filter((e) => {
      const d = daysUntil(e.startDate ?? "")
      return (
        d >= 0 &&
        d <= 14 &&
        (e.status === "Draft" || e.status === "Pending Review")
      )
    })
    .sort((a, b) => daysUntil(a.startDate ?? "") - daysUntil(b.startDate ?? ""))

  const archivableFinished = expos.filter(
    (e) =>
      e.status !== "Archived" &&
      e.status !== "Canceled" &&
      daysUntil(e.endDate ?? "") < -7
  )

  const failedTemplates = [
    ...hallTemplates
      .filter((t) => getHallTemplateStatus(t, assetMap) === "Failed")
      .map((t) => ({ name: t.name, kind: "Hall Template" as const })),
    ...boothTemplates
      .filter((t) => getBoothTemplateStatus(t, assetMap) === "Failed")
      .map((t) => ({ name: t.name, kind: "Booth Template" as const }))
  ]

  const hasAny =
    pendingApproval.length > 0 ||
    startingSoon.length > 0 ||
    archivableFinished.length > 0 ||
    failedTemplates.length > 0

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="flex items-center gap-2 font-semibold text-base">
        <ZapIcon className="h-4 w-4 text-amber-500" />
        Action Reminders
      </h2>
      <p className="mt-0.5 text-muted-foreground text-sm">
        Items that may need your attention.
      </p>

      {!hasAny ? (
        <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm">
          <CheckCircle2Icon className="h-4 w-4" />
          No pending actions — everything looks good.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {pendingApproval.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="flex items-center gap-1.5 font-medium text-amber-700 text-sm dark:text-amber-400">
                <FileClockIcon className="h-4 w-4" />
                {pendingApproval.length} expo
                {pendingApproval.length > 1 ? "s" : ""} awaiting approval
              </p>
              <ul className="mt-2 space-y-1.5">
                {pendingApproval.map((expo) => (
                  <li
                    key={expo.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-muted-foreground text-xs">
                      {expo.name}
                    </span>
                    <Button size="xs" variant="outline" asChild>
                      <Link href={`/admin/tradexpo/expos/${expo.id}`}>
                        Review
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {startingSoon.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="flex items-center gap-1.5 font-medium text-blue-700 text-sm dark:text-blue-400">
                <CalendarCheckIcon className="h-4 w-4" />
                {startingSoon.length} expo{startingSoon.length > 1 ? "s" : ""}{" "}
                starting soon
              </p>
              <ul className="mt-2 space-y-1.5">
                {startingSoon.map((expo) => {
                  const days = daysUntil(expo.startDate ?? "")
                  return (
                    <li
                      key={expo.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-muted-foreground text-xs">
                        {expo.name}
                      </span>
                      <span className="shrink-0 text-blue-600 text-xs dark:text-blue-400">
                        {days === 0 ? "today" : `in ${days}d`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {archivableFinished.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="flex items-center gap-1.5 font-medium text-sm text-zinc-600 dark:text-zinc-400">
                <ArchiveIcon className="h-4 w-4" />
                {archivableFinished.length} finished expo
                {archivableFinished.length > 1 ? "s" : ""} to archive
              </p>
              <ul className="mt-2 space-y-1">
                {archivableFinished.map((expo) => (
                  <li
                    key={expo.id}
                    className="truncate text-muted-foreground text-xs"
                  >
                    {expo.name} — ended {formatShortDate(expo.endDate ?? "")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {failedTemplates.length > 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900 dark:bg-rose-950/30">
              <p className="flex items-center gap-1.5 font-medium text-rose-700 text-sm dark:text-rose-400">
                <AlertTriangleIcon className="h-4 w-4" />
                {failedTemplates.length} template asset
                {failedTemplates.length > 1 ? "s" : ""} failed
              </p>
              <ul className="mt-2 space-y-1">
                {failedTemplates.map((t) => (
                  <li
                    key={`${t.kind}-${t.name}`}
                    className="text-muted-foreground text-xs"
                  >
                    {t.name} <span className="opacity-60">({t.kind})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ─── notification feed ────────────────────────────────────────────────────────

const KIND_META: Record<
  NotificationKind,
  { icon: React.ReactNode; color: string }
> = {
  approval_needed: {
    icon: <FileClockIcon className="h-4 w-4" />,
    color: "text-amber-500"
  },
  expo_live: {
    icon: <RadioIcon className="h-4 w-4" />,
    color: "text-emerald-500"
  },
  expo_ended: {
    icon: <ClockIcon className="h-4 w-4" />,
    color: "text-zinc-400"
  },
  asset_failed: {
    icon: <AlertCircleIcon className="h-4 w-4" />,
    color: "text-rose-500"
  },
  expo_starting_soon: {
    icon: <CalendarCheckIcon className="h-4 w-4" />,
    color: "text-blue-500"
  },
  expo_canceled: {
    icon: <XIcon className="h-4 w-4" />,
    color: "text-rose-400"
  }
}

function NotificationFeed({
  initialNotifications
}: {
  initialNotifications: AdminNotification[]
}) {
  const [notifications, setNotifications] = React.useState<AdminNotification[]>(
    () =>
      [...initialNotifications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  )
  const [showAll, setShowAll] = React.useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  async function markAllRead() {
    try {
      const response = await fetch("/api/tradexpo/notifications", {
        method: "PATCH"
      })
      if (!response.ok) return
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {
      // no-op
    }
  }

  async function dismiss(id: string) {
    try {
      const response = await fetch(`/api/tradexpo/notifications/${id}`, {
        method: "DELETE"
      })
      if (!response.ok) return
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      // no-op
    }
  }

  async function markRead(id: string) {
    try {
      const response = await fetch(`/api/tradexpo/notifications/${id}`, {
        method: "PATCH"
      })
      if (!response.ok) return
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch {
      // no-op
    }
  }

  const visible = showAll ? notifications : notifications.slice(0, 5)

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-base">
          <BellIcon className="h-4 w-4" />
          Notifications
          {unreadCount > 0 && (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700 text-xs"
            >
              {unreadCount} new
            </Badge>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button size="xs" variant="ghost" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-4 text-muted-foreground text-sm">No notifications.</p>
      ) : (
        <>
          <ul className="mt-3 divide-y">
            {visible.map((notif) => {
              const meta = KIND_META[notif.kind]
              return (
                <li
                  key={notif.id}
                  className={cn(
                    "flex gap-3 py-3",
                    !notif.isRead && "-mx-4 bg-muted/30 px-4"
                  )}
                >
                  <span className={cn("mt-0.5 shrink-0", meta.color)}>
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !notif.isRead
                            ? "font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {notif.title}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-muted-foreground text-xs">
                          {timeAgo(notif.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => dismiss(notif.id)}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                          aria-label="Dismiss"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {notif.relatedExpoId && (
                        <Button size="xs" variant="outline" asChild>
                          <Link
                            href={`/admin/tradexpo/expos/${notif.relatedExpoId}`}
                          >
                            View Expo
                          </Link>
                        </Button>
                      )}
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={() => markRead(notif.id)}
                          className="text-muted-foreground text-xs hover:text-foreground"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {notifications.length > 5 && (
            <Button
              variant="ghost"
              size="xs"
              className="mt-2 w-full"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Show less" : `Show ${notifications.length - 5} more`}
            </Button>
          )}
        </>
      )}
    </section>
  )
}

// ─── root ─────────────────────────────────────────────────────────────────────

export function TradeXpoOverview({
  initialAssets,
  initialHallTemplates,
  initialBoothTemplates,
  initialExpos,
  initialNotifications
}: {
  initialAssets: ModelAsset[]
  initialHallTemplates: HallTemplate[]
  initialBoothTemplates: BoothTemplate[]
  initialExpos: Expo[]
  initialNotifications: AdminNotification[]
}) {
  const expos = React.useMemo(
    () => initialExpos.map((e) => ({ ...e })),
    [initialExpos]
  )

  return (
    <div className="mt-6 grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExpoStatsCard expos={expos} />
        <LiveNowCard expos={expos} />
        <PendingReviewCard expos={expos} />
        <TemplatesCard
          assets={initialAssets}
          hallTemplates={initialHallTemplates}
          boothTemplates={initialBoothTemplates}
        />
      </div>

      <RemindersPanel
        expos={expos}
        assets={initialAssets}
        hallTemplates={initialHallTemplates}
        boothTemplates={initialBoothTemplates}
      />

      <NotificationFeed initialNotifications={initialNotifications} />
    </div>
  )
}
