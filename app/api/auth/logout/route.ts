import { NextResponse } from "next/server"
import { revokeCurrentAuthSession } from "@/lib/auth/session"

export async function POST() {
  try {
    await revokeCurrentAuthSession()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to sign out." }, { status: 500 })
  }
}

