"use client"

import {
  ArchiveIcon,
  BuildingIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PencilIcon,
  PhoneIcon,
  SearchIcon,
  SendHorizontalIcon,
  TrashIcon,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { ChatUser, Conversation, Message } from "@/lib/deal-room/types"
import { cn } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MAX_ATTACHMENTS_PER_MESSAGE = 5
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
const MAX_INLINE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_FILE_TYPES = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "mp4",
  "pdf",
  "md",
  "doc",
  "docx",
  "csv",
  "xlsx",
])
const IMAGE_FILE_TYPES = new Set(["jpg", "jpeg", "png", "webp"])

type PendingAttachment = {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

function isImageAttachment(att: {
  fileType: string
  fileUrl: string
}): boolean {
  return IMAGE_FILE_TYPES.has(att.fileType.toLowerCase()) && att.fileUrl !== "#"
}

function formatRelativeTime(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(isoStr).toLocaleDateString()
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getConversationDisplayName(
  conv: Conversation,
  users: ChatUser[],
  currentUserId: string,
): string {
  const otherId = conv.members.find((m) => m.userId !== currentUserId)?.userId
  return users.find((u) => u.id === otherId)?.name ?? "Unknown User"
}

function getLastMessage(
  messages: Message[],
): { preview: string; sentAt: string } | null {
  const last = messages.at(-1)
  if (!last) return null
  let preview: string
  if (last.isDeleted) {
    preview = "This message was deleted."
  } else if (last.isSystemMessage) {
    preview = last.content
  } else if (last.attachments.length > 0 && !last.content) {
    preview = `📎 ${last.attachments[0].fileName}`
  } else {
    preview = last.content
  }
  return { preview, sentAt: last.sentAt }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConversationAvatar({
  conv,
  users,
  currentUserId,
  size = "default",
}: {
  conv: Conversation
  users: ChatUser[]
  currentUserId: string
  size?: "sm" | "default"
}) {
  const otherId = conv.members.find((m) => m.userId !== currentUserId)?.userId
  const other = users.find((u) => u.id === otherId)
  const initials = other?.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <Avatar size={size === "sm" ? "sm" : "default"}>
      <AvatarFallback>{initials ?? "?"}</AvatarFallback>
    </Avatar>
  )
}

function UserHoverCard({
  user,
  side = "right",
  children,
  onMessageClick,
}: {
  user: ChatUser
  side?: "top" | "right" | "bottom" | "left"
  children: React.ReactNode
  onMessageClick?: () => void
}) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <HoverCard openDelay={400} closeDelay={150}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side={side} align="start" className="w-72 p-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-3">
          <Avatar>
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{user.name}</p>
            {user.jobTitle && (
              <p className="truncate text-muted-foreground text-xs">
                {user.jobTitle}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Details */}
        <div className="space-y-2 p-3 text-xs">
          <div className="flex items-start gap-2">
            <BuildingIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="font-medium">{user.company}</span>
          </div>
          <div className="flex items-start gap-2">
            <MailIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-start gap-2">
              <PhoneIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">{user.phone}</span>
            </div>
          )}
          {user.website && (
            <div className="flex items-start gap-2">
              <GlobeIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">
                {user.website}
              </span>
            </div>
          )}
          {user.location && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">{user.location}</span>
            </div>
          )}
        </div>

        {onMessageClick && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-full text-xs"
                onClick={onMessageClick}
              >
                <MessageCircleIcon className="size-3.5" />
                Send Direct Message
              </Button>
            </div>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DealRoomManager({
  initialConversationId,
  initialUsers,
  initialConversations,
  initialMessagesMap,
  initialUnreadCounts,
  currentUserId,
}: {
  initialConversationId?: string
  initialUsers: ChatUser[]
  initialConversations: Conversation[]
  initialMessagesMap: Record<string, Message[]>
  initialUnreadCounts: Record<string, number>
  currentUserId: string
}) {
  const router = useRouter()

  // ── State ──
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    structuredClone(initialConversations),
  )
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(
    () => structuredClone(initialMessagesMap),
  )
  const [users] = useState<ChatUser[]>(initialUsers)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(
    () => ({ ...initialUnreadCounts }),
  )
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(initialConversationId ?? null)

  const [inboxSearch, setInboxSearch] = useState("")
  const [inboxFilter, setInboxFilter] = useState<"active" | "archived">(
    "active",
  )
  const [composerValue, setComposerValue] = useState("")
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([])
  const [composerError, setComposerError] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Derived ──
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null
  const activeMessages = activeConversationId
    ? (messagesMap[activeConversationId] ?? [])
    : []

  const visibleConversations = conversations
    .filter((c) => {
      const myMember = c.members.find((m) => m.userId === currentUserId)
      if (!myMember) return false
      if (inboxFilter === "active" && myMember.isArchived) return false
      if (inboxFilter === "archived" && !myMember.isArchived) return false
      if (!inboxSearch) return true
      const name = getConversationDisplayName(c, users, currentUserId)
      const otherId = c.members.find((m) => m.userId !== currentUserId)?.userId
      const otherUser = users.find((u) => u.id === otherId)
      const query = inboxSearch.toLowerCase()
      return (
        name.toLowerCase().includes(query) ||
        (otherUser?.company.toLowerCase().includes(query) ?? false)
      )
    })
    .sort((a, b) => {
      const aTime = messagesMap[a.id]?.at(-1)?.sentAt ?? a.createdAt
      const bTime = messagesMap[b.id]?.at(-1)?.sentAt ?? b.createdAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0)

  // ── Handlers ──
  function selectConversation(id: string) {
    setActiveConversationId(id)
    setUnreadCounts((prev) => ({ ...prev, [id]: 0 }))
    setComposerValue("")
    setPendingAttachments([])
    setComposerError(null)
    setEditingMessageId(null)
    router.push(`/seller/deal-room/${id}`, { scroll: false })
  }

  async function handleSelectAttachments(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    async function toDataUrl(file: File): Promise<string> {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () =>
          resolve(typeof reader.result === "string" ? reader.result : "#")
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
      })
    }

    setComposerError(null)
    const accepted: PendingAttachment[] = []
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
      if (!ALLOWED_FILE_TYPES.has(ext)) {
        setComposerError(
          "File type not supported. Allowed: JPG, JPEG, PNG, WEBP, MP4, PDF, MD, DOC, DOCX, CSV, XLSX.",
        )
        continue
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setComposerError("File too large. Maximum file size is 20 MB.")
        continue
      }
      if (
        IMAGE_FILE_TYPES.has(ext) &&
        file.size > MAX_INLINE_IMAGE_SIZE_BYTES
      ) {
        setComposerError(
          "Image too large to preview. Maximum preview size is 5 MB.",
        )
        continue
      }
      const fileUrl = IMAGE_FILE_TYPES.has(ext) ? await toDataUrl(file) : "#"
      accepted.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: ext,
      })
    }
    setPendingAttachments((prev) => {
      const availableSlots = Math.max(
        MAX_ATTACHMENTS_PER_MESSAGE - prev.length,
        0,
      )
      if (accepted.length > availableSlots) {
        setComposerError("Maximum 5 files per message.")
      }
      return [...prev, ...accepted.slice(0, availableSlots)]
    })
    event.target.value = ""
  }

  function handleRemovePendingAttachment(id: string) {
    setPendingAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  async function handleSendMessage() {
    const text = composerValue.trim()
    if (!activeConversationId) return
    if (!text && pendingAttachments.length === 0) {
      setComposerError("Message cannot be empty.")
      return
    }
    setComposerError(null)

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUserId,
      content: text,
      attachments: pendingAttachments.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        fileType: file.fileType as
          | "jpg"
          | "jpeg"
          | "png"
          | "webp"
          | "mp4"
          | "pdf"
          | "md"
          | "doc"
          | "docx"
          | "csv"
          | "xlsx",
      })),
      status: "sent",
      sentAt: new Date().toISOString(),
      isDeleted: false,
      isSystemMessage: false,
    }

    try {
      const response = await fetch(
        `/api/deal-room/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newMsg.id,
            senderId: newMsg.senderId,
            content: newMsg.content,
            attachments: newMsg.attachments,
            status: newMsg.status,
            sentAt: newMsg.sentAt,
          }),
        },
      )
      if (!response.ok) {
        setComposerError("Unable to send message.")
        return
      }
      setMessagesMap((prev) => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] ?? []), newMsg],
      }))
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                members: conv.members.map((member) =>
                  member.userId === currentUserId
                    ? { ...member, isArchived: false }
                    : member,
                ),
              }
            : conv,
        ),
      )
      setComposerValue("")
      setPendingAttachments([])
    } catch {
      setComposerError("Unable to send message.")
    }
  }

  async function handleSaveEdit() {
    if (!activeConversationId || !editingMessageId) return
    const text = editingContent.trim()
    if (!text) return
    const editedAt = new Date().toISOString()
    try {
      const response = await fetch(
        `/api/deal-room/conversations/${activeConversationId}/messages/${editingMessageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, editedAt }),
        },
      )
      if (!response.ok) return
      setMessagesMap((prev) => ({
        ...prev,
        [activeConversationId]:
          prev[activeConversationId]?.map((m) =>
            m.id === editingMessageId ? { ...m, content: text, editedAt } : m,
          ) ?? [],
      }))
      setEditingMessageId(null)
    } catch {
      // keep editing state to let user retry
    }
  }

  async function handleDeleteMessage(id: string) {
    if (!activeConversationId) return
    try {
      const response = await fetch(
        `/api/deal-room/conversations/${activeConversationId}/messages/${id}`,
        { method: "DELETE" },
      )
      if (!response.ok) return
      setMessagesMap((prev) => ({
        ...prev,
        [activeConversationId]:
          prev[activeConversationId]?.map((m) =>
            m.id === id ? { ...m, isDeleted: true, attachments: [] } : m,
          ) ?? [],
      }))
    } catch {
      // no-op
    }
  }

  async function handleArchiveConversation(id: string) {
    try {
      const response = await fetch(
        `/api/deal-room/conversations/${id}/archive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        },
      )
      if (!response.ok) return
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                members: c.members.map((m) =>
                  m.userId === currentUserId ? { ...m, isArchived: true } : m,
                ),
              }
            : c,
        ),
      )
      if (activeConversationId === id) {
        setActiveConversationId(null)
        router.push("/seller/deal-room", { scroll: false })
      }
    } catch {
      // no-op
    }
  }

  // ── Render ──
  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* ── Left panel: Conversation list ── */}
      <aside className="flex w-72 shrink-0 flex-col border-r bg-sidebar">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <MessageCircleIcon className="size-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Deal Room</span>
            {totalUnread > 0 && (
              <Badge className="h-4 min-w-4 rounded-full px-1 text-xs">
                {totalUnread}
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or company..."
              className="h-8 pl-8 text-xs"
              value={inboxSearch}
              onChange={(e) => setInboxSearch(e.target.value)}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
            <Button
              variant={inboxFilter === "active" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setInboxFilter("active")}
            >
              Inbox
            </Button>
            <Button
              variant={inboxFilter === "archived" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setInboxFilter("archived")}
            >
              Archived
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {visibleConversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-muted-foreground text-xs">
                {inboxSearch
                  ? "No conversations match your search."
                  : inboxFilter === "archived"
                    ? "No archived conversations."
                    : "No conversations yet. Start a conversation to begin negotiating."}
              </p>
            </div>
          ) : (
            visibleConversations.map((conv) => {
              const displayName = getConversationDisplayName(
                conv,
                users,
                currentUserId,
              )
              const lastMsg = getLastMessage(messagesMap[conv.id] ?? [])
              const unread = unreadCounts[conv.id] ?? 0
              const isActive = conv.id === activeConversationId

              return (
                <button
                  key={conv.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent",
                    isActive && "bg-sidebar-accent",
                  )}
                  onClick={() => selectConversation(conv.id)}
                >
                  <ConversationAvatar
                    conv={conv}
                    users={users}
                    currentUserId={currentUserId}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "truncate text-sm",
                          unread > 0
                            ? "font-semibold text-foreground"
                            : "font-medium",
                        )}
                      >
                        {displayName}
                      </span>
                      {lastMsg && (
                        <span className="shrink-0 text-muted-foreground text-xs">
                          {formatRelativeTime(lastMsg.sentAt)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-1">
                      <span className="truncate text-muted-foreground text-xs">
                        {lastMsg
                          ? lastMsg.preview.slice(0, 60)
                          : "No messages yet"}
                      </span>
                      {unread > 0 && (
                        <Badge className="h-4 min-w-4 shrink-0 rounded-full px-1 text-xs">
                          {unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      {activeConversation ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Thread header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-3">
              {(() => {
                if (activeConversation.type === "direct") {
                  const otherId = activeConversation.members.find(
                    (m) => m.userId !== currentUserId,
                  )?.userId
                  const other = users.find((u) => u.id === otherId)
                  if (other) {
                    return (
                      <UserHoverCard user={other} side="bottom">
                        <button
                          type="button"
                          className="flex cursor-pointer items-center gap-3"
                        >
                          <ConversationAvatar
                            conv={activeConversation}
                            users={users}
                            currentUserId={currentUserId}
                            size="sm"
                          />
                          <div className="text-left">
                            <p className="font-semibold text-sm leading-tight hover:underline">
                              {other.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {other.company}
                            </p>
                          </div>
                        </button>
                      </UserHoverCard>
                    )
                  }
                }
                return (
                  <div className="flex items-center gap-3">
                    <ConversationAvatar
                      conv={activeConversation}
                      users={users}
                      currentUserId={currentUserId}
                      size="sm"
                    />
                    <div>
                      <p className="font-semibold text-sm leading-tight">
                        {getConversationDisplayName(
                          activeConversation,
                          users,
                          currentUserId,
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        1:1 direct conversation
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    handleArchiveConversation(activeConversation.id)
                  }
                >
                  <ArchiveIcon className="size-4" />
                  Archive conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Messages area */}
          <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {activeMessages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  No messages yet. Say hello!
                </p>
              </div>
            )}
            {activeMessages.map((msg, idx) => {
              const isOwn = msg.senderId === currentUserId
              const sender = users.find((u) => u.id === msg.senderId)
              const prevMsg = activeMessages[idx - 1]
              const showSenderName =
                !isOwn &&
                !msg.isSystemMessage &&
                msg.senderId !== prevMsg?.senderId

              const sentMs = new Date(msg.sentAt).getTime()
              const isEditable =
                isOwn &&
                !msg.isDeleted &&
                !msg.isSystemMessage &&
                Date.now() - sentMs < 15 * 60 * 1000

              // System message
              if (msg.isSystemMessage) {
                return (
                  <div key={msg.id} className="flex justify-center py-1">
                    <span className="rounded-full bg-muted/60 px-3 py-0.5 text-muted-foreground text-xs italic">
                      {msg.content}
                    </span>
                  </div>
                )
              }

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-end gap-2",
                    isOwn ? "justify-end" : "justify-start",
                    idx > 0 &&
                      activeMessages[idx - 1].senderId !== msg.senderId &&
                      "mt-3",
                  )}
                >
                  {/* Other's avatar */}
                  {!isOwn && (
                    <div className="mb-4 shrink-0">
                      {sender ? (
                        <UserHoverCard user={sender} side="right">
                          <button type="button" className="cursor-pointer">
                            <Avatar size="sm">
                              <AvatarFallback>
                                {sender.name
                                  .split(" ")
                                  .map((w) => w[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                        </UserHoverCard>
                      ) : (
                        <Avatar size="sm">
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex max-w-[60%] flex-col gap-0.5",
                      isOwn ? "items-end" : "items-start",
                    )}
                  >
                    {showSenderName && sender && (
                      <UserHoverCard user={sender} side="right">
                        <button
                          type="button"
                          className="ml-1 cursor-pointer text-muted-foreground text-xs hover:text-foreground hover:underline"
                        >
                          {sender.name}
                        </button>
                      </UserHoverCard>
                    )}

                    {/* Editing state */}
                    {editingMessageId === msg.id ? (
                      <div className="flex w-72 flex-col gap-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="min-h-0 resize-none py-1.5 text-sm"
                          rows={3}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSaveEdit()
                            }
                            if (e.key === "Escape") setEditingMessageId(null)
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setEditingMessageId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "group relative rounded-2xl px-3 py-2 text-sm",
                          isOwn
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm bg-muted text-foreground",
                          msg.isDeleted && "italic opacity-60",
                        )}
                      >
                        {msg.isDeleted ? (
                          <span>This message was deleted.</span>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                            {msg.attachments.length > 0 && (
                              <div className="mt-2 flex flex-col gap-1.5">
                                {msg.attachments.map((att) => (
                                  <div key={att.id}>
                                    {isImageAttachment(att) ? (
                                      <a
                                        href={att.fileUrl}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className={cn(
                                          "block overflow-hidden rounded-lg border",
                                          isOwn
                                            ? "border-primary-foreground/30"
                                            : "border-border/70",
                                        )}
                                      >
                                        <Image
                                          src={att.fileUrl}
                                          alt={att.fileName}
                                          width={360}
                                          height={220}
                                          unoptimized
                                          className="h-auto max-h-64 w-full max-w-72 object-cover"
                                        />
                                      </a>
                                    ) : (
                                      <div
                                        className={cn(
                                          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
                                          isOwn
                                            ? "bg-primary-foreground/20"
                                            : "bg-background/60",
                                        )}
                                      >
                                        <PaperclipIcon className="size-3.5 shrink-0" />
                                        <span className="min-w-0 truncate">
                                          {att.fileName}
                                        </span>
                                        <span className="shrink-0 opacity-70">
                                          {formatFileSize(att.fileSize)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* Hover actions (own messages only) */}
                        {isOwn && !msg.isDeleted && (
                          <div className="absolute -top-7 right-0 hidden items-center gap-0.5 rounded-full border bg-popover px-1 py-0.5 shadow-xs group-hover:flex">
                            {isEditable && (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="size-6"
                                onClick={() => {
                                  setEditingMessageId(msg.id)
                                  setEditingContent(msg.content)
                                }}
                              >
                                <PencilIcon className="size-3" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="size-6 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteMessage(msg.id)}
                            >
                              <TrashIcon className="size-3" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp + meta */}
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-muted-foreground text-xs">
                        {formatRelativeTime(msg.sentAt)}
                      </span>
                      {msg.editedAt && (
                        <span className="text-muted-foreground text-xs">
                          · Edited
                        </span>
                      )}
                      {isOwn && !msg.isDeleted && (
                        <span className="text-muted-foreground text-xs">
                          ·{" "}
                          {msg.status === "read"
                            ? "Read"
                            : msg.status === "delivered"
                              ? "Delivered"
                              : "Sent"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Own avatar placeholder for alignment */}
                  {isOwn && <div className="mb-4 size-7 shrink-0" />}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="border-t p-3">
            <div className="space-y-2 rounded-xl border bg-background px-3 py-2 transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pendingAttachments.map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
                      onClick={() => handleRemovePendingAttachment(att.id)}
                    >
                      <PaperclipIcon className="size-3" />
                      <span className="max-w-40 truncate">{att.fileName}</span>
                      <span className="text-muted-foreground">
                        ({formatFileSize(att.fileSize)})
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-start gap-2">
                <Button size="icon" variant="ghost" asChild>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,.mp4,.pdf,.md,.doc,.docx,.csv,.xlsx"
                      onChange={handleSelectAttachments}
                    />
                    <PaperclipIcon className="size-4" />
                    <span className="sr-only">Attach files</span>
                  </label>
                </Button>
                <Textarea
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  className="min-h-0 flex-1 resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0"
                  rows={1}
                  value={composerValue}
                  onChange={(e) => setComposerValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  size="icon"
                  disabled={
                    !composerValue.trim() && pendingAttachments.length === 0
                  }
                  onClick={handleSendMessage}
                  className="shrink-0 rounded-full"
                >
                  <SendHorizontalIcon className="size-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
            {composerError && (
              <p className="mt-2 text-destructive text-xs">{composerError}</p>
            )}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-primary p-4">
            <MessageCircleIcon className="size-8 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-lg">Your messages</p>
            <p className="mt-1 text-muted-foreground">
              Select a conversation to view messages.
              <br />
              Let's start a new conversation to get a big deal.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
