import { hashPassword, verifyPassword } from "@/lib/auth/password"
import type { AppRole } from "@/lib/auth/rbac"
import { APP_ROLES } from "@/lib/auth/rbac"
import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { CURRENT_USER_PROFILE } from "@/lib/user/current-user"

const DEFAULT_ADMIN_EMAIL = CURRENT_USER_PROFILE.email
const DEFAULT_ADMIN_PASSWORD = "ChangeMe123!"

export const DEMO_LOGIN_ROLES = ["admin", "partner", "seller", "buyer"] as const
export type DemoLoginRole = (typeof DEMO_LOGIN_ROLES)[number]

type DemoAccount = {
  role: DemoLoginRole
  appRole: AppRole
  userId: string
  name: string
  email: string
  password: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "admin",
    appRole: "admin",
    userId: "11111111-1111-4111-8111-111111111111",
    name: "Khai Pham",
    email: "khaipham@arobid.com",
    password: "Admin@Arobid123"
  },
  {
    role: "partner",
    appRole: "exhibitor",
    userId: "88888888-8888-4888-8888-888888888888",
    name: "Partner Demo",
    email: "partner.demo@arobid.com",
    password: "Partner@Arobid123"
  },
  {
    role: "seller",
    appRole: "seller",
    userId: "99999999-9999-4999-8999-999999999999",
    name: "Seller Demo",
    email: "seller.demo@arobid.com",
    password: "Seller@Arobid123"
  },
  {
    role: "buyer",
    appRole: "buyer",
    userId: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    name: "Buyer Demo",
    email: "buyer.demo@arobid.com",
    password: "Buyer@Arobid123"
  }
]

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  roles: AppRole[]
  companyId: string | null
}

function toRedirectPath(input: { roles: AppRole[] }) {
  if (input.roles.includes("admin")) return "/admin"
  if (input.roles.includes("exhibitor")) return "/partner"
  return "/seller"
}

export async function ensureDemoAccounts() {
  await sql`
    insert into companies (id, name)
    values ('comp-' || encode(sha256('Arobid Demo'::bytea), 'hex'), 'Arobid Demo')
    on conflict (id) do nothing
  `

  for (const account of DEMO_ACCOUNTS) {
    await sql`
      insert into users (id, name, email, company_id, is_active)
      values (
        ${account.userId},
        ${account.name},
        ${account.email},
        'comp-' || encode(sha256('Arobid Demo'::bytea), 'hex'),
        true
      )
      on conflict (id) do update
      set
        name = excluded.name,
        email = excluded.email,
        company_id = excluded.company_id,
        is_active = excluded.is_active
    `

    await sql`
      delete from user_roles
      where user_id = ${account.userId}
        and role_id <> ${account.appRole}
        and expo_id is null
    `

    await sql`
      insert into user_roles (user_id, role_id, expo_id)
      values (${account.userId}, ${account.appRole}, null)
      on conflict do nothing
    `

    await sql`
      insert into auth_identities (id, user_id, email, password_hash, is_active)
      values (
        gen_random_uuid(),
        ${account.userId},
        ${account.email},
        ${hashPassword(account.password)},
        true
      )
      on conflict (email) do update
      set
        user_id = excluded.user_id,
        password_hash = excluded.password_hash,
        is_active = excluded.is_active,
        updated_at = now()
    `
  }
}

export async function ensureAuthBootstrapIdentity() {
  await ensurePlatformSchema()
  const email = process.env.AUTH_BOOTSTRAP_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL
  const password =
    process.env.AUTH_BOOTSTRAP_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD

  const existing = (await sql`
    select 1
    from auth_identities
    where email = ${email}
    limit 1
  `) as { "?column?": number }[]

  if (existing.length === 0) {
    await sql`
      insert into auth_identities (id, user_id, email, password_hash, is_active)
      values (
        gen_random_uuid(),
        ${CURRENT_USER_PROFILE.id},
        ${email},
        ${hashPassword(password)},
        true
      )
      on conflict (email) do nothing
    `
  }

  await ensureDemoAccounts()
}

export async function authenticateByEmailPassword(input: {
  email: string
  password: string
}): Promise<AuthenticatedUser | null> {
  const rows = (await sql`
    select
      ai.user_id,
      ai.password_hash,
      ai.is_active as identity_active,
      u.name,
      u.email,
      u.is_active as user_active,
      u.company_id
    from auth_identities ai
    inner join users u on u.id = ai.user_id
    where lower(ai.email) = lower(${input.email.trim()})
    limit 1
  `) as {
    user_id: string
    password_hash: string
    identity_active: boolean
    name: string
    email: string
    user_active: boolean
    company_id: string | null
  }[]

  const row = rows[0]
  if (!row) return null
  if (!row.identity_active || !row.user_active) return null
  if (!verifyPassword(input.password, row.password_hash)) return null

  const roleRows = (await sql`
    select role_id
    from user_roles
    where user_id = ${row.user_id}
      and expo_id is null
  `) as { role_id: string }[]

  const roles = roleRows
    .map((r) => r.role_id)
    .filter((r): r is AppRole => APP_ROLES.includes(r as AppRole))

  return {
    id: row.user_id,
    name: row.name,
    email: row.email,
    roles,
    companyId: row.company_id
  }
}

export async function authenticateByDemoRole(input: {
  role: DemoLoginRole
}): Promise<(AuthenticatedUser & { redirectPath: string }) | null> {
  const account = DEMO_ACCOUNTS.find((item) => item.role === input.role)
  if (!account) return null

  const user = await getAuthenticatedUserById(account.userId)
  if (!user) return null

  return {
    ...user,
    redirectPath: toRedirectPath({ roles: user.roles })
  }
}

export async function getAuthenticatedUserById(
  userId: string
): Promise<AuthenticatedUser | null> {
  const rows = (await sql`
    select id, name, email, is_active, company_id
    from users
    where id = ${userId}
    limit 1
  `) as {
    id: string
    name: string
    email: string
    is_active: boolean
    company_id: string | null
  }[]
  const user = rows[0]
  if (!user?.is_active) return null

  const roleRows = (await sql`
    select role_id
    from user_roles
    where user_id = ${userId}
      and expo_id is null
  `) as { role_id: string }[]

  const roles = roleRows
    .map((r) => r.role_id)
    .filter((r): r is AppRole => APP_ROLES.includes(r as AppRole))

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles,
    companyId: user.company_id
  }
}
