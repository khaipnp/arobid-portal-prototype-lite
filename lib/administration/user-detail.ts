import { headers } from "next/headers"
import { sql } from "@/lib/db/neon"

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

export interface UpdateAdministrationUserInput {
  currentUserId: string
  nextUserId: string
  name: string
  email: string
  companyId: string | null
  companyName: string | null
  jobTitle: string | null
  phone: string | null
  website: string | null
  location: string | null
  avatarUrl: string | null
  isActive: boolean
}

type UserRow = Omit<
  AdministrationUserDetail,
  "roles" | "auditEvents" | "roleCount" | "auditEventCount" | "latestActivityAt"
>

type CountRow = { count: number }
type LatestActivityRow = { latestActivityAt: string | null }
type ForeignKeyReferenceRow = {
  schemaName: string
  tableName: string
  columnName: string
}

type ColumnRow = { columnName: string }

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

export async function getRequestAuditContext() {
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 512) ?? null
  const forwardedFor = requestHeaders.get("x-forwarded-for")
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || null

  return { ipAddress, userAgent }
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

function normalizeNullableText(value: string | null) {
  const normalized = value?.trim() ?? ""
  return normalized || null
}

function assertValidUserId(userId: string) {
  if (!UUID_RE.test(userId)) {
    throw new Error("User ID must be a valid UUID.")
  }
}

async function getTableColumns(tableName: string): Promise<string[]> {
  const rows = (await sql`
    select column_name as "columnName"
    from information_schema.columns
    where table_schema = 'public'
      and table_name = ${tableName}
    order by ordinal_position asc
  `) as ColumnRow[]

  return rows.map((row) => row.columnName)
}

async function getUserForeignKeyReferences(): Promise<
  ForeignKeyReferenceRow[]
> {
  return (await sql`
    select
      table_schema as "schemaName",
      table_name as "tableName",
      column_name as "columnName"
    from information_schema.key_column_usage kcu
    join information_schema.referential_constraints rc
      on rc.constraint_schema = kcu.constraint_schema
      and rc.constraint_name = kcu.constraint_name
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_schema = rc.unique_constraint_schema
      and ccu.constraint_name = rc.unique_constraint_name
    where ccu.table_schema = 'public'
      and ccu.table_name = 'users'
      and ccu.column_name = 'id'
      and kcu.table_schema = 'public'
    order by kcu.table_name asc, kcu.column_name asc
  `) as ForeignKeyReferenceRow[]
}

