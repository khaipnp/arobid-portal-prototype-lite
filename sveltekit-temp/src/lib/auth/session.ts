import { randomUUID } from "node:crypto"
import type { Cookies } from "@sveltejs/kit"
import { sql } from "$lib/db/neon"

export const AUTH_SESSION_COOKIE = "arobid_session"
const DEFAULT_SESSION_DAYS = 14

function getSessionMaxAgeSeconds() {
  const raw = process.env.AUTH_SESSION_MAX_AGE_SECONDS
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  if (Number.isFinite(parsed) && parsed > 0) return parsed
  return DEFAULT_SESSION_DAYS * 24 * 60 * 60
}

export async function createAuthSession(
  userId: string,
  event: { cookies: Cookies; request: Request }
) {
  const sessionId = randomUUID()
  const maxAge = getSessionMaxAgeSeconds()
  const expiresAt = new Date(Date.now() + maxAge * 1000)
  const userAgent =
    event.request.headers.get("user-agent")?.slice(0, 512) ?? null
  const forwardedFor = event.request.headers.get("x-forwarded-for")
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || null

  await sql`
    insert into auth_sessions (
      session_id,
      user_id,
      user_agent,
      ip_address,
      expires_at
    ) values (
      ${sessionId}::uuid,
      ${userId},
      ${userAgent},
      ${ipAddress},
      ${expiresAt}
    )
  `

  event.cookies.set(AUTH_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  })
}

export async function revokeCurrentAuthSession(cookies: Cookies) {
  const sessionId = cookies.get(AUTH_SESSION_COOKIE)

  if (sessionId) {
    await sql`
      update auth_sessions
      set revoked_at = now(), updated_at = now()
      where session_id = ${sessionId}::uuid
    `
  }

  cookies.delete(AUTH_SESSION_COOKIE, { path: "/" })
}

export async function getCurrentSessionUserId(
  cookies: Cookies,
  options?: {
    clearInvalidCookie?: boolean
  }
): Promise<string | null> {
  const sessionId = cookies.get(AUTH_SESSION_COOKIE)
  if (!sessionId) return null

  const rows = (await sql`
    select user_id
    from auth_sessions
    where session_id = ${sessionId}::uuid
      and revoked_at is null
      and expires_at > now()
    limit 1
  `) as { user_id: string }[]

  const userId = rows[0]?.user_id ?? null
  if (!userId) {
    if (options?.clearInvalidCookie) {
      cookies.delete(AUTH_SESSION_COOKIE, { path: "/" })
    }
    return null
  }

  await sql`
    update auth_sessions
    set last_seen_at = now(), updated_at = now()
    where session_id = ${sessionId}::uuid
  `
  return userId
}
