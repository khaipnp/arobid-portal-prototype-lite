import { randomUUID } from "node:crypto"
import { sql } from "$lib/db/neon"
import { getAssetUrl } from "$lib/image-utils"
import { ensureCoHostPartnerAssignment } from "$lib/partner/db"
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
  SellerBoothProduct,
  SellerBoothRegistration,
  StreamSession,
  StreamSessionStatus
} from "$lib/tradexpo/types"
import { listWishlistedTargetIds } from "$lib/wishlist/db"

export type ExpoDetailExhibitor = {
  id: string
  name: string
  company: string
  logoUrl?: string
  avatarUrl?: string
  category: string
  boothTier: string
  boothRef: string
  country: string
  products: Array<SellerBoothProduct & { isWishlisted?: boolean }>
  isWishlisted?: boolean
}

export type ExpoDetailProduct = {
  id: string
  name: string
  description: string
  imageUrl?: string
  exhibitorId: string
  exhibitorName: string
  exhibitorCompany: string
  exhibitorLogoUrl?: string
  exhibitorAvatarUrl?: string
  boothTier: string
  country: string
  isWishlisted?: boolean
}

function normalizeBoothTier(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === "pro") return "Professional"
  if (normalized === "professional") return "Professional"
  if (normalized === "premium") return "Premium"
  if (normalized === "basic") return "Basic"
  return value
}

type ExpoRow = {
  id: string
  slug?: string | null
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

const DEFAULT_LIST_LIMIT = 100
const DEFAULT_ACTIVITY_LIMIT = 500
const PRODUCT_FEATURE_MAX_LIMIT = 48

function normalizeLimit(
  limit: number | undefined,
  fallback = DEFAULT_LIST_LIMIT
) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return fallback
  return Math.max(1, Math.min(1000, Math.floor(limit)))
}

function normalizeProductFeedLimit(limit: number | undefined) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return 24
  return Math.max(1, Math.min(PRODUCT_FEATURE_MAX_LIMIT, Math.floor(limit)))
}

function normalizeOffset(offset: number | undefined) {
  if (typeof offset !== "number" || !Number.isFinite(offset)) return 0
  return Math.max(0, Math.floor(offset))
}

function slugifyExpoName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizedExpoSlugExpression() {
  return sql`trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))`
}

async function uniqueExpoSlug(base: string, excludeExpoId?: string) {
  const normalized = base || "expo"
  const rows = (await sql`
    select id, slug
    from expos
    where slug like ${`${normalized}%`}
  `) as { id: string; slug: string | null }[]
  const used = new Set(
    rows
      .filter((r) => (excludeExpoId ? r.id !== excludeExpoId : true))
      .map((r) => r.slug)
      .filter(Boolean)
  )
  if (!used.has(normalized)) return normalized
  let i = 2
  while (used.has(`${normalized}-${i}`)) i += 1
  return `${normalized}-${i}`
}

export async function listExpoCategories(): Promise<ExpoCategory[]> {
  const rows = (await sql`
    select id, name, level from expo_categories order by name asc
  `) as CategoryRow[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    level: 1
  }))
}

export function rowToExpo(r: ExpoRow): Expo {
  const startAt = r.start_at ? toIso(r.start_at) : undefined
  const endAt = r.end_at ? toIso(r.end_at) : undefined
  return {
    id: r.id,
    slug: r.slug ?? undefined,
    name: r.name,
    thumbnailUrl: getAssetUrl(r.thumbnail_url, r.id),
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
    ownerUserId: r.owner_user_id ?? undefined
  }
}

export async function listExpos(options?: { limit?: number }): Promise<Expo[]> {
  const limit = normalizeLimit(options?.limit)
  const rows = (await sql`
    select * from expos order by created_at desc limit ${limit}
  `) as ExpoRow[]
  return rows.map(rowToExpo)
}

export async function listExposByOwner(ownerUserId: string): Promise<Expo[]> {
  const rows = (await sql`
    select *
    from expos
    where owner_user_id = ${ownerUserId}
    order by created_at desc
  `) as ExpoRow[]
  return rows.map(rowToExpo)
}

