export type NotificationEventPayload = {
  userId: string
  source: string
  type: string
  title: string
  body: string
  deepLinkPath: string
  referenceId?: string
  referenceType?: string
}

export type NotificationRecord = NotificationEventPayload & {
  notificationId: string
  isRead: boolean
  createdAt: string
  readAt: string | null
}
