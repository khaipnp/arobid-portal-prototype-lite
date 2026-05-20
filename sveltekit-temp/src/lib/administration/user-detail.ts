// next/headers removed for SvelteKit compatibility
import { sql } from "$lib/db/neon"

export interface AdministrationUserRole {
  roleId: string
  roleName: string
  scope: string
  expoId: string | null
}

export interface AdministrationUserAuditEvent {
  id: string
  targetUserId: string
  actorUserId: string | null
  actorName: string | null
  actorEmail: string | null
  actorType: string
  action: string
  resourceType: string | null
  resourceId: string | null
  summary: string
  metadata: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AdministrationUserDetail {
  id: string
  name: string
  email: string
  companyId: string | null
  companyName: string | null
  industry: string | null
  jobTitle: string | null
  phone: string | null
  website: string | null
  location: string | null
  avatarUrl: string | null
  isActive: boolean
  roleCount: number
  auditEventCount: number
  latestActivityAt: string | null
  roles: AdministrationUserRole[]
  auditEvents: AdministrationUserAuditEvent[]
}

export interface RecordUserAuditEventInput {
  targetUserId: string
  actorUserId?: string | null
  actorType: "user" | "admin" | "system"
  action: string
  resourceType?: string | null
  resourceId?: string | null
  summary: string
  metadata?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

type UserRow = Omit<
  AdministrationUserDetail,
  "roles" | "auditEvents" | "roleCount" | "auditEventCount" | "latestActivityAt"
>

type CountRow = { count: number }
type LatestActivityRow = { latestActivityAt: string | null }

let userAuditSchemaReady = false

export async function ensureUserAuditSchema() {
  if (userAuditSchemaReady) return

  await sql`
    create table if not exists user_audit_events (
      id text primary key,
      target_user_id text not null references users(id) on delete cascade,
      actor_user_id text references users(id) on delete set null,
      actor_type text not null,
      action text not null,
      resource_type text,
      resource_id text,
      summary text not null,
      metadata jsonb not null default '{}'::jsonb,
      ip_address text,
      user_agent text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_user_audit_events_target_created
    on user_audit_events (target_user_id, created_at desc)
  `
  await sql`
    create index if not exists idx_user_audit_events_actor_created
    on user_audit_events (actor_user_id, created_at desc)
  `
  await sql`
    create index if not exists idx_user_audit_events_action_created
    on user_audit_events (action, created_at desc)
  `

  userAuditSchemaReady = true
}

export async function getRequestAuditContext(request?: Request) {
  if (request) {
    const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || null

    return { ipAddress, userAgent }
  }
  return { ipAddress: null, userAgent: null }
}

export async function recordUserAuditEvent(input: RecordUserAuditEventInput) {
  try {
    await ensureUserAuditSchema()
    await sql`
      insert into user_audit_events (
        id,
        target_user_id,
        actor_user_id,
        actor_type,
        action,
        resource_type,
        resource_id,
        summary,
        metadata,
        ip_address,
        user_agent
      ) values (
        gen_random_uuid()::text,
        ${input.targetUserId},
        ${input.actorUserId ?? null},
        ${input.actorType},
        ${input.action},
        ${input.resourceType ?? null},
        ${input.resourceId ?? null},
        ${input.summary},
        ${JSON.stringify(input.metadata ?? {})}::jsonb,
        ${input.ipAddress ?? null},
        ${input.userAgent ?? null}
      )
    `
  } catch (error) {
    console.error("Failed to record user audit event", error)
  }
}

export async function getAdministrationUserDetail(
  userId: string
): Promise<AdministrationUserDetail | null> {
  await ensureUserAuditSchema()

  const userRows = (await sql`
    select
      app_user.id,
      app_user.name,
      app_user.email,
      app_user.company_id as "companyId",
      company.name as "companyName",
      null::text as industry,
      null::text as "jobTitle",
      null::text as phone,
      null::text as website,
      null::text as location,
      null::text as "avatarUrl",
      app_user.is_active as "isActive"
    from users app_user
    left join companies company on company.id = app_user.company_id
    where app_user.id = ${userId}
    limit 1
  `) as UserRow[]

  const user = userRows[0]
  if (!user) return null

  const roles = (await sql`
    select
      user_roles.role_id as "roleId",
      coalesce(roles.name, user_roles.role_id) as "roleName",
      case when user_roles.expo_id is null then 'Global' else 'Expo' end as scope,
      user_roles.expo_id as "expoId"
    from user_roles
    left join roles on roles.id = user_roles.role_id
    where user_roles.user_id = ${userId}
    order by scope asc, "roleName" asc
  `) as AdministrationUserRole[]

  const auditEvents = (await sql`
    select
      event.id,
      event.target_user_id as "targetUserId",
      event.actor_user_id as "actorUserId",
      actor.name as "actorName",
      actor.email as "actorEmail",
      event.actor_type as "actorType",
      event.action,
      event.resource_type as "resourceType",
      event.resource_id as "resourceId",
      event.summary,
      event.metadata,
      event.ip_address as "ipAddress",
      event.user_agent as "userAgent",
      event.created_at as "createdAt"
    from user_audit_events event
    left join users actor on actor.id = event.actor_user_id
    where event.target_user_id = ${userId}
    order by event.created_at desc
    limit 50
  `) as AdministrationUserAuditEvent[]

  const auditCountRows = (await sql`
    select count(*)::int as count
    from user_audit_events
    where target_user_id = ${userId}
  `) as CountRow[]

  const latestActivityRows = (await sql`
    select max(created_at) as "latestActivityAt"
    from user_audit_events
    where target_user_id = ${userId}
  `) as LatestActivityRow[]

  return {
    ...user,
    roleCount: roles.length,
    auditEventCount: Number(auditCountRows[0]?.count ?? 0),
    latestActivityAt: latestActivityRows[0]?.latestActivityAt ?? null,
    roles,
    auditEvents
  }
}
