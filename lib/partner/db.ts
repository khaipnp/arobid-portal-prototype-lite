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
}

type PartnerExpoRow = {
  id: string
  slug?: string | null
  name: string
  thumbnail_url: string
  owner_email: string
  start_date: string | Date
  end_date: string | Date
  status: ExpoStatus
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
    status: row.status,
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

function rowToAssignedExpo(row: PartnerExpoRow): PartnerAssignedExpo {
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
      pea.partnership_model
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    where pm.user_id = ${userId}
      and pm.status = 'active'
      and po.status = 'active'
    order by e.created_at desc
  `) as PartnerExpoRow[]

  return rows.map(rowToAssignedExpo)
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
      pea.partnership_model
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    where pm.user_id = ${userId}
      and e.id = ${expoId}
      and pm.status = 'active'
      and po.status = 'active'
    limit 1
  `) as PartnerExpoRow[]

  const row = rows[0]
  return row ? rowToAssignedExpo(row) : null
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