export async function getExpoBySlug(slug: string): Promise<Expo | null> {
  const bySlug = (await sql`
    select * from expos where slug = ${slug} limit 1
  `) as ExpoRow[]
  if (bySlug[0]) return rowToExpo(bySlug[0])

  // Backward-compatible fallback for rows created before slug rollout.
  const byName = (await sql`
    select * from expos
    where ${normalizedExpoSlugExpression()} = ${slug}
    limit 1
  `) as ExpoRow[]
  const row = byName[0]
  return row ? rowToExpo(row) : null
}

export async function countExpos(): Promise<number> {
  const rows = (await sql`
    select count(*)::int as total from expos
  `) as { total: number }[]
  return rows[0]?.total ?? 0
}

export type ExpoCardStats = {
  expoId: string
  exhibitors: number
  visitors: number
  products: number
}

export type ExpoHeroStats = {
  exhibitors: number
  visitors: number
  products: number
  rfqs: number
}

export async function getExpoHeroStatsByExpo(
  input: Pick<Expo, "id" | "name">
): Promise<ExpoHeroStats> {
  const rows = (await sql`
    with exhibitor_stats as (
      select count(*)::int as exhibitors
      from seller_booth_registrations
      where expo_id = ${input.id}
    ),
    product_stats as (
      select coalesce(sum(jsonb_array_length(coalesce(bc.products, '[]'::jsonb))), 0)::int as products
      from seller_booth_registrations sbr
      left join booth_customizations bc on bc.registration_id = sbr.id
      where sbr.expo_id = ${input.id}
    ),
    visitor_stats as (
      select count(distinct customer_id)::int as visitors
      from orders
      where expo_name = ${input.name}
    ),
    rfq_stats as (
      select count(*)::int as rfqs
      from orders
      where expo_name = ${input.name}
    )
    select
      coalesce((select exhibitors from exhibitor_stats), 0)::int as exhibitors,
      coalesce((select visitors from visitor_stats), 0)::int as visitors,
      coalesce((select products from product_stats), 0)::int as products,
      coalesce((select rfqs from rfq_stats), 0)::int as rfqs
  `) as {
    exhibitors: number
    visitors: number
    products: number
    rfqs: number
  }[]

  const row = rows[0]
  return {
    exhibitors: row?.exhibitors ?? 0,
    visitors: row?.visitors ?? 0,
    products: row?.products ?? 0,
    rfqs: row?.rfqs ?? 0
  }
}

export async function listExpoCardStats(): Promise<ExpoCardStats[]> {
  const rows = (await sql`
    with exhibitor_stats as (
      select expo_id, count(*)::int as exhibitors
      from seller_booth_registrations
      group by expo_id
    ),
    product_stats as (
      select
        sbr.expo_id,
        coalesce(sum(jsonb_array_length(coalesce(bc.products, '[]'::jsonb))), 0)::int as products
      from seller_booth_registrations sbr
      left join booth_customizations bc on bc.registration_id = sbr.id
      group by sbr.expo_id
    ),
    visitor_stats as (
      select expo_name, count(distinct customer_id)::int as visitors
      from orders
      where expo_name is not null
      group by expo_name
    )
    select
      e.id as expo_id,
      coalesce(es.exhibitors, 0)::int as exhibitors,
      coalesce(vs.visitors, 0)::int as visitors,
      coalesce(ps.products, 0)::int as products
    from expos e
    left join exhibitor_stats es on es.expo_id = e.id
    left join product_stats ps on ps.expo_id = e.id
    left join visitor_stats vs on vs.expo_name = e.name
    order by e.created_at desc
  `) as {
    expo_id: string
    exhibitors: number
    visitors: number
    products: number
  }[]

  return rows.map((row) => ({
    expoId: row.expo_id,
    exhibitors: row.exhibitors,
    visitors: row.visitors,
    products: row.products
  }))
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
    premiumQty: r.premium_qty
  }))
}

