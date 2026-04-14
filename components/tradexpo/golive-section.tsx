"use client"

import {
  CircleIcon,
  ClockIcon,
  PlayCircleIcon,
  RadioIcon,
  VideoIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockGoLIVEEvents, mockStreamSessions } from "@/lib/tradexpo/mock-data"
import type {
  ExpoStatus,
  GoLIVEEvent,
  GoLIVEEventStatus,
  GoLIVESessionType,
  StreamSession,
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

type VisitorExpoStatus = "Upcoming" | "Live" | "Archive"

function toVisitorStatus(status: ExpoStatus): VisitorExpoStatus {
  if (status === "Live") return "Live"
  if (status === "Ended" || status === "Archived" || status === "Canceled")
    return "Archive"
  return "Upcoming"
}

const SESSION_TYPE_LABELS: Record<GoLIVESessionType, string> = {
  Workshop: "Workshop",
  Talkshow: "Talkshow",
  Keynote: "Keynote",
  Panel: "Panel",
  ProductDemo: "Product Demo",
  Other: "Other",
}

const statusStyles: Record<GoLIVEEventStatus, string> = {
  Scheduled: "border-blue-300 bg-blue-50 text-blue-700",
  Ready: "border-violet-300 bg-violet-50 text-violet-700",
  Live: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-600",
  Canceled: "border-rose-300 bg-rose-50 text-rose-700",
}

function formatSchedule(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getCountdown(iso: string | null): string | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `Starting in ${h}h ${m}m`
}

interface CardProps {
  event: GoLIVEEvent
  session: StreamSession
}

function GoLIVECard({ event, session }: CardProps) {
  const countdown = getCountdown(event.scheduledStartAt)

  return (
    <div className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {event.thumbnailUrl ? (
          <Image
            src={event.thumbnailUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <RadioIcon className="h-8 w-8 text-white/30" />
          </div>
        )}

        {/* Status overlay badge */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {event.status === "Live" && (
            <div className="flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 shadow-sm">
              <CircleIcon className="h-2 w-2 fill-white text-white animate-pulse" />
              <span className="font-bold text-white text-xs">LIVE</span>
            </div>
          )}
          <div className="rounded-md bg-black/60 px-2 py-0.5 backdrop-blur-sm">
            <span className="text-white/90 text-xs">
              {SESSION_TYPE_LABELS[event.sessionType]}
            </span>
          </div>
        </div>

        {/* Viewer count overlay for live */}
        {event.status === "Live" && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 backdrop-blur-sm">
            <span className="text-white/90 text-xs">
              {(session.peakViewerCount ?? 0).toLocaleString()} watching
            </span>
          </div>
        )}

        {/* Ended + replay available */}
        {event.status === "Ended" &&
          session.replayEnabled &&
          session.replayUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <PlayCircleIcon className="h-12 w-12 text-white drop-shadow-lg" />
            </div>
          )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
            {event.title}
          </h3>
          {event.description && (
            <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {event.status === "Scheduled" && (
            <>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {formatSchedule(event.scheduledStartAt)}
              </span>
              {countdown && (
                <span className="font-medium text-amber-600">{countdown}</span>
              )}
            </>
          )}
          {event.status === "Ready" && (
            <span className="flex items-center gap-1">
              <VideoIcon className="h-3 w-3" />
              On demand
            </span>
          )}
          {(event.status === "Live" || event.status === "Ended") && (
            <span>Broadcaster: {event.broadcasterDisplayName}</span>
          )}
        </div>

        {/* Action */}
        <div>
          {event.status === "Live" && (
            <Button
              asChild
              size="sm"
              className="w-full gap-1.5 bg-red-600 hover:bg-red-700"
            >
              <Link href={`/watch/${event.streamSessionId}`}>
                <CircleIcon className="h-3 w-3 fill-current animate-pulse" />
                Watch Now
              </Link>
            </Button>
          )}
          {event.status === "Ended" &&
            session.replayEnabled &&
            session.replayUrl && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
              >
                <Link href={`/watch/${event.streamSessionId}`}>
                  <PlayCircleIcon className="h-4 w-4" />
                  Watch Replay
                </Link>
              </Button>
            )}
          {event.status === "Ended" &&
            session.replayEnabled &&
            !session.replayUrl && (
              <p className="text-center text-xs text-muted-foreground italic">
                Replay is being prepared…
              </p>
            )}
          {event.status === "Ended" && !session.replayEnabled && (
            <p className="text-center text-xs text-muted-foreground">
              Stream ended
            </p>
          )}
          {(event.status === "Scheduled" || event.status === "Ready") && (
            <p className="text-center text-xs text-muted-foreground">
              {event.status === "Scheduled"
                ? "Available when session goes live"
                : "Waiting for broadcaster"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  expoId: string
  expoStatus: ExpoStatus
}

export function GoLIVESection({ expoId, expoStatus }: Props) {
  const visitorStatus = toVisitorStatus(expoStatus)
  const allEvents = mockGoLIVEEvents.filter(
    (e) => e.expoId === expoId && e.status !== "Canceled",
  )

  // Filter by expo visibility rules
  const eligibleEvents = allEvents.filter((event) => {
    if (visitorStatus === "Upcoming") {
      return event.status === "Scheduled" || event.status === "Ready"
    }
    if (visitorStatus === "Archive") {
      const session = mockStreamSessions.find(
        (s) => s.streamSessionId === event.streamSessionId,
      )
      return (
        event.status === "Ended" && session?.replayEnabled && session?.replayUrl
      )
    }
    // Live: all non-canceled (already filtered)
    return true
  })

  if (eligibleEvents.length === 0) return null

  // Sort: Live first, then Scheduled/Ready, then Ended
  const sortOrder: Record<GoLIVEEventStatus, number> = {
    Live: 0,
    Scheduled: 1,
    Ready: 2,
    Ended: 3,
    Canceled: 4,
  }
  const sorted = [...eligibleEvents].sort(
    (a, b) => sortOrder[a.status] - sortOrder[b.status],
  )

  const pairs = sorted
    .map((event) => {
      const session = mockStreamSessions.find(
        (s) => s.streamSessionId === event.streamSessionId,
      )
      return session ? { event, session } : null
    })
    .filter(Boolean) as { event: GoLIVEEvent; session: StreamSession }[]

  if (pairs.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <RadioIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-lg">GoLIVE Sessions</h2>
        <Badge variant="secondary" className="text-xs">
          {pairs.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map(({ event, session }) => (
          <GoLIVECard
            key={event.goLiveEventId}
            event={event}
            session={session}
          />
        ))}
      </div>
    </section>
  )
}
