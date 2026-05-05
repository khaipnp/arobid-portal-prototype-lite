import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
import type {
  AdminNotification,
  BoothCustomization,
  BoothTemplateCustomizationConfig,
  ExhibitorCatalogProduct,
  Expo,
  ExpoBoothTemplateAssignment,
  ExpoCategory,
  ExpoHall,
  ExpoHallDraft,
  ExpoLayoutTemplate,
  ExpoStatus,
  GoLIVEEvent,
  GoLIVEEventStatus,
  LiveComment,
  NotificationKind,
  SellerBoothRegistration,
  StreamSession,
  StreamSessionStatus,
} from "@/lib/tradexpo/types"

type ExpoRow = {
  id: string
  name: string
  thumbnail_url: string
  owner_email: string
  start_date: string | Date
  end_date: string | Date
  status: Expo["status"]
  category_ids: string[]
  created_at: string | Date
  description?: string
  timezone?: string
  expo_template_id?: string | null
  owner_user_id?: string | null
  start_at?: string | Date | null
  end_at?: string | Date | null
}

type CategoryRow = {
  id: string
  name: string
  level: number
}

type NotifRow = {
  id: string
  kind: NotificationKind
  title: string
  message: string
  related_expo_id: string | null
  created_at: string | Date
  is_read: boolean
}

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

function toDateOnly(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

export async function listExpoCategories(): Promise<ExpoCategory[]> {
  const rows = (await sql`
    select id, name, level from expo_categories order by name asc
  `) as CategoryRow[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    level: 1,
  }))
}

function rowToExpo(r: ExpoRow): Expo {
  const startAt = r.start_at ? toIso(r.start_at) : undefined
  const endAt = r.end_at ? toIso(r.end_at) : undefined
  return {
    id: r.id,
    name: r.name,
    thumbnailUrl: r.thumbnail_url,
    ownerEmail: r.owner_email,
    startDate: startAt
      ? toDateOnly(r.start_at as string | Date)
      : toDateOnly(r.start_date),
    endDate: endAt
      ? toDateOnly(r.end_at as string | Date)
      : toDateOnly(r.end_date),
    startAt,
    endAt,
    status: r.status,
    categoryIds: r.category_ids,
    createdAt: toIso(r.created_at),
    description: r.description,
    timezone: r.timezone,
    expoTemplateId: r.expo_template_id ?? undefined,
    ownerUserId: r.owner_user_id ?? undefined,
  }
}

export async function listExpos(): Promise<Expo[]> {
  const rows = (await sql`
    select * from expos order by created_at desc
  `) as ExpoRow[]
  return rows.map(rowToExpo)
}

export async function countExpos(): Promise<number> {
  const rows = (await sql`
    select count(*)::int as total from expos
  `) as { total: number }[]
  return rows[0]?.total ?? 0
}

export async function listExpoLayoutTemplates(): Promise<ExpoLayoutTemplate[]> {
  const rows = (await sql`
    select id, name from expo_layout_templates order by name asc
  `) as { id: string; name: string }[]
  return rows
}

export async function listExpoHalls(expoId: string): Promise<ExpoHall[]> {
  const rows = (await sql`
    select *
    from expo_halls
    where expo_id = ${expoId}
    order by sort_order asc
  `) as {
    id: string
    expo_id: string
    sort_order: number
    hall_name: string
    hall_template_id: string
    basic_qty: number
    professional_qty: number
    premium_qty: number
  }[]
  return rows.map((r) => ({
    id: r.id,
    expoId: r.expo_id,
    sortOrder: r.sort_order,
    hallName: r.hall_name,
    hallTemplateId: r.hall_template_id,
    basicQty: r.basic_qty,
    professionalQty: r.professional_qty,
    premiumQty: r.premium_qty,
  }))
}

export async function searchExpoOwnersByEmail(
  query: string,
): Promise<{ id: string; email: string; name: string }[]> {
  const q = query.trim()
  if (q.length < 2) {
    return []
  }
  const pattern = `%${q}%`
  const rows = (await sql`
    select id, email, name
    from chat_users
    where email ilike ${pattern}
    order by email asc
    limit 15
  `) as { id: string; email: string; name: string }[]
  return rows
}

