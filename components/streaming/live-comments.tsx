"use client"

import { SendIcon, TrashIcon, UserIcon } from "lucide-react"
import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import type { LiveComment, StreamSessionStatus } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

interface GuestIdentity {
  displayName: string
  email: string
}

interface Props {
  streamSessionId: string
  sessionStatus: StreamSessionStatus
  initialComments: LiveComment[]
  isModerator?: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function LiveComments({
  streamSessionId,
  sessionStatus,
  initialComments,
  isModerator = false
}: Props) {
  const [comments, setComments] = React.useState<LiveComment[]>(() =>
    [...initialComments].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  )
  const [commentText, setCommentText] = React.useState("")
  const [_guestIdentity, setGuestIdentity] =
    React.useState<GuestIdentity | null>(null)
  const [showGuestForm, setShowGuestForm] = React.useState(false)
  const [guestName, setGuestName] = React.useState("")
  const [guestEmail, setGuestEmail] = React.useState("")
  const [guestNameError, setGuestNameError] = React.useState("")
  const [guestEmailError, setGuestEmailError] = React.useState("")
  const [pendingText, setPendingText] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Current user is always "Khai Pham" (authenticated) in this prototype
  const currentUserId = "user-khai"
  const currentUserName = "Khai Pham"

  const isActive = sessionStatus === "Active"

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()
    const syncComments = async () => {
      try {
        const response = await fetch(
          `/api/stream/sessions/${streamSessionId}/comments`,
          {
            signal: controller.signal,
            cache: "no-store"
          }
        )
        if (!response.ok) return
        const payload = (await response.json()) as { comments?: LiveComment[] }
        if (!payload.comments) return
        setComments(
          [...payload.comments].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        )
      } catch {
        // no-op
      }
    }
    const interval = setInterval(syncComments, 3000)
    void syncComments()
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [streamSessionId])

  async function submitComment(text: string, identity?: GuestIdentity) {
    const trimmed = text.trim()
    if (!trimmed) return

    const newComment: LiveComment = {
      liveCommentId: `lc-${Date.now()}`,
      streamSessionId,
      authorUserId: currentUserId,
      authorDisplayName: currentUserName,
      guestDisplayName: null,
      guestEmail: null,
      commentText: trimmed,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      deletedByUserId: null
    }

    if (identity) {
      newComment.authorUserId = null
      newComment.authorDisplayName = null
      newComment.guestDisplayName = identity.displayName
      newComment.guestEmail = identity.email
    }

    try {
      const response = await fetch(
        `/api/stream/sessions/${streamSessionId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: newComment })
        }
      )
      if (!response.ok) return
      setComments((prev) => [...prev, newComment])
      setCommentText("")
      setPendingText("")
    } catch {
      // no-op
    }
  }

  async function handlePost() {
    if (!commentText.trim()) return
    await submitComment(commentText)
  }

  async function handleGuestPost() {
    let hasError = false
    setGuestNameError("")
    setGuestEmailError("")

    if (!guestName.trim()) {
      setGuestNameError("Name is required")
      hasError = true
    }
    if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      setGuestEmailError("Valid email is required")
      hasError = true
    }
    if (hasError) return

    const identity: GuestIdentity = {
      displayName: guestName.trim(),
      email: guestEmail.trim()
    }
    setGuestIdentity(identity)
    setShowGuestForm(false)
    await submitComment(pendingText, identity)
    setGuestName("")
    setGuestEmail("")
  }

  async function handleDelete(commentId: string) {
    const deletedAt = new Date().toISOString()
    try {
      const response = await fetch(`/api/stream/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deletedByUserId: currentUserId,
          deletedAt
        })
      })
      if (!response.ok) return
      setComments((prev) =>
        prev.map((c) =>
          c.liveCommentId === commentId
            ? {
                ...c,
                isDeleted: true,
                deletedAt,
                deletedByUserId: currentUserId
              }
            : c
        )
      )
    } catch {
      // no-op
    }
  }

  const visibleComments = comments.filter((c) => !c.isDeleted)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold text-sm">Live Comments</h3>
        <p className="text-muted-foreground text-xs">
          {visibleComments.length} messages
        </p>
      </div>

      <ScrollArea
        className="flex-1 px-4"
        ref={scrollRef as React.Ref<HTMLDivElement>}
      >
        <div className="space-y-4 py-4">
          {visibleComments.length === 0 && (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No comments yet. Be the first to say something!
            </p>
          )}
          {visibleComments.map((comment) => {
            const displayName =
              comment.authorDisplayName ?? comment.guestDisplayName ?? "Guest"
            const isGuest = !comment.authorUserId
            return (
              <div key={comment.liveCommentId} className="group flex gap-2">
                <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-[10px]",
                      isGuest
                        ? "bg-violet-100 text-violet-700"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate font-medium text-xs">
                      {displayName}
                    </span>
                    {isGuest && (
                      <span className="shrink-0 rounded bg-violet-100 px-1 py-px text-[10px] text-violet-600">
                        guest
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="wrap-break-word mt-0.5 text-sm">
                    {comment.commentText}
                  </p>
                </div>
                {isModerator && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.liveCommentId)}
                    className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    title="Delete comment"
                  >
                    <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        {!isActive ? (
          <p className="text-center text-muted-foreground text-xs italic">
            This stream has ended. Comments are closed.
          </p>
        ) : showGuestForm ? (
          <div className="space-y-3">
            <p className="font-medium text-xs">Enter your details to comment</p>
            <div className="space-y-1">
              <Label htmlFor="guest-name" className="text-xs">
                Your name
              </Label>
              <Input
                id="guest-name"
                placeholder="Display name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={60}
                className="h-8 text-sm"
              />
              {guestNameError && (
                <p className="text-[11px] text-destructive">{guestNameError}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="guest-email" className="text-xs">
                Your email
              </Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="Not shown publicly"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="h-8 text-sm"
              />
              {guestEmailError && (
                <p className="text-[11px] text-destructive">
                  {guestEmailError}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 text-xs"
                onClick={handleGuestPost}
              >
                Post Comment
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  setShowGuestForm(false)
                  setPendingText("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Textarea
              placeholder="Join the conversation…"
              value={commentText}
              onChange={(e) => {
                if (e.target.value.length <= 500) setCommentText(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handlePost()
                }
              }}
              rows={1}
              className="min-h-[36px] resize-none py-2 text-sm"
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handlePost}
              disabled={!commentText.trim()}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
        {isActive && !showGuestForm && (
          <div className="mt-1 flex justify-between">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <UserIcon className="h-3 w-3" /> Khai Pham
            </span>
            <span className="text-[11px] text-muted-foreground">
              {commentText.length}/500
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
