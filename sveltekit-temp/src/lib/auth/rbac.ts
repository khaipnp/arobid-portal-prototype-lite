import type { Cookies } from "@sveltejs/kit"
import { redirect } from "@sveltejs/kit"
import { getCurrentSessionUserId } from "$lib/auth/session"
import { sql } from "$lib/db/neon"

export const APP_ROLES = [
  "sys_admin",
  "admin",
  "partner",
  "seller",
  "buyer",
  "exhibitor"
] as const
export type AppRole = (typeof APP_ROLES)[number]

export async function getCurrentUserIdFromRequest(event: {
  cookies: Cookies
  request?: Request
}): Promise<string> {
  const sessionUserId = await getCurrentSessionUserId(event.cookies)
  if (sessionUserId) return sessionUserId

  const userId = event.request?.headers.get("x-user-id")?.trim()
  if (userId && process.env.NODE_ENV !== "production") {
    return userId
  }
  throw new Error("Unauthorized")
}

export async function userHasRole(
  userId: string,
  role: AppRole,
  expoId?: string | null
): Promise<boolean> {
  if (role !== "sys_admin") {
    const sysAdminRows = (await sql`
      select 1
      from user_roles
      where user_id = ${userId}
        and role_id = 'sys_admin'
        and expo_id is null
      limit 1
    `) as { "?column?": number }[]
    if (sysAdminRows.length > 0) return true
  }

  const rows = expoId
    ? ((await sql`
        select 1
        from user_roles
        where user_id = ${userId}
          and role_id = ${role}
          and (expo_id = ${expoId} or expo_id is null)
        limit 1
      `) as { "?column?": number }[])
    : ((await sql`
        select 1
        from user_roles
        where user_id = ${userId}
          and role_id = ${role}
          and expo_id is null
        limit 1
      `) as { "?column?": number }[])
  return rows.length > 0
}

export async function requireRole(
  event: { cookies: Cookies; request?: Request },
  role: AppRole
): Promise<string> {
  let userId = ""
  try {
    userId = await getCurrentUserIdFromRequest(event)
  } catch {
    throw redirect(302, "/login")
  }
  const allowed = await userHasRole(userId, role)
  if (!allowed) {
    throw redirect(302, "/login")
  }
  return userId
}

export async function requireAnyRole(
  event: { cookies: Cookies; request?: Request },
  roles: AppRole[]
): Promise<string> {
  let userId = ""
  try {
    userId = await getCurrentUserIdFromRequest(event)
  } catch {
    throw redirect(302, "/login")
  }

  for (const role of roles) {
    const allowed = await userHasRole(userId, role)
    if (allowed) {
      return userId
    }
  }

  throw redirect(302, "/login")
}
