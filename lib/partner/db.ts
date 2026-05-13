import { createHash } from "node:crypto"
import { sql } from "@/lib/db/neon"
import type { Expo, ExpoStatus } from "@/lib/tradexpo/types"

export type PartnerModel = "co_host" | "turnkey" | "tenant"

export type PartnerMembershipRole =
  | "primary_representative"
  | "admin"
  | "operator"
  | "analyst"

export type PartnerCapability =
  | "view_dashboard"
  | "manage_golive"
  | "manage_exhibitors"
  | "edit_expo_content"
  | "configure_operations"
  | "manage_branding"
  | "manage_tenant_settings"
  | "manage_partner_users"

export type PartnerOrganization = {
  id: string
  name: string
  model: PartnerModel
  status: "active" | "inactive"
  primaryUserId: string | null
}

export type PartnerAssignment = {
  partnerOrganization: PartnerOrganization
  membershipRole: PartnerMembershipRole
  partnershipModel: PartnerModel
  capabilities: PartnerCapability[]
}

export type PartnerAssignedExpo = {
  expo: Expo
  assignment: PartnerAssignment
  goLiveCount: number
  totalBooths: number
  soldBooths: number
  visitors: number
  rfqCount: number
  chatCount: number
}

export type PartnerDashboardExpoMetric = {
  expoId: string
  expoName: string
  status: ExpoStatus
  startDate: string
  endDate: string
  totalBooths: number
  soldBooths: number
  unsoldBooths: number
  boothUtilization: number
  publishedBooths: number
  goLiveEvents: number
  liveSessions: number
  peakViewers: number
  comments: number
  revenue: number
}

export type PartnerDashboardBreakdownItem = {
  name: string
  value: number
}

export type PartnerDashboardMetrics = {
  totals: {
    assignedExpos: number
    liveExpos: number
    soldBooths: number
    totalBooths: number
    boothUtilization: number
    publishedBooths: number
    goLiveEvents: number
    liveSessions: number
    peakViewers: number
    comments: number
    revenue: number
  }
  expoMetrics: PartnerDashboardExpoMetric[]
  statusBreakdown: PartnerDashboardBreakdownItem[]
  countryBreakdown: PartnerDashboardBreakdownItem[]
  boothTierBreakdown: PartnerDashboardBreakdownItem[]
}

export type PartnerExpoTierBreakdown = {
  tier: string
  capacity: number
  sold: number
  published: number
}

export type PartnerExpoHallBreakdown = {
  id: string
  name: string
  capacity: number
  basicQty: number
  professionalQty: number
  premiumQty: number
}

export type PartnerExpoRegistrationStatusBreakdown = {
  status: string
  value: number
}

export type PartnerExpoOperationsDetail = {
  summary: {
    totalBooths: number
    soldBooths: number
    unsoldBooths: number
    boothUtilization: number
    publishedBooths: number
    goLiveEvents: number
    liveSessions: number
    peakViewers: number
    comments: number
    revenue: number
    visitors: number
    products: number
  }
  tierBreakdown: PartnerExpoTierBreakdown[]
  hallBreakdown: PartnerExpoHallBreakdown[]
  registrationStatusBreakdown: PartnerExpoRegistrationStatusBreakdown[]
}

type PartnerExpoRow = {
  id: string
  slug?: string | null
  name: string
  thumbnail_url: string
  owner_email: string
  start_date: string | Date
  end_date: string | Date
  status: string
  category_ids: string[]
  created_at: string | Date
  description?: string
  timezone?: string
  expo_template_id?: string | null
  owner_user_id?: string | null
  start_at?: string | Date | null
  end_at?: string | Date | null
  partner_org_id: string
  partner_org_name: string
  partner_org_model: PartnerModel
  partner_org_status: "active" | "inactive"
  partner_org_primary_user_id: string | null
  membership_role: PartnerMembershipRole
  partnership_model: PartnerModel
}

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