export type CreateExpoWithHallsInput = {
  name: string
  description: string
  thumbnailUrl: string
  expoTemplateId: string
  categoryIds: string[]
  startAt: string
  endAt: string
  timezone: string
  ownerUserId: string
  ownerEmail: string
  halls: ExpoHallDraft[]
}

export async function createExpoWithHalls(
  input: CreateExpoWithHallsInput,
): Promise<{ id: string }> {
  const start = new Date(input.startAt)
  const end = new Date(input.endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start or end date/time.")
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error("End must be after start.")
  }

  const dup = (await sql`
    select id from expos where lower(name) = lower(${input.name}) limit 1
  `) as { id: string }[]
  if (dup.length > 0) {
    throw new Error("An expo with this name already exists.")
  }

  const expoId = `expo-${randomUUID()}`
  const createdAt = new Date().toISOString()
  const startDateStr = start.toISOString().slice(0, 10)
  const endDateStr = end.toISOString().slice(0, 10)
  const thumb =
    input.thumbnailUrl.trim() ||
    `https://picsum.photos/seed/${encodeURIComponent(expoId)}/640/360`

  await sql`begin`
  try {
    await sql`
      insert into expos (
        id,
        name,
        thumbnail_url,
        owner_email,
        start_date,
        end_date,
        status,
        category_ids,
        created_at,
        description,
        timezone,
        expo_template_id,
        owner_user_id,
        start_at,
        end_at
      )
      values (
        ${expoId},
        ${input.name},
        ${thumb},
        ${input.ownerEmail},
        ${startDateStr},
        ${endDateStr},
        ${"Draft" satisfies ExpoStatus},
        ${JSON.stringify(input.categoryIds)}::jsonb,
        ${createdAt},
        ${input.description},
        ${input.timezone},
        ${input.expoTemplateId},
        ${input.ownerUserId},
        ${start.toISOString()},
        ${end.toISOString()}
      )
    `

    let order = 0
    for (const hall of input.halls) {
      const hallId = `expo-hall-${randomUUID()}`
      await sql`
        insert into expo_halls (
          id,
          expo_id,
          sort_order,
          hall_name,
          hall_template_id,
          basic_qty,
          professional_qty,
          premium_qty
        )
        values (
          ${hallId},
          ${expoId},
          ${order},
          ${hall.hallName},
          ${hall.hallTemplateId},
          ${hall.basicQty},
          ${hall.professionalQty},
          ${hall.premiumQty}
        )
      `
      order += 1
    }

    await sql`commit`
  } catch (e) {
    await sql`rollback`
    throw e
  }

  return { id: expoId }
}

export async function getExpoById(expoId: string): Promise<Expo | null> {
  const rows = (await sql`
    select * from expos where id = ${expoId} limit 1
  `) as ExpoRow[]
  const r = rows[0]
  return r ? rowToExpo(r) : null
}

export async function getChatUserById(
  userId: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const rows = (await sql`
    select id, email, name from chat_users where id = ${userId} limit 1
  `) as { id: string; email: string; name: string }[]
  return rows[0] ?? null
}

export async function updateExpoWithHalls(
  expoId: string,
  input: CreateExpoWithHallsInput,
): Promise<void> {
  const start = new Date(input.startAt)
  const end = new Date(input.endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start or end date/time.")
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error("End must be after start.")
  }

  const dup = (await sql`
    select id from expos
    where lower(name) = lower(${input.name}) and id <> ${expoId}
    limit 1
  `) as { id: string }[]
  if (dup.length > 0) {
    throw new Error("An expo with this name already exists.")
  }

  const startDateStr = start.toISOString().slice(0, 10)
  const endDateStr = end.toISOString().slice(0, 10)
  const thumb =
    input.thumbnailUrl.trim() ||
    `https://picsum.photos/seed/${encodeURIComponent(expoId)}/640/360`

  await sql`begin`
  try {
    await sql`
      update expos
      set
        name = ${input.name},
        thumbnail_url = ${thumb},
        owner_email = ${input.ownerEmail},
        start_date = ${startDateStr},
        end_date = ${endDateStr},
        category_ids = ${JSON.stringify(input.categoryIds)}::jsonb,
        description = ${input.description},
        timezone = ${input.timezone},
        expo_template_id = ${input.expoTemplateId},
        owner_user_id = ${input.ownerUserId},
        start_at = ${start.toISOString()},
        end_at = ${end.toISOString()}
      where id = ${expoId}
    `

    await sql`
      delete from expo_halls where expo_id = ${expoId}
    `

    let order = 0
    for (const hall of input.halls) {
      const hallId = `expo-hall-${randomUUID()}`
      await sql`
        insert into expo_halls (
          id,
          expo_id,
          sort_order,
          hall_name,
          hall_template_id,
          basic_qty,
          professional_qty,
          premium_qty
        )
        values (
          ${hallId},
          ${expoId},
          ${order},
          ${hall.hallName},
          ${hall.hallTemplateId},
          ${hall.basicQty},
          ${hall.professionalQty},
          ${hall.premiumQty}
        )
      `
      order += 1
    }

    await sql`commit`
  } catch (e) {
    await sql`rollback`
    throw e
  }
}

