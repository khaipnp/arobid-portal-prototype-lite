"use client"

import {
  CheckIcon,
  CircleIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  MonitorPlayIcon,
  RadioIcon,
  SquareIcon,
  UsersIcon,
} from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockGoLIVEEvents, mockStreamSessions } from "@/lib/tradexpo/mock-data"
import type {
  GoLIVEEvent,
  StreamSession,
  StreamSessionStatus,
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

const CURRENT_USER_ID = "user-khai"

const statusStyles: Record<StreamSessionStatus, string> = {
  Provisioned: "border-amber-300 bg-amber-50 text-amber-700",
  Active: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-600",
  Canceled: "border-rose-300 bg-rose-50 text-rose-700",
}

function CredentialField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false)
  const [revealed, setRevealed] = React.useState(false)

  function copy() {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isKey = label === "Stream Key"

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <code className="flex-1 truncate font-mono text-xs">
          {isKey && !revealed ? "•".repeat(32) : value}
        </code>
        {isKey && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {revealed ? (
              <EyeOffIcon className="h-3.5 w-3.5" />
            ) : (
              <EyeIcon className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <CopyIcon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}

function formatDuration(startIso: string | null, endIso: string | null) {
  if (!startIso) return "—"
  const start = new Date(startIso).getTime()
  const end = endIso ? new Date(endIso).getTime() : Date.now()
  const secs = Math.floor((end - start) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`
}

interface SessionCardProps {
  event: GoLIVEEvent
  session: StreamSession
  onSessionChange?: (session: StreamSession) => void
}

function SessionCard({
  event,
  session: initialSession,
  onSessionChange,
}: SessionCardProps) {
  const [session, setSession] = React.useState<StreamSession>(initialSession)
  const [viewerCount, setViewerCount] = React.useState(
    session.peakViewerCount ?? 0,
  )
  const [elapsedLabel, setElapsedLabel] = React.useState("")
  const startedAtRef = React.useRef<string | null>(session.startedAt)

  React.useEffect(() => {
    if (session.status !== "Active") return
    const interval = setInterval(() => {
      setViewerCount((prev) =>
        Math.max(1, prev + Math.floor(Math.random() * 11) - 5),
      )
      if (startedAtRef.current) {
        setElapsedLabel(formatDuration(startedAtRef.current, null))
      }
    }, 3000)
    // initial
    if (startedAtRef.current)
      setElapsedLabel(formatDuration(startedAtRef.current, null))
    return () => clearInterval(interval)
  }, [session.status])

  function handleGoLive() {
    const now = new Date().toISOString()
    startedAtRef.current = now
    const updatedSession = {
      ...session,
      status: "Active" as const,
      startedAt: now,
    }
    setSession(updatedSession)
    onSessionChange?.(updatedSession)
    setViewerCount(1)
    setElapsedLabel("0s")
  }

  function handleEndBroadcast() {
    const now = new Date().toISOString()
    const updatedSession = {
      ...session,
      status: "Ended" as const,
      endedAt: now,
      peakViewerCount: viewerCount,
    }
    setSession(updatedSession)
    onSessionChange?.(updatedSession)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-1 text-base">
              {event.title}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {event.sessionType} · {event.expoId}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-xs", statusStyles[session.status])}
          >
            {session.status === "Active" && (
              <CircleIcon className="mr-1 h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
            )}
            {session.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {session.status === "Active" && (
          <div className="flex items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <RadioIcon className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-emerald-700 text-sm">
                Broadcasting live
              </span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <UsersIcon className="h-3.5 w-3.5" />
                <span className="font-semibold">
                  {viewerCount.toLocaleString()}
                </span>
                <span className="text-emerald-600/70">watching</span>
              </div>
              <span className="text-emerald-600/70 font-mono text-xs">
                {elapsedLabel}
              </span>
            </div>
          </div>
        )}

        {session.status === "Ended" && (
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="mb-3 font-medium text-sm">Session Summary</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {formatDuration(session.startedAt, session.endedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peak Viewers</p>
                <p className="font-medium">
                  {session.peakViewerCount?.toLocaleString() ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Replay</p>
                <p className="font-medium">
                  {session.replayEnabled
                    ? session.replayUrl
                      ? "Available"
                      : "Processing…"
                    : "Not recorded"}
                </p>
              </div>
            </div>
          </div>
        )}

        {session.status === "Provisioned" && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Stream Credentials</p>
                <span className="text-[11px] text-muted-foreground">
                  Private — do not share
                </span>
              </div>
              <CredentialField
                label="Server (Stream URL)"
                value={session.streamUrl}
              />
              <CredentialField label="Stream Key" value={session.streamKey} />
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="mb-1.5 font-medium text-xs">
                How to go live with OBS
              </p>
              <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                <li>Open OBS → Settings → Stream</li>
                <li>Set Service = "Custom…"</li>
                <li>Paste the Server URL above</li>
                <li>Paste the Stream Key above</li>
                <li>Click "Start Streaming" in OBS</li>
              </ol>
            </div>
          </>
        )}

        {session.status === "Active" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              OBS is connected. Stop streaming in OBS, or end broadcast below.
            </p>
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          {session.status === "Provisioned" && (
            <Button
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleGoLive}
            >
              <RadioIcon className="h-4 w-4" />
              Simulate Go Live
            </Button>
          )}
          {session.status === "Active" && (
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={handleEndBroadcast}
            >
              <SquareIcon className="h-4 w-4 fill-current" />
              End Broadcast
            </Button>
          )}
          {session.status === "Ended" && (
            <div className="flex w-full items-center justify-center gap-2 text-muted-foreground text-sm">
              <MonitorPlayIcon className="h-4 w-4" />
              Session ended
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function HostDashboard() {
  const baseSessionData = mockStreamSessions
  const events = mockGoLIVEEvents

  const myEvents = events.filter((e) => e.broadcasterUserId === CURRENT_USER_ID)

  const initialPairs = myEvents
    .map((event) => {
      const session = baseSessionData.find(
        (s) => s.streamSessionId === event.streamSessionId,
      )
      return session ? { event, session } : null
    })
    .filter(Boolean) as { event: GoLIVEEvent; session: StreamSession }[]

  const [selectedSessionId, setSelectedSessionId] = React.useState<
    string | null
  >(null)
  const [sessionStates, setSessionStates] = React.useState<
    Record<string, StreamSession>
  >(() => {
    const initial: Record<string, StreamSession> = {}
    initialPairs.forEach(({ session }) => {
      initial[session.streamSessionId] = session
    })
    return initial
  })

  const myPairs = initialPairs.map(({ event, session }) => ({
    event,
    session: sessionStates[session.streamSessionId] || session,
  }))

  const selectedSession = selectedSessionId
    ? myPairs.find((p) => p.event.goLiveEventId === selectedSessionId) || null
    : null

  const handleSessionChange = (updatedSession: StreamSession) => {
    setSessionStates((prev) => ({
      ...prev,
      [updatedSession.streamSessionId]: updatedSession,
    }))
  }

  if (myPairs.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <MonitorPlayIcon className="mx-auto mb-3 h-8 w-8 opacity-40" />
        <p className="text-sm">No sessions assigned to you.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Viewers</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myPairs.map(({ event, session }) => (
              <TableRow
                key={event.goLiveEventId}
                className="cursor-pointer"
                onClick={() => setSelectedSessionId(event.goLiveEventId)}
              >
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {event.sessionType}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", statusStyles[session.status])}
                  >
                    {session.status === "Active" && (
                      <CircleIcon className="mr-1 h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
                    )}
                    {session.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {session.status === "Active"
                    ? `${session.peakViewerCount ?? 0} watching`
                    : session.status === "Ended"
                      ? `${session.peakViewerCount ?? 0} peak`
                      : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDuration(session.startedAt, session.endedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedSession}
        onOpenChange={(open) => {
          if (!open) setSelectedSessionId(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSession.event.title}</DialogTitle>
                <DialogDescription>
                  {selectedSession.event.sessionType} ·{" "}
                  {selectedSession.event.expoId}
                </DialogDescription>
              </DialogHeader>
              <SessionCard
                event={selectedSession.event}
                session={selectedSession.session}
                onSessionChange={handleSessionChange}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
