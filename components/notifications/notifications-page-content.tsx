"use client"

import { BellIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { NotificationItemRow } from "@/components/notifications/notification-item-row"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"
import type { NotificationRecord } from "@/lib/notifications/types"
import { cn } from "@/lib/utils"

const POLL_MS = 5_000
const LIST_LIMIT = 50

interface NotificationsPageContentProps {
  className?: string
  listLimit?: number
  pollMs?: number
  onNavigate?: () => void
  onUnreadCountChange?: (unreadCount: number) => void
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    return null
  }
  const payload = (await response.json()) as T
  return payload
}

export function NotificationsPageContent({
  className,
  listLimit = LIST_LIMIT,
  pollMs = POLL_MS,
  onNavigate,
  onUnreadCountChange
}: NotificationsPageContentProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [busyNotificationId, setBusyNotificationId] = useState<string | null>(
    null
  )

  const hasUnread = unreadCount > 0

  const updateUnreadCount = useCallback(
    (nextUnreadCount: number) => {
      setUnreadCount(nextUnreadCount)
      onUnreadCountChange?.(nextUnreadCount)
    },
    [onUnreadCountChange]
  )

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/unread-count`, {
        cache: "no-store"
      })
      const payload = await readJson<{ unreadCount: number }>(response)
      if (payload) {
        updateUnreadCount(payload.unreadCount)
      }
    } catch {
      // Keep last known unread count; polling will retry.
    }
  }, [updateUnreadCount])

  const fetchNotificationList = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?limit=${listLimit}`, {
        cache: "no-store"
      })
      const payload = await readJson<{ notifications: NotificationRecord[] }>(
        response
      )
      if (payload) {
        setNotifications(payload.notifications)
      }
    } catch {
      // Keep last known list; polling will retry.
    }
  }, [listLimit])

  const refreshListAndCount = useCallback(async () => {
    await Promise.all([fetchNotificationList(), fetchUnreadCount()])
  }, [fetchNotificationList, fetchUnreadCount])

  const markNotificationRead = useCallback(async (notificationId: string) => {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: "PATCH"
    })
    if (!response.ok) {
      return false
    }
    return true
  }, [])

  useEffect(() => {
    void refreshListAndCount()
    if (pollMs <= 0) {
      return
    }
    const timer = window.setInterval(() => {
      void refreshListAndCount()
    }, pollMs)
    return () => window.clearInterval(timer)
  }, [pollMs, refreshListAndCount])

  const handleOpenNotification = useCallback(
    async (notification: NotificationRecord) => {
      if (busyNotificationId) {
        return
      }
      setBusyNotificationId(notification.notificationId)
      try {
        if (!notification.isRead) {
          setNotifications((current) =>
            current.map((item) =>
              item.notificationId === notification.notificationId
                ? { ...item, isRead: true, readAt: new Date().toISOString() }
                : item
            )
          )
          setUnreadCount((current) => {
            const nextUnreadCount = Math.max(0, current - 1)
            onUnreadCountChange?.(nextUnreadCount)
            return nextUnreadCount
          })
        }
        const shouldNavigate =
          notification.isRead ||
          (await markNotificationRead(notification.notificationId))
        if (shouldNavigate) {
          onNavigate?.()
          router.push(notification.deepLinkPath)
        }
      } finally {
        setBusyNotificationId(null)
        await refreshListAndCount()
      }
    },
    [
      busyNotificationId,
      markNotificationRead,
      onNavigate,
      onUnreadCountChange,
      refreshListAndCount,
      router
    ]
  )

  return (
    <div className={cn("space-y-4", className)}>
      {notifications.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellIcon />
            </EmptyMedia>
            <EmptyTitle>No Notifications</EmptyTitle>
            <EmptyDescription className="max-w-xs text-pretty">
              No notifications yet. We&apos;ll let you know when something
              important happens.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItemRow
              key={notification.notificationId}
              notification={notification}
              isBusy={busyNotificationId === notification.notificationId}
              onRowClick={handleOpenNotification}
            />
          ))}
        </div>
      )}
    </div>
  )
}
