import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db/neon"
import { getCurrentSessionUserId } from "@/lib/auth/session"

export const APP_ROLES = ["admin", "seller", "buyer", "exhibitor"] as const
export type AppRole = (typeof APP_ROLES)[number]

export async function getCurrentUserIdFromRequest(): Promise<string> {
  const sessionUserId = await getCurrentSessionUserId()
  if (sessionUserId) return sessionUserId

  const requestHeaders = await headers()
  const userId = requestHeaders.get("x-user-id")?.trim()
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

export async function requireRole(role: AppRole): Promise<string> {
  let userId = ""
  try {
    userId = await getCurrentUserIdFromRequest()
  } catch {
    redirect("/login")
  }
  const allowed = await userHasRole(userId, role)
  if (!allowed) {
    redirect("/login")
  }
  return userId
}

export async function requireAnyRole(roles: AppRole[]): Promise<string> {
  let userId = ""
  try {
    userId = await getCurrentUserIdFromRequest()
  } catch {
    redirect("/login")
  }

  for (const role of roles) {
    const allowed = await userHasRole(userId, role)
    if (allowed) {
      return userId
    }
  }

  redirect("/login")
}
