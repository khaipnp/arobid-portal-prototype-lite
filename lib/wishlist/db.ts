import { sql } from "@/lib/db/neon"

export type WishlistTargetType = "expo" | "product" | "seller"

export type WishlistItem =
  | WishlistExpoItem
  | WishlistProductItem
  | WishlistSellerItem

type WishlistBaseItem = {
  targetType: WishlistTargetType
  targetId: string
  createdAt: string
}

export type WishlistExpoItem = WishlistBaseItem & {
  targetType: "expo"
  expo: {
    id: string
    slug?: string
    name: string
    thumbnailUrl: string
    startDate: string
    endDate: string
    status: string
  }
}

export type WishlistProductItem = WishlistBaseItem & {
  targetType: "product"
  product: {
    id: string
    name: string
    description?: string
    imageUrl?: string
    price?: number
    currency: string
  }
  seller: {
    id: string
    name: string
    logoUrl?: string
  }
}

export type WishlistSellerItem = WishlistBaseItem & {
  targetType: "seller"
  registrationId: string
  company: string
  exhibitorName: string
  logoUrl?: string
  category: string
  boothTier: string
  boothRef: string
  country: string
  expo: {
    id: string
    slug?: string
    name: string
    thumbnailUrl: string
    startDate: string
    endDate: string
    status: string
  }
}

function normalizeBoothTier(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === "pro") return "Professional"
  if (normalized === "professional") return "Professional"
  if (normalized === "premium") return "Premium"
  if (normalized === "basic") return "Basic"
  return value
}