export async function searchExpoOwnersByEmail(
  query: string
): Promise<{ id: string; email: string; name: string }[]> {
  const q = query.trim()
  if (q.length < 2) {
    return []
  }
  const pattern = `%${q}%`
  const rows = (await sql`
    select id, email, name
    from users
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
  input: CreateExpoWithHallsInput
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
  const slug = await uniqueExpoSlug(slugifyExpoName(input.name))
  const createdAt = new Date().toISOString()
  const startDateStr = start.toISOString().slice(0, 10)
  const endDateStr = end.toISOString().slice(0, 10)
  const thumb = getAssetUrl(input.thumbnailUrl, expoId)

  await sql`begin`
  try {
    await sql`
      insert into expos (
        id,
        slug,
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
        ${slug},
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

    await sql`
      insert into user_roles (user_id, role_id, expo_id)
      values (${input.ownerUserId}, 'partner', null)
      on conflict do nothing
    `

    await ensureCoHostPartnerAssignment({
      userId: input.ownerUserId,
      userEmail: input.ownerEmail,
      expoId
    })

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

export async function getUserById(
  userId: string
): Promise<{ id: string; email: string; name: string } | null> {
  const rows = (await sql`
    select id, email, name from users where id = ${userId} limit 1
  `) as { id: string; email: string; name: string }[]
  return rows[0] ?? null
}

export async function updateExpoWithHalls(
  expoId: string,
  input: CreateExpoWithHallsInput
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
  const slug = await uniqueExpoSlug(slugifyExpoName(input.name), expoId)
  const thumb = getAssetUrl(input.thumbnailUrl, expoId)

  await sql`begin`
  try {
    await sql`
      update expos
      set
        name = ${input.name},
        slug = ${slug},
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
      insert into user_roles (user_id, role_id, expo_id)
      values (${input.ownerUserId}, 'partner', null)
      on conflict do nothing
    `

    await ensureCoHostPartnerAssignment({
      userId: input.ownerUserId,
      userEmail: input.ownerEmail,
      expoId,
      replaceExisting: true
    })

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
  status: ExpoStatus
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

export async function listAdminNotifications(options?: {
  limit?: number
}): Promise<AdminNotification[]> {
  const limit = normalizeLimit(options?.limit)
  const rows = (await sql`
    select * from admin_notifications order by created_at desc limit ${limit}
  `) as NotifRow[]
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    message: r.message,
    relatedExpoId: r.related_expo_id ?? undefined,
    createdAt: toIso(r.created_at),
    isRead: r.is_read
  }))
}

export async function markNotificationRead(
  notificationId: string
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
  notificationId: string
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
    boothTemplateIds: r.booth_template_ids
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
    hasVideo: r.has_video
  }))
}

export async function listExhibitorCatalogProducts(): Promise<
  ExhibitorCatalogProduct[]
> {
  const rows = (await sql`
    select id, name, description, main_image_url as image_url from company_products order by name asc
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
    imageUrl: r.image_url ?? undefined
  }))
}

export async function listSellerBoothRegistrations(
  userId: string,
  options?: { limit?: number }
): Promise<SellerBoothRegistration[]> {
  const limit = normalizeLimit(options?.limit)
  const rows = (await sql`
    select *
    from seller_booth_registrations
    where user_id = ${userId}
    order by purchased_at desc
    limit ${limit}
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
    purchasedAt: toIso(r.purchased_at)
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
    products: r.products
  }))
}

export async function countExpoDetailProducts(expoId: string): Promise<number> {
  const rows = (await sql`
    select count(*)::int as total
    from seller_booth_registrations sbr
    join booth_customizations bc on bc.registration_id = sbr.id
    cross join lateral jsonb_array_elements(coalesce(bc.products, '[]'::jsonb)) as product_item(value)
    where sbr.expo_id = ${expoId}
      and bc.publish_status = 'Published'
      and product_item.value ? 'id'
      and product_item.value ? 'name'
  `) as { total: number }[]

  return rows[0]?.total ?? 0
}

