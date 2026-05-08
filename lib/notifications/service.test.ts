import { beforeEach, describe, expect, test } from "bun:test"

import { sql } from "@/lib/db/neon"
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  publishNotification,
} from "@/lib/notifications/service"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

describe("notification schema", () => {
  test("creates notifications table with required fields", async () => {
    await ensurePlatformSchema()
    const rows = (await sql`
      select column_name, data_type, column_default
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notifications'
    `) as {
      column_name: string
      data_type: string
      column_default: string | null
    }[]
    const columnNames = new Set(rows.map((row) => row.column_name))

    const requiredColumns = [
      "notification_id",
      "user_id",
      "source",
      "type",
      "title",
      "body",
      "deep_link_path",
      "reference_id",
      "reference_type",
      "is_read",
      "created_at",
      "read_at",
    ]
    for (const column of requiredColumns) {
      expect(columnNames.has(column)).toBe(true)
    }

    const notificationId = rows.find(
      (row) => row.column_name === "notification_id",
    )
    expect(notificationId?.data_type).toBe("uuid")

    const isRead = rows.find((row) => row.column_name === "is_read")
    const createdAt = rows.find((row) => row.column_name === "created_at")
    expect(isRead?.column_default).not.toBeNull()
    expect(createdAt?.column_default).not.toBeNull()

    const indexRows = (await sql`
      select indexname, indexdef
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'notifications'
    `) as { indexname: string; indexdef: string }[]
    const indexNames = new Set(indexRows.map((row) => row.indexname))
    expect(indexNames.has("idx_notifications_user_created")).toBe(true)
    expect(indexNames.has("idx_notifications_user_unread")).toBe(true)
    expect(indexNames.has("idx_notifications_dedupe_lookup")).toBe(true)

    const dedupeIndex = indexRows.find(
      (row) => row.indexname === "idx_notifications_dedupe_lookup",
    )
    expect(dedupeIndex).toBeDefined()
    expect(dedupeIndex?.indexdef).toContain(
      "(user_id, source, type, reference_id, created_at DESC)",
    )
    expect(dedupeIndex?.indexdef).toContain(
      "WHERE ((reference_id IS NOT NULL) AND (reference_type IS NOT NULL))",
    )
  })
})

