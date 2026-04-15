import { sql } from "@/lib/db/neon"
import type {
  AdminNotification,
  BoothCustomization,
  BoothTemplateCustomizationConfig,
  ExhibitorCatalogProduct,
  Expo,
  ExpoBoothTemplateAssignment,
  ExpoCategory,
  GoLIVEEvent,
  LiveComment,
  NotificationKind,
  SellerBoothRegistration,
  StreamSession,
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
}

type CategoryRow = {
  id: string
  name: string
  level: number
  parent_id: string | null
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
    select * from expo_categories order by level asc, name asc
  `) as CategoryRow[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    level: r.level as ExpoCategory["level"],
    parentId: r.parent_id ?? undefined,
  }))
}

export async function listExpos(): Promise<Expo[]> {
  const rows = (await sql`
    select * from expos order by created_at desc
  `) as ExpoRow[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    thumbnailUrl: r.thumbnail_url,
    ownerEmail: r.owner_email,
    startDate: toDateOnly(r.start_date),
    endDate: toDateOnly(r.end_date),
    status: r.status,
    categoryIds: r.category_ids,
    createdAt: toIso(r.created_at),
  }))
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

export async function listSellerBoothRegistrations(): Promise<
  SellerBoothRegistration[]
> {
  const rows = (await sql`
    select * from seller_booth_registrations order by purchased_at desc
  `) as {
    id: string
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
