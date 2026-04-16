"use client"

import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getNotificationSourceIcon } from "@/lib/notifications/source-icons"
import type { NotificationRecord } from "@/lib/notifications/types"
import { cn } from "@/lib/utils"

interface NotificationItemRowProps {
  notification: NotificationRecord
  isBusy?: boolean
  onRowClick: (notification: NotificationRecord) => void
  onMarkAsRead: (notification: NotificationRecord) => void
}

function getRelativeTimeLabel(timestamp: string) {
  const date = new Date(timestamp)
  const diffMs = date.getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  if (absMs < hourMs) {
    return formatter.format(Math.round(diffMs / minuteMs), "minute")
  }
  if (absMs < dayMs) {
    return formatter.format(Math.round(diffMs / hourMs), "hour")
  }
  return formatter.format(Math.round(diffMs / dayMs), "day")
}

export function NotificationItemRow({
  notification,
  isBusy = false,
  onRowClick,
  onMarkAsRead,
}: NotificationItemRowProps) {
  const SourceIcon = getNotificationSourceIcon(notification.source)
  const relativeTime = getRelativeTimeLabel(notification.createdAt)

  return (
    <div
      className={cn(
        "w-full rounded-md border p-3 text-left transition-colors",
        "hover:bg-muted/60",
        notification.isRead ? "bg-background" : "bg-muted/40",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isBusy}
          onClick={() => onRowClick(notification)}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-muted p-2">
              <SourceIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    {notification.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                    {notification.body}
                  </p>
                </div>
                {!notification.isRead ? (
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary">
                    <span className="sr-only">Unread notification</span>
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">
                  {relativeTime}
                </span>
              </div>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          {!notification.isRead ? (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={isBusy}
              onClick={() => {
                void onMarkAsRead(notification)
              }}
            >
              <CheckIcon />
              Mark as read
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
