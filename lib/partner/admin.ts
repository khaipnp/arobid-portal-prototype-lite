import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
import type {
  PartnerCapability,
  PartnerMiniSiteStatus,
  PartnerMvpRole,
  PartnerScopeSummary
} from "@/lib/partner/core"
import type { PartnerModel, PartnerType } from "@/lib/partner/db"

export type PartnerOrganizationInput = {
  name: string
  model: PartnerModel
  partnerType: PartnerType
}

export type PartnerUserInviteInput = {
  email: string
  role: PartnerMvpRole
}

function partnerScopeAssignmentId(
  partnerOrgId: string,
  scopeType: "expo" | "program" | "company",
  scopeId: string
) {
  return `partner-scope-${partnerOrgId}-${scopeType}-${scopeId}`
}

export function normalizePartnerOrganizationInput(
  input: PartnerOrganizationInput
) {
  const name = input.name.trim()
  if (!name) throw new Error("Partner organization name is required.")

  return {
    name,
    model: input.model,
    partnerType: input.partnerType
  }
}

export function normalizePartnerUserInviteInput(input: PartnerUserInviteInput) {
  const email = input.email.trim().toLowerCase()
  if (!email) throw new Error("Email is required.")

  return {
    email,
    role: input.role
  }
}

export function assertAdminMiniSiteDecision(
  decision: "published" | "rejected",
  reason: string | null | undefined
) {
  if (decision === "rejected" && !reason?.trim()) {
    throw new Error("Reject reason is required.")
  }
}

export async function listPartnerOrganizationsForAdmin() {
  return sql`
    select
      po.id,
      po.name,
      po.model,
      po.partner_type,
      po.status,
      po.primary_user_id,
      count(pm.user_id)::int as member_count
    from partner_organizations po
    left join partner_memberships pm on pm.partner_org_id = po.id
    group by po.id
    order by po.created_at desc
  `
}

export async function createPartnerOrganizationForAdmin(
  actorUserId: string,
  input: PartnerOrganizationInput
) {
  const normalized = normalizePartnerOrganizationInput(input)
  const id = `partner-org-${randomUUID()}`

  await sql`
    insert into partner_organizations (
      id,
      name,
      model,
      partner_type,
      status,
      primary_user_id
    )
    values (
      ${id},
      ${normalized.name},
      ${normalized.model},
      ${normalized.partnerType},
      'active',
      ${actorUserId}
    )
  `

  await setPartnerCapabilitiesForAdmin(actorUserId, id, ["overview"])
  return { id }
}

export async function invitePartnerUserForAdmin(
  partnerOrgId: string,
  input: PartnerUserInviteInput
) {
  const normalized = normalizePartnerUserInviteInput(input)
  const rows = (await sql`
    select id
    from users
    where lower(email) = ${normalized.email}
    limit 1
  `) as { id: string }[]

  const user = rows[0]
  if (!user) throw new Error("Arobid user not found.")

  await sql`
    insert into partner_memberships (
      partner_org_id,
      user_id,
      role,
      status
    )
    values (
      ${partnerOrgId},
      ${user.id},
      ${normalized.role},
      'active'
    )
    on conflict (partner_org_id, user_id) do update set
      role = excluded.role,
      status = 'active'
  `

  return { userId: user.id }
}

export async function updatePartnerMembershipForAdmin(input: {
  partnerOrgId: string
  userId: string
  role?: PartnerMvpRole
  status?: "active" | "inactive" | "removed"
}) {
  await sql`
    update partner_memberships
    set
      role = coalesce(${input.role ?? null}, role),
      status = coalesce(${input.status ?? null}, status)
    where partner_org_id = ${input.partnerOrgId}
      and user_id = ${input.userId}
  `
}

export async function setPartnerCapabilitiesForAdmin(
  actorUserId: string,
  partnerOrgId: string,
  capabilities: PartnerCapability[]
) {
  await sql`begin`
  try {
    await sql`
      delete from partner_capability_assignments
      where partner_org_id = ${partnerOrgId}
    `

    await sql`
      insert into partner_capability_assignments (
        partner_org_id,
        capability,
        granted_by_user_id
      )
      select ${partnerOrgId}, capability, ${actorUserId}
      from unnest(${capabilities}::text[]) as capability
      on conflict (partner_org_id, capability) do nothing
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function setPartnerScopesForAdmin(input: {
  actorUserId: string
  partnerOrgId: string
  scopes: PartnerScopeSummary
}) {
  const entries = [
    ...input.scopes.expoIds.map((id) => ["expo", id] as const),
    ...input.scopes.programIds.map((id) => ["program", id] as const),
    ...input.scopes.companyIds.map((id) => ["company", id] as const)
  ]

  await sql`begin`
  try {
    await sql`
      update partner_scope_assignments
      set status = 'inactive', updated_at = now()
      where partner_org_id = ${input.partnerOrgId}
    `

    for (const [scopeType, scopeId] of entries) {
      await sql`
        insert into partner_scope_assignments (
          id,
          partner_org_id,
          scope_type,
          scope_id,
          assigned_by_user_id,
          status
        )
        values (
          ${partnerScopeAssignmentId(input.partnerOrgId, scopeType, scopeId)},
          ${input.partnerOrgId},
          ${scopeType},
          ${scopeId},
          ${input.actorUserId},
          'active'
        )
        on conflict (id)
        do update set
          assigned_by_user_id = excluded.assigned_by_user_id,
          status = 'active',
          updated_at = now()
      `
    }
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function decidePartnerMiniSiteForAdmin(input: {
  actorUserId: string
  partnerOrgId: string
  miniSiteId: string
  decision: "published" | "rejected"
  reason?: string | null
}) {
  assertAdminMiniSiteDecision(input.decision, input.reason)

  await sql`begin`
  try {
    const rows = (await sql`
      select status
      from partner_mini_sites
      where id = ${input.miniSiteId}
        and partner_org_id = ${input.partnerOrgId}
      for update
      limit 1
    `) as { status: PartnerMiniSiteStatus }[]

    const current = rows[0]
    if (!current) throw new Error("Mini-site version not found.")
    if (current.status !== "submitted") {
      throw new Error("Only submitted mini-site versions can be reviewed.")
    }

    if (input.decision === "published") {
      await sql`
        update partner_mini_sites
        set status = 'rejected', updated_at = now()
        where partner_org_id = ${input.partnerOrgId}
          and status = 'published'
      `
    }

    await sql`
      update partner_mini_sites
      set
        status = ${input.decision},
        published_by_user_id = case when ${input.decision} = 'published' then ${input.actorUserId} else null end,
        published_at = case when ${input.decision} = 'published' then now() else null end,
        rejected_by_user_id = case when ${input.decision} = 'rejected' then ${input.actorUserId} else null end,
        rejected_at = case when ${input.decision} = 'rejected' then now() else null end,
        reject_reason = case when ${input.decision} = 'rejected' then ${input.reason?.trim() ?? null} else null end,
        updated_at = now()
      where id = ${input.miniSiteId}
        and partner_org_id = ${input.partnerOrgId}
    `

    await sql`
      insert into partner_mini_site_review_events (
        id,
        mini_site_id,
        partner_org_id,
        from_status,
        to_status,
        actor_user_id,
        reason
      )
      values (
        ${`partner-mini-site-review-${randomUUID()}`},
        ${input.miniSiteId},
        ${input.partnerOrgId},
        ${current.status},
        ${input.decision},
        ${input.actorUserId},
        ${input.reason?.trim() ?? null}
      )
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}