function toDateOnly(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

async function targetExists(targetType: WishlistTargetType, targetId: string) {
  if (targetType === "expo") {
    const rows = (await sql`
      select id from expos where id = ${targetId} limit 1
    `) as { id: string }[]
    return rows.length > 0
  }

  if (targetType === "product") {
    const rows = (await sql`
      select id from company_products where id = ${targetId} limit 1
    `) as { id: string }[]
    return rows.length > 0
  }

  const rows = (await sql`
    select id from seller_booth_registrations where id = ${targetId} limit 1
  `) as { id: string }[]
  return rows.length > 0
}

export async function addWishlistItem(input: {
  userId: string
  targetType: WishlistTargetType
  targetId: string
}) {
  const exists = await targetExists(input.targetType, input.targetId)
  if (!exists) return false

  await sql`
    insert into user_wishlist_items (user_id, target_type, target_id)
    values (${input.userId}, ${input.targetType}, ${input.targetId})
    on conflict (user_id, target_type, target_id) do nothing
  `

  return true
}

export async function removeWishlistItem(input: {
  userId: string
  targetType: WishlistTargetType
  targetId: string
}) {
  await sql`
    delete from user_wishlist_items
    where user_id = ${input.userId}
      and target_type = ${input.targetType}
      and target_id = ${input.targetId}
  `
}

export async function listWishlistedTargetIds(
  userId: string,
  targetType: WishlistTargetType
): Promise<Set<string>> {
  const rows = (await sql`
    select target_id
    from user_wishlist_items
    where user_id = ${userId}
      and target_type = ${targetType}
  `) as { target_id: string }[]

  return new Set(rows.map((row) => row.target_id))
}

export async function addWishlistExhibitor(input: {
  userId: string
  registrationId: string
}) {
  return addWishlistItem({
    userId: input.userId,
    targetType: "seller",
    targetId: input.registrationId
  })
}

export async function removeWishlistExhibitor(input: {
  userId: string
  registrationId: string
}) {
  await removeWishlistItem({
    userId: input.userId,
    targetType: "seller",
    targetId: input.registrationId
  })
}

export async function listWishlistedRegistrationIds(
  userId: string
): Promise<Set<string>> {
  return listWishlistedTargetIds(userId, "seller")
}

export async function listWishlistItems(
  userId: string
): Promise<WishlistItem[]> {
  const [sellerItems, expoItems, productItems] = await Promise.all([
    listWishlistSellerItems(userId),
    listWishlistExpoItems(userId),
    listWishlistProductItems(userId)
  ])

  return [...sellerItems, ...expoItems, ...productItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

async function listWishlistSellerItems(
  userId: string
): Promise<WishlistSellerItem[]> {
  const rows = (await sql`
    select
      uwi.target_id as registration_id,
      uwi.created_at,
      sbr.booth_tier,
      sbr.booth_ref,
      u.name as exhibitor_name,
      comp.name as company,
      nullif(comp.logo_url, '') as logo_url,
      (
        select string_agg(cat.name, ' • ')
        from company_categories cc
        join exhibitor_categories cat on cat.id = cc.category_id
        where cc.company_id = comp.id
      ) as category,
      e.id as expo_id,
      e.slug as expo_slug,
      e.name as expo_name,
      e.thumbnail_url as expo_thumbnail_url,
      coalesce(e.start_at, e.start_date::timestamptz) as expo_start_at,
      coalesce(e.end_at, e.end_date::timestamptz) as expo_end_at,
      e.status as expo_status
    from user_wishlist_items uwi
    join seller_booth_registrations sbr on sbr.id = uwi.target_id
    join users u on u.id = sbr.user_id
    left join companies comp on comp.id = u.company_id
    join expos e on e.id = sbr.expo_id
    where uwi.user_id = ${userId}
      and uwi.target_type = 'seller'
    order by uwi.created_at desc
  `) as {
    registration_id: string
    created_at: string | Date
    booth_tier: string
    booth_ref: string
    exhibitor_name: string
    company: string | null
    logo_url: string | null
    category: string | null
    expo_id: string
    expo_slug: string | null
    expo_name: string
    expo_thumbnail_url: string
    expo_start_at: string | Date
    expo_end_at: string | Date
    expo_status: string
  }[]

  return rows.map((row) => ({
    targetType: "seller",
    targetId: row.registration_id,
    registrationId: row.registration_id,
    createdAt: toIso(row.created_at),
    company: row.company ?? row.exhibitor_name,
    exhibitorName: row.exhibitor_name,
    logoUrl: row.logo_url ?? undefined,
    category: row.category ?? "",
    boothTier: normalizeBoothTier(row.booth_tier),
    boothRef: row.booth_ref,
    country: "Vietnam",
    expo: {
      id: row.expo_id,
      slug: row.expo_slug ?? undefined,
      name: row.expo_name,
      thumbnailUrl: row.expo_thumbnail_url,
      startDate: toDateOnly(row.expo_start_at),
      endDate: toDateOnly(row.expo_end_at),
      status: row.expo_status
    }
  }))
}

async function listWishlistExpoItems(
  userId: string
): Promise<WishlistExpoItem[]> {
  const rows = (await sql`
    select
      uwi.target_id,
      uwi.created_at,
      e.id,
      e.slug,
      e.name,
      e.thumbnail_url,
      coalesce(e.start_at, e.start_date::timestamptz) as start_at,
      coalesce(e.end_at, e.end_date::timestamptz) as end_at,
      e.status
    from user_wishlist_items uwi
    join expos e on e.id = uwi.target_id
    where uwi.user_id = ${userId}
      and uwi.target_type = 'expo'
    order by uwi.created_at desc
  `) as {
    target_id: string
    created_at: string | Date
    id: string
    slug: string | null
    name: string
    thumbnail_url: string
    start_at: string | Date
    end_at: string | Date
    status: string
  }[]

  return rows.map((row) => ({
    targetType: "expo",
    targetId: row.target_id,
    createdAt: toIso(row.created_at),
    expo: {
      id: row.id,
      slug: row.slug ?? undefined,
      name: row.name,
      thumbnailUrl: row.thumbnail_url,
      startDate: toDateOnly(row.start_at),
      endDate: toDateOnly(row.end_at),
      status: row.status
    }
  }))
}

async function listWishlistProductItems(
  userId: string
): Promise<WishlistProductItem[]> {
  const rows = (await sql`
    select
      uwi.target_id,
      uwi.created_at,
      p.id,
      p.name,
      p.description,
      p.main_image_url,
      p.price,
      p.currency,
      comp.id as company_id,
      comp.name as company_name,
      nullif(comp.logo_url, '') as logo_url
    from user_wishlist_items uwi
    join company_products p on p.id = uwi.target_id
    join companies comp on comp.id = p.company_id
    where uwi.user_id = ${userId}
      and uwi.target_type = 'product'
    order by uwi.created_at desc
  `) as {
    target_id: string
    created_at: string | Date
    id: string
    name: string
    description: string | null
    main_image_url: string | null
    price: string | number | null
    currency: string
    company_id: string
    company_name: string
    logo_url: string | null
  }[]

  return rows.map((row) => ({
    targetType: "product",
    targetId: row.target_id,
    createdAt: toIso(row.created_at),
    product: {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      imageUrl: row.main_image_url ?? undefined,
      price: row.price ? Number(row.price) : undefined,
      currency: row.currency
    },
    seller: {
      id: row.company_id,
      name: row.company_name,
      logoUrl: row.logo_url ?? undefined
    }
  }))
}