export async function updateExpoStatus(
  expoId: string,
  status: ExpoStatus,
): Promise<void> {
  await sql`
    update expos
    set status = ${status}
    where id = ${expoId}
  `
}

export async function deleteExpo(expoId: string): Promise<void> {
  await sql`delete from expos where id = ${expoId}`
}

export async function listAdminNotifications(): Promise<AdminNotification[]> {
  const rows = (await sql`
    select * from admin_notifications order by created_at desc
  `) as NotifRow[]
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    message: r.message,
    relatedExpoId: r.related_expo_id ?? undefined,
    createdAt: toIso(r.created_at),
    isRead: r.is_read,
  }))
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await sql`
    update admin_notifications
    set is_read = true
    where id = ${notificationId}
  `
}

export async function markAllNotificationsRead(): Promise<void> {
  await sql`update admin_notifications set is_read = true where is_read = false`
}

export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  await sql`delete from admin_notifications where id = ${notificationId}`
}

export async function listExpoBoothTemplateAssignments(): Promise<
  ExpoBoothTemplateAssignment[]
> {
  const rows = (await sql`
    select * from expo_booth_template_assignments
  `) as { expo_id: string; booth_template_ids: string[] }[]
  return rows.map((r) => ({
    expoId: r.expo_id,
    boothTemplateIds: r.booth_template_ids,
  }))
}

export async function listBoothTemplateCustomizationConfigs(): Promise<
  BoothTemplateCustomizationConfig[]
> {
  const rows = (await sql`
    select * from booth_template_customization_configs
  `) as {
    booth_template_id: string
    color_slots: number
    image_slots: number
    product_limit: number
    has_video: boolean
  }[]
  return rows.map((r) => ({
    boothTemplateId: r.booth_template_id,
    colorSlots: Number(r.color_slots),
    imageSlots: Number(r.image_slots),
    productLimit: Number(r.product_limit),
    hasVideo: r.has_video,
  }))
}

export async function listExhibitorCatalogProducts(): Promise<
  ExhibitorCatalogProduct[]
> {
  const rows = (await sql`
    select * from exhibitor_catalog_products order by name asc
  `) as {
    id: string
    name: string
    description: string
    image_url: string | null
  }[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    imageUrl: r.image_url ?? undefined,
  }))
}

export async function listSellerBoothRegistrations(
  userId: string,
): Promise<SellerBoothRegistration[]> {
  const rows = (await sql`
    select *
    from seller_booth_registrations
    where user_id = ${userId}
    order by purchased_at desc
  `) as {
    id: string
    user_id: string
    expo_id: string
    slot_id: string | null
    booth_template_id: string | null
    booth_ref: string
    booth_tier: string
    status: SellerBoothRegistration["status"]
    purchased_at: string | Date
  }[]
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    expoId: r.expo_id,
    slotId: r.slot_id ?? undefined,
    boothTemplateId: r.booth_template_id ?? undefined,
    boothRef: r.booth_ref,
    boothTier: r.booth_tier,
    status: r.status,
    purchasedAt: toIso(r.purchased_at),
  }))
}

