"use client"

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item"
import { getNotificationSourceIcon } from "@/lib/notifications/source-icons"
import type { NotificationRecord } from "@/lib/notifications/types"
import { cn } from "@/lib/utils"

interface NotificationItemRowProps {
  notification: NotificationRecord
  isBusy?: boolean
  onRowClick: (notification: NotificationRecord) => void
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
  onRowClick
}: NotificationItemRowProps) {
  const SourceIcon = getNotificationSourceIcon(notification.source)
  const relativeTime = getRelativeTimeLabel(notification.createdAt)

  return (
    <Item
      size="sm"
      variant="outline"
      className={cn(
        "cursor-pointer",
        notification.isRead ? "bg-background" : "bg-muted/40"
      )}
      onClick={() => onRowClick(notification)}
    >
      <ItemMedia className="rounded-full bg-muted p-2">
        <SourceIcon className="size-4 text-muted-foreground" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <ItemTitle className="truncate">{notification.title}</ItemTitle>
            <ItemDescription className="mt-1 text-xs">
              {notification.body}
            </ItemDescription>
          </div>
          {!notification.isRead ? (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-primary">
              <span className="sr-only">Unread notification</span>
            </span>
          ) : null}
        </div>
        <span className="mt-1 text-muted-foreground text-xs">
          {relativeTime}
        </span>
      </ItemContent>
    </Item>
  )
}