describe("NotificationService", () => {
  beforeEach(async () => {
    await ensurePlatformSchema()
    await sql`delete from notifications`
  })

  test("dedupes same reference key inside window", async () => {
    const first = await publishNotification({
      userId: "seller-1",
      source: "chat",
      type: "message_received",
      title: "New message",
      body: "message body",
      deepLinkPath: "/seller/deal-room",
      referenceId: "conv-1",
      referenceType: "Conversation",
    })

    const second = await publishNotification({
      userId: "seller-1",
      source: "chat",
      type: "message_received",
      title: "New message",
      body: "message body",
      deepLinkPath: "/seller/deal-room",
      referenceId: "conv-1",
      referenceType: "Conversation",
    })

    expect(first.deduped).toBe(false)
    expect(second.deduped).toBe(true)
    expect(second.notificationId).toBe(first.notificationId)

    const rows = (await sql`
      select count(*)::int as count
      from notifications
      where user_id = 'seller-1'
    `) as { count: number }[]
    expect(rows[0]?.count).toBe(1)
  })

  test("does not dedupe when reference fields are absent", async () => {
    const first = await publishNotification({
      userId: "seller-1",
      source: "chat",
      type: "message_received",
      title: "New message",
      body: "message body",
      deepLinkPath: "/seller/deal-room",
    })
    const second = await publishNotification({
      userId: "seller-1",
      source: "chat",
      type: "message_received",
      title: "Another message",
      body: "message body",
      deepLinkPath: "/seller/deal-room",
    })

    expect(first.deduped).toBe(false)
    expect(second.deduped).toBe(false)

    const rows = (await sql`
      select count(*)::int as count
      from notifications
      where user_id = 'seller-1'
    `) as { count: number }[]
    expect(rows[0]?.count).toBe(2)
  })

  test("does not dedupe outside dedupe window", async () => {
    const previousWindow = process.env.NOTIFICATION_DEDUPE_WINDOW_MS
    process.env.NOTIFICATION_DEDUPE_WINDOW_MS = "50"

    try {
      const first = await publishNotification({
        userId: "seller-1",
        source: "chat",
        type: "message_received",
        title: "New message",
        body: "message body",
        deepLinkPath: "/seller/deal-room",
        referenceId: "conv-window",
        referenceType: "Conversation",
      })

      await sql`
        update notifications
        set created_at = now() - interval '10 minutes'
        where notification_id = ${first.notificationId}::uuid
      `

      const second = await publishNotification({
        userId: "seller-1",
        source: "chat",
        type: "message_received",
        title: "New message",
        body: "message body",
        deepLinkPath: "/seller/deal-room",
        referenceId: "conv-window",
        referenceType: "Conversation",
      })

      expect(second.deduped).toBe(false)
      expect(second.notificationId).not.toBe(first.notificationId)

      const rows = (await sql`
        select count(*)::int as count
        from notifications
        where user_id = 'seller-1'
          and reference_id = 'conv-window'
      `) as { count: number }[]
      expect(rows[0]?.count).toBe(2)
    } finally {
      if (previousWindow === undefined) {
        delete process.env.NOTIFICATION_DEDUPE_WINDOW_MS
      } else {
        process.env.NOTIFICATION_DEDUPE_WINDOW_MS = previousWindow
      }
    }
  })

  test("markNotificationRead is idempotent and updates unread count", async () => {
    const created = await publishNotification({
      userId: "seller-2",
      source: "orders",
      type: "payment_confirmed",
      title: "Payment confirmed",
      body: "Order paid",
      deepLinkPath: "/seller/orders",
    })

    const unreadBefore = await getUnreadCount("seller-2")
    expect(unreadBefore).toBe(1)

    const firstRead = await markNotificationRead(
      "seller-2",
      created.notificationId,
    )
    const secondRead = await markNotificationRead(
      "seller-2",
      created.notificationId,
    )

    expect(firstRead.found).toBe(true)
    expect(firstRead.updated).toBe(true)
    expect(secondRead.found).toBe(true)
    expect(secondRead.updated).toBe(false)

    const unreadAfter = await getUnreadCount("seller-2")
    expect(unreadAfter).toBe(0)

    const listed = await listNotifications("seller-2", { limit: 20 })
    expect(listed[0]?.isRead).toBe(true)
    expect(listed[0]?.readAt).not.toBeNull()
  })

  test("markNotificationRead rejects invalid UUID values", async () => {
    await publishNotification({
      userId: "seller-2b",
      source: "orders",
      type: "payment_confirmed",
      title: "Payment confirmed",
      body: "Order paid",
      deepLinkPath: "/seller/orders",
    })

    await expect(
      markNotificationRead("seller-2b", "not-a-valid-uuid"),
    ).rejects.toThrow("invalid notification id")
    expect(await getUnreadCount("seller-2b")).toBe(1)
  })

  test("deleteNotification removes the row and updates unread count", async () => {
    const unread = await publishNotification({
      userId: "seller-5",
      source: "orders",
      type: "payment_confirmed",
      title: "Unread notification",
      body: "Order paid",
      deepLinkPath: "/seller/orders",
    })
    const read = await publishNotification({
      userId: "seller-5",
      source: "chat",
      type: "message_received",
      title: "Read notification",
      body: "Message received",
      deepLinkPath: "/seller/deal-room",
    })
    await markNotificationRead("seller-5", read.notificationId)

    expect(await getUnreadCount("seller-5")).toBe(1)

    const unreadDelete = await deleteNotification(
      "seller-5",
      unread.notificationId,
    )
    expect(unreadDelete.found).toBe(true)
    expect(unreadDelete.deleted).toBe(true)
    expect(await getUnreadCount("seller-5")).toBe(0)

    const readDelete = await deleteNotification("seller-5", read.notificationId)
    expect(readDelete.found).toBe(true)
    expect(readDelete.deleted).toBe(true)

    const listed = await listNotifications("seller-5", { limit: 20 })
    expect(listed).toHaveLength(0)
  })

  test("deleteNotification rejects invalid UUID values", async () => {
    await publishNotification({
      userId: "seller-6",
      source: "orders",
      type: "payment_confirmed",
      title: "Payment confirmed",
      body: "Order paid",
      deepLinkPath: "/seller/orders",
    })

    await expect(
      deleteNotification("seller-6", "not-a-valid-uuid"),
    ).rejects.toThrow("invalid notification id")
    expect(await getUnreadCount("seller-6")).toBe(1)
  })

  test("listNotifications uses stable tie-breaker for matching timestamps", async () => {
    const createdOne = await publishNotification({
      userId: "seller-4",
      source: "orders",
      type: "payment_confirmed",
      title: "One",
      body: "Order paid",
      deepLinkPath: "/seller/orders",
    })
    const createdTwo = await publishNotification({
      userId: "seller-4",
      source: "orders",
      type: "payment_confirmed",
      title: "Two",
      body: "Order paid",
      deepLinkPath: "/seller/orders",
    })

    await sql`
      update notifications
      set created_at = '2026-01-01T00:00:00.000Z'::timestamptz
      where notification_id in (
        ${createdOne.notificationId}::uuid,
        ${createdTwo.notificationId}::uuid
      )
    `

    const firstPage = await listNotifications("seller-4", { limit: 1 })
    expect(firstPage).toHaveLength(1)
    const firstRow = firstPage[0]
    expect(firstRow).toBeDefined()

    const secondPage = await listNotifications("seller-4", {
      limit: 1,
      cursor: `${firstRow?.createdAt}|${firstRow?.notificationId}`,
    })
    expect(secondPage).toHaveLength(1)
    expect(secondPage[0]?.notificationId).not.toBe(firstRow?.notificationId)
  })

  test("markAll marks unread notifications as read", async () => {
    await publishNotification({
      userId: "seller-3",
      source: "orders",
      type: "payment_confirmed",
      title: "Payment confirmed",
      body: "Order paid",
      deepLinkPath: "/seller/orders",
    })
    await publishNotification({
      userId: "seller-3",
      source: "tradexpo",
      type: "expo_updated",
      title: "Expo updated",
      body: "Your expo draft changed",
      deepLinkPath: "/seller/expos",
    })

    expect(await getUnreadCount("seller-3")).toBe(2)
    await markAllNotificationsRead("seller-3")
    expect(await getUnreadCount("seller-3")).toBe(0)

    const listed = await listNotifications("seller-3", { limit: 20 })
    expect(listed).toHaveLength(2)
    expect(listed.every((row) => row.isRead)).toBe(true)
    expect(listed.every((row) => row.readAt !== null)).toBe(true)
  })
})
