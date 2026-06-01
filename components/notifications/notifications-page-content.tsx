"use client"

import { BellIcon, CheckCheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { NotificationItemRow } from "@/components/notifications/notification-item-row"
import { Button } from "@/components/ui/button"
import type { NotificationRecord } from "@/lib/notifications/types"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "../ui/empty"

const POLL_MS = 5_000
const LIST_LIMIT = 50

async function readJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    return null
  }
  const payload = (await response.json()) as T
  return payload
}

export function NotificationsPageContent() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [busyNotificationId, setBusyNotificationId] = useState<string | null>(
    null
  )
  const [isMarkAllBusy, setIsMarkAllBusy] = useState(false)

  const hasUnread = unreadCount > 0

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

  const fetchNotificationList = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?limit=${LIST_LIMIT}`, {
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
  }, [])

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
    const timer = window.setInterval(() => {
      void refreshListAndCount()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [refreshListAndCount])

  const handleOpenNotification = useCallback(
    async (notification: NotificationRecord) => {
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
          setUnreadCount((current) => Math.max(0, current - 1))
        }
        const shouldNavigate =
          notification.isRead ||
          (await markNotificationRead(notification.notificationId))
        if (shouldNavigate) {
          router.push(notification.deepLinkPath)
        }
      } finally {
        setBusyNotificationId(null)
        await refreshListAndCount()
      }
    },
    [markNotificationRead, refreshListAndCount, router]
  )

  const handleMarkAll = useCallback(async () => {
    if (!hasUnread || isMarkAllBusy) {
      return
    }
    setIsMarkAllBusy(true)
    try {
      const optimisticReadAt = new Date().toISOString()
      setNotifications((current) =>
        current.map((item) =>
          item.isRead
            ? item
            : { ...item, isRead: true, readAt: optimisticReadAt }
        )
      )
      setUnreadCount(0)
      const response = await fetch(`/api/notifications/read-all`, {
        method: "POST"
      })
      if (!response.ok) {
        // Server rejected mark-all; refresh below reconciles optimistic state.
      }
    } finally {
      await refreshListAndCount()
      setIsMarkAllBusy(false)
    }
  }, [hasUnread, isMarkAllBusy, refreshListAndCount])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={!hasUnread || isMarkAllBusy}
          onClick={handleMarkAll}
        >
          <CheckCheckIcon />
          Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Empty className="border border-dashed">
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