export async function listExpoDetailProducts(
  expoId: string,
  options?: { userId?: string | null; limit?: number; offset?: number }
): Promise<ExpoDetailProduct[]> {
  const limit = normalizeProductFeedLimit(options?.limit)
  const offset = normalizeOffset(options?.offset)
  const wishlistedProductIds = options?.userId
    ? await listWishlistedTargetIds(options.userId, "product")
    : new Set<string>()

  const rows = (await sql`
    select
      product_item.value ->> 'id' as product_id,
      product_item.value ->> 'name' as product_name,
      coalesce(product_item.value ->> 'description', '') as product_description,
      nullif(product_item.value ->> 'imageUrl', '') as product_image_url,
      sbr.id as exhibitor_id,
      cu.name as exhibitor_name,
      coalesce(comp.name, cu.name) as exhibitor_company,
      nullif(comp.logo_url, '') as exhibitor_logo_url,
      cu.avatar_url as exhibitor_avatar_url,
      sbr.booth_tier,
      'Vietnam'::text as country,
      case lower(trim(sbr.booth_tier))
        when 'premium' then 1
        when 'professional' then 2
        when 'pro' then 2
        when 'basic' then 3
        else 4
      end as tier_sort,
      sbr.purchased_at,
      product_item.ordinality as product_index
    from seller_booth_registrations sbr
    join users cu on cu.id = sbr.user_id
    left join companies comp on comp.id = cu.company_id
    join booth_customizations bc on bc.registration_id = sbr.id
    cross join lateral jsonb_array_elements(coalesce(bc.products, '[]'::jsonb)) with ordinality as product_item(value, ordinality)
    where sbr.expo_id = ${expoId}
      and bc.publish_status = 'Published'
      and product_item.value ? 'id'
      and product_item.value ? 'name'
    order by tier_sort asc, sbr.purchased_at desc, sbr.id asc, product_item.ordinality asc
    limit ${limit}
    offset ${offset}
  `) as {
    product_id: string | null
    product_name: string | null
    product_description: string | null
    product_image_url: string | null
    exhibitor_id: string
    exhibitor_name: string
    exhibitor_company: string
    exhibitor_logo_url: string | null
    exhibitor_avatar_url: string | null
    booth_tier: string
    country: string
  }[]

  return rows.flatMap((row) => {
    if (!row.product_id || !row.product_name) return []
    return [
      {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description ?? "",
        imageUrl: row.product_image_url ?? undefined,
        exhibitorId: row.exhibitor_id,
        exhibitorName: row.exhibitor_name,
        exhibitorCompany: row.exhibitor_company,
        exhibitorLogoUrl: row.exhibitor_logo_url ?? undefined,
        exhibitorAvatarUrl: row.exhibitor_avatar_url ?? undefined,
        boothTier: normalizeBoothTier(row.booth_tier),
        country: row.country,
        isWishlisted: wishlistedProductIds.has(row.product_id)
      }
    ]
  })
}

