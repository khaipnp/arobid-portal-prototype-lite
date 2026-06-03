"use client"

import { BellIcon } from "lucide-react"
import { NotificationTrigger } from "@/components/notifications/notification-trigger"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"

interface NotificationsSheetEntryProps {
  description?: string
}

export function NotificationsSheetEntry({
  description = "Notifications now open in a right-side sheet so you can review updates without leaving your current workflow."
}: NotificationsSheetEntryProps) {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <Empty className="border border-dashed bg-muted/20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BellIcon />
          </EmptyMedia>
          <EmptyTitle>Notifications moved to the header</EmptyTitle>
          <EmptyDescription className="max-w-sm text-pretty">
            {description}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NotificationTrigger size="default" variant="default">
            <BellIcon />
            Open notification sheet
          </NotificationTrigger>
        </EmptyContent>
      </Empty>
    </div>
  )
}
