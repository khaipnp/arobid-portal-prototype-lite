import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

export const APP_ROLES = ["admin", "seller", "buyer", "exhibitor"] as const
export type AppRole = (typeof APP_ROLES)[number]

export async function getCurrentUserIdFromRequest(): Promise<string> {
  const requestHeaders = await headers()
  const userId = requestHeaders.get("x-user-id")?.trim()
  return userId || CURRENT_USER_ID
}

export async function userHasRole(
  userId: string,
  role: AppRole,
  expoId?: string | null,
): Promise<boolean> {
  await ensurePlatformSchema()
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
  const userId = await getCurrentUserIdFromRequest()
  const allowed = await userHasRole(userId, role)
  if (!allowed) {
    redirect("/")
  }
  return userId
}

