"use client"

import {
  CalendarIcon,
  CircleIcon,
  ClockIcon,
  MoreHorizontalIcon,
  RadioIcon
} from "lucide-react"
import Image from "next/image"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import type {
  GoLIVEEvent,
  GoLIVEEventStatus,
  GoLIVESessionType,
  StreamSession
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "../ui/empty"

const SESSION_TYPES: GoLIVESessionType[] = [
  "Workshop",
  "Talkshow",
  "Keynote",
  "Panel",
  "ProductDemo",
  "Other"
]

const SESSION_TYPE_LABELS: Record<GoLIVESessionType, string> = {
  Workshop: "Workshop",
  Talkshow: "Talkshow",
  Keynote: "Keynote",
  Panel: "Panel",
  ProductDemo: "Product Demo",
  Other: "Other"
}

const MOCK_EXPO_MEMBERS = [
  { userId: "user-khai", displayName: "Khai Pham" },
  { userId: "user-nina", displayName: "Nina Tran" },
  { userId: "user-minh", displayName: "Minh Do" },
  { userId: "user-lan", displayName: "Lan Nguyen" }
]

const statusStyles: Record<GoLIVEEventStatus, string> = {
  Scheduled: "border-blue-300 bg-blue-50 text-blue-700",
  Ready: "border-violet-300 bg-violet-50 text-violet-700",
  Live: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-600",
  Canceled: "border-rose-300 bg-rose-50 text-rose-700"
}

function formatSchedule(iso: string | null) {
  if (!iso) return "On demand"
  const d = new Date(iso)
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
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

interface FormState {
  title: string
  sessionType: GoLIVESessionType | ""
  description: string
  scheduledStartAt: string
  broadcasterUserId: string
  replayEnabled: boolean
}

const EMPTY_FORM: FormState = {
  title: "",
  sessionType: "",
  description: "",
  scheduledStartAt: "",
  broadcasterUserId: "",
  replayEnabled: false
}

interface Props {
  expoId: string
  initialGoLIVEEvents: GoLIVEEvent[]
  initialStreamSessions: StreamSession[]
}

export function GoLIVEManager({
  expoId,
  initialGoLIVEEvents,
  initialStreamSessions
}: Props) {
  const seedEvents = initialGoLIVEEvents.filter((e) => e.expoId === expoId)
  const [events, setEvents] = React.useState<GoLIVEEvent[]>(seedEvents)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<GoLIVEEvent | null>(
    null
  )
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof FormState, string>>
  >({})
  const [cancelTarget, setCancelTarget] = React.useState<GoLIVEEvent | null>(
    null
  )
  const [deleteTarget, setDeleteTarget] = React.useState<GoLIVEEvent | null>(
    null
  )
  const [requestError, setRequestError] = React.useState<string | null>(null)

  function openCreate() {
    setEditingEvent(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(event: GoLIVEEvent) {
    setEditingEvent(event)
    setForm({
      title: event.title,
      sessionType: event.sessionType,
      description: event.description ?? "",
      scheduledStartAt: event.scheduledStartAt
        ? new Date(event.scheduledStartAt).toISOString().slice(0, 16)
        : "",
      broadcasterUserId: event.broadcasterUserId,
      replayEnabled:
        initialStreamSessions.find(
          (s) => s.streamSessionId === event.streamSessionId
        )?.replayEnabled ?? false
    })
    setErrors({})
    setFormOpen(true)
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) errs.title = "Title is required"
    if (!form.sessionType) errs.sessionType = "Session type is required"
    if (!form.broadcasterUserId)
      errs.broadcasterUserId = "Broadcaster is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    const now = new Date().toISOString()
    const broadcaster = MOCK_EXPO_MEMBERS.find(
      (m) => m.userId === form.broadcasterUserId
    )
    if (!broadcaster) return

    if (editingEvent) {
      const updatedEvent: GoLIVEEvent = {
        ...editingEvent,
        title: form.title.trim(),
        sessionType: form.sessionType as GoLIVESessionType,
        description: form.description.trim() || null,
        scheduledStartAt: form.scheduledStartAt
          ? new Date(form.scheduledStartAt).toISOString()
          : null,
        status: form.scheduledStartAt ? "Scheduled" : "Ready",
        broadcasterUserId: form.broadcasterUserId,
        broadcasterDisplayName: broadcaster.displayName,
        updatedAt: now
      }
      try {
        const response = await fetch(
          `/api/tradexpo/golive-events/${editingEvent.goLiveEventId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update",
              event: updatedEvent,
              replayEnabled: form.replayEnabled
            })
          }
        )
        if (!response.ok) throw new Error("failed")
        setEvents((prev) =>
          prev.map((e) =>
            e.goLiveEventId === editingEvent.goLiveEventId ? updatedEvent : e
          )
        )
        setRequestError(null)
      } catch {
        setRequestError("Unable to save GoLIVE event.")
        return
      }
    } else {
      const eventId = `gl-${crypto.randomUUID()}`
      const streamSessionId = `ss-${crypto.randomUUID()}`
      const newEvent: GoLIVEEvent = {
        goLiveEventId: eventId,
        expoId,
        streamSessionId,
        title: form.title.trim(),
        sessionType: form.sessionType as GoLIVESessionType,
        description: form.description.trim() || null,
        thumbnailUrl: null,
        scheduledStartAt: form.scheduledStartAt
          ? new Date(form.scheduledStartAt).toISOString()
          : null,
        status: form.scheduledStartAt ? "Scheduled" : "Ready",
        broadcasterUserId: form.broadcasterUserId,
        broadcasterDisplayName: broadcaster.displayName,
        createdAt: now,
        updatedAt: now
      }
      const streamSession: StreamSession = {
        streamSessionId,
        status: "Provisioned",
        hostUserId: form.broadcasterUserId,
        hostDisplayName: broadcaster.displayName,
        streamUrl: `rtmp://stream.arobid.local/live/${streamSessionId}`,
        streamKey: `key-${crypto.randomUUID().replaceAll("-", "")}`,
        replayEnabled: form.replayEnabled,
        replayUrl: null,
        startedAt: null,
        endedAt: null,
        peakViewerCount: null,
        createdAt: now,
        updatedAt: now
      }
      try {
        const response = await fetch(
          `/api/tradexpo/expos/${expoId}/golive-events`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: newEvent,
              streamSession
            })
          }
        )
        if (!response.ok) throw new Error("failed")
        setEvents((prev) => [newEvent, ...prev])
        setRequestError(null)
      } catch {
        setRequestError("Unable to create GoLIVE event.")
        return
      }
    }
    setFormOpen(false)
  }

  async function handleCancel(event: GoLIVEEvent) {
    try {
      const response = await fetch(
        `/api/tradexpo/golive-events/${event.goLiveEventId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" })
        }
      )
      if (!response.ok) throw new Error("failed")
      setEvents((prev) =>
        prev.map((e) =>
          e.goLiveEventId === event.goLiveEventId
            ? { ...e, status: "Canceled", updatedAt: new Date().toISOString() }
            : e
        )
      )
      setRequestError(null)
      setCancelTarget(null)
    } catch {
      setRequestError("Unable to cancel GoLIVE event.")
    }
  }

  async function handleDelete(event: GoLIVEEvent) {
    try {
      const response = await fetch(
        `/api/tradexpo/golive-events/${event.goLiveEventId}`,
        {
          method: "DELETE"
        }
      )
      if (!response.ok) throw new Error("failed")
      setEvents((prev) =>
        prev.filter((e) => e.goLiveEventId !== event.goLiveEventId)
      )
      setRequestError(null)
      setDeleteTarget(null)
    } catch {
      setRequestError("Unable to delete GoLIVE event.")
    }
  }

  const canManage = (status: GoLIVEEventStatus) =>
    status === "Scheduled" || status === "Ready"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-2xl">Events</h2>
        <Button size="lg" onClick={openCreate}>
          Create New
        </Button>
      </div>

      {requestError && (
        <p className="text-destructive text-sm">{requestError}</p>
      )}

      {events.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RadioIcon />
            </EmptyMedia>
            <EmptyTitle>No GoLIVE Events yet.</EmptyTitle>
            <EmptyDescription>
              Create the first live session for this Expo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="divide-y rounded-lg border">
          {events.map((event) => {
            const countdown = getCountdown(event.scheduledStartAt)
            const isManageable = canManage(event.status)
            return (
              <div
                key={event.goLiveEventId}
                className="flex items-start gap-4 p-4"
              >
                {event.thumbnailUrl ? (
                  <Image
                    src={event.thumbnailUrl}
                    alt=""
                    width={112}
                    height={64}
                    className="h-16 w-28 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <RadioIcon className="h-6 w-6 opacity-40" />
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{event.title}</span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", statusStyles[event.status])}
                    >
                      {event.status === "Live" && (
                        <CircleIcon className="mr-1 h-2 w-2 animate-pulse fill-emerald-500 text-emerald-500" />
                      )}
                      {event.status}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {SESSION_TYPE_LABELS[event.sessionType]}
                    </Badge>
                  </div>

                  {event.description && (
                    <p className="line-clamp-1 text-muted-foreground text-xs">
                      {event.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatSchedule(event.scheduledStartAt)}
                    </span>
                    {countdown && (
                      <span className="flex items-center gap-1 font-medium text-amber-600">
                        <ClockIcon className="h-3 w-3" />
                        {countdown}
                      </span>
                    )}
                    <span>Broadcaster: {event.broadcasterDisplayName}</span>
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEdit(event)}
                            disabled={!isManageable}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setCancelTarget(event)}
                            disabled={!isManageable}
                          >
                            Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(event)}
                            disabled={!isManageable}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TooltipTrigger>
                  {!isManageable && (
                    <TooltipContent>
                      Cannot modify an active live session
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Create Event"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? "Update the session details. Changes take effect immediately."
                : "Schedule a live session for this Expo. The designated broadcaster will receive private stream credentials."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gl-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gl-title"
                placeholder="e.g. Opening Keynote"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value.slice(0, 256) })
                }
                maxLength={256}
              />
              {errors.title && (
                <p className="text-destructive text-xs">{errors.title}</p>
              )}
              <p className="text-right text-muted-foreground text-xs">
                {form.title.length}/256
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gl-type">
                Session Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.sessionType}
                onValueChange={(v) =>
                  setForm({ ...form, sessionType: v as GoLIVESessionType })
                }
              >
                <SelectTrigger id="gl-type">
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SESSION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sessionType && (
                <p className="text-destructive text-xs">{errors.sessionType}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gl-desc">Description</Label>
              <Textarea
                id="gl-desc"
                placeholder="Brief description visible to visitors…"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gl-start">Scheduled Start</Label>
              <Input
                id="gl-start"
                type="datetime-local"
                value={form.scheduledStartAt}
                onChange={(e) =>
                  setForm({ ...form, scheduledStartAt: e.target.value })
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank for an on-demand session (no fixed start time)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gl-broadcaster">
                Designated Broadcaster{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.broadcasterUserId}
                onValueChange={(v) =>
                  setForm({ ...form, broadcasterUserId: v })
                }
              >
                <SelectTrigger id="gl-broadcaster">
                  <SelectValue placeholder="Select a broadcaster" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_EXPO_MEMBERS.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.broadcasterUserId && (
                <p className="text-destructive text-xs">
                  {errors.broadcasterUserId}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="font-medium text-sm">Enable Replay</p>
                <p className="text-muted-foreground text-xs">
                  Record this session for on-demand replay after it ends
                </p>
              </div>
              <Switch
                checked={form.replayEnabled}
                onCheckedChange={(v) => setForm({ ...form, replayEnabled: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel GoLIVE Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel{" "}
              <strong>&ldquo;{cancelTarget?.title}&rdquo;</strong>. The event
              will remain visible in the schedule with a Canceled badge. Stream
              credentials will be invalidated immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => cancelTarget && handleCancel(cancelTarget)}
            >
              Cancel Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete GoLIVE Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>. It will no
              longer appear anywhere in the Expo. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