export async function listBoothCustomizations(): Promise<BoothCustomization[]> {
  const rows = (await sql`
    select * from booth_customizations
  `) as {
    registration_id: string
    selected_booth_template_id: string | null
    publish_status: BoothCustomization["publishStatus"]
    colors: string[]
    logo_url: string
    image_urls: string[]
    video_type: "upload" | "youtube" | null
    video_url: string
    products: BoothCustomization["products"]
  }[]
  return rows.map((r) => ({
    registrationId: r.registration_id,
    selectedBoothTemplateId: r.selected_booth_template_id ?? null,
    publishStatus: r.publish_status,
    colors: r.colors,
    logoUrl: r.logo_url,
    imageUrls: r.image_urls,
    videoType: r.video_type,
    videoUrl: r.video_url,
    products: r.products,
  }))
}

export async function listStreamSessions(): Promise<StreamSession[]> {
  const rows = (await sql`
    select * from stream_sessions order by created_at desc
  `) as {
    stream_session_id: string
    status: StreamSession["status"]
    host_user_id: string
    host_display_name: string
    stream_url: string
    stream_key: string
    replay_enabled: boolean
    replay_url: string | null
    started_at: string | Date | null
    ended_at: string | Date | null
    peak_viewer_count: number | null
    created_at: string | Date
    updated_at: string | Date
  }[]
  return rows.map((r) => ({
    streamSessionId: r.stream_session_id,
    status: r.status,
    hostUserId: r.host_user_id,
    hostDisplayName: r.host_display_name,
    streamUrl: r.stream_url,
    streamKey: r.stream_key,
    replayEnabled: r.replay_enabled,
    replayUrl: r.replay_url,
    startedAt: r.started_at ? toIso(r.started_at) : null,
    endedAt: r.ended_at ? toIso(r.ended_at) : null,
    peakViewerCount: r.peak_viewer_count,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  }))
}

export async function getStreamSessionById(
  streamSessionId: string,
): Promise<StreamSession | null> {
  const rows = (await sql`
    select *
    from stream_sessions
    where stream_session_id = ${streamSessionId}
    limit 1
  `) as {
    stream_session_id: string
    status: StreamSession["status"]
    host_user_id: string
    host_display_name: string
    stream_url: string
    stream_key: string
    replay_enabled: boolean
    replay_url: string | null
    started_at: string | Date | null
    ended_at: string | Date | null
    peak_viewer_count: number | null
    created_at: string | Date
    updated_at: string | Date
  }[]
  const r = rows[0]
  if (!r) return null
  return {
    streamSessionId: r.stream_session_id,
    status: r.status,
    hostUserId: r.host_user_id,
    hostDisplayName: r.host_display_name,
    streamUrl: r.stream_url,
    streamKey: r.stream_key,
    replayEnabled: r.replay_enabled,
    replayUrl: r.replay_url,
    startedAt: r.started_at ? toIso(r.started_at) : null,
    endedAt: r.ended_at ? toIso(r.ended_at) : null,
    peakViewerCount: r.peak_viewer_count,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  }
}

export async function listLiveComments(): Promise<LiveComment[]> {
  const rows = (await sql`
    select * from live_comments order by created_at asc
  `) as {
    live_comment_id: string
    stream_session_id: string
    author_user_id: string | null
    author_display_name: string | null
    guest_display_name: string | null
    guest_email: string | null
    comment_text: string
    is_deleted: boolean
    created_at: string | Date
    deleted_at: string | Date | null
    deleted_by_user_id: string | null
  }[]
  return rows.map((r) => ({
    liveCommentId: r.live_comment_id,
    streamSessionId: r.stream_session_id,
    authorUserId: r.author_user_id,
    authorDisplayName: r.author_display_name,
    guestDisplayName: r.guest_display_name,
    guestEmail: r.guest_email,
    commentText: r.comment_text,
    isDeleted: r.is_deleted,
    createdAt: toIso(r.created_at),
    deletedAt: r.deleted_at ? toIso(r.deleted_at) : null,
    deletedByUserId: r.deleted_by_user_id,
  }))
}