export async function listExpoDetailExhibitorsByName(
  expoName: string,
  options?: { userId?: string | null }
): Promise<ExpoDetailExhibitor[]> {
  const pattern = `%${expoName.trim()}%`
  const wishlistedSellerIds = options?.userId
    ? await listWishlistedTargetIds(options.userId, "seller")
    : new Set<string>()
  const wishlistedProductIds = options?.userId
    ? await listWishlistedTargetIds(options.userId, "product")
    : new Set<string>()
  const rows = (await sql`
    with ranked_exhibitors as (
    select
      sbr.id,
      sbr.booth_tier,
      sbr.booth_ref,
      cu.name,
      comp.name as company,
      (
        select string_agg(cat.name, ' • ')
        from company_categories cc
        join exhibitor_categories cat on cat.id = cc.category_id
        where cc.company_id = comp.id
      ) as category,
      nullif(comp.logo_url, '') as logo_url,
      cu.avatar_url,
      'Vietnam'::text as country,
      coalesce(bc.products, '[]'::jsonb) as products,
      case lower(trim(sbr.booth_tier))
        when 'premium' then 1
        when 'professional' then 2
        when 'pro' then 2
        when 'basic' then 3
        else 4
      end as tier_sort,
      sbr.purchased_at,
      row_number() over (
        partition by coalesce(comp.id, cu.id)
        order by
          case lower(trim(sbr.booth_tier))
            when 'premium' then 1
            when 'professional' then 2
            when 'pro' then 2
            when 'basic' then 3
            else 4
          end asc,
          sbr.purchased_at desc,
          sbr.id asc
      ) as exhibitor_rank
    from seller_booth_registrations sbr
    join expos e on e.id = sbr.expo_id
    join users cu on cu.id = sbr.user_id
    left join companies comp on comp.id = cu.company_id
    join booth_customizations bc on bc.registration_id = sbr.id
    where e.name ilike ${pattern}
      and bc.publish_status = 'Published'
    )
    select *
    from ranked_exhibitors
    where exhibitor_rank = 1
    order by tier_sort asc, purchased_at desc, id asc
    limit 36
  `) as {
    id: string
    booth_tier: string
    booth_ref: string
    name: string
    company: string | null
    category: string | null
    logo_url: string | null
    avatar_url: string | null
    country: string
    products: unknown
  }[]

  return rows.map((row) => {
    const rawProducts = Array.isArray(row.products) ? row.products : []
    const products: Array<SellerBoothProduct & { isWishlisted?: boolean }> = []
    for (const item of rawProducts) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("name" in item)
      ) {
        continue
      }
      const product = item as {
        id: string
        name: string
        description?: string
        imageUrl?: string
      }
      products.push({
        id: String(product.id),
        name: String(product.name),
        description: product.description ? String(product.description) : "",
        imageUrl: product.imageUrl ? String(product.imageUrl) : undefined,
        isWishlisted: wishlistedProductIds.has(String(product.id))
      })
      if (products.length >= 4) break
    }

    return {
      id: row.id,
      name: row.name,
      company: row.company ?? row.name,
      logoUrl: row.logo_url ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      category: row.category ?? "",
      boothTier: normalizeBoothTier(row.booth_tier),
      boothRef: row.booth_ref,
      country: row.country,
      products,
      isWishlisted: wishlistedSellerIds.has(row.id)
    }
  })
}

export async function listStreamSessions(options?: {
  limit?: number
}): Promise<StreamSession[]> {
  const limit = normalizeLimit(options?.limit)
  const rows = (await sql`
    select * from stream_sessions order by created_at desc limit ${limit}
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
    updatedAt: toIso(r.updated_at)
  }))
}

export async function getStreamSessionById(
  streamSessionId: string
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
    updatedAt: toIso(r.updated_at)
  }
}

export async function listLiveComments(options?: {
  limit?: number
}): Promise<LiveComment[]> {
  const limit = normalizeLimit(options?.limit, DEFAULT_ACTIVITY_LIMIT)
  const rows = (await sql`
    select *
    from (
      select * from live_comments order by created_at desc limit ${limit}
    ) recent_comments
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
    deletedByUserId: r.deleted_by_user_id
  }))
}

export async function listLiveCommentsBySession(
  streamSessionId: string,
  options?: { limit?: number }
): Promise<LiveComment[]> {
  const limit = normalizeLimit(options?.limit, DEFAULT_ACTIVITY_LIMIT)
  const rows = (await sql`
    select *
    from (
      select * from live_comments
      where stream_session_id = ${streamSessionId}
      order by created_at desc
      limit ${limit}
    ) recent_comments
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
    deletedByUserId: r.deleted_by_user_id
  }))
}

export async function listGoLIVEEvents(options?: {
  limit?: number
}): Promise<GoLIVEEvent[]> {
  const limit = normalizeLimit(options?.limit)
  const rows = (await sql`
    select * from go_live_events order by scheduled_start_at desc nulls last limit ${limit}
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
    updatedAt: toIso(r.updated_at)
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
  customization: BoothCustomization
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
