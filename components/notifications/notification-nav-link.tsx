"use client"

import { BellIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

interface NotificationNavLinkProps {
  href: string
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    return null
  }
  const payload = (await response.json()) as T
  return payload
}

const POLL_MS = 10_000

export function NotificationNavLink({ href }: NotificationNavLinkProps) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  const hasUnread = unreadCount > 0
  const isActive = pathname === href

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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={href}>
          <div className="relative">
            <BellIcon className="size-4" />
            {hasUnread ? (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary">
                <span className="sr-only">Unread notifications</span>
              </span>
            ) : null}
          </div>
          <span>Notifications</span>
          {hasUnread ? (
            <Badge className="ml-auto h-4 px-1.5" aria-live="polite">
              {unreadCount}
            </Badge>
          ) : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
