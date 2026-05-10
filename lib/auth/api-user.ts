import { getCurrentSessionUserId } from "@/lib/auth/session"

export async function requireApiUserId() {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

