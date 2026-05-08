"use client"

import { CheckCheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { NotificationItemRow } from "@/components/notifications/notification-item-row"
import { Button } from "@/components/ui/button"
import type { NotificationRecord } from "@/lib/notifications/types"

const POLL_MS = 5_000
const LIST_LIMIT = 50

interface NotificationsPageContentProps {
  userId: string
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    return null
  }
  const payload = (await response.json()) as T
  return payload
}

export function NotificationsPageContent({
  userId,
}: NotificationsPageContentProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [busyNotificationId, setBusyNotificationId] = useState<string | null>(
    null,
  )
  const [isMarkAllBusy, setIsMarkAllBusy] = useState(false)

  const encodedUserId = useMemo(() => encodeURIComponent(userId), [userId])
  const hasUnread = unreadCount > 0

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/notifications/unread-count?userId=${encodedUserId}`,
        {
          cache: "no-store",
        },
      )
      const payload = await readJson<{ unreadCount: number }>(response)
      if (payload) {
        setUnreadCount(payload.unreadCount)
      }
    } catch {
      // Keep last known unread count; polling will retry.
    }
  }, [encodedUserId])

  const fetchNotificationList = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/notifications?userId=${encodedUserId}&limit=${LIST_LIMIT}`,
        {
          cache: "no-store",
        },
      )
      const payload = await readJson<{ notifications: NotificationRecord[] }>(
        response,
      )
      if (payload) {
        setNotifications(payload.notifications)
      }
    } catch {
      // Keep last known list; polling will retry.
    }
  }, [encodedUserId])

  const refreshListAndCount = useCallback(async () => {
    await Promise.all([fetchNotificationList(), fetchUnreadCount()])
  }, [fetchNotificationList, fetchUnreadCount])

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      const response = await fetch(
        `/api/notifications/${notificationId}/read?userId=${encodedUserId}`,
        {
          method: "PATCH",
        },
      )
      if (!response.ok) {
        return false
      }
      return true
    },
    [encodedUserId],
  )

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      const response = await fetch(
        `/api/notifications/${notificationId}?userId=${encodedUserId}`,
        {
          method: "DELETE",
        },
      )
      if (!response.ok) {
        return false
      }
      return true
    },
    [encodedUserId],
  )

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
                : item,
            ),
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
    [markNotificationRead, refreshListAndCount, router],
  )

  const handleMarkSingle = useCallback(
    async (notification: NotificationRecord) => {
      if (notification.isRead) {
        return
      }
      setBusyNotificationId(notification.notificationId)
      try {
        setNotifications((current) =>
          current.map((item) =>
            item.notificationId === notification.notificationId
              ? { ...item, isRead: true, readAt: new Date().toISOString() }
              : item,
          ),
        )
        setUnreadCount((current) => Math.max(0, current - 1))
        const isMarked = await markNotificationRead(notification.notificationId)
        if (!isMarked) {
          // Server rejected mark-read; refresh below reconciles optimistic state.
        }
      } finally {
        await refreshListAndCount()
        setBusyNotificationId(null)
      }
    },
    [markNotificationRead, refreshListAndCount],
  )

  const handleDeleteSingle = useCallback(
    async (notification: NotificationRecord) => {
      setBusyNotificationId(notification.notificationId)
      try {
        setNotifications((current) =>
          current.filter(
            (item) => item.notificationId !== notification.notificationId,
          ),
        )
        if (!notification.isRead) {
          setUnreadCount((current) => Math.max(0, current - 1))
        }
        const isDeleted = await deleteNotification(notification.notificationId)
        if (!isDeleted) {
          // Server rejected deletion; refresh below reconciles optimistic state.
        }
      } finally {
        await refreshListAndCount()
        setBusyNotificationId(null)
      }
    },
    [deleteNotification, refreshListAndCount],
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
            : { ...item, isRead: true, readAt: optimisticReadAt },
        ),
      )
      setUnreadCount(0)
      const response = await fetch(
        `/api/notifications/read-all?userId=${encodedUserId}`,
        {
          method: "POST",
        },
      )
      if (!response.ok) {
        // Server rejected mark-all; refresh below reconciles optimistic state.
      }
    } finally {
      await refreshListAndCount()
      setIsMarkAllBusy(false)
    }
  }, [encodedUserId, hasUnread, isMarkAllBusy, refreshListAndCount])

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
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No notifications yet. We&apos;ll let you know when something
            important happens.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItemRow
              key={notification.notificationId}
              notification={notification}
              isBusy={busyNotificationId === notification.notificationId}
              onRowClick={handleOpenNotification}
              onMarkAsRead={handleMarkSingle}
              onDelete={handleDeleteSingle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
