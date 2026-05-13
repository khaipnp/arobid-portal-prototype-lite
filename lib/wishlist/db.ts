import { sql } from "@/lib/db/neon"

export type WishlistItem = {
  registrationId: string
  createdAt: string
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

export async function addWishlistExhibitor(input: {
  userId: string
  registrationId: string
}) {
  const rows = (await sql`
    insert into user_wishlist_exhibitors (user_id, registration_id)
    select ${input.userId}, sbr.id
    from seller_booth_registrations sbr
    where sbr.id = ${input.registrationId}
    on conflict (user_id, registration_id) do nothing
    returning registration_id
  `) as { registration_id: string }[]

  return rows.length > 0
}

export async function removeWishlistExhibitor(input: {
  userId: string
  registrationId: string
}) {
  await sql`
    delete from user_wishlist_exhibitors
    where user_id = ${input.userId}
      and registration_id = ${input.registrationId}
  `
}

export async function listWishlistedRegistrationIds(
  userId: string
): Promise<Set<string>> {
  const rows = (await sql`
    select registration_id
    from user_wishlist_exhibitors
    where user_id = ${userId}
  `) as { registration_id: string }[]

  return new Set(rows.map((row) => row.registration_id))
}

export async function listWishlistItems(
  userId: string
): Promise<WishlistItem[]> {
  const rows = (await sql`
    select
      uwe.registration_id,
      uwe.created_at,
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
    from user_wishlist_exhibitors uwe
    join seller_booth_registrations sbr on sbr.id = uwe.registration_id
    join users u on u.id = sbr.user_id
    left join companies comp on comp.id = u.company_id
    join expos e on e.id = sbr.expo_id
    where uwe.user_id = ${userId}
    order by uwe.created_at desc
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