function toDateOnly(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

function normalizePartnerExpoStatus(status: string): ExpoStatus {
  if (
    status === "Draft" ||
    status === "Pending Review" ||
    status === "Live" ||
    status === "Archived" ||
    status === "Canceled"
  ) {
    return status
  }

  return "Archived"
}

function rowToExpo(row: PartnerExpoRow): Expo {
  const startAt = row.start_at ? toIso(row.start_at) : undefined
  const endAt = row.end_at ? toIso(row.end_at) : undefined

  return {
    id: row.id,
    slug: row.slug ?? undefined,
    name: row.name,
    thumbnailUrl: row.thumbnail_url,
    ownerEmail: row.owner_email,
    startDate: startAt
      ? toDateOnly(row.start_at as string | Date)
      : toDateOnly(row.start_date),
    endDate: endAt
      ? toDateOnly(row.end_at as string | Date)
      : toDateOnly(row.end_date),
    startAt,
    endAt,
    status: normalizePartnerExpoStatus(row.status),
    categoryIds: row.category_ids,
    createdAt: toIso(row.created_at),
    description: row.description,
    timezone: row.timezone,
    expoTemplateId: row.expo_template_id ?? undefined,
    ownerUserId: row.owner_user_id ?? undefined
  }
}

export function resolvePartnerCapabilities(
  model: PartnerModel
): PartnerCapability[] {
  const coHost: PartnerCapability[] = [
    "view_dashboard",
    "manage_golive",
    "manage_exhibitors"
  ]

  if (model === "co_host") return coHost

  const turnkey: PartnerCapability[] = [
    ...coHost,
    "edit_expo_content",
    "configure_operations",
    "manage_branding"
  ]

  if (model === "turnkey") return turnkey

  return [...turnkey, "manage_tenant_settings", "manage_partner_users"]
}

function rowToAssignedExpo(
  row: PartnerExpoRow
): Omit<PartnerAssignedExpo, "goLiveCount"> {
  return {
    expo: rowToExpo(row),
    assignment: {
      partnerOrganization: {
        id: row.partner_org_id,
        name: row.partner_org_name,
        model: row.partner_org_model,
        status: row.partner_org_status,
        primaryUserId: row.partner_org_primary_user_id
      },
      membershipRole: row.membership_role,
      partnershipModel: row.partnership_model,
      capabilities: resolvePartnerCapabilities(row.partnership_model)
    }
  }
}

function toNumber(value: unknown): number {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0

  return Number.isFinite(numberValue) ? numberValue : 0
}

export async function listPartnerAssignedExpos(
  userId: string
): Promise<PartnerAssignedExpo[]> {
  const rows = (await sql`
    select
      e.*,
      po.id as partner_org_id,
      po.name as partner_org_name,
      po.model as partner_org_model,
      po.status as partner_org_status,
      po.primary_user_id as partner_org_primary_user_id,
      pm.role as membership_role,
      pea.partnership_model,
      (
        select count(*)::int
        from go_live_events gle
        where gle.expo_id = e.id
          and gle.status <> 'Canceled'
      ) as go_live_count,
      (
        select coalesce(sum(basic_qty + professional_qty + premium_qty), 0)::int
        from expo_halls eh
        where eh.expo_id = e.id
      ) as total_booths,
      (
        select count(*)::int
        from seller_booth_registrations sbr
        where sbr.expo_id = e.id
      ) as sold_booths,
      (
        select count(distinct customer_id)::int
        from orders o
        where o.expo_name = e.name
      ) as visitors,
      (
        select count(*)::int
        from orders o
        where o.expo_name = e.name and o.order_type = 'booth_registration'
      ) * 1.5::int as rfq_count,
      (
        select count(*)::int
        from live_comments lc
        inner join go_live_events gle on gle.stream_session_id = lc.stream_session_id
        where gle.expo_id = e.id
      ) as chat_count
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    where pm.user_id = ${userId}
      and pm.status = 'active'
      and po.status = 'active'
    order by e.created_at desc
  `) as (PartnerExpoRow & {
    go_live_count: number
    total_booths: number
    sold_booths: number
    visitors: number
    rfq_count: number
    chat_count: number
  })[]

  return rows.map((row) => ({
    ...rowToAssignedExpo(row),
    goLiveCount: row.go_live_count,
    totalBooths: row.total_booths,
    soldBooths: row.sold_booths,
    visitors: row.visitors,
    rfqCount: row.rfq_count || Math.floor(row.visitors * 0.4),
    chatCount: row.chat_count || Math.floor(row.visitors * 0.8)
  }))
}

export async function getPartnerAssignedExpo(
  userId: string,
  expoId: string
): Promise<PartnerAssignedExpo | null> {
  const rows = (await sql`
    select
      e.*,
      po.id as partner_org_id,
      po.name as partner_org_name,
      po.model as partner_org_model,
      po.status as partner_org_status,
      po.primary_user_id as partner_org_primary_user_id,
      pm.role as membership_role,
      pea.partnership_model,
      (
        select count(*)::int
        from go_live_events gle
        where gle.expo_id = e.id
          and gle.status <> 'Canceled'
      ) as go_live_count,
      (
        select coalesce(sum(basic_qty + professional_qty + premium_qty), 0)::int
        from expo_halls eh
        where eh.expo_id = e.id
      ) as total_booths,
      (
        select count(*)::int
        from seller_booth_registrations sbr
        where sbr.expo_id = e.id
      ) as sold_booths,
      (
        select count(distinct customer_id)::int
        from orders o
        where o.expo_name = e.name
      ) as visitors,
      (
        select count(*)::int
        from orders o
        where o.expo_name = e.name and o.order_type = 'booth_registration'
      ) * 1.5::int as rfq_count,
      (
        select count(*)::int
        from live_comments lc
        inner join go_live_events gle on gle.stream_session_id = lc.stream_session_id
        where gle.expo_id = e.id
      ) as chat_count
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    where pm.user_id = ${userId}
      and e.id = ${expoId}
      and pm.status = 'active'
      and po.status = 'active'
    limit 1
  `) as (PartnerExpoRow & {
    go_live_count: number
    total_booths: number
    sold_booths: number
    visitors: number
    rfq_count: number
    chat_count: number
  })[]

  const row = rows[0]
  return row
    ? {
        ...rowToAssignedExpo(row),
        goLiveCount: row.go_live_count,
        totalBooths: row.total_booths,
        soldBooths: row.sold_booths,
        visitors: row.visitors,
        rfqCount: row.rfq_count || Math.floor(row.visitors * 0.4),
        chatCount: row.chat_count || Math.floor(row.visitors * 0.8)
      }
    : null
}

export async function getPartnerExpoOperationsDetail(
  userId: string,
  expoId: string
): Promise<PartnerExpoOperationsDetail | null> {
  const assignedRows = (await sql`
    select e.id, e.name
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    where pm.user_id = ${userId}
      and e.id = ${expoId}
      and pm.status = 'active'
      and po.status = 'active'
    limit 1
  `) as { id: string; name: string }[]

  const assigned = assignedRows[0]
  if (!assigned) return null

  const summaryRows = (await sql`
    with hall_capacity as (
      select
        coalesce(sum(basic_qty + professional_qty + premium_qty), 0)::int as total_booths
      from expo_halls
      where expo_id = ${expoId}
    ),
    booth_stats as (
      select
        count(*)::int as sold_booths,
        count(*) filter (where bc.publish_status = 'Published')::int as published_booths,
        coalesce(sum(jsonb_array_length(coalesce(bc.products, '[]'::jsonb))), 0)::int as products
      from seller_booth_registrations sbr
      left join booth_customizations bc on bc.registration_id = sbr.id
      where sbr.expo_id = ${expoId}
    ),
    golive_stats as (
      select
        count(*) filter (where gle.status <> 'Canceled')::int as go_live_events,
        count(*) filter (where ss.status = 'Live')::int as live_sessions,
        coalesce(sum(ss.peak_viewer_count), 0)::int as peak_viewers
      from go_live_events gle
      left join stream_sessions ss on ss.stream_session_id = gle.stream_session_id
      where gle.expo_id = ${expoId}
    ),
    comment_stats as (
      select count(lc.live_comment_id)::int as comments
      from go_live_events gle
      inner join live_comments lc on lc.stream_session_id = gle.stream_session_id
      where gle.expo_id = ${expoId}
        and lc.is_deleted = false
    ),
    order_stats as (
      select
        count(distinct customer_id)::int as visitors,
        coalesce(sum(amount) filter (where status = 'Paid'), 0)::numeric as revenue
      from orders
      where expo_name = ${assigned.name}
    )
    select
      coalesce(hc.total_booths, 0)::int as total_booths,
      coalesce(bs.sold_booths, 0)::int as sold_booths,
      greatest(coalesce(hc.total_booths, bs.sold_booths, 0) - coalesce(bs.sold_booths, 0), 0)::int as unsold_booths,
      coalesce(bs.published_booths, 0)::int as published_booths,
      coalesce(bs.products, 0)::int as products,
      coalesce(gs.go_live_events, 0)::int as go_live_events,
      coalesce(gs.live_sessions, 0)::int as live_sessions,
      coalesce(gs.peak_viewers, 0)::int as peak_viewers,
      coalesce(cs.comments, 0)::int as comments,
      coalesce(os.visitors, 0)::int as visitors,
      coalesce(os.revenue, 0)::numeric as revenue
    from hall_capacity hc
    cross join booth_stats bs
    cross join golive_stats gs
    cross join comment_stats cs
    cross join order_stats os
  `) as {
    total_booths: number | string
    sold_booths: number | string
    unsold_booths: number | string
    published_booths: number | string
    products: number | string
    go_live_events: number | string
    live_sessions: number | string
    peak_viewers: number | string
    comments: number | string
    visitors: number | string
    revenue: number | string
  }[]

  const tierRows = (await sql`
    with capacity as (
      select 'Basic' as tier, coalesce(sum(basic_qty), 0)::int as capacity
      from expo_halls
      where expo_id = ${expoId}
      union all
      select 'Professional' as tier, coalesce(sum(professional_qty), 0)::int as capacity
      from expo_halls
      where expo_id = ${expoId}
      union all
      select 'Premium' as tier, coalesce(sum(premium_qty), 0)::int as capacity
      from expo_halls
      where expo_id = ${expoId}
    ),
    sold as (
      select
        case
          when lower(booth_tier) in ('pro', 'professional') then 'Professional'
          when lower(booth_tier) = 'premium' then 'Premium'
          else 'Basic'
        end as tier,
        count(*)::int as sold,
        count(*) filter (where bc.publish_status = 'Published')::int as published
      from seller_booth_registrations sbr
      left join booth_customizations bc on bc.registration_id = sbr.id
      where sbr.expo_id = ${expoId}
      group by 1
    )
    select
      c.tier,
      c.capacity,
      coalesce(s.sold, 0)::int as sold,
      coalesce(s.published, 0)::int as published
    from capacity c
    left join sold s on s.tier = c.tier
    order by case c.tier when 'Basic' then 1 when 'Professional' then 2 else 3 end
  `) as {
    tier: string
    capacity: number | string
    sold: number | string
    published: number | string
  }[]

  const hallRows = (await sql`
    select
      id,
      hall_name,
      basic_qty,
      professional_qty,
      premium_qty,
      (basic_qty + professional_qty + premium_qty)::int as capacity
    from expo_halls
    where expo_id = ${expoId}
    order by sort_order asc
  `) as {
    id: string
    hall_name: string
    basic_qty: number | string
    professional_qty: number | string
    premium_qty: number | string
    capacity: number | string
  }[]

  const statusRows = (await sql`
    select status, count(*)::int as value
    from seller_booth_registrations
    where expo_id = ${expoId}
    group by status
    order by value desc, status asc
  `) as { status: string; value: number | string }[]

  const summaryRow = summaryRows[0]
  const totalBooths = toNumber(summaryRow?.total_booths)
  const soldBooths = toNumber(summaryRow?.sold_booths)

  return {
    summary: {
      totalBooths,
      soldBooths,
      unsoldBooths: toNumber(summaryRow?.unsold_booths),
      boothUtilization:
        totalBooths > 0 ? Math.round((soldBooths / totalBooths) * 100) : 0,
      publishedBooths: toNumber(summaryRow?.published_booths),
      goLiveEvents: toNumber(summaryRow?.go_live_events),
      liveSessions: toNumber(summaryRow?.live_sessions),
      peakViewers: toNumber(summaryRow?.peak_viewers),
      comments: toNumber(summaryRow?.comments),
      revenue: toNumber(summaryRow?.revenue),
      visitors: toNumber(summaryRow?.visitors),
      products: toNumber(summaryRow?.products)
    },
    tierBreakdown: tierRows.map((row) => ({
      tier: row.tier,
      capacity: toNumber(row.capacity),
      sold: toNumber(row.sold),
      published: toNumber(row.published)
    })),
    hallBreakdown: hallRows.map((row) => ({
      id: row.id,
      name: row.hall_name,
      capacity: toNumber(row.capacity),
      basicQty: toNumber(row.basic_qty),
      professionalQty: toNumber(row.professional_qty),
      premiumQty: toNumber(row.premium_qty)
    })),
    registrationStatusBreakdown: statusRows.map((row) => ({
      status: row.status,
      value: toNumber(row.value)
    }))
  }
}

export async function getPartnerDashboardMetrics(
  userId: string
): Promise<PartnerDashboardMetrics> {
  const expoRows = (await sql`
    with assigned as (
      select distinct e.id, e.name, e.status, e.start_date, e.end_date
      from partner_memberships pm
      inner join partner_organizations po on po.id = pm.partner_org_id
      inner join partner_expo_assignments pea on pea.partner_org_id = po.id
      inner join expos e on e.id = pea.expo_id
      where pm.user_id = ${userId}
        and pm.status = 'active'
        and po.status = 'active'
    ),
    hall_capacity as (
      select
        eh.expo_id,
        sum(eh.basic_qty + eh.professional_qty + eh.premium_qty)::int as total_booths
      from expo_halls eh
      inner join assigned a on a.id = eh.expo_id
      group by eh.expo_id
    ),
    booth_stats as (
      select
        sbr.expo_id,
        count(*)::int as sold_booths,
        count(*) filter (where bc.publish_status = 'Published')::int as published_booths
      from seller_booth_registrations sbr
      inner join assigned a on a.id = sbr.expo_id
      left join booth_customizations bc on bc.registration_id = sbr.id
      group by sbr.expo_id
    ),
    golive_stats as (
      select
        gle.expo_id,
        count(*) filter (where gle.status <> 'Canceled')::int as go_live_events,
        count(*) filter (where ss.status = 'Live')::int as live_sessions,
        coalesce(sum(ss.peak_viewer_count), 0)::int as peak_viewers
      from go_live_events gle
      inner join assigned a on a.id = gle.expo_id
      left join stream_sessions ss on ss.stream_session_id = gle.stream_session_id
      group by gle.expo_id
    ),
    comment_stats as (
      select
        gle.expo_id,
        count(lc.live_comment_id)::int as comments
      from go_live_events gle
      inner join assigned a on a.id = gle.expo_id
      inner join live_comments lc on lc.stream_session_id = gle.stream_session_id
      where lc.is_deleted = false
      group by gle.expo_id
    ),
    revenue_stats as (
      select
        a.id as expo_id,
        coalesce(sum(o.amount) filter (where o.status = 'Paid'), 0)::numeric as revenue
      from assigned a
      left join orders o on o.order_type = 'booth_registration'
        and o.expo_name = a.name
      group by a.id
    )
    select
      a.id,
      a.name,
      a.status,
      a.start_date,
      a.end_date,
      coalesce(hc.total_booths, bs.sold_booths, 0)::int as total_booths,
      coalesce(bs.sold_booths, 0)::int as sold_booths,
      greatest(coalesce(hc.total_booths, bs.sold_booths, 0) - coalesce(bs.sold_booths, 0), 0)::int as unsold_booths,
      coalesce(bs.published_booths, 0)::int as published_booths,
      coalesce(gs.go_live_events, 0)::int as go_live_events,
      coalesce(gs.live_sessions, 0)::int as live_sessions,
      coalesce(gs.peak_viewers, 0)::int as peak_viewers,
      coalesce(cs.comments, 0)::int as comments,
      coalesce(rs.revenue, 0)::numeric as revenue
    from assigned a
    left join hall_capacity hc on hc.expo_id = a.id
    left join booth_stats bs on bs.expo_id = a.id
    left join golive_stats gs on gs.expo_id = a.id
    left join comment_stats cs on cs.expo_id = a.id
    left join revenue_stats rs on rs.expo_id = a.id
    order by a.start_date asc, a.name asc
  `) as {
    id: string
    name: string
    status: string
    start_date: string | Date
    end_date: string | Date
    total_booths: number | string
    sold_booths: number | string
    unsold_booths: number | string
    published_booths: number | string
    go_live_events: number | string
    live_sessions: number | string
    peak_viewers: number | string
    comments: number | string
    revenue: number | string
  }[]

  const countryRows = (await sql`
    with assigned as (
      select distinct e.id
      from partner_memberships pm
      inner join partner_organizations po on po.id = pm.partner_org_id
      inner join partner_expo_assignments pea on pea.partner_org_id = po.id
      inner join expos e on e.id = pea.expo_id
      where pm.user_id = ${userId}
        and pm.status = 'active'
        and po.status = 'active'
    )
    select
      coalesce(nullif(trim(u.location), ''), 'Vietnam') as name,
      count(*)::int as value
    from seller_booth_registrations sbr
    inner join assigned a on a.id = sbr.expo_id
    inner join users u on u.id = sbr.user_id
    group by coalesce(nullif(trim(u.location), ''), 'Vietnam')
    order by value desc, name asc
    limit 6
  `) as { name: string; value: number | string }[]

  const boothTierRows = (await sql`
    with assigned as (
      select distinct e.id
      from partner_memberships pm
      inner join partner_organizations po on po.id = pm.partner_org_id
      inner join partner_expo_assignments pea on pea.partner_org_id = po.id
      inner join expos e on e.id = pea.expo_id
      where pm.user_id = ${userId}
        and pm.status = 'active'
        and po.status = 'active'
    )
    select
      sbr.booth_tier as name,
      count(*)::int as value
    from seller_booth_registrations sbr
    inner join assigned a on a.id = sbr.expo_id
    group by sbr.booth_tier
    order by value desc, name asc
  `) as { name: string; value: number | string }[]

  const expoMetrics = expoRows.map((row) => {
    const totalBooths = toNumber(row.total_booths)
    const soldBooths = toNumber(row.sold_booths)

    return {
      expoId: row.id,
      expoName: row.name,
      status: normalizePartnerExpoStatus(row.status),
      startDate: toDateOnly(row.start_date),
      endDate: toDateOnly(row.end_date),
      totalBooths,
      soldBooths,
      unsoldBooths: toNumber(row.unsold_booths),
      boothUtilization:
        totalBooths > 0 ? Math.round((soldBooths / totalBooths) * 100) : 0,
      publishedBooths: toNumber(row.published_booths),
      goLiveEvents: toNumber(row.go_live_events),
      liveSessions: toNumber(row.live_sessions),
      peakViewers: toNumber(row.peak_viewers),
      comments: toNumber(row.comments),
      revenue: toNumber(row.revenue)
    }
  })

  const totals = expoMetrics.reduce(
    (acc, item) => {
      acc.assignedExpos += 1
      if (item.status === "Live") acc.liveExpos += 1
      acc.soldBooths += item.soldBooths
      acc.totalBooths += item.totalBooths
      acc.publishedBooths += item.publishedBooths
      acc.goLiveEvents += item.goLiveEvents
      acc.liveSessions += item.liveSessions
      acc.peakViewers += item.peakViewers
      acc.comments += item.comments
      acc.revenue += item.revenue
      return acc
    },
    {
      assignedExpos: 0,
      liveExpos: 0,
      soldBooths: 0,
      totalBooths: 0,
      boothUtilization: 0,
      publishedBooths: 0,
      goLiveEvents: 0,
      liveSessions: 0,
      peakViewers: 0,
      comments: 0,
      revenue: 0
    }
  )
  totals.boothUtilization =
    totals.totalBooths > 0
      ? Math.round((totals.soldBooths / totals.totalBooths) * 100)
      : 0

  const statusMap = new Map<string, number>()
  for (const item of expoMetrics) {
    statusMap.set(item.status, (statusMap.get(item.status) ?? 0) + 1)
  }

  return {
    totals,
    expoMetrics,
    statusBreakdown: Array.from(statusMap, ([name, value]) => ({
      name,
      value
    })),
    countryBreakdown: countryRows.map((row) => ({
      name: row.name,
      value: toNumber(row.value)
    })),
    boothTierBreakdown: boothTierRows.map((row) => ({
      name: row.name,
      value: toNumber(row.value)
    }))
  }
}

export async function ensureCoHostPartnerAssignment(input: {
  userId: string
  userEmail: string
  expoId: string
  replaceExisting?: boolean
}) {
  const orgId = `partner-org-${createHash("sha256").update(input.userId).digest("hex")}`

  const userRows = (await sql`
    select name
    from users
    where id = ${input.userId}
    limit 1
  `) as { name: string }[]
  const userName = userRows[0]?.name ?? input.userEmail

  await sql`
    insert into partner_organizations (
      id,
      name,
      model,
      status,
      primary_user_id,
      created_at,
      updated_at
    )
    values (
      ${orgId},
      ${userName},
      'co_host',
      'active',
      ${input.userId},
      now(),
      now()
    )
    on conflict (id) do update
    set
      name = excluded.name,
      primary_user_id = excluded.primary_user_id,
      updated_at = now()
  `

  await sql`
    insert into partner_memberships (partner_org_id, user_id, role, status)
    values (${orgId}, ${input.userId}, 'primary_representative', 'active')
    on conflict (partner_org_id, user_id) do update
    set
      role = excluded.role,
      status = excluded.status
  `

  if (input.replaceExisting) {
    await sql`
      delete from partner_expo_assignments
      where expo_id = ${input.expoId}
        and partner_org_id <> ${orgId}
    `
  }

  await sql`
    insert into partner_expo_assignments (
      partner_org_id,
      expo_id,
      partnership_model,
      capabilities
    )
    values (${orgId}, ${input.expoId}, 'co_host', '{}'::jsonb)
    on conflict (partner_org_id, expo_id) do update
    set partnership_model = excluded.partnership_model
  `
}