export async function listLiveCommentsBySession(
  streamSessionId: string,
): Promise<LiveComment[]> {
  const rows = (await sql`
    select * from live_comments
    where stream_session_id = ${streamSessionId}
    order by created_at asc
  `) as {
    live_comment_id: string
    stream_session_id: string
    author_user_id: string | null
    author_display_name: string | null
    guest_display_name: string | null
    guest_email: string | null
    comment_text: string
    is_deleted: boolean
    created_at: string | Date
    deleted_at: string | Date | null
    deleted_by_user_id: string | null
  }[]
  return rows.map((r) => ({
    liveCommentId: r.live_comment_id,
    streamSessionId: r.stream_session_id,
    authorUserId: r.author_user_id,
    authorDisplayName: r.author_display_name,
    guestDisplayName: r.guest_display_name,
    guestEmail: r.guest_email,
    commentText: r.comment_text,
    isDeleted: r.is_deleted,
    createdAt: toIso(r.created_at),
    deletedAt: r.deleted_at ? toIso(r.deleted_at) : null,
    deletedByUserId: r.deleted_by_user_id,
  }))
}

export async function listGoLIVEEvents(): Promise<GoLIVEEvent[]> {
  const rows = (await sql`
    select * from go_live_events order by scheduled_start_at desc nulls last
  `) as {
    go_live_event_id: string
    expo_id: string
    stream_session_id: string
    title: string
    description: string | null
    thumbnail_url: string | null
    session_type: GoLIVEEvent["sessionType"]
    scheduled_start_at: string | Date | null
    status: GoLIVEEvent["status"]
    broadcaster_user_id: string
    broadcaster_display_name: string
    created_at: string | Date
    updated_at: string | Date
  }[]
  return rows.map((r) => ({
    goLiveEventId: r.go_live_event_id,
    expoId: r.expo_id,
    streamSessionId: r.stream_session_id,
    title: r.title,
    description: r.description,
    thumbnailUrl: r.thumbnail_url,
    sessionType: r.session_type,
    scheduledStartAt: r.scheduled_start_at ? toIso(r.scheduled_start_at) : null,
    status: r.status,
    broadcasterUserId: r.broadcaster_user_id,
    broadcasterDisplayName: r.broadcaster_display_name,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  }))
}

