"use client"

import { BellIcon } from "lucide-react"
import type * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { NotificationsPageContent } from "./notifications-page-content"

const POLL_MS = 10_000

interface NotificationTriggerProps extends React.ComponentProps<typeof Button> {
  sheetTitle?: string
  sheetDescription?: string
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    return null
  }
  const payload = (await response.json()) as T
  return payload
}

function getUnreadLabel(unreadCount: number) {
  if (unreadCount <= 0) {
    return "Open notifications"
  }
  return `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
}

export function NotificationTrigger({
  className,
  children,
  variant = "ghost",
  size = "icon",
  sheetTitle = "Notifications",
  sheetDescription,
  ...props
}: NotificationTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const hasUnread = unreadCount > 0
  const unreadLabel = getUnreadLabel(unreadCount)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/unread-count`, {
        cache: "no-store"
      })
      const payload = await readJson<{ unreadCount: number }>(response)
      if (payload) {
        setUnreadCount(payload.unreadCount)
      }
    } catch {
      // Keep last known unread count; polling will retry.
    }
  }, [])

  useEffect(() => {
    void fetchUnreadCount()
    const timer = window.setInterval(() => {
      void fetchUnreadCount()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [fetchUnreadCount])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setIsOpen(nextOpen)
      if (nextOpen) {
        void fetchUnreadCount()
      }
    },
    [fetchUnreadCount]
  )

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          aria-label={unreadLabel}
          className={cn("relative", className)}
          {...props}
        >
          {children ?? <BellIcon />}
          {hasUnread ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground leading-none ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
              <span className="sr-only">{unreadLabel}</span>
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md" side="right">
        <SheetHeader>
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>
            {sheetDescription ??
              (hasUnread
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You are all caught up.")}
          </SheetDescription>
        </SheetHeader>
        <NotificationsPageContent
          className="min-h-0 flex-1 overflow-y-auto p-4"
          listLimit={20}
          onNavigate={() => setIsOpen(false)}
          onUnreadCountChange={setUnreadCount}
        />
      </SheetContent>
    </Sheet>
  )
}
