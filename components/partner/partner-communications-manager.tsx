"use client"

import {
  HandshakeIcon,
  MessageSquareIcon,
  PlusIcon,
  RadioIcon,
  SendIcon,
  ShieldCheckIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import type {
  PartnerCommunicationsWorkspace,
  PartnerMessageThread,
  PartnerMessageTrigger
} from "@/lib/partner/db"
import { cn } from "@/lib/utils"

const contextLabels: Record<PartnerMessageTrigger["contextType"], string> = {
  service_inquiry: "Service inquiry",
  bundle_purchase: "Bundle purchase",
  deal_support: "Deal support",
  expo_participation: "Expo participation"
}

export function PartnerCommunicationsManager({
  workspace
}: {
  workspace: PartnerCommunicationsWorkspace
}) {
  const router = useRouter()
  const [activeThreadId, setActiveThreadId] = useState(
    workspace.threads[0]?.id ?? ""
  )
  const [triggerKey, setTriggerKey] = useState(
    workspace.triggers[0]
      ? `${workspace.triggers[0].contextType}:${workspace.triggers[0].contextId}`
      : ""
  )
  const [messageBody, setMessageBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const activeThread = useMemo(
    () => workspace.threads.find((thread) => thread.id === activeThreadId),
    [workspace.threads, activeThreadId]
  )
  const activeMessages = activeThread
    ? (workspace.messagesByThread[activeThread.id] ?? [])
    : []

  async function submitJson(url: string, body?: unknown) {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Request failed.")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setIsSaving(false)
    }
  }

  async function createThread() {
    const [contextType, contextId] = triggerKey.split(":")
    await submitJson("/api/partner/message-threads", {
      contextType,
      contextId
    })
  }

  async function sendMessage() {
    if (!activeThread) return
    await submitJson(
      `/api/partner/message-threads/${activeThread.id}/messages`,
      {
        body: messageBody
      }
    )
    setMessageBody("")
  }

  async function toggleThreadStatus(thread: PartnerMessageThread) {
    await submitJson(`/api/partner/message-threads/${thread.id}/status`, {
      status: thread.status === "open" ? "closed" : "open"
    })
  }

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Open Threads"
          value={workspace.totals.openThreads.toLocaleString("en")}
          note="Context-bound conversations"
          icon={<MessageSquareIcon />}
        />
        <MetricCard
          title="Service Inquiry"
          value={workspace.totals.serviceInquiryTriggers.toLocaleString("en")}
          note="Published bundle triggers"
          icon={<HandshakeIcon />}
        />
        <MetricCard
          title="Deal Support"
          value={workspace.totals.dealSupportTriggers.toLocaleString("en")}
          note="RFQ/deal-context triggers"
          icon={<ShieldCheckIcon />}
        />
        <MetricCard
          title="Expo Support"
          value={workspace.totals.expoParticipationTriggers.toLocaleString(
            "en"
          )}
          note="Assigned expo triggers"
          icon={<RadioIcon />}
        />
      </section>

      {error ? <div className="text-destructive text-sm">{error}</div> : null}

      <section className="grid min-h-[560px] gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Partner Message Hub</CardTitle>
                <CardDescription>
                  Chat opens only from approved business context.
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <NativeSelect
                className="min-w-0 flex-1"
                value={triggerKey}
                onChange={(event) => setTriggerKey(event.target.value)}
              >
                {workspace.triggers.length === 0 ? (
                  <option value="">No available triggers</option>
                ) : null}
                {workspace.triggers.map((trigger) => (
                  <option
                    key={`${trigger.contextType}:${trigger.contextId}`}
                    value={`${trigger.contextType}:${trigger.contextId}`}
                  >
                    {trigger.label}
                  </option>
                ))}
              </NativeSelect>
              <Button
                size="sm"
                disabled={!triggerKey || isSaving}
                onClick={createThread}
              >
                <PlusIcon />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspace.threads.length === 0 ? (
              <div className="flex min-h-56 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                No communication threads yet.
              </div>
            ) : (
              workspace.threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={cn(
                    "w-full rounded-md border p-3 text-left transition-colors hover:bg-muted",
                    activeThreadId === thread.id && "border-primary bg-muted"
                  )}
                  onClick={() => setActiveThreadId(thread.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{thread.subject}</p>
                      <p className="text-muted-foreground text-xs">
                        {thread.participantLabel}
                      </p>
                    </div>
                    <Badge
                      variant={thread.status === "open" ? "default" : "outline"}
                    >
                      {thread.status}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-1 text-muted-foreground text-xs">
                    {thread.lastMessage ?? "No messages yet"}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>
                  {activeThread?.subject ?? "Select a thread"}
                </CardTitle>
                <CardDescription>
                  {activeThread
                    ? `${contextLabels[activeThread.contextType]} / ${activeThread.participantLabel}`
                    : "Context details appear here."}
                </CardDescription>
              </div>
              {activeThread ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => toggleThreadStatus(activeThread)}
                >
                  {activeThread.status === "open" ? "Close" : "Reopen"}
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="min-h-80 flex-1 space-y-3 rounded-md border bg-muted/20 p-3">
              {activeMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No messages in this thread.
                </div>
              ) : (
                activeMessages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-md bg-background p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-sm">
                        {message.senderLabel}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {message.createdAt.slice(0, 16).replace("T", " ")}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {message.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="grid gap-2">
              <Textarea
                value={messageBody}
                disabled={!activeThread || activeThread.status === "closed"}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Write a context-bound message..."
              />
              <div className="flex justify-end">
                <Button
                  disabled={
                    !activeThread ||
                    activeThread.status === "closed" ||
                    !messageBody.trim() ||
                    isSaving
                  }
                  onClick={sendMessage}
                >
                  <SendIcon />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function MetricCard({
  title,
  value,
  note,
  icon
}: {
  title: string
  value: string
  note: string
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-muted-foreground text-xs [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        <span>{note}</span>
      </CardContent>
    </Card>
  )
}
