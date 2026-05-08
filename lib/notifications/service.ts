import { randomUUID } from "node:crypto"

import { sql } from "@/lib/db/neon"
import type {
  NotificationEventPayload,
  NotificationRecord,
} from "@/lib/notifications/types"
import { parseNotificationEvent } from "@/lib/notifications/validation"

const DEFAULT_DEDUPE_WINDOW_MS = 5 * 60 * 1000
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getDedupeWindowMs() {
  const envValue = process.env.NOTIFICATION_DEDUPE_WINDOW_MS
  if (!envValue) {
    return DEFAULT_DEDUPE_WINDOW_MS
  }

  const parsed = Number.parseInt(envValue, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_DEDUPE_WINDOW_MS
  }

  return parsed
}

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

function isUuid(value: string) {
  return UUID_REGEX.test(value)
}

function parsePaginationCursor(
  cursor: string,
): { createdAt: string; notificationId?: string } | null {
  const parts = cursor.split("|")
  const createdAtRaw = parts[0]?.trim()
  if (!createdAtRaw) {
    return null
  }

  const createdAtDate = new Date(createdAtRaw)
  if (Number.isNaN(createdAtDate.getTime())) {
    return null
  }

  const notificationIdRaw = parts[1]?.trim()
  if (!notificationIdRaw) {
    return { createdAt: createdAtDate.toISOString() }
  }
  if (!isUuid(notificationIdRaw)) {
    return null
  }

  return {
    createdAt: createdAtDate.toISOString(),
    notificationId: notificationIdRaw,
  }
}

function toNotificationRecord(row: {
  notification_id: string
  user_id: string
  source: string
  type: string
  title: string
  body: string
  deep_link_path: string
  reference_id: string | null
  reference_type: string | null
  is_read: boolean
  created_at: string | Date
  read_at: string | Date | null
}): NotificationRecord {
  return {
    notificationId: row.notification_id,
    userId: row.user_id,
    source: row.source,
    type: row.type,
    title: row.title,
    body: row.body,
    deepLinkPath: row.deep_link_path,
    ...(row.reference_id ? { referenceId: row.reference_id } : {}),
    ...(row.reference_type ? { referenceType: row.reference_type } : {}),
    isRead: row.is_read,
    createdAt: toIso(row.created_at),
    readAt: row.read_at ? toIso(row.read_at) : null,
  }
}

export async function publishNotification(
  payload: NotificationEventPayload,
): Promise<{ deduped: boolean; notificationId: string }> {
  const parsed = parseNotificationEvent(payload)
  const dedupeWindowMs = getDedupeWindowMs()

  if (parsed.referenceId && parsed.referenceType) {
    const notificationId = randomUUID()
    const dedupeKey = `${parsed.userId}|${parsed.source}|${parsed.type}|${parsed.referenceId}`
    const dedupeRows = (await sql`
      with dedupe_lock as (
        select pg_advisory_xact_lock(hashtext(${dedupeKey}))
      ),
      existing as (
        select notification_id
        from notifications
        where user_id = ${parsed.userId}
          and source = ${parsed.source}
          and type = ${parsed.type}
          and reference_id = ${parsed.referenceId}
          and created_at >= now() - (${dedupeWindowMs} * interval '1 millisecond')
        order by created_at desc, notification_id desc
        limit 1
      ),
      inserted as (
        insert into notifications (
          notification_id,
          user_id,
          source,
          type,
          title,
          body,
          deep_link_path,
          reference_id,
          reference_type,
          is_read,
          created_at,
          read_at
        )
        select
          ${notificationId},
          ${parsed.userId},
          ${parsed.source},
          ${parsed.type},
          ${parsed.title},
          ${parsed.body},
          ${parsed.deepLinkPath},
          ${parsed.referenceId},
          ${parsed.referenceType},
          false,
          now(),
          null
        where not exists (select 1 from existing)
        returning notification_id
      )
      select true as deduped, notification_id
      from existing
      union all
      select false as deduped, notification_id
      from inserted
      limit 1
    `) as { deduped: boolean; notification_id: string }[]

    const dedupeResult = dedupeRows[0]
    if (!dedupeResult) {
      throw new Error("Failed to publish notification")
    }

    // This reduces duplicate rows under concurrent requests without schema changes.
    // Full hard guarantees need a DB-enforced uniqueness strategy introduced in a later task.
    return {
      deduped: dedupeResult.deduped,
      notificationId: dedupeResult.notification_id,
    }
  }

  const notificationId = randomUUID()
  await sql`
    insert into notifications (
      notification_id,
      user_id,
      source,
      type,
      title,
      body,
      deep_link_path,
      reference_id,
      reference_type,
      is_read,
      created_at,
      read_at
    )
    values (
      ${notificationId},
      ${parsed.userId},
      ${parsed.source},
      ${parsed.type},
      ${parsed.title},
      ${parsed.body},
      ${parsed.deepLinkPath},
      ${parsed.referenceId ?? null},
      ${parsed.referenceType ?? null},
      false,
      now(),
      null
    )
  `

  return {
    deduped: false,
    notificationId,
  }
}