function quoteIdent(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
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
      app_user.job_title as "jobTitle",
      app_user.phone,
      app_user.website,
      app_user.location,
      app_user.avatar_url as "avatarUrl",
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

export async function updateAdministrationUser(
  input: UpdateAdministrationUserInput
): Promise<{ id: string }> {
  const currentUserId = input.currentUserId.trim()
  const nextUserId = input.nextUserId.trim().toLowerCase()
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const companyId = normalizeNullableText(input.companyId)
  const companyName = normalizeNullableText(input.companyName)
  const jobTitle = normalizeNullableText(input.jobTitle)
  const phone = normalizeNullableText(input.phone)
  const website = normalizeNullableText(input.website)
  const location = normalizeNullableText(input.location)
  const avatarUrl = normalizeNullableText(input.avatarUrl)

  assertValidUserId(currentUserId)
  assertValidUserId(nextUserId)
  if (!name || name.length > 255) {
    throw new Error("Name is required (max 255 characters).")
  }
  if (!email || email.length > 320 || !email.includes("@")) {
    throw new Error("Valid email is required.")
  }

  const idChanged = currentUserId !== nextUserId
  const existingRows = (await sql`
    select id from users where id = ${currentUserId} limit 1
  `) as { id: string }[]
  if (existingRows.length === 0) {
    throw new Error("User not found.")
  }

  if (idChanged) {
    const duplicateIdRows = (await sql`
      select id from users where id = ${nextUserId} limit 1
    `) as { id: string }[]
    if (duplicateIdRows.length > 0) {
      throw new Error("User ID already exists.")
    }

    const duplicateIdentityIdRows = (await sql`
      select user_id from auth_identities where user_id = ${nextUserId} limit 1
    `) as { user_id: string }[]
    if (duplicateIdentityIdRows.length > 0) {
      throw new Error("User ID already has a login identity.")
    }
  }

  const duplicateEmailRows = (await sql`
    select id from users
    where lower(email) = lower(${email}) and id <> ${currentUserId}
    limit 1
  `) as { id: string }[]
  if (duplicateEmailRows.length > 0) {
    throw new Error("Email already belongs to another user.")
  }

  const duplicateIdentityRows = (await sql`
    select user_id from auth_identities
    where lower(email) = lower(${email}) and user_id <> ${currentUserId}
    limit 1
  `) as { user_id: string }[]
  if (duplicateIdentityRows.length > 0) {
    throw new Error("Login email already belongs to another user.")
  }

  const references = idChanged
    ? (await getUserForeignKeyReferences()).filter(
        (reference) => reference.tableName !== "auth_identities"
      )
    : []
  const userColumns = idChanged ? await getTableColumns("users") : []
  const copiedUserColumns = userColumns.filter((column) => column !== "id")
  const transactionQueries = [] as Array<ReturnType<typeof sql>>

  transactionQueries.push(sql`
    select pg_advisory_xact_lock(hashtextextended(${currentUserId}, 0))
  `)
  if (idChanged) {
    transactionQueries.push(sql`
      select pg_advisory_xact_lock(hashtextextended(${nextUserId}, 0))
    `)
  }

  if (companyId) {
    transactionQueries.push(sql`
      insert into companies (id, name)
      values (${companyId}, ${companyName ?? companyId})
      on conflict (id) do update
      set name = excluded.name
    `)
  }

  if (idChanged) {
    transactionQueries.push(
      sql.query(
        `insert into users (${["id", ...copiedUserColumns.map(quoteIdent)].join(
          ", "
        )}) select $1, ${copiedUserColumns
          .map(quoteIdent)
          .join(", ")} from users where id = $2`,
        [nextUserId, currentUserId]
      )
    )
    transactionQueries.push(sql`
      update users
      set
        name = ${name},
        email = ${email},
        company_id = ${companyId},
        job_title = ${jobTitle},
        phone = ${phone},
        website = ${website},
        location = ${location},
        avatar_url = ${avatarUrl},
        is_active = ${input.isActive}
      where id = ${nextUserId}
    `)

    for (const reference of references) {
      transactionQueries.push(
        sql.query(
          `update ${quoteIdent(reference.schemaName)}.${quoteIdent(reference.tableName)} set ${quoteIdent(reference.columnName)} = $1 where ${quoteIdent(reference.columnName)} = $2`,
          [nextUserId, currentUserId]
        )
      )
    }

    transactionQueries.push(sql`
      update chat_users
      set
        id = ${nextUserId},
        name = ${name},
        email = ${email},
        company_id = ${companyId},
        job_title = ${jobTitle},
        phone = ${phone},
        website = ${website},
        location = ${location},
        avatar_url = ${avatarUrl},
        is_active = ${input.isActive}
      where id = ${currentUserId}
    `)
    transactionQueries.push(sql`
      update chat_messages
      set sender_id = ${nextUserId}
      where sender_id = ${currentUserId}
    `)
    transactionQueries.push(sql`
      update auth_identities
      set
        user_id = ${nextUserId},
        email = ${email},
        updated_at = now()
      where user_id = ${currentUserId}
    `)
    transactionQueries.push(sql`delete from users where id = ${currentUserId}`)
  } else {
    transactionQueries.push(sql`
      update users
      set
        name = ${name},
        email = ${email},
        company_id = ${companyId},
        job_title = ${jobTitle},
        phone = ${phone},
        website = ${website},
        location = ${location},
        avatar_url = ${avatarUrl},
        is_active = ${input.isActive}
      where id = ${currentUserId}
    `)
    transactionQueries.push(sql`
      update chat_users
      set
        name = ${name},
        email = ${email},
        company_id = ${companyId},
        job_title = ${jobTitle},
        phone = ${phone},
        website = ${website},
        location = ${location},
        avatar_url = ${avatarUrl},
        is_active = ${input.isActive}
      where id = ${currentUserId}
    `)
  }

  if (!idChanged) {
    transactionQueries.push(sql`
      update auth_identities
      set
        email = ${email},
        updated_at = now()
      where user_id = ${currentUserId}
    `)
  }

  await sql.transaction(transactionQueries)

  return { id: nextUserId }
}