export async function createGoLIVEEventWithSession(input: {
  event: GoLIVEEvent
  streamSession: StreamSession
}): Promise<void> {
  await sql`begin`
  try {
    await sql`
      insert into stream_sessions (
        stream_session_id,
        status,
        host_user_id,
        host_display_name,
        stream_url,
        stream_key,
        replay_enabled,
        replay_url,
        started_at,
        ended_at,
        peak_viewer_count,
        created_at,
        updated_at
      )
      values (
        ${input.streamSession.streamSessionId},
        ${input.streamSession.status},
        ${input.streamSession.hostUserId},
        ${input.streamSession.hostDisplayName},
        ${input.streamSession.streamUrl},
        ${input.streamSession.streamKey},
        ${input.streamSession.replayEnabled},
        ${input.streamSession.replayUrl},
        ${input.streamSession.startedAt},
        ${input.streamSession.endedAt},
        ${input.streamSession.peakViewerCount},
        ${input.streamSession.createdAt},
        ${input.streamSession.updatedAt}
      )
    `
    await sql`
      insert into go_live_events (
        go_live_event_id,
        expo_id,
        stream_session_id,
        title,
        description,
        thumbnail_url,
        session_type,
        scheduled_start_at,
        status,
        broadcaster_user_id,
        broadcaster_display_name,
        created_at,
        updated_at
      )
      values (
        ${input.event.goLiveEventId},
        ${input.event.expoId},
        ${input.event.streamSessionId},
        ${input.event.title},
        ${input.event.description},
        ${input.event.thumbnailUrl},
        ${input.event.sessionType},
        ${input.event.scheduledStartAt},
        ${input.event.status},
        ${input.event.broadcasterUserId},
        ${input.event.broadcasterDisplayName},
        ${input.event.createdAt},
        ${input.event.updatedAt}
      )
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function updateGoLIVEEventAndSession(input: {
  event: GoLIVEEvent
  replayEnabled: boolean
}): Promise<void> {
  await sql`begin`
  try {
    await sql`
      update go_live_events
      set
        title = ${input.event.title},
        description = ${input.event.description},
        session_type = ${input.event.sessionType},
        scheduled_start_at = ${input.event.scheduledStartAt},
        status = ${input.event.status},
        broadcaster_user_id = ${input.event.broadcasterUserId},
        broadcaster_display_name = ${input.event.broadcasterDisplayName},
        updated_at = ${input.event.updatedAt}
      where go_live_event_id = ${input.event.goLiveEventId}
    `
    await sql`
      update stream_sessions
      set
        host_user_id = ${input.event.broadcasterUserId},
        host_display_name = ${input.event.broadcasterDisplayName},
        replay_enabled = ${input.replayEnabled},
        updated_at = ${input.event.updatedAt}
      where stream_session_id = ${input.event.streamSessionId}
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function cancelGoLIVEEvent(eventId: string): Promise<void> {
  await sql`
    update go_live_events
    set status = 'Canceled', updated_at = now()
    where go_live_event_id = ${eventId}
  `
}

export async function deleteGoLIVEEvent(eventId: string): Promise<void> {
  await sql`begin`
  try {
    const rows = (await sql`
      select stream_session_id
      from go_live_events
      where go_live_event_id = ${eventId}
    `) as { stream_session_id: string }[]
    const streamSessionId = rows[0]?.stream_session_id
    await sql`delete from go_live_events where go_live_event_id = ${eventId}`
    if (streamSessionId) {
      await sql`
        delete from stream_sessions
        where stream_session_id = ${streamSessionId}
      `
    }
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function createLiveComment(input: LiveComment): Promise<void> {
  await sql`
    insert into live_comments (
      live_comment_id,
      stream_session_id,
      author_user_id,
      author_display_name,
      guest_display_name,
      guest_email,
      comment_text,
      is_deleted,
      created_at,
      deleted_at,
      deleted_by_user_id
    )
    values (
      ${input.liveCommentId},
      ${input.streamSessionId},
      ${input.authorUserId},
      ${input.authorDisplayName},
      ${input.guestDisplayName},
      ${input.guestEmail},
      ${input.commentText},
      ${input.isDeleted},
      ${input.createdAt},
      ${input.deletedAt},
      ${input.deletedByUserId}
    )
  `
}

export async function softDeleteLiveComment(input: {
  liveCommentId: string
  deletedByUserId: string
  deletedAt: string
}): Promise<void> {
  await sql`
    update live_comments
    set
      is_deleted = true,
      deleted_at = ${input.deletedAt},
      deleted_by_user_id = ${input.deletedByUserId}
    where live_comment_id = ${input.liveCommentId}
  `
}

export async function upsertBoothCustomization(
  customization: BoothCustomization,
): Promise<void> {
  await sql`
    insert into booth_customizations (
      registration_id,
      selected_booth_template_id,
      publish_status,
      colors,
      logo_url,
      image_urls,
      video_type,
      video_url,
      products
    )
    values (
      ${customization.registrationId},
      ${customization.selectedBoothTemplateId},
      ${customization.publishStatus},
      ${JSON.stringify(customization.colors)}::jsonb,
      ${customization.logoUrl},
      ${JSON.stringify(customization.imageUrls)}::jsonb,
      ${customization.videoType},
      ${customization.videoUrl},
      ${JSON.stringify(customization.products)}::jsonb
    )
    on conflict (registration_id) do update set
      selected_booth_template_id = excluded.selected_booth_template_id,
      publish_status = excluded.publish_status,
      colors = excluded.colors,
      logo_url = excluded.logo_url,
      image_urls = excluded.image_urls,
      video_type = excluded.video_type,
      video_url = excluded.video_url,
      products = excluded.products
  `
}

export async function updateStreamSessionStatus(input: {
  streamSessionId: string
  status: StreamSessionStatus
  startedAt: string | null
  endedAt: string | null
  peakViewerCount: number | null
  updatedAt: string
}): Promise<void> {
  await sql`
    update stream_sessions
    set
      status = ${input.status},
      started_at = ${input.startedAt},
      ended_at = ${input.endedAt},
      peak_viewer_count = ${input.peakViewerCount},
      updated_at = ${input.updatedAt}
    where stream_session_id = ${input.streamSessionId}
  `
}

export async function updateGoLIVEEventStatusBySession(input: {
  streamSessionId: string
  status: GoLIVEEventStatus
  updatedAt: string
}): Promise<void> {
  await sql`
    update go_live_events
    set status = ${input.status}, updated_at = ${input.updatedAt}
    where stream_session_id = ${input.streamSessionId}
  `
}