export async function listNotifications(
  userId: string,
  opts: { limit: number; cursor?: string },
): Promise<NotificationRecord[]> {
  const rawLimit = Number.isFinite(opts.limit) ? opts.limit : 20
  const limit = Math.max(1, Math.min(100, Math.floor(rawLimit)))
  const cursor = opts.cursor?.trim()
  const parsedCursor = cursor ? parsePaginationCursor(cursor) : null

  const rows = parsedCursor?.notificationId
    ? ((await sql`
        select *
        from notifications
        where user_id = ${userId}
          and (
            created_at,
            notification_id
          ) < (
            ${parsedCursor.createdAt}::timestamptz,
            ${parsedCursor.notificationId}::uuid
          )
        order by created_at desc, notification_id desc
        limit ${limit}
      `) as {
        notification_id: string
        user_id: string
        source: string
        type: string
        title: string
        body: string
        deep_link_path: string
        reference_id: string | null
        reference_type: string | null
        is_read: boolean
        created_at: string | Date
        read_at: string | Date | null
      }[])
    : parsedCursor
      ? ((await sql`
          select *
          from notifications
          where user_id = ${userId}
            and created_at < ${parsedCursor.createdAt}::timestamptz
          order by created_at desc, notification_id desc
          limit ${limit}
        `) as {
          notification_id: string
          user_id: string
          source: string
          type: string
          title: string
          body: string
          deep_link_path: string
          reference_id: string | null
          reference_type: string | null
          is_read: boolean
          created_at: string | Date
          read_at: string | Date | null
        }[])
      : ((await sql`
        select *
        from notifications
        where user_id = ${userId}
        order by created_at desc, notification_id desc
        limit ${limit}
      `) as {
          notification_id: string
          user_id: string
          source: string
          type: string
          title: string
          body: string
          deep_link_path: string
          reference_id: string | null
          reference_type: string | null
          is_read: boolean
          created_at: string | Date
          read_at: string | Date | null
        }[])

  return rows.map(toNotificationRecord)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const rows = (await sql`
    select count(*)::int as unread_count
    from notifications
    where user_id = ${userId}
      and is_read = false
  `) as { unread_count: number }[]

  return rows[0]?.unread_count ?? 0
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<{ found: boolean; updated: boolean }> {
  const normalizedNotificationId = notificationId.trim()
  if (!isUuid(normalizedNotificationId)) {
    throw new Error("invalid notification id")
  }

  const rows = (await sql`
    with target as (
      select notification_id, is_read
      from notifications
      where user_id = ${userId}
        and notification_id = ${normalizedNotificationId}::uuid
      limit 1
    ),
    updated as (
      update notifications
      set
        is_read = true,
        read_at = now()
      where user_id = ${userId}
        and notification_id = ${normalizedNotificationId}::uuid
        and is_read = false
      returning notification_id
    )
    select
      exists(select 1 from target) as found,
      exists(select 1 from updated) as updated
  `) as { found: boolean; updated: boolean }[]

  return rows[0] ?? { found: false, updated: false }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await sql`
    update notifications
    set
      is_read = true,
      read_at = now()
    where user_id = ${userId}
      and is_read = false
  `
}

export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<{ found: boolean; deleted: boolean }> {
  const normalizedNotificationId = notificationId.trim()
  if (!isUuid(normalizedNotificationId)) {
    throw new Error("invalid notification id")
  }

  const rows = (await sql`
    with target as (
      select notification_id
      from notifications
      where user_id = ${userId}
        and notification_id = ${normalizedNotificationId}::uuid
      limit 1
    ),
    deleted as (
      delete from notifications
      where user_id = ${userId}
        and notification_id = ${normalizedNotificationId}::uuid
      returning notification_id
    )
    select
      exists(select 1 from target) as found,
      exists(select 1 from deleted) as deleted
  `) as { found: boolean; deleted: boolean }[]

  return rows[0] ?? { found: false, deleted: false }
}
