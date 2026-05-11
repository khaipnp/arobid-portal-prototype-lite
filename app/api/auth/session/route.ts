import { NextResponse } from "next/server"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import { getCurrentSessionUserId } from "@/lib/auth/session"

export async function GET() {
  try {
    const userId = await getCurrentSessionUserId({ clearInvalidCookie: true })
    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    const user = await getAuthenticatedUserById(userId)
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    return NextResponse.json({ authenticated: true, user })
  } catch {
    return NextResponse.json(
      { error: "Failed to resolve session." },
      { status: 500 }
    )
  }
}
